import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// @TODO rename this class to stage
export class Scene {
  constructor(cameraConfig, sceneConfig, targetElement) {
    // this line needs validation
    this.targetElement = document.getElementById(targetElement)
    this.cameraConfig = cameraConfig
    this.sceneConfig = sceneConfig
    this.clientWidth = this.targetElement.clientWidth
    this.clientHeight = this.targetElement.clientHeight
    this.updateSize()

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.FOV,
      (this.clientWidth * sceneConfig.WIDTH_PERCENTAGE) /
        (this.clientHeight * sceneConfig.HEIGHT_PERCENTAGE),
      cameraConfig.MIN_VISIBLE,
      cameraConfig.MAX_VISIBLE
    )
    this.camera.position.set(
      cameraConfig.DEFAULT_POINT_X,
      cameraConfig.DEFAULT_POINT_Y,
      cameraConfig.DEFAULT_POINT_Z
    )
    this.camera.updateProjectionMatrix()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(
      this.clientWidth * sceneConfig.WIDTH_PERCENTAGE,
      this.clientHeight * sceneConfig.HEIGHT_PERCENTAGE
    )
    // @TODO set this to 1 to make it look like startrek next generation or starwars
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.targetElement.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    /**
     * Renderables
     */

    this.renderables = []

    /**
     * Observers
     *
     * when something changes here inform anything 'observing' these
     */

    this.resizeObservers = []

    // Handle #base-globe div resizing
    this.size = new THREE.Vector2(
      this.clientWidth * sceneConfig.WIDTH_PERCENTAGE,
      this.clientHeight * sceneConfig.HEIGHT_PERCENTAGE
    )
    // this.onWindowResize = this.onWindowResize.bind(this)
    // window.addEventListener('resize', this.onWindowResize, false)
  }

  // allow other objects to subscribe to resize events
  addResizeObserver(observer) {
    this.resizeObservers.push(observer)
  }

  animate() {
    const animateFunc = () => {
      requestAnimationFrame(animateFunc)
      this.render()
    }
    animateFunc()
  }

  render() {
    this.controls.update()
    for (let renderable of this.renderables) {
      renderable.render()
    }
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Supporting methods
   */

  onWindowResize() {
    this.updateSize()
    const newSize = new THREE.Vector2(
      this.clientWidth * this.sceneConfig.WIDTH_PERCENTAGE,
      this.clientHeight * this.sceneConfig.HEIGHT_PERCENTAGE
    )
    if (!newSize.equals(this.size)) {
      this.camera.aspect =
        (this.clientWidth * this.sceneConfig.WIDTH_PERCENTAGE) /
        (this.clientHeight * this.sceneConfig.HEIGHT_PERCENTAGE)
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(newSize.x, newSize.y)
      this.controls.dispose() // dispose old controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement) // add new controls
      this.size.copy(newSize)
    }

    // Notify all observers about the resize event
    for (let observer of this.resizeObservers) {
      observer.onResize(newSize)
    }
  }

  updateSize() {
    this.clientWidth = this.targetElement.clientWidth
    this.clientHeight = this.targetElement.clientHeight
  }
}
