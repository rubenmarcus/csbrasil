// Sistema de Patentes e Elos — CS BRASIL
// Patentes: progressão permanente por XP (nunca reseta)
// Elos: rating dinâmico que sobe/desce por partida (como CS:GO)

/* ─── XP por ação ─────────────────────────────────────────────────────── */
export const XP = { kill: 25, headshot: 12, winRound: 40, winMatch: 120, match: 25 };

/* ─── Curva de progressão ─────────────────────────────────────────────── */
// nv1→2: 850 XP | nv25→26: 9.350 XP | nv49→50: 17.650 XP
// Total nv1→50 ≈ 453.000 XP → ~1.100 partidas competitivas ≈ 275h de jogo
export function xpToNextLevel(level) {
  if (level >= 50) return Infinity;
  return 500 + level * 350;
}

export function progressFromXp(totalXp) {
  let xp = Math.max(0, totalXp), level = 1;
  while (level < 50) {
    const need = xpToNextLevel(level);
    if (xp < need) break;
    xp -= need; level++;
  }
  return { level, xpCurrent: Math.floor(xp), xpNeeded: level < 50 ? xpToNextLevel(level) : 0 };
}

export function xpForMatch(s) {
  const myRounds = s.team === 'P' ? (s.roundsP || 0) : (s.roundsB || 0);
  return s.kills * XP.kill
       + (s.headshots || 0) * XP.headshot
       + myRounds * XP.winRound
       + (s.won ? XP.winMatch : 0)
       + XP.match;
}

/* ─── Variação de rating por partida ──────────────────────────────────── */
export function ratingDelta(s) {
  const perf = Math.min(s.kills * 2 + (s.headshots || 0) * 3, 30);
  return s.won ? 55 + perf : -35 + Math.min(perf, 10);
}

/* ─── SVG helpers ─────────────────────────────────────────────────────── */
const S = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">${body}</svg>`;

function star(cx, cy, r, fill, stroke = 'none') {
  const ri = r * 0.4;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rd = i % 2 === 0 ? r : ri;
    return `${+(cx + Math.cos(a) * rd).toFixed(1)},${+(cy + Math.sin(a) * rd).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="0.5"/>`;
}

function rhombus(cx, cy, w, h, fill) {
  return `<polygon points="${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}" fill="${fill}"/>`;
}

function chevron(cy, color, w = 2.5) {
  return `<polyline points="6,${cy + 6} 16,${cy} 26,${cy + 6}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function bar(y, color) {
  return `<rect x="7" y="${y}" width="18" height="3.5" rx="1.5" fill="${color}"/>`;
}

// Escudo para elos
const SH = 'M16,2 L28,8 L28,19 Q28,27 16,31 Q4,27 4,19 L4,8 Z';
function eloIcon(bg, stroke, inner) {
  return S(`<path d="${SH}" fill="${bg}" stroke="${stroke}" stroke-width="1.5"/>${inner}`);
}

/* ─── Ícones de patentes ──────────────────────────────────────────────── */
const IC = {
  recruta:   S(`<circle cx="16" cy="16" r="12" fill="none" stroke="#6b7280" stroke-width="2"/>
    <text x="16" y="20" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#6b7280">RCT</text>`),

  soldado1:  S(star(16, 16, 11, '#9ca3af')),

  soldado2:  S(star(10, 17, 8, '#9ca3af') + star(22, 17, 8, '#9ca3af')),

  cabo1:     S(chevron(18, '#a8a29e')),

  cabo2:     S(chevron(13, '#a8a29e') + chevron(21, '#a8a29e')),

  sarg1:     S(rhombus(16, 16, 7, 11, '#b45309')),

  sarg2:     S(rhombus(9, 16, 5.5, 8, '#b45309') + rhombus(23, 16, 5.5, 8, '#b45309')),

  sarg3:     S(rhombus(6, 16, 4, 7, '#ca8a04') + rhombus(16, 16, 4, 7, '#ca8a04') + rhombus(26, 16, 4, 7, '#ca8a04')),

  sargAj:    S(rhombus(6, 13, 3.5, 6, '#ca8a04') + rhombus(16, 13, 3.5, 6, '#ca8a04') + rhombus(26, 13, 3.5, 6, '#ca8a04') + chevron(21, '#ca8a04', 2)),

  subtenente: S(`<path d="M7,20 L7,15 Q7,6 16,6 Q25,6 25,15 L25,20" fill="none" stroke="#d97706" stroke-width="2"/>
    <rect x="5" y="20" width="22" height="3" rx="1.5" fill="#d97706"/>` + rhombus(16, 12, 3.5, 6, '#fbbf24')),

  aspirante:  S(`<circle cx="16" cy="16" r="11" fill="none" stroke="#0369a1" stroke-width="1.5"/>
    <line x1="16" y1="5" x2="16" y2="27" stroke="#0369a1" stroke-width="2.5"/>
    <line x1="5" y1="16" x2="27" y2="16" stroke="#0369a1" stroke-width="2.5"/>`),

  ten2:       S(bar(21, '#0284c7') + star(16, 12, 7, '#fbbf24')),

  ten1:       S(bar(18, '#0284c7') + bar(24, '#0284c7') + star(16, 10, 5.5, '#fbbf24')),

  capitao:    S(bar(15, '#0e7490') + bar(20, '#0e7490') + bar(25, '#0e7490') + star(16, 9, 5, '#fbbf24')),

  major:      S(`<path d="M16,4 L21,10 L29,11 L23,17 L25,25 L16,20.5 L7,25 L9,17 L3,11 L11,10 Z" fill="#7e22ce"/>
    <path d="M10,27 L16,23 L22,27 L16,30 Z" fill="#6d28d9"/>`),

  tenCel:     S(`<path d="M16,4 L21,10 L29,11 L23,17 L25,25 L16,20.5 L7,25 L9,17 L3,11 L11,10 Z" fill="#6d28d9"/>` +
    star(16, 28, 3.5, '#e2e8f0')),

  coronel:    S(`<path d="M16,4 L21,10 L29,11 L23,17 L25,25 L16,20.5 L7,25 L9,17 L3,11 L11,10 Z" fill="#4c1d95"/>` +
    star(10, 28, 3.5, '#e2e8f0') + star(22, 28, 3.5, '#e2e8f0')),

  genBrig:    S(star(9,  9,  7, '#9f1239') + star(23,  9, 7, '#9f1239') +
                star(9, 23,  7, '#9f1239') + star(23, 23, 7, '#9f1239')),

  genDiv:     S(star(16,  5, 6, '#be123c') +
                star( 5, 15, 6, '#be123c') + star(27, 15, 6, '#be123c') +
                star( 9, 26, 6, '#be123c') + star(23, 26, 6, '#be123c')),

  genEx:      S(star(16,  4, 5, '#e11d48') +
                star( 4, 13, 5, '#e11d48') + star(28, 13, 5, '#e11d48') +
                star( 4, 22, 5, '#e11d48') + star(28, 22, 5, '#e11d48') +
                star(16, 28, 5, '#e11d48')),

  genCom:     S(`<path d="M4,23 Q4,8 16,4 Q28,8 28,23 L24,27 L16,29 L8,27 Z" fill="none" stroke="#f43f5e" stroke-width="1.5"/>` +
    star( 8, 19, 4.5, '#f43f5e') + star(16, 11, 5.5, '#fbbf24') + star(24, 19, 4.5, '#f43f5e')),

  marechal:   S(`<path d="M7,16 L7,12 Q7,4 16,3 Q25,4 25,12 L25,16 L22,19 L16,20 L10,19 Z" fill="#92400e"/>
    <rect x="8" y="12" width="16" height="2" fill="#fbbf24"/>
    <rect x="6" y="15" width="20" height="2" fill="#fbbf24"/>
    <rect x="8" y="8" width="16" height="2" fill="#fbbf24"/>` +
    star(16, 26, 5.5, '#fbbf24')),
};

/* ─── Ícones de elo ───────────────────────────────────────────────────── */
const EI = {
  bronze1:    eloIcon('#451a03', '#d97706', star(16, 20, 7, '#d97706')),
  bronze2:    eloIcon('#451a03', '#d97706', star(10, 20, 5.5, '#d97706') + star(22, 20, 5.5, '#d97706')),
  bronze3:    eloIcon('#451a03', '#f59e0b', star(9, 20, 4.5, '#f59e0b') + star(16, 20, 4.5, '#f59e0b') + star(23, 20, 4.5, '#f59e0b')),
  prata1:     eloIcon('#1f2937', '#9ca3af', star(16, 20, 7, '#9ca3af')),
  prata2:     eloIcon('#1f2937', '#d1d5db', star(10, 20, 5.5, '#d1d5db') + star(22, 20, 5.5, '#d1d5db')),
  prata3:     eloIcon('#1f2937', '#e5e7eb', star(9, 20, 4.5, '#e5e7eb') + star(16, 20, 4.5, '#e5e7eb') + star(23, 20, 4.5, '#e5e7eb')),
  ouro1:      eloIcon('#1c1400', '#fbbf24', star(16, 20, 7, '#fbbf24')),
  ouro2:      eloIcon('#1c1400', '#f59e0b', star(10, 20, 5.5, '#f59e0b') + star(22, 20, 5.5, '#f59e0b')),
  ouro3:      eloIcon('#1c1400', '#eab308', star(9, 20, 4.5, '#eab308') + star(16, 20, 4.5, '#eab308') + star(23, 20, 4.5, '#eab308')),
  platina1:   eloIcon('#083344', '#06b6d4', `<polygon points="16,9 22,18 16,27 10,18" fill="#06b6d4" opacity="0.8"/>`),
  platina2:   eloIcon('#083344', '#22d3ee', `<polygon points="16,8 23,18 16,28 9,18" fill="#0e7490"/>` + star(16, 18, 5.5, '#22d3ee')),
  platina3:   eloIcon('#083344', '#67e8f9', `<polygon points="16,7 24,18 16,29 8,18" fill="#155e75"/>` + star(16, 18, 6, '#67e8f9')),
  diamante1:  eloIcon('#1e1b4b', '#818cf8', `<polygon points="16,7 24,18 16,29 8,18" fill="#3730a3"/>` + star(16, 18, 6, '#818cf8')),
  diamante2:  eloIcon('#1e1b4b', '#a5b4fc', `<polygon points="16,6 25,18 16,30 7,18" fill="#3730a3"/>` + star(16, 18, 6.5, '#a5b4fc')),
  diamante3:  eloIcon('#1e1b4b', '#c7d2fe', `<polygon points="16,5 26,18 16,31 6,18" fill="#312e81"/>` + star(16, 18, 7, '#c7d2fe')),
  mestre:     eloIcon('#2e1065', '#c084fc', `<circle cx="16" cy="19" r="8" fill="#7e22ce"/>` + star(16, 19, 5.5, '#f0abfc')),
  graoMestre: eloIcon('#1a0030', '#f472b6', `<circle cx="16" cy="19" r="8" fill="#6d28d9"/>` + star(16, 19, 6, '#fde047')),
  lenda:      eloIcon('#1c1400', '#fde047',
    `<path d="M10,26 Q8,15 16,10 Q24,15 22,26 L19,27 L16,28 L13,27 Z" fill="#92400e" stroke="#fde047" stroke-width="1"/>` +
    star(16, 19, 7, '#fde047')),
};

/* ─── 50 Patentes ─────────────────────────────────────────────────────── */
const R = (title, short, color, icon) => ({ title, short, color, icon });

export const RANK_TABLE = [
  R('Recruta',              'RCT', '#6b7280', IC.recruta),    //  1
  R('Soldado',              'SLD', '#9ca3af', IC.soldado1),   //  2
  R('Soldado',              'SLD', '#9ca3af', IC.soldado1),   //  3
  R('Soldado de 1ª Classe', 'S1C', '#9ca3af', IC.soldado2),   //  4
  R('Soldado de 1ª Classe', 'S1C', '#9ca3af', IC.soldado2),   //  5
  R('Cabo',                 'CB',  '#a8a29e', IC.cabo1),      //  6
  R('Cabo',                 'CB',  '#a8a29e', IC.cabo1),      //  7
  R('Cabo de 1ª Classe',    'C1C', '#a8a29e', IC.cabo2),      //  8
  R('3º Sargento',          '3SG', '#b45309', IC.sarg1),      //  9
  R('3º Sargento',          '3SG', '#b45309', IC.sarg1),      // 10
  R('2º Sargento',          '2SG', '#b45309', IC.sarg2),      // 11
  R('2º Sargento',          '2SG', '#b45309', IC.sarg2),      // 12
  R('1º Sargento',          '1SG', '#ca8a04', IC.sarg3),      // 13
  R('1º Sargento',          '1SG', '#ca8a04', IC.sarg3),      // 14
  R('Sargento-Ajudante',    'SAJ', '#ca8a04', IC.sargAj),     // 15
  R('Sargento-Ajudante',    'SAJ', '#ca8a04', IC.sargAj),     // 16
  R('Subtenente',           'ST',  '#d97706', IC.subtenente), // 17
  R('Subtenente',           'ST',  '#d97706', IC.subtenente), // 18
  R('Aspirante a Oficial',  'AS',  '#0369a1', IC.aspirante),  // 19
  R('Aspirante a Oficial',  'AS',  '#0369a1', IC.aspirante),  // 20
  R('2º Tenente',           '2TN', '#0284c7', IC.ten2),       // 21
  R('2º Tenente',           '2TN', '#0284c7', IC.ten2),       // 22
  R('1º Tenente',           '1TN', '#0ea5e9', IC.ten1),       // 23
  R('1º Tenente',           '1TN', '#0ea5e9', IC.ten1),       // 24
  R('Capitão',              'CAP', '#0e7490', IC.capitao),    // 25
  R('Capitão',              'CAP', '#0e7490', IC.capitao),    // 26
  R('Capitão',              'CAP', '#0e7490', IC.capitao),    // 27
  R('Major',                'MAJ', '#7e22ce', IC.major),      // 28
  R('Major',                'MAJ', '#7e22ce', IC.major),      // 29
  R('Major',                'MAJ', '#7e22ce', IC.major),      // 30
  R('Tenente-Coronel',      'TCL', '#6d28d9', IC.tenCel),     // 31
  R('Tenente-Coronel',      'TCL', '#6d28d9', IC.tenCel),     // 32
  R('Tenente-Coronel',      'TCL', '#6d28d9', IC.tenCel),     // 33
  R('Coronel',              'CEL', '#4c1d95', IC.coronel),    // 34
  R('Coronel',              'CEL', '#4c1d95', IC.coronel),    // 35
  R('Coronel',              'CEL', '#4c1d95', IC.coronel),    // 36
  R('Coronel',              'CEL', '#4c1d95', IC.coronel),    // 37
  R('General de Brigada',   'GB',  '#9f1239', IC.genBrig),    // 38
  R('General de Brigada',   'GB',  '#9f1239', IC.genBrig),    // 39
  R('General de Brigada',   'GB',  '#9f1239', IC.genBrig),    // 40
  R('General de Divisão',   'GD',  '#be123c', IC.genDiv),     // 41
  R('General de Divisão',   'GD',  '#be123c', IC.genDiv),     // 42
  R('General de Divisão',   'GD',  '#be123c', IC.genDiv),     // 43
  R('General de Exército',  'GE',  '#e11d48', IC.genEx),      // 44
  R('General de Exército',  'GE',  '#e11d48', IC.genEx),      // 45
  R('General de Exército',  'GE',  '#e11d48', IC.genEx),      // 46
  R('General Comandante',   'GC',  '#f43f5e', IC.genCom),     // 47
  R('General Comandante',   'GC',  '#f43f5e', IC.genCom),     // 48
  R('General Comandante',   'GC',  '#f43f5e', IC.genCom),     // 49
  R('Marechal',             'MAR', '#fbbf24', IC.marechal),   // 50
];

export function rankForLevel(level) {
  return RANK_TABLE[Math.min(Math.max(level, 1), 50) - 1];
}

/* ─── 18 Elos ─────────────────────────────────────────────────────────── */
export const ELOS = [
  { id: 'bronze1',    name: 'Bronze I',       min: 0,     color: '#d97706', icon: EI.bronze1    },
  { id: 'bronze2',    name: 'Bronze II',      min: 400,   color: '#d97706', icon: EI.bronze2    },
  { id: 'bronze3',    name: 'Bronze III',     min: 800,   color: '#f59e0b', icon: EI.bronze3    },
  { id: 'prata1',     name: 'Prata I',        min: 1200,  color: '#9ca3af', icon: EI.prata1     },
  { id: 'prata2',     name: 'Prata II',       min: 1700,  color: '#d1d5db', icon: EI.prata2     },
  { id: 'prata3',     name: 'Prata III',      min: 2200,  color: '#e5e7eb', icon: EI.prata3     },
  { id: 'ouro1',      name: 'Ouro I',         min: 2800,  color: '#fbbf24', icon: EI.ouro1      },
  { id: 'ouro2',      name: 'Ouro II',        min: 3400,  color: '#f59e0b', icon: EI.ouro2      },
  { id: 'ouro3',      name: 'Ouro III',       min: 4000,  color: '#eab308', icon: EI.ouro3      },
  { id: 'platina1',   name: 'Platina I',      min: 4700,  color: '#06b6d4', icon: EI.platina1   },
  { id: 'platina2',   name: 'Platina II',     min: 5500,  color: '#22d3ee', icon: EI.platina2   },
  { id: 'platina3',   name: 'Platina III',    min: 6300,  color: '#67e8f9', icon: EI.platina3   },
  { id: 'diamante1',  name: 'Diamante I',     min: 7200,  color: '#818cf8', icon: EI.diamante1  },
  { id: 'diamante2',  name: 'Diamante II',    min: 8200,  color: '#a5b4fc', icon: EI.diamante2  },
  { id: 'diamante3',  name: 'Diamante III',   min: 9300,  color: '#c7d2fe', icon: EI.diamante3  },
  { id: 'mestre',     name: 'Mestre',         min: 10500, color: '#c084fc', icon: EI.mestre     },
  { id: 'graoMestre', name: 'Grão-Mestre',    min: 12000, color: '#f472b6', icon: EI.graoMestre },
  { id: 'lenda',      name: 'LENDA',          min: 14000, color: '#fde047', icon: EI.lenda      },
];

export function eloFromRating(rating) {
  let elo = ELOS[0];
  for (const e of ELOS) if (rating >= e.min) elo = e;
  return elo;
}

export function eloProgress(rating) {
  const elo = eloFromRating(rating);
  const idx = ELOS.indexOf(elo);
  const next = idx < ELOS.length - 1 ? ELOS[idx + 1] : null;
  const pct = next ? Math.round(((rating - elo.min) / (next.min - elo.min)) * 100) : 100;
  return { elo, next, pct };
}
