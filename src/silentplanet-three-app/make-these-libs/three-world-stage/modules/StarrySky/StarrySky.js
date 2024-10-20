import * as THREE from 'three';

/**
 * @class StarrySky
 * @description A class for creating a starry sky in a three.js scene.
 * @param {THREE.Scene} scene - The scene to add the starry sky to.
 * @param {THREE.Camera} camera - The camera to use for the starry sky.
 * @param {THREE.CubeTexture} envMap - The environment map to use for the starry sky.
 * 
 * @example 
 * const scene = new THREE.Scene();
 * const camera = new THREE.Camera();
 * const envMap = new THREE.CubeTextureLoader().load(texturePaths);
 * const starrySky = new StarrySky(scene, camera, envMap);
 * starrySky.initialize(texturePaths);
 * 
 * @see https://threejs.org/docs/#api/en/textures/CubeTexture
 *  
 * @todo: asyncronously load increasingly detailed starry sky textures
 */
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
