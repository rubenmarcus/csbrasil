// Map registry — single source of truth for selectable arenas.
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';
import { buildSitio } from './map_sitio.js';
import { buildMetro } from './map_metro.js';

export const MAPS = {
  awp_map:     { name: 'AWP Treta (Praça)',   build: buildWorld },
  fy_pool_day: { name: 'Piscinão da Treta',   build: buildPoolDay },
  fy_sitio:    { name: 'Sítio da Treta (Atibaia)', build: buildSitio },
  fy_metro:    { name: 'Metrô SP (Estação Treta)', build: buildMetro },
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
