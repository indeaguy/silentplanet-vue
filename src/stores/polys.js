import { defineStore } from 'pinia'
import { toggleMeshVisibility } from '../silentplanet-three-app/make-these-libs/three-helpers'

export const useThreePolysStore = defineStore('ThreePolysStoreMeshes', {
  state: () => ({
    meshes: new Map(), // Using a Map instead of an array
    selectedMesh: {},
    hoveredMesh: {},
    openedMeshIds: [],
  }),
  actions: {
    addMesh(mesh) {
      if (this.meshes.has(mesh.regionId)) {
        return
      }
      this.meshes.set(mesh.regionId, mesh)
    },
    addSelectedMesh(mesh) {
      this.addMesh(mesh)
      this.setSelectedMesh(mesh)
    },
    addVisibleMesh(mesh) {
      this.addMesh(mesh)
      this.addToOpenMeshes(mesh)
    },
    getMeshByRegionId(meshRegionId) {
      return this.meshes.get(meshRegionId)
    },
    findFirstAvailableMesh(regionIds) {
      for (let i = 0; i < regionIds.length; i++) {
        const mesh = this.getMeshByRegionId(regionIds[i])
        if (mesh) {
          return mesh
        }
      }
      return null // no valid mesh is found
    },
    setSelectedMesh(mesh, callback = false) {
      mesh.isSelected = true
      this.selectedMesh = mesh
      if (typeof callback === 'function') {
        // it's overriden don't do the default selected mesh behavior
        callback(mesh)
        return
      }
    },
    setSelectedMeshByRegionId(meshRegionId, callback = false) {
      const mesh = this.getMeshByRegion(meshRegionId)
      if (mesh) {
        this.setSelectedMesh(mesh, callback) // @TODO what affect does this approach have on reactivity?
      }
    },
    setHoveredMesh(mesh, callback) {
      // @TODO should this only be handled in the component refs for emits etc? which is more effiecient?
      this.hoveredMesh = mesh

      if (mesh && !mesh?.isSelected) {
        // @TODO why don't?
        mesh.isSelected = false
      }

      if (typeof callback === 'function') {
        // it's overriden don't do the default selected mesh behavior
        callback(mesh)
        return
      }
    },
    setHoveredMeshByRegionId(meshRegionId, callback = false) {
      const mesh = this.getMeshByRegion(meshRegionId, callback)
      if (mesh) {
        this.setHoveredMesh(mesh) // @TODO what affect does this approach have on reactivity?
      }
    },
    toggleVisibilityByRegionId(meshRegionId) {
      const mesh = this.getMeshByRegionId(meshRegionId)
      if (mesh) {
        this.toggleVisibility(mesh)
      }
    },
    toggleVisibility(mesh) {
      if (!mesh && !mesh.regionId && !mesh.visible) {
        return
      }
      toggleMeshVisibility(mesh)
      if (mesh.visible) {
        this.addToOpenMeshes(mesh);
      } else {
        this.removeFromOpenMeshes(mesh)
      }
    },
    addToOpenMeshes(mesh) { 
      if (!mesh || !mesh.regionId || this.openedMeshIds.includes(mesh.regionId)) {
        return
      }
      this.openedMeshIds.push(mesh.regionId);
    },
    removeFromOpenMeshes(mesh) { 
      if (!mesh || !mesh.regionId || !this.openedMeshIds.includes(mesh.regionId)) {
        return
      }
      const index = this.openedMeshIds.indexOf(mesh.regionId);
      if (index > -1) {
        this.openedMeshIds.splice(index, 1);
      }
    },
    /**
     * When a region is selected, open all of its family members that are not already open and close all others
     * 
     * @param {int} fromRegionId 
     * @param {int} toRegionId 
     * @returns void
     */
    drillTo(fromRegionId, toRegionId) {
      if (fromRegionId === toRegionId) {
        return
      }

      let toRegion = this.getMeshByRegionId(toRegionId);

      if (!toRegion || !toRegion.regionId || !toRegion.openFamily || toRegion.openFamily.length === 0) {
        return
      }

      // find all family members in openFamily that are not open, and all the open ones that are not in openFamily and combine them together
      let meshesToToggle = [
        ...toRegion.openFamily.filter(mesh => !this.openedMeshIds.includes(mesh)),
        ...this.openedMeshIds.filter(meshId => !toRegion.openFamily.includes(meshId))
      ];

      meshesToToggle.forEach(meshId => {
        this.toggleVisibilityByRegionId(meshId)
      })

      if (toRegion.regionId !== this.selectedMesh?.regionId) {
        this.setSelectedMesh(toRegion) // @TODO affects reactivity?
      }
    },
  }
})
