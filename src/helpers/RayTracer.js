//@TODO 6490556acd192949fea5d02297b4594c574c5079

/**
 * 
 *     Client Size Handling:
        The clientHeight and clientWidth are passed from the stage object. Ensure that these values are updated if the canvas size changes, for instance, due to window resizing. You have a method onResize for this, but make sure it's properly called when the canvas size changes.

    Raycasting Logic:
        The checkIntersections method is well-implemented. It changes the color of the intersected object, which is a nice visual feedback for interaction. Just ensure that the material of the objects in your scene supports color changes (i.e., they are not using a basic material with a texture map).

    Performance Considerations:
        Depending on the complexity and number of objects in your scene, raycasting can be computationally expensive. If performance becomes an issue, consider optimizing the scene or using more efficient methods for intersection tests.

    Callback Function:
        The handleRayEvent method accepts a callback, which is good for flexibility. Ensure that the callback function is used appropriately in the context of your Vue application.

    Mouse Position Calculation:
        The calculation of this.mouse.x and this.mouse.y in handleRayEvent is standard for converting the mouse position to normalized device coordinates. Just ensure that event.offsetX and event.offsetY are always providing the correct values relative to the canvas.

    Logging:
        The console log in checkIntersections is useful for debugging but should be removed or commented out for production.

    Error Handling:
        Consider adding error handling or validation, especially in methods like handleRayEvent and checkIntersections.

    Documentation:
        Adding more detailed comments explaining the purpose of each method and the parameters it accepts would be beneficial, especially for more complex methods like createRayFromCamera.

    Use of Plane and PlaneNormal:
        The plane and planeNormal properties are declared but not used in the provided code. If these are not needed, consider removing them to clean up the class.

    Modularity and Reusability:
        The class is designed specifically for the current application context. If you plan to use it in different contexts, consider making it more generic and configurable.

 */

import * as THREE from 'three' // Import the earcut library for triangulation.

export class RayTracer {
  constructor(stage, meshHandler) {
    this.scene = stage.scene
    this.camera = stage.camera
    this.clientHeight = stage.clientHeight // @TODO need a very good reason to do this
    this.clientWidth = stage.clientWidth // @TODO need a very good reason to do this
    this.meshHandler = meshHandler
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.plane = new THREE.Plane()
    this.planeNormal = new THREE.Vector3()
    this.intersected = null
  }

  handleRayEvent(event, callback) {
    this.mouse.x = (event.offsetX / this.clientWidth) * 2 - 1
    this.mouse.y = -(event.offsetY / this.clientHeight) * 2 + 1
    this.checkIntersections()
    if (typeof callback === 'function') {
      callback(this.intersected)
    }
  }

  onResize(newSize) {
    this.clientHeight = newSize.y
    this.clientWidth = newSize.x
  }

  checkIntersections() {
    const ray = this.createRayFromCamera()

    // Perform the raycasting
    const intersects = ray.intersectObjects(this.scene.children, true)

    // Find the first intersected object with a non-empty name attribute and are visible
    const firstNamedIntersect = intersects.find((intersect) => intersect.object.name && intersect.object.visible)

    if (firstNamedIntersect && firstNamedIntersect.object) {

      if (this.intersected !== firstNamedIntersect.object) {
        this.intersected = firstNamedIntersect.object
        this.meshHandler.handleIntersection(firstNamedIntersect.object)
      }
      // else do nothing
    } else {
      this.meshHandler.resetIntersected()
      this.intersected = null
    }
  }

  createRayFromCamera() {
    const raycaster = new THREE.Raycaster()
    const direction = new THREE.Vector3()

    // Get the direction in which the camera is looking
    this.camera.getWorldDirection(direction)

    // Set the raycaster with the camera's position and direction
    //raycaster.set(this.mouse, direction);
    raycaster.setFromCamera(this.mouse, this.camera)

    return raycaster // This is the ray that moves directly away from the camera
  }
}
