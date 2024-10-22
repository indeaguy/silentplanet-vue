import * as THREE from 'three';

export function loadCubeTexture(texturePaths) {
  return new THREE.CubeTextureLoader().load(texturePaths);
}

export function loadTexture(texturePath) {
  return new THREE.TextureLoader().load(texturePath);
}

