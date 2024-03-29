import { defineStore } from 'pinia'
import { MeshModifier } from '../helpers/MeshModifier'

// @TODO move this to a library/existing?
function findMatchingValuesSorted(array1, array2) {
  // Find the intersection
  const intersection = array1.filter((value) => array2.includes(value))

  // Sort the intersection array from smallest to largest
  intersection.sort((a, b) => a - b)

  return intersection
}

export const useThreePolysStore = defineStore('three', {
  state: () => ({
    meshes: new Map(), // Using a Map instead of an array
    meshModifier: new MeshModifier(),
    selectedMesh: {},
    selectedMeshes: [],
    hoveredMesh: {},
    hoveredMeshes: [],
    openedMeshIds: [], // @TODO which of these is better? Does openedMeshes use vue reactivity?
    openedMeshes: []
  }),
  actions: {
    addMesh(mesh) {
      // @TODO check if mesh already exists
      // @TODO id should be first class? at least check it exists
      this.meshes.set(mesh.regionId, mesh) // Add mesh to the Map
    },
    addSelectedMesh(mesh) {
      // @TODO check if mesh already exists
      // @TODO id should be first class? at least check it exists
      this.addMesh(mesh)
      this.setSelectedMesh(mesh) // Add mesh to the Map
    },
    addVisibleMesh(mesh) {
      // @TODO check if mesh already exists
      // @TODO id should be first class? at least check it exists
      this.addMesh(mesh)
      this.addToOpenMeshes(mesh)
    },
    getMeshByRegionId(meshRegionId) {
      return this.meshes.get(meshRegionId) // Retrieve mesh by ID
    },
    findFirstAvailableMesh(regionIds) {
      for (let i = 0; i < regionIds.length; i++) {
        const mesh = this.getMeshByRegionId(regionIds[i])
        if (mesh) {
          return mesh
        }
      }
      return null // Return null if no valid mesh is found
    },
    setSelectedMesh(mesh, callback = false) {
      //mesh.material.color = new THREE.Color(0x00ff00); // @TODO this should be a ref? use meshModifier?

      mesh.isSelected = true // @TODO what problems with this cause?
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
      //this.meshModifier.setHoveredMesh(mesh) // @TODO bad code smell here behvior in name, should be setting styles etc with a command pattern
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
    // @TODO always use this.. make meshModifier private to polys.js
    // @TODO maintain list of visible meshes here for effecient use later
    toggleVisibility(mesh) {
      if (!mesh && !mesh.regionId && !mesh.visible) {
        return
      }

      // toggle the visibility first
      this.meshModifier.toggleVisibility(mesh)

      // then conditionally add or remove the mesh from openedMeshIds and openMeshes
      // @TODO before I can start adding here need to also account for the meshes that are added by default
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
      // @TODO reeallly should only do one of these..
      const index = this.openedMeshIds.indexOf(mesh.regionId);
      if (index > -1) {
        this.openedMeshIds.splice(index, 1);
      }
    },
    // @TODO this doesn't belong here?
    /**
     *
     * @param {int} meshRegionId the mesh being drilled into
     * @returns
     */
    // @TODO this isn't used anymore
    drillDown(meshRegionId) {
      let child
      const mesh = this.getMeshByRegionId(meshRegionId)

      if (!mesh || !mesh.regionId) {
        // @TODO err
        return
      }

      //let hmm = this.selectedMesh;
      //console.log(this.selectedMesh);

      if (mesh.regionId !== this.selectedMesh?.regionId) {
        this.setSelectedMesh(mesh) // @TODO affects reactivity?
      }

      if (mesh.childMeshIds) {
        this.toggleVisibility(mesh)
        mesh.childMeshIds.forEach((childId) => {
          // @Todo better way to do this than foreach? Handle types

          child = this.getMeshByRegionId(childId)

          if (!child) {
            // @TODO err
            return
          }

          this.toggleVisibility(child)
        })
      }
    },
    /**
     *
     * @param {int} meshRegionId presumably the current mesh
     * @returns
     */
    drillUp() {
      // @TODO
    },
    drillTo(fromRegionId, toRegionId) {
      if (fromRegionId === toRegionId) {
        return
      }

      let openMeshes = this.openedMeshIds;
      let toRegion = this.getMeshByRegionId(toRegionId);

      if (!toRegion || !toRegion.regionId || !toRegion.openFamily || toRegion.openFamily.length === 0) {
        
        // @TODO try to load it here
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

      
      

      // combine them together

      // toggle the combined lis

      /**
       * @todo
       * make sure we have the toRegion and all it's anscestors and if not get them
       * for the fromRegion, we don't need all those, just all the open ones.
       *
       * while those are loading, do what we can based on the fromRegion in the meantime.. show a spinner after if we need
       */

      //let lowestCommonAncestorId = this.findLowestCommonAncestor(fromRegionId, toRegionId)

      // @TODO this doesn't work.. just toggling all the decendants
      // instead.. of all the children that are visible of the lowest common ancestor
      // make them invisible except the immediate children of the lowest common ancestor
      //let childrenToToggle = this.findAllOpenChildrensChildren(lowestCommonAncestorId)
      //let lowestCommonAncestorsChildren = this.findAllDescendants(lowestCommonAncestorId);

      // childrenToToggle.forEach((childId) => {
      //   this.toggleVisibilityByRegionId(childId)
      // })

      // find lowest common ancestor

      // close all children of lowest common ancestor

      // recursively open all children of lowest common ancestor between lowerst common ancestor and toRegionId's mesh

      // @TODO
    },
    // @TODO not used anymore..
    findAllOpenChildrensChildren(regionId) {
      // @TODO this is returning an array of ids.. need to manage types

      if (!this.meshes.has(regionId)) {
        // there is no mesh
        return []
      }

      // @TODO here .. if there's no mesh we're at the very top of the anscestor tree

      const mesh = this.meshes.get(regionId)

      if (!mesh.childMeshIds || mesh.childMeshIds.length === 0) {
        // there are no children
        return []
      }

      // @TODO here. do this instead
      // if (this.openedMeshIds.length > 0) {

      //   // @TODO add logic here to use openMeshIds instead.
      //   return [];
      // } else { // maybe leave this fallback.. but it won't perform well!

      let openDescendents = this.findAllOpenChildren(regionId)

      if (openDescendents.length === 0) {
        return []
      }

      // return the open descendents that are not immediate children
      return openDescendents.filter((value) => !mesh.childMeshIds.includes(value))
      //}
    },
    findAllOpenChildren(regionId) {
      return this.findAllDescendants(regionId, (mesh) => mesh.visible === true)
    },
    // @TODO not used anymore..
    // @TODO, this only works if all the meshes are loaded into state
    findAllParents(regionId) {
      const parents = []
      let currentId = regionId

      while (currentId && this.meshes.has(currentId)) {
        const currentMesh = this.meshes.get(currentId)
        if (currentMesh.parentId) {
          // Assuming 'parentID' is the property name
          parents.push(currentMesh.parentId)
          currentId = currentMesh.parentId // Move up to the next parent
        } else {
          break // No more parents, exit the loop
        }
      }

      return parents
    },
    // @TODO, this only works if all the meshes are loaded into state
    // findAllDescendants(regionId) {
    //   let descendants = [];

    //   function getMeshByRegionId(regionId) {
    //       return this.meshes.get(regionId); // Retrieve mesh by ID
    //   }

    //   function gatherDescendants(id) {
    //       const currentMesh = getMeshByRegionId(id);
    //       if (currentMesh && currentMesh.childrenIDs) { // Assuming 'childrenIDs' is the property name
    //           descendants = descendants.concat(currentMesh.childrenIDs);
    //           currentMesh.childrenIDs.forEach(childId => gatherDescendants(childId));
    //       }
    //   }

    //   gatherDescendants(regionId);
    //   return descendants;
    // },
    // @TODO not used anymore..
    findAllDescendants(regionId, shouldInclude = () => true) {
      let descendants = []

      const gatherDescendants = (id) => {
        const currentMesh = this.meshes.get(id)
        if (currentMesh && shouldInclude(currentMesh) && currentMesh.childMeshIds) {
          descendants = descendants.concat(currentMesh.childMeshIds)
          currentMesh.childMeshIds.forEach((childId) => gatherDescendants(childId))
        }
      }

      gatherDescendants(regionId)
      return descendants
    },
    // @TODO not used anymore..
    findAllVisibleDescendants(regionId) {
      let descendants = []

      const gatherDescendants = (id) => {
        const currentMesh = this.meshes.get(id)
        // if the visibility is false the children are opened
        if (currentMesh && currentMesh.visible == false && currentMesh.childMeshIds) {
          descendants = descendants.concat(currentMesh.childMeshIds)

          // remove
          let index = descendants.indexOf(currentMesh.childMeshIds)
          if (index > -1) {
            descendants.splice(index, 1)
          }

          currentMesh.childMeshIds.forEach((childId) => gatherDescendants(childId))
        }
      }

      gatherDescendants(regionId)
      return descendants
    },
    // @TODO not used anymore..
    // @TODO, this only works if all the meshes are loaded into state
    findLowestCommonAncestor(regionIdA, regionIdB) {
      const ancestorsA = this.findAllParents(regionIdA)
      const ancestorsB = this.findAllParents(regionIdB)
      const commonAncestors = ancestorsA.filter((id) => ancestorsB.includes(id))
      const lowestCommonAncestor = commonAncestors[commonAncestors.length - 1]
      return lowestCommonAncestor
    },
    // @TODO not used anymore..
    // this depends on the parentIds array already in the mesh loaded from the backend
    // which includes all parents .. and this only loads the lowest common anscestor that is stored in state.. or regionid 0
    findLowestKnownCommonAncestor(hereRegionId, thereRegionId) {
      let commonAncestorIds, lowestCommonAncestor
      // @TODO these should be expected as first class instead
      let hereRegion = this.getMeshByRegionId(hereRegionId)
      let thereRegion = this.getMeshByRegionId(thereRegionId)

      if (
        !hereRegion?.regionId ||
        !thereRegion?.regionId ||
        !hereRegion?.parentIds ||
        !thereRegion?.parentIds ||
        hereRegion.parentIds.length === 0 ||
        thereRegion.parentIds.length === 0
      ) {
        // @TODO err
        return thereRegion
      }

      if (thereRegion.parentIds.includes(hereRegion.regionId)) {
        return hereRegion // hereRegion is the lowest common ancestor
      }

      if (hereRegion.parentIds.includes(thereRegion.regionId)) {
        return thereRegion // thereRegion is the lowest common ancestor
      }

      commonAncestorIds = findMatchingValuesSorted(hereRegion.parentIds, thereRegion.parentIds)

      if (commonAncestorIds.length === 0) {
        // @TODO err
        return thereRegion
      }

      lowestCommonAncestor = this.findFirstAvailableMesh(commonAncestorIds)

      if (!lowestCommonAncestor) {
        // @TODO err
        return thereRegion
      } else {
        return lowestCommonAncestor
      }
    }
  }
})
