import * as THREE from 'three'

class RayTracer {
  constructor() {
    this.worldStageModel = null
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.direction = new THREE.Vector3()
    this.intersected = null
  }

  setWorldStageModel(worldStageModel) {
    this.worldStageModel = worldStageModel
  }

  handleRayEvent(event, callback) {
    if (!this.worldStageModel) {
      console.error('WorldStageModel not set for RayTracer')
      return
    }
    
    // Use offsetX and offsetY instead of clientX and clientY
    this.mouse.x = (event.offsetX / this.worldStageModel.size.x) * 2 - 1
    this.mouse.y = -(event.offsetY / this.worldStageModel.size.y) * 2 + 1
    
    this.checkIntersections()
    if (typeof callback === 'function') {
      callback(this.intersected)
    }
  }

  checkIntersections() {
    if (!this.worldStageModel) return
    this.updateRayFromCameraAndMouse()

    // Perform the raycasting
    const intersects = this.raycaster.intersectObjects(this.worldStageModel.scene.children, true)

    // Find the first intersected object with a non-empty name attribute and are visible
    const firstNamedIntersect = intersects.find(
      (intersect) => intersect.object.name && intersect.object.visible
    )

    if (firstNamedIntersect && firstNamedIntersect.object) {
      if (this.intersected !== firstNamedIntersect.object) {
        this.intersected = firstNamedIntersect.object
      }
    } else {
      this.intersected = null
    }
  }

  updateRayFromCameraAndMouse() {
    if (!this.worldStageModel) return
    // Get the direction in which the camera is looking
    this.worldStageModel.camera.getWorldDirection(this.direction)

    // Set the raycaster with the camera's position and direction
    this.raycaster.setFromCamera(this.mouse, this.worldStageModel.camera)

    return this.raycaster // This is the ray that moves directly away from the camera
  }
}

// Create a single instance of RayTracer
const rayTracerInstance = new RayTracer();

// Export the handleRayEvent method that uses the instance
export const handleRayEvent = (event, callback) => {
  rayTracerInstance.handleRayEvent(event, callback);
};

// Export a method to set the WorldStageModel
export const setRayTracerWorldStageModel = (worldStageModel) => {
  rayTracerInstance.setWorldStageModel(worldStageModel);
};

// Optionally, you can still export the class if needed elsewhere
export { RayTracer };
