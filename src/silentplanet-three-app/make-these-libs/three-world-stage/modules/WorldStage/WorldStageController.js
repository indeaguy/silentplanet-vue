import configInstance from '../../../../../silentplanet-three-app/Config.js';
import { WorldStageModel } from './WorldStageModel.js';
import { WorldStageView } from './WorldStageView.js';

export class WorldStageController {
  constructor(targetElement) {
    this.model = new WorldStageModel();
    this.targetElement = document.getElementById(targetElement);
    this.view = new WorldStageView(this.model, this.targetElement);
    this.setupScene();
  }

  setupScene() {
    // Set up the camera, renderer, and controls
    this.view.setupCamera();
    this.view.setupRenderer();
    this.view.setupControls();
    
    // Update the scene size once everything is set up
    this.updateSceneSize();
  }

  updateSceneSize() {
    const { SCENE } = configInstance.settings;
    const { WIDTH_PERCENTAGE, HEIGHT_PERCENTAGE } = SCENE;
    const width = this.targetElement.clientWidth * WIDTH_PERCENTAGE;
    const height = this.targetElement.clientHeight * HEIGHT_PERCENTAGE;
    this.model.updateSize(width, height);
    this.view.updateSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
  }

  render() {
    if (this.view.controls) {
      this.view.controls.update();
    }
    this.model.renderables.forEach(renderable => renderable.render());
    this.view.renderer.render(this.model.scene, this.model.camera);
  }

  onWindowResize() {
    this.updateSceneSize();
    this.view.dispose();
    this.view.setupControls();
    this.model.resizeObservers.forEach(observer => observer.onResize(this.model.size));
  }

  addResizeObserver(observer) {
    this.model.addResizeObserver(observer);
  }

  handleRayEvent(event, callback) {
    this.model.rayTracer.handleRayEvent(event, callback);
  }
}