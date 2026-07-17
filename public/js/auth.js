// OAuth (Google/GitHub/LinkedIn/X) + avatar de perfil.
// supabase-js é carregado via CDN lazy SOMENTE quando /api/config existe
// (única dependência externa do jogo — ver CONTRIBUTING).
// ATENÇÃO: o import precisa ser URL literal com @vite-ignore (o Vite reescreve
// variáveis pra caminho local e quebra em produção).

export class Auth {
  constructor() { this.sb = null; this.user = null; this.session = null; this.ok = false; this.onChange = null; }

  async init() {
    let cfg = null;
    try { const r = await fetch('/api/config'); if (r.ok) cfg = await r.json(); } catch {}
    if (!cfg) return false;
    try {
      const { createClient } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
      this.sb = createClient(cfg.url, cfg.anonKey);
      const { data: { session } } = await this.sb.auth.getSession();
      this.session = session; this.user = session?.user ?? null;
      this.sb.auth.onAuthStateChange((_e, s) => {
        this.session = s; this.user = s?.user ?? null;
        this.onChange?.(this.user);
      });
      this.ok = true;
    } catch { this.sb = null; }
    return this.ok;
  }

  login(provider) {
    return this.sb?.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + '/' } });
  }
  logout() { return this.sb?.auth.signOut(); }
  get accessToken() { return this.session?.access_token || null; }
  avatarUrl() {
    const m = this.user?.user_metadata || {};
    return m.avatar_url || m.picture || null;
  }
  displayName() {
    const m = this.user?.user_metadata || {};
    return m.full_name || m.name || this.user?.email || null;
  }

  // redimensiona pra 128×128 e sobe no bucket "avatars" (policy: dono)
  async uploadAvatar(file) {
    if (!this.sb || !this.user) return null;
    const bmp = await createImageBitmap(file);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const s = Math.min(bmp.width, bmp.height);
    x.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 128, 128);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const path = `${this.user.id}.png`;
    const { error } = await this.sb.storage.from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/png' });
    if (error) return null;
    const { data } = this.sb.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }
}
