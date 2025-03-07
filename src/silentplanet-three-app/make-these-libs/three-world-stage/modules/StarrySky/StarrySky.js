import * as THREE from 'three';
import { loadCubeTextureAsync, loadRotatedCubeTextureAsync } from '../../../three-helpers';

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
    this.rotationMatrix = null;
  }

  async initialize(texturePaths, rotation = null) {
    if (!texturePaths || texturePaths.length !== 6) {
      console.error('Invalid texture paths for starry sky');
      return;
    }

    try {
      // If rotation is provided, use the rotated texture loader
      if (rotation) {
        // Create rotation matrix based on the provided rotation (in radians)
        this.rotationMatrix = new THREE.Matrix4();
        
        // You can set different types of rotations based on your needs
        if (rotation.y !== undefined) {
          this.rotationMatrix.makeRotationY(rotation.y);
        } else if (rotation.x !== undefined) {
          this.rotationMatrix.makeRotationX(rotation.x);
        } else if (rotation.z !== undefined) {
          this.rotationMatrix.makeRotationZ(rotation.z);
        } else if (rotation.matrix) {
          this.rotationMatrix = rotation.matrix;
        }
        
        this.envMap = await loadRotatedCubeTextureAsync(texturePaths, this.rotationMatrix);
      } else {
        this.envMap = await loadCubeTextureAsync(texturePaths);
      }
      
      // @TODO: don't do this here
      this.scene.background = this.envMap;
    } catch (error) {
      console.error('Error loading starry sky textures:', error);
    }
  }

  update() {
    if (this.scene.background && this.scene.background.isTexture) {
      // If we're using a rotation matrix, we don't need to update offsets
      if (!this.rotationMatrix) {
        this.scene.background.offset.x = this.camera.rotation.y / (2 * Math.PI);
        this.scene.background.offset.y = this.camera.rotation.x / (2 * Math.PI);
      }
    }
  }

  getEnvMap() {
    return this.envMap;
  }
  
  // New method to rotate the sky after initialization
  rotateEnvironment(rotation) {
    if (!this.envMap) return;
    
    this.rotationMatrix = new THREE.Matrix4();
    
    if (rotation.y !== undefined) {
      this.rotationMatrix.makeRotationY(rotation.y);
    } else if (rotation.x !== undefined) {
      this.rotationMatrix.makeRotationX(rotation.x);
    } else if (rotation.z !== undefined) {
      this.rotationMatrix.makeRotationZ(rotation.z);
    } else if (rotation.matrix) {
      this.rotationMatrix = rotation.matrix;
    }
    
    this.envMap.matrix = this.rotationMatrix;
    this.envMap.matrixAutoUpdate = false;
  }
}
