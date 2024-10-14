import * as THREE from 'three';

export function loadCubeTexture(texturePaths) {
  return new THREE.CubeTextureLoader().load(texturePaths);
}

