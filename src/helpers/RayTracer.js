import * as THREE from 'three'; // Import the earcut library for triangulation.

export class RayTracer {
  constructor(scene, camera, hoverColor = 0xFFC0CB, originalColor = 0x00ff00) {
    this.scene = scene;
    this.camera = camera;
    this.hoverColor = new THREE.Color(hoverColor);
    this.originalColor = new THREE.Color(originalColor);
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.intersected = null;

    // @TODO should only do this when the appropriate debugging is enabled
    const circleGeometry = new THREE.CircleGeometry(0.5, 32); // Small circle with a radius of 0.5
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.indicator = new THREE.Mesh(circleGeometry, circleMaterial);
    this.indicator.visible = false; // Initially hidden
    scene.add(this.indicator);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    this.checkIntersections();

    // @TODO should only do this when the appropriate debugging is enabled
    this.updateIndicatorPosition();
  }

  checkIntersections() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    //console.log(this.scene.children);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      if (this.intersected != intersects[0].object) {
        if (this.intersected) this.intersected.material.color.set(this.originalColor);
        this.intersected = intersects[0].object;
        this.intersected.material.color.set(this.hoverColor);
      }
    } else {
      if (this.intersected) this.intersected.material.color.set(this.originalColor);
      this.intersected = null;
    }
  }

  updateIndicatorPosition() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    // Assuming you want to place the indicator on a specific plane for demonstration
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Adjust as needed
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, target);

    if (target) {
      this.indicator.position.copy(target);
      this.indicator.visible = true;
    } else {
      this.indicator.visible = false;
    }
  }

}
