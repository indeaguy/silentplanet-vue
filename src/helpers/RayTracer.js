import * as THREE from 'three'

class RayTracer {
  constructor() {
    this.stage = null
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.direction = new THREE.Vector3()
    this.intersected = null
  }

  setStage(stage) {
    this.stage = stage
  }

  handleRayEvent(event, callback) {
    if (!this.stage) {
      console.error('Stage not set for RayTracer')
      return
    }
    this.mouse.x = (event.offsetX / this.stage.sceneWidth) * 2 - 1
    this.mouse.y = -(event.offsetY / this.stage.sceneHeight) * 2 + 1
    this.checkIntersections()
    if (typeof callback === 'function') {
      callback(this.intersected)
    }
  }

  checkIntersections() {
    if (!this.stage) return
    this.updateRayFromCameraAndMouse()

    // Perform the raycasting
    const intersects = this.raycaster.intersectObjects(this.stage.scene.children, true)

    // Find the first intersected object with a non-empty name attribute and are visible
    const firstNamedIntersect = intersects.find(
      (intersect) => intersect.object.name && intersect.object.visible
    )

    if (firstNamedIntersect && firstNamedIntersect.object) {
      if (this.intersected !== firstNamedIntersect.object) {
        this.intersected = firstNamedIntersect.object
      }
      // else do nothing
    } else {
      this.intersected = null
    }
  }

  updateRayFromCameraAndMouse() {
    if (!this.stage) return
    // Get the direction in which the camera is looking
    this.stage.camera.getWorldDirection(this.direction)

    // Set the raycaster with the camera's position and direction
    this.raycaster.setFromCamera(this.mouse, this.stage.camera)

    return this.raycaster // This is the ray that moves directly away from the camera
  }
}

// Create a single instance of RayTracer
const rayTracerInstance = new RayTracer();

// Export the handleRayEvent method that uses the instance
export const handleRayEvent = (event, callback) => {
  rayTracerInstance.handleRayEvent(event, callback);
};

// Export a method to set the stage
export const setRayTracerStage = (stage) => {
  rayTracerInstance.setStage(stage);
};

// Optionally, you can still export the class if needed elsewhere
export { RayTracer };
