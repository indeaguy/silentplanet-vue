import { updateMeshColor, newThreeColour } from './helpers/ThreeMeshHelpers';

export class MeshModifierController {
  constructor(model) {
    this.model = model;
  }

  setColour(mesh, stateName, colour = false, updateState = false) {
    const state = this.model.getState(stateName);
    if (!state) {
      console.error(`State '${stateName}' does not exist`);
      return;
    }

    if (!mesh || !mesh.material) {
      console.error('Invalid mesh or mesh material');
      return;
    }

    const colourToUse = colour === false ? state.colour : newThreeColour(colour);

    if (
      mesh.material?.color &&
      (mesh.material.color?.r !== colourToUse?.r ||
        mesh.material.color?.g !== colourToUse?.g ||
        mesh.material.color?.b !== colourToUse?.b)
    ) {
      updateMeshColor(mesh, colourToUse);

      if (updateState) {
        this.model.addColorToState(stateName, colourToUse);
      }
    }
  }

  /**
   * 
   * @param {THREE.Mesh} intersectedMesh 
   * @param {string} stateName 
   * @param {function} callback 
   * @returns {void}
   * 
   * @example
   * handleIntersection(mesh, 'selected', () => {
   *   console.log('Intersection with mesh');
   * });
   * @todo why is this not used?
   */
  async handleIntersection(intersectedMesh, stateName, callback = null) {
    // if (this.model.intersected !== intersectedMesh) {
    //   if (intersectedMesh) {
    //     this.setColour(intersectedMesh, 'default');
    //   }

    //   if (this.model.intersected) {
    //     const prevState = this.model.getIntersectedState();
    //     this.setColour(this.model.intersected, prevState);
    //   }

    //   this.model.setIntersected(intersectedMesh, stateName);
    // }

    // if (callback) {
    //   await callback();
    // }
  }

  resetIntersected() {
    // if (this.model.intersected) {
    //   this.setColour(this.model.intersected, 'default');
    //   this.model.resetIntersected();
    // }
  }
}