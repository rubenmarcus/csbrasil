// Map registry — single source of truth for selectable arenas.
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';
import { buildMasp } from './map_masp.js';

export const MAPS = {
  awp_map:     { name: 'AWP Treta (Praça)',   build: buildWorld },
  fy_pool_day: { name: 'Piscinão da Treta',   build: buildPoolDay },
  fy_masp:     { name: 'Museu da Treta (Av. Paulista)', build: buildMasp },
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
