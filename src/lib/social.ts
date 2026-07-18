// Links e avatares sociais.

// normaliza o link social pra URL clicável ("x.com/foo" → "https://x.com/foo")
export function socialHref(s?: string | null): string | null {
  const v = (s || '').trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : 'https://' + v.replace(/^@/, '');
}

// extrai handle de twitter/x.com/rubenmarcus_dev, twitter.com/@foo ou @foo
export function twitterHandle(s?: string | null): string | null {
  if (!s) return null;
  const m = s.match(/(?:x\.com|twitter\.com)\/@?([A-Za-z0-9_]{1,15})/) || s.match(/^@([A-Za-z0-9_]{1,15})$/);
  return m ? m[1] : null;
}

// avatar por rede social — X via unavatar.io, GitHub direto (oficial).
// Instagram/LinkedIn/TikTok não têm fetch público: aí o usuário faz upload.
export function socialAvatar(s?: string | null): string | null {
  if (!s) return null;
  const gh = s.match(/github\.com\/@?([A-Za-z0-9-]{1,39})/);
  if (gh) return `https://github.com/${gh[1]}.png?size=128`;
  const h = twitterHandle(s);
  return h ? `https://unavatar.io/twitter/${h}` : null;
}
