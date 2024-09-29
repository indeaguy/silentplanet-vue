import * as THREE from 'three';
import { RayTracerController } from '../RayTracer';
import { WorldStageConfig } from './types/ConfigTypes.js';

export class WorldStageModel {
  /**
   * @param {WorldStageConfig} config
   */
  constructor(config) {
    this.config = config;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderables = [];
    this.resizeObservers = [];
    this.size = new THREE.Vector2();
    this.rayTracer = new RayTracerController(this);
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