// Fundo das páginas do site: o mesmo mundo 3D do menu do jogo, orbitando.
import * as THREE from 'three';
import { initTextures } from './textures.js';
import { buildWorld } from './map.js';

const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
buildWorld(scene, initTextures());
const cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);

let angle = Math.random() * 10, last = performance.now();
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  angle += dt * 0.06;
  cam.position.set(Math.sin(angle) * 34, 17 + Math.sin(angle * 0.6) * 4, Math.cos(angle) * 34);
  cam.lookAt(0, 1, 0);
  renderer.render(scene, cam);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
});
requestAnimationFrame(loop);
