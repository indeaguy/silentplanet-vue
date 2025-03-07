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
      (texture) => {
        // You can set rotation matrix on the cube texture here if needed
        resolve(texture);
      },
      undefined,
      (error) => reject(error)
    );
  });
}

// New function to load and rotate a cube texture
export function loadRotatedCubeTextureAsync(texturePaths, rotationMatrix) {
  return new Promise((resolve, reject) => {
    new THREE.CubeTextureLoader().load(
      texturePaths,
      (texture) => {
        if (rotationMatrix) {
          // Apply rotation matrix to the cube texture
          texture.matrix = rotationMatrix;
          texture.matrixAutoUpdate = false;
        }
        resolve(texture);
      },
      undefined,
      (error) => reject(error)
    );
  });
}

