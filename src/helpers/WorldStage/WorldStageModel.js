import * as THREE from 'three'

export class WorldStageModel {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderables = [];
    this.resizeObservers = [];
    this.size = new THREE.Vector2();
  }

  addResizeObserver(observer) {
    this.resizeObservers.push(observer);
  }

  updateSize(width, height) {
    this.size.set(width, height);
  }
}