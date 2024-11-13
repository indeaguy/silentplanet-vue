import { updateMeshColour, newThreeColour } from '../../../../make-these-libs/three-helpers';

export class MeshModifierController {
  constructor(model) {
    this.model = model;
  }

  /**
   * Sets the colour of a mesh to a specific state colour or a custom colour
   * 
   * @param {THREE.Mesh} mesh 
   * @param {string} stateName 
   * @param {number|false} colour 
   * @param {boolean} updateState 
   * @returns {void}
   */
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
      updateMeshColour(mesh, colourToUse);

      if (updateState) {
        this.model.addColorToState(stateName, colourToUse);
      }
    }
  }

  /**
   * Sets the material of a mesh to a specific state material or a custom material
   * 
   * @param {THREE.Mesh} mesh 
   * @param {string} stateName 
   * @param {THREE.Material|false} material 
   * @param {boolean} updateState 
   * @returns {void}
   */
  setMaterial(mesh, stateName, material = false, updateState = false) {
    const state = this.model.getState(stateName);
    if (!state) {
      console.error(`State '${stateName}' does not exist`);
      return;
    }

    const materialToUse = material === false ? state.material : material;

    if (mesh.material !== materialToUse) {
      mesh.material = materialToUse;
    }

    if (updateState) {
      this.model.addMaterialToState(stateName, materialToUse);
    }
  }

  /**
   * Get the material for a state
   * @param {string} stateName 
   * @returns {THREE.Material}
   */
  getStateMaterial(stateName) {
    return this.model.getStateMaterial(stateName);
  }
}