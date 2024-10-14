import * as THREE from 'three';

export class StarrySky {
  constructor(scene, camera, envMap) {
    this.scene = scene;
    this.camera = camera;
    this.envMap = envMap;
  }

  initialize(texturePaths) {
    if (!texturePaths || texturePaths.length !== 6) {
      console.error('Invalid texture paths for starry sky');
      return;
    }

    const loader = new THREE.CubeTextureLoader();
    loader.load(texturePaths,
      (texture) => {
        this.envMap = texture;
        this.scene.background = this.envMap;
      },
      undefined,
      (error) => {
        console.error('Error loading starry sky textures:', error);
      }
    );
  }

  update() {
    if (this.scene.background && this.scene.background.isTexture) {
      this.scene.background.offset.x = this.camera.rotation.y / (2 * Math.PI);
      this.scene.background.offset.y = this.camera.rotation.x / (2 * Math.PI);
    }
  }

  getEnvMap() {
    return this.envMap;
  }
}
