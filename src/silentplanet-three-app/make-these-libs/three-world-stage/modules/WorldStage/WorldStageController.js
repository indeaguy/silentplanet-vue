let instance = null;

import { WorldStageModel } from './WorldStageModel.js';
import { WorldStageView } from './WorldStageView.js';

export class WorldStageController {
  /**
   * @param {string} targetElement - The ID of the HTML element to render the scene into.
   * @param {WorldStageConfig} config - The configuration object for the WorldStage.
   */
  constructor(targetElement, config) {
    // it's a singleton
    if (instance) {
      return instance;
    }
    this.model = new WorldStageModel(config);
    this.targetElement = document.getElementById(targetElement);
    this.view = new WorldStageView(this.model, this.targetElement);
    this.setupScene();
    instance = this;
  }

  setupScene() {
    this.view.setupCamera();
    this.view.setupRenderer();
    this.view.setupControls();
    this.updateSceneSize();
  }

  updateSceneSize() {
    const { SCENE } = this.model.config.settings;
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
    this.model.handleRayEvent(event, callback);
  }
}

/**
 * @param {string} targetElement - The ID of the HTML element to render the scene into.
 * @param {WorldStageConfig} config - The configuration object for the WorldStage.
 * @returns {WorldStageController}
 */
export function getWorldStageController(targetElement, config) {
  if (!instance) {
    instance = new WorldStageController(targetElement, config);
  }
  return instance;
}
