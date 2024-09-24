import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// @TODO encapsulation problem here! This must aleady be initialized somewhere.
import configInstance from '../helpers/Config.js';

export class Scene {
  constructor(targetElement) {
    const { CAMERA, SCENE } = configInstance.settings;

    this.targetElement = document.getElementById(targetElement);
    this.updateSceneSize(SCENE);

    this.scene = new THREE.Scene();
    this.setupCamera(CAMERA);
    this.setupRenderer();
    this.setupControls(CAMERA);

    this.renderables = [];
    this.resizeObservers = [];
    this.size = new THREE.Vector2(this.sceneWidth, this.sceneHeight);
  }

  setupCamera(CAMERA) {
    const {
      FOV,
      MIN_VISIBLE_DISTANCE,
      MAX_VISIBLE_DISTANCE,
      DEFAULT_POINT_X,
      DEFAULT_POINT_Y,
      DEFAULT_POINT_Z
    } = CAMERA;

    this.camera = new THREE.PerspectiveCamera(
      FOV,
      this.sceneWidth / this.sceneHeight,
      MIN_VISIBLE_DISTANCE,
      MAX_VISIBLE_DISTANCE
    );
    this.camera.position.set(DEFAULT_POINT_X, DEFAULT_POINT_Y, DEFAULT_POINT_Z);
    this.camera.updateProjectionMatrix();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.sceneWidth, this.sceneHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.targetElement.appendChild(this.renderer.domElement);
  }

  setupControls(CAMERA) {
    const {
      MAX_ZOOM_DISTANCE,
      MIN_ZOOM_DISTANCE
    } = CAMERA;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = MIN_ZOOM_DISTANCE;
    this.controls.maxDistance = MAX_ZOOM_DISTANCE;
  }

  addResizeObserver(observer) {
    this.resizeObservers.push(observer);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
  }

  render() {
    this.controls.update();
    this.renderables.forEach(renderable => renderable.render());
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const { SCENE } = configInstance.settings;
    this.updateSceneSize(SCENE);
    const newSize = new THREE.Vector2(this.sceneWidth, this.sceneHeight);

    if (!newSize.equals(this.size)) {
      this.updateCameraAndRenderer(newSize);
      this.size.copy(newSize);
    }

    this.resizeObservers.forEach(observer => observer.onResize(newSize));
  }

  updateCameraAndRenderer(newSize) {
    this.camera.aspect = newSize.x / newSize.y;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(newSize.x, newSize.y);
    this.controls.dispose();
    this.setupControls(configInstance.settings.CAMERA);
  }

  updateSceneSize(SCENE) {
    const {
      WIDTH_PERCENTAGE,
      HEIGHT_PERCENTAGE
    } = SCENE;

    this.sceneWidth = this.targetElement.clientWidth * WIDTH_PERCENTAGE;
    this.sceneHeight = this.targetElement.clientHeight * HEIGHT_PERCENTAGE;
  }
}
