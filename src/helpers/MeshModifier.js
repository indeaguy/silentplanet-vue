import * as THREE from 'three' // Import the earcut library for triangulation.

export class MeshModifier {
  constructor(intersected = null, originalColour = 0x00ff00, eventColour = 0xffc0cb) {
    this.originalColour = new THREE.Color(originalColour)
    this.eventColour = new THREE.Color(eventColour)
    this.intersected = intersected
  }

  updateMeshColor(mesh, color) {
    if (mesh && mesh.material) {
      mesh.material.color.set(color)
    }
  }

  handleIntersection(intersectedMesh) {
    if (this.intersected !== intersectedMesh) {
      if (this.intersected) this.updateMeshColor(this.intersected, this.originalColour)
      if (intersectedMesh) this.updateMeshColor(intersectedMesh, this.eventColour)
      this.intersected = intersectedMesh
    }
  }

  hideMesh(mesh) {
    if (mesh) {
      mesh.visible = false
    }
  }

  showMesh(mesh) {
    if (mesh) {
      mesh.visible = true
    }
  }

  resetIntersected() {
    if (this.intersected) {
      this.updateMeshColor(this.intersected, this.originalColour)
      this.intersected = null
    }
  }
}
