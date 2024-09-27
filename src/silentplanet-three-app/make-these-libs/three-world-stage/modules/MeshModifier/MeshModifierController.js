import * as THREE from 'three';

export class MeshModifierController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  setColour(mesh, preset = 'defaultColour', colour = false, updatePreset = false) {
    if (!this.model[preset]) {
      return; // @TODO: Handle error
    }

    if (!mesh || !mesh.material) {
      return; // @TODO: Handle error
    }

    const colourToUse = colour === false ? this.model[preset] : 
      (this.model.isValidHexColour(colour) ? this.model.newColour(colour) : this.model[preset]);

    if (
      mesh.material?.color &&
      (mesh.material.color?.r !== colourToUse?.r ||
        mesh.material.color?.g !== colourToUse?.g ||
        mesh.material.color?.b !== colourToUse?.b)
    ) {
      this.view.updateMeshColor(mesh, colourToUse);

      if (updatePreset) {
        this.model[preset] = this.model.newColour(colourToUse);
      }
    }
  }

  async handleIntersection(intersectedMesh, callback = null) {
    if (this.model.intersected !== intersectedMesh) {
      if (intersectedMesh) {
        this.view.updateMeshColor(intersectedMesh, this.model.defaultColour);
      }

      if (this.model.intersected) {
        this.view.updateMeshColor(this.model.intersected, this.model.eventColour);
      }

      this.model.setIntersected(intersectedMesh);
    }

    if (callback) {
      await callback();
    }
  }

  resetIntersected() {
    if (this.model.intersected) {
      this.view.updateMeshColor(this.model.intersected, this.model.defaultColour);
      this.model.resetIntersected();
    }
  }
}