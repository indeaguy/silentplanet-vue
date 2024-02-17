import { defineStore } from 'pinia';

export const useThreePolysStore = defineStore('three', {
  state: () => ({
    meshes: new Map(), // Using a Map instead of an array
    selectedMesh: null,
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
      this.selectedMesh = mesh;
    },
    setSelectedMeshByRegion(meshRegion) {
      const mesh = this.getMeshByRegion(meshRegion);
      if (mesh) {
        this.setSelectedMesh(mesh); // @TODO what affect does this approach have on reactivity?
      }
    },
    toggleVisibility(meshRegionId) {
      const mesh = this.getMeshByRegionId(meshRegionId);
      if (mesh) {
        mesh.visible = !mesh.visible;
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
        
        this.setSelectedMeshByRegionId(mesh.regionId); // @TODO affects reactivity?
      }

      if (mesh.childMeshIds) {
        mesh.visible = !mesh.visible;
        mesh.childMeshIds.forEach((childId) => { // @Todo better way to do this than foreach? Handle types
          
          child = this.getMeshByRegionId(childId);

          if (!child) {
            // @TODO err
            return
          }

          child.visible = !child.visible;
        });
      }
    }

  }
});
