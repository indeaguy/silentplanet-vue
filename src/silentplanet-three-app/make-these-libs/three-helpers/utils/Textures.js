import * as THREE from 'three';

export function loadCubeTexture(texturePaths) {
  return new THREE.CubeTextureLoader().load(texturePaths);
}

export function loadTexture(texturePath) {
  return new THREE.TextureLoader().load(texturePath);
}

export function loadCubeTextureAsync(texturePaths) {
  return new Promise((resolve, reject) => {
    new THREE.CubeTextureLoader().load(
      texturePaths,
      (texture) => resolve(texture),
      undefined,
      (error) => reject(error)
    );
  });
}

