import { newThreeColour } from '../../../../make-these-libs/three-helpers';

export class MeshModifierModel {
  constructor() {
    this.states = new Map();
    this.intersected = null;
  }

  /**
   * Add a state to the mesh model
   * @param {string} stateName 
   * @returns {void}
   * 
   * @example
   * addState('default')
   * addState('event')
   * addState('selected')
   * addState('selectedEvent')
   */
  addState(stateName) {
    if (!this.states.has(stateName)) {
      this.states.set(stateName, {});
    }
  }

  /**
   * Add a color to a state
   * @param {string} stateName 
   * @param {string} colour 
   * @returns {void}
   * 
   * @example
   * addColorToState('default', '#f279a8')
   * addColorToState('event', '#ffc0cb')
   * addColorToState('selected', '#0051e6')
   * addColorToState('selectedEvent', '#005aff')
   */
  addColorToState(stateName, colour) {
    if (!this.states.has(stateName)) {
      this.addState(stateName);
    }
    const state = this.states.get(stateName);
    state.colour = newThreeColour(colour, true);
  }

  /**
   * Add a material to a state
   * @param {string} stateName 
   * @param {THREE.Material} material 
   * @returns {void}
   */
  addMaterialToState(stateName, material) {
    if (!this.states.has(stateName)) {
      this.addState(stateName);
    }
    const state = this.states.get(stateName);
    state.material = material;
  }

  /**
   * Get a state
   * @param {string} stateName 
   * @returns {object}
   * 
   * @example
   * getState('default')
   * getState('event')
   * getState('selected')
   * getState('selectedEvent')
   */
  getState(stateName) {
    return this.states.get(stateName);
  }

  getStateMaterial(stateName) {
    return this.getState(stateName).material;
  }

  setIntersected(mesh) {
    this.intersected = mesh;
  }

  resetIntersected() {
    this.intersected = null;
  }
}