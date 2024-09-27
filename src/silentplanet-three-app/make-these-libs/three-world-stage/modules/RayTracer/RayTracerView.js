export class RayTracerView {
  constructor(rayTracerModel) {
    this.model = rayTracerModel;
  }

  updateMousePosition(event) {
    this.model.mouse.x = (event.offsetX / this.model.worldStageModel.size.x) * 2 - 1;
    this.model.mouse.y = -(event.offsetY / this.model.worldStageModel.size.y) * 2 + 1;
  }

  updateRayFromCameraAndMouse() {
    if (!this.model.worldStageModel) return;
    this.model.worldStageModel.camera.getWorldDirection(this.model.direction);
    this.model.raycaster.setFromCamera(this.model.mouse, this.model.worldStageModel.camera);
    return this.model.raycaster;
  }
}