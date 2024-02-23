import { defineStore } from 'pinia';
import { MeshModifier } from "../helpers/MeshModifier"

export const useThreePolysStore = defineStore('three', {
  state: () => ({
    meshes: new Map(), // Using a Map instead of an array
    meshModifier: new MeshModifier(),
    selectedMesh: {},
    selectedMeshes: [],
    hoveredMesh: {},
    hoveredMeshes: [],
  }),
  actions: {
    addMesh(mesh) {
      // @TODO check if mesh already exists
      // @TODO id should be first class? at least check it exists
      this.meshes.set(mesh.regionId, mesh); // Add mesh to the Map
    },
    addSelectedMesh(mesh) {
      // @TODO check if mesh already exists
      // @TODO id should be first class? at least check it exists
      this.meshes.set(mesh.regionId, mesh);
      this.setSelectedMesh(mesh); // Add mesh to the Map
    },
    getMeshByRegionId(meshRegionId) {
      return this.meshes.get(meshRegionId); // Retrieve mesh by ID
    },
    setSelectedMesh(mesh, callback = false) {
      //mesh.material.color = new THREE.Color(0x00ff00); // @TODO this should be a ref? use meshModifier?

      mesh.isSelected = true; // @TODO what problems with this cause?
      this.selectedMesh = mesh;


      if (typeof callback === 'function') {
        // it's overriden don't do the default selected mesh behavior
        callback(mesh)
        return

      }
    },
    setSelectedMeshByRegionId(meshRegionId, callback = false) {
      const mesh = this.getMeshByRegion(meshRegionId);
      if (mesh) {
        this.setSelectedMesh(mesh, callback); // @TODO what affect does this approach have on reactivity?
      }
    },
    setHoveredMesh(mesh, callback) { // @TODO should this only be handled in the component refs for emits etc? which is more effiecient?
      this.hoveredMesh = mesh;

      if (mesh && !mesh?.isSelected) { // @TODO why don't?
        mesh.isSelected = false;
      }

      if (typeof callback === 'function') {
        // it's overriden don't do the default selected mesh behavior
        callback(mesh)
        return

      }
      //this.meshModifier.setHoveredMesh(mesh) // @TODO bad code smell here behvior in name, should be setting styles etc with a command pattern

    },
    setHoveredMeshByRegionId(meshRegionId, callback = false) {
      const mesh = this.getMeshByRegion(meshRegionId, callback);
      if (mesh) {
        this.setHoveredMesh(mesh); // @TODO what affect does this approach have on reactivity?
      }
    },
    toggleVisibility(meshRegionId) {
      const mesh = this.getMeshByRegionId(meshRegionId);
      if (mesh) {
        this.meshModifier.toggleVisibility(mesh);
      }
    },
    // @TODO this doesn't belong here?
    drillDown(meshRegionId) {
      let child;
      const mesh = this.getMeshByRegionId(meshRegionId);

      if (!mesh || !mesh.regionId) {
        // @TODO err
        return
      }
        
      if (mesh.regionId !== this.selectedMesh?.regionId) {
        
        this.setSelectedMesh(mesh); // @TODO affects reactivity?
      }

      if (mesh.childMeshIds) {

        this.meshModifier.toggleVisibility(mesh)
        mesh.childMeshIds.forEach((childId) => { // @Todo better way to do this than foreach? Handle types
        
          child = this.getMeshByRegionId(childId);

          if (!child) {
            // @TODO err
            return
          }

          this.meshModifier.toggleVisibility(child);
        });
      }
    },
    // @TODO just return both hovered and selected and let callback decide
    // hoverEffects(callback = null) {
    //   //const mesh = this.getMeshByRegionId(meshRegionId);

    //   if (!this.hoveredMesh?.regionId) {
    //     return // nothing is hovered
    //   }

    //   if (!callback) {
    //     return // there are no effects
    //   }

    //   if (this.hoveredMesh?.regionId !== this.selectedMesh?.regionId ) {
        
    //     //this.setHoveredMesh(mesh); // @TODO affects reactivity?
    //   } 
    // }

  }
});
