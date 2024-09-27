import * as THREE from 'three';

export class RayTracerModel {
  constructor(worldStageModel) {
    this.worldStageModel = worldStageModel;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.direction = new THREE.Vector3();
    this.intersected = null;
  }
}