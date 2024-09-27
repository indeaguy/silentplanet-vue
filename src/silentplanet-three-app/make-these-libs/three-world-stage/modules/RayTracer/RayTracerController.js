import { RayTracerModel } from './RayTracerModel.js';
import { RayTracerView } from './RayTracerView.js';

export class RayTracerController {
  constructor(worldStageModel) {
    this.model = new RayTracerModel(worldStageModel);
    this.view = new RayTracerView(this.model);
  }

  handleRayEvent(event, callback) {
    if (!this.model.worldStageModel) {
      console.error('WorldStageModel not set for RayTracer');
      return;
    }

    this.view.updateMousePosition(event);
    this.checkIntersections();
    if (typeof callback === 'function') {
      callback(this.model.intersected);
    }
  }

  checkIntersections() {
    if (!this.model.worldStageModel) return;
    this.view.updateRayFromCameraAndMouse();

    const intersects = this.model.raycaster.intersectObjects(this.model.worldStageModel.scene.children, true);
    const firstNamedIntersect = intersects.find(
      (intersect) => intersect.object.name && intersect.object.visible
    );

    if (firstNamedIntersect && firstNamedIntersect.object) {
      if (this.model.intersected !== firstNamedIntersect.object) {
        this.model.intersected = firstNamedIntersect.object;
      }
    } else {
      this.model.intersected = null;
    }
  }
}