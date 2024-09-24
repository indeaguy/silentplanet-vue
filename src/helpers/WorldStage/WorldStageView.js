import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import configInstance from '../../helpers/Config.js';

export class WorldStageView {
  constructor(model, targetElement) {
    this.model = model;
    this.targetElement = targetElement;
    this.renderer = null;
    this.controls = null;
  }

  setupCamera() {
    const { CAMERA } = configInstance.settings;
    const {
      FOV,
      MIN_VISIBLE_DISTANCE,
      MAX_VISIBLE_DISTANCE,
      DEFAULT_POINT_X,
      DEFAULT_POINT_Y,
      DEFAULT_POINT_Z
    } = CAMERA;

    this.model.camera = new THREE.PerspectiveCamera(
      FOV,
      this.model.size.x / this.model.size.y,
      MIN_VISIBLE_DISTANCE,
      MAX_VISIBLE_DISTANCE
    );
    this.model.camera.position.set(DEFAULT_POINT_X, DEFAULT_POINT_Y, DEFAULT_POINT_Z);
    this.model.camera.updateProjectionMatrix();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.updateSize(this.model.size.x, this.model.size.y);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.targetElement.appendChild(this.renderer.domElement);
  }

  setupControls() {
    if (!this.model.camera) {
      console.error('Camera not initialized');
      return;
    }

    const { CAMERA } = configInstance.settings;
    const {
      MAX_ZOOM_DISTANCE,
      MIN_ZOOM_DISTANCE
    } = CAMERA;

    this.controls = new OrbitControls(this.model.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = MIN_ZOOM_DISTANCE;
    this.controls.maxDistance = MAX_ZOOM_DISTANCE;
  }

  updateSize(width, height) {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
    if (this.model.camera) {
      this.model.camera.aspect = width / height;
      this.model.camera.updateProjectionMatrix();
    }
  }

  dispose() {
    if (this.controls) {
      this.controls.dispose();
    }
  }
}