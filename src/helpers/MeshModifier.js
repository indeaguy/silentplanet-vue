import * as THREE from 'three' // Import the earcut library for triangulation.

// @TODO should me moved to a 'services' directory as this is a Service Layer design pattern?
export class MeshModifier {
  // @TODO use command pattern config instead of default colours here
  constructor(intersected = null, defaultColour = 0x00ff00, eventColour = 0xffc0cb, selectedColour = 0xFFA500, selectedEventColour = 0x005AFF) {
    this.defaultColour = this.newColour(defaultColour, true)
    this.eventColour = this.newColour(eventColour, true)
    this.selectedColour = this.newColour(selectedColour, true)
    this.selectedEventColour = this.newColour(selectedEventColour, true)
    this.intersected = intersected
  }

  newColour(color, bypass = false) {
    // decide here what a colour is
    if (!bypass && !this.isValidHexColour(color)) {
      return
    }

    return new THREE.Color(color)
  }

  updateMeshColor(mesh, colour) {
    if (mesh && mesh.material && colour && colour instanceof THREE.Color) {
      mesh.material.color.set(colour)
    }
  }

  toggleVisibility(mesh) {
    //if (mesh && mesh.visible) { // @TODO child mesh in polys.js fails this check?
      mesh.visible = !mesh.visible;
    //}
  }

  // if you don't want to choose a colour pass false and which colour in the class to use..
  // @TODO this seems to be the only reason this.intersected exists.. maybe just pass mesh as a first class value here
  setColour(mesh, preset = 'defaultColour', colour = false, updatePreset = false) {

    if (!this[preset]) {
      return //@TODO err

    }

    if (!mesh || !mesh.material) {
      return //@TODO err

    }

    if (colour === false) {
      this.updateMeshColor(mesh, this[preset]);

    } else {

      const colourToUse = this.isValidHexColour(colour) ? colour : this[preset];
      
      if (
          mesh.material?.color 
          && (
            mesh.material.color?.r !== colourToUse?.r
            || mesh.material.color?.g !== colourToUse?.g
            || mesh.material.color?.b !== colourToUse?.b
          )
        ) { // now only change the colour if it's different

        this.updateMeshColor(mesh, colourToUse);

        if (updatePreset) {
          // @TODO should always use getters/setters here?
          this[preset] = this.newColour(colourToUse)
        }

      }

    }
  }

  async handleIntersection(intersectedMesh, callback = null) {

    if (this.intersected !== intersectedMesh) {

      // set the colour of the one hovering-away-from back to the default
      if (intersectedMesh) this.updateMeshColor(intersectedMesh, this.defaultColour)

      if (this.intersected) this.updateMeshColor(this.intersected, this.eventColour)

      this.setInterected(intersectedMesh);
    }

  }

  setInterected(mesh) {
    this.intersected = mesh
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
      this.updateMeshColor(this.intersected, this.defaultColour)
      this.intersected = null
    }
  }


  // @TODO another/own library?
  isValidHexColour(color) {
    return typeof color === 'string' && /^0x[0-9A-Fa-f]{6}$/.test(color);
  }

}
