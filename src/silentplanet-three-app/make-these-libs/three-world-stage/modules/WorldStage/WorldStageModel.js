import * as THREE from 'three';
import { RayTracerController } from '../RayTracer';

export class WorldStageModel {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderables = [];
    this.resizeObservers = [];
    this.size = new THREE.Vector2();
    this.rayTracer = new RayTracerController(this); // Add RayTracerController instance
  }

  addResizeObserver(observer) {
    this.resizeObservers.push(observer);
  }

  updateSize(width, height) {
    this.size.set(width, height);
  }

  handleRayEvent(event, callback) {
    this.rayTracer.handleRayEvent(event, callback);
  }
}