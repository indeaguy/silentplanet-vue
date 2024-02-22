import { defineStore } from 'pinia';
import { MeshModifier } from "../helpers/MeshModifier"

export const useThreePolysStore = defineStore('three', {
  state: () => ({
    meshes: new Map(), // Using a Map instead of an array
    meshModifier: new MeshModifier(),
    selectedMesh: '',
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
    setSelectedMesh(mesh) { // @TODO should this only be handled in the component refs for emits etc? which is more effiecient?
      //mesh.material.color = new THREE.Color(0x00ff00); // @TODO this should be a ref? use meshModifier?
      this.selectedMesh = mesh;

    },
    setSelectedMeshByRegionId(meshRegionId) {
      const mesh = this.getMeshByRegion(meshRegionId);
      if (mesh) {
        this.setSelectedMesh(mesh); // @TODO what affect does this approach have on reactivity?
      }
    },
    toggleVisibility(meshRegionId) {
      const mesh = this.getMeshByRegionId(meshRegionId);
      if (mesh) {
        this.meshModifier.toggleVisibility(mesh);
      }
    },
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
    }

  }
});
