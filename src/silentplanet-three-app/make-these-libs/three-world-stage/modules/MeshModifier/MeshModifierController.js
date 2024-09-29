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

  fadeMeshColourByCameraDistance(mesh, config, distance) {
    if (!mesh || !mesh.material || !config) {
      return;
    }

    // @TODO This migth be the wrong calculation
    const fadeStart = config.FADE_START * (this.model.minZoomDistance + this.model.maxZoomDistance);
    const fadeEnd = config.FADE_END * (this.model.minZoomDistance + this.model.maxZoomDistance);
    
    const normalizedDistance = calculateNormalizedDistance(distance, fadeStart, fadeEnd);

    const fromColor = this.model.newColour(config.COLOR);
    const toColor = this.model.newColour(config.COLOR_FINAL);

    this.view.fadeMeshColourByCameraDistance(mesh.material, fromColor, toColor, normalizedDistance, config.FADE_SPEED);
  }
}


function calculateNormalizedDistance(distance, fadeStart, fadeEnd) {
  if (distance > fadeEnd) {
    return 1;
  } else if (distance < fadeStart) {
    return 0;
  } else {
    return (distance - fadeStart) / (fadeEnd - fadeStart);
  }
}