import * as THREE from 'three';

/**
 * Toggles the mesh visibility
 * 
 * @param {THREE.Mesh} mesh 
 * @returns {void}
 */
export function toggleMeshVisibility(mesh) {
    if (mesh) {
      mesh.visible = !mesh.visible;
    }
  }
  
  /**
   * Hides the mesh
   * 
   * @param {THREE.Mesh} mesh 
   * @returns {void}
   */
  export function hideMesh(mesh) {
    if (mesh) {
      mesh.visible = false;
    }
  }
  
  /**
   * Shows the mesh
   * 
   * @param {THREE.Mesh} mesh 
   * @returns {void}
   */
  export function showMesh(mesh) {
    if (mesh) {
      mesh.visible = true;
    }
  }