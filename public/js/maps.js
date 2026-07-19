// Map registry — single source of truth for selectable arenas.
import { buildBrasilia } from './map_brasilia.js';
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';

export const MAPS = {
  awp_map:     { name: 'Praça dos Três Poderes', build: buildBrasilia }, // Brasília fiel (substitui o clássico)
  praca_old:   { name: 'Praça (clássico)',       build: buildWorld },
  fy_pool_day: { name: 'Piscinão da Treta',      build: buildPoolDay },
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
