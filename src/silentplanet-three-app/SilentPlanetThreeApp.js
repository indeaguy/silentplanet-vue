import { configInstance } from './services/silentplanet-rust-geo';
import { getWorldStageController, createMeshModifier } from './make-these-libs/three-world-stage';
import {
  createLineBasicMaterial,
  createMeshBasicMaterial,
  createMeshPhongMaterial,
  createSphere,
  createSphericalGridLines,
  fadeMaterialColourByCameraDistance,
  loadCubeTexture,
  loadTexture,
  newThreeColour
} from './make-these-libs/three-helpers'
import { loadAndCreatePertinentRegionMeshesFromRedis } from '../silentplanet-three-app/services/GeosMeshService'
import { StarrySky } from './make-these-libs/three-world-stage/modules/StarrySky/StarrySky';

export class SilentPlanetThree {
  constructor(elementId, threePolysStore) {
    this.gridMaterials = {};
    this.worldStage = null;
    this.threePolysStore = threePolysStore;
    this.elementId = elementId;
    this.meshModifier = null;
    this.starrySky = null;

    // @TODO maybe don't do this.
    // Bind the methods to ensure correct 'this' context
    this.handleHoverEvent = this.handleHoverEvent.bind(this);
    this.handleClickEvent = this.handleClickEvent.bind(this);
  }

  async initialize() {
    let sphereMaterial, sphere, grids;

    await configInstance.initialize().catch(
      (error) => {
        console.error('Error initializing config:', error);
        throw error;
      }
    );

    this.worldStage = getWorldStageController(this.elementId, configInstance);

    // Initialize starry sky
    this.initializeStarrySky();

    const envMap = this.starrySky.getEnvMap();
    const bumpMap = loadTexture(import.meta.env.VITE_APP_EARTH_BUMP_MAP_PATH);
    const bumpScale = 1000;
    const specular = newThreeColour('grey');

    // Observers!
    this.worldStage.addResizeObserver(this);


    // Adding to the inital scene
    sphereMaterial = createMeshPhongMaterial({
      color: configInstance.settings.SPHERE.FILL_COLOUR,
      wireframe: configInstance.settings.SPHERE.WIREFRAME,
      transparent: configInstance.settings.SPHERE.TRANSPARENT,
      opacity: configInstance.settings.SPHERE.OPACITY,
      envMap: envMap,
      bumpMap: bumpMap,
      bumpScale: bumpScale,
      specular: specular
    });
    sphere = createSphere({
      radius: configInstance.settings.SPHERE.RADIUS,
      widthSegments: configInstance.settings.SPHERE.WIDTH_SEGMENTS,
      heightSegments: configInstance.settings.SPHERE.HEIGHT_SEGMENTS,
      material: sphereMaterial
    });
    this.worldStage.model.scene.add(sphere)

    // grids = this.createGrids()
    // Object.values(grids).forEach(gridArray => {
    //   gridArray.forEach(line => {
    //     this.worldStage.model.scene.add(line)
    //   })
    // })

    // @TODO anything added here has to be removed in onBeforeUnmount?
    // @TODO don't load these from scratch every time
    // const initialMeshes = await loadAndCreatePertinentRegionMeshesFromRedis()

    // // @TODO n+1 issue here. load them batches
    // this.loadChildMeshes(initialMeshes)

    this.meshModifier = createMeshModifier()

    this.worldStage.model.renderables.push(this)

    this.worldStage.animate()

    // Ensure that handleHoverEvent and handleClickEvent are bound to the correct context
    this.worldStage.handleHoverEvent = this.handleHoverEvent;
    this.worldStage.handleClickEvent = this.handleClickEvent;
  }

  initializeStarrySky() {
    const starryTexturePaths = configInstance.settings.STARRY_SKY_TEXTURES;

    if (starryTexturePaths && starryTexturePaths.length === 6) {

      // envMap
      const envMap = loadCubeTexture(starryTexturePaths);
      this.starrySky = new StarrySky(this.worldStage.model.scene, this.worldStage.model.camera, envMap);
      this.starrySky.initialize(starryTexturePaths);
    } else {
      console.warn('Starry sky textures not properly configured');
    }
  }

  // @TODO the only reason this is here is because it needs access to configInstance and this.gridMaterials
  createGrids() {
    const allGridLines = {};
    this.gridMaterials = {};

    Object.entries(configInstance.settings.SPHERE.GRIDS).forEach(([key, gridConfig]) => {
      // Create grid lines
      const grid = createSphericalGridLines(
        configInstance.settings.SPHERE.RADIUS,
        gridConfig.LAT_DENSITY,
        gridConfig.LAT_DENSITY,
        gridConfig.LON_DENSITY,
        key
      );

      // Create material using the new function
      const material = createLineBasicMaterial(gridConfig.COLOR);

      // Apply material to grid lines
      grid.forEach(line => {
        line.material = material;
      });

      // Store grid lines and materials
      allGridLines[key] = grid;
      this.gridMaterials[key] = { material, config: gridConfig };
    });

    return allGridLines;
  }

    /**
   * Loads and adds meshes to the scene and threePolysStore
   * 
   * @param {Array<THREE.Mesh>} meshes
   * @returns {Promise<void>}
   */
  async loadChildMeshes(meshes) {
    // do nothing for now
    for (const mesh of meshes) {
      if (!mesh.regionId) {
        continue
      }

      if (mesh.hasChild && mesh.regionId) {

        let childMeshIds = []
        const childMeshes = await loadAndCreatePertinentRegionMeshesFromRedis(mesh.regionId, false)

        for (const childMesh of childMeshes) {
          // @TODO nested for loop bad code smell

          if (!childMesh.regionId) {
            continue
          }

          // airforce harcoding here (intentional coupling)
          this.worldStage.model.scene.add(childMesh)
          this.threePolysStore.addMesh(childMesh)
          childMeshIds.push(childMesh.regionId)
        }

        mesh.childMeshIds = childMeshIds
      }

      // airforce harcoding here (intentional coupling)
      this.worldStage.model.scene.add(mesh)
      this.threePolysStore.addMesh(mesh)
      this.threePolysStore.addToOpenMeshes(mesh)
    }
  }

  /**
   * 
   * @param {THREE.Mesh} hoveredRegion 
   * @returns {void}
   */
  handleHoverEvent(hoveredRegion) {
    if (!this.threePolysStore) {
      console.warn('threePolysStore is not initialized in handleHoverEvent');
      return;
    }

    if (
      hoveredRegion?.regionId &&
      (!this.threePolysStore?.hoveredMesh?.regionId ||
        hoveredRegion.regionId !== this.threePolysStore.hoveredMesh.regionId)
    ) {
      if (
        this.threePolysStore?.selectedMesh?.regionId &&
        hoveredRegion?.regionId &&
        hoveredRegion.regionId == this.threePolysStore.selectedMesh.regionId
      ) {
        this.meshModifier.setColour(hoveredRegion, 'selectedEvent')
      } else {
        this.meshModifier.setColour(hoveredRegion, 'event')
      }
    }
  
    if (
      this.threePolysStore?.hoveredMesh?.regionId &&
      (!hoveredRegion?.regionId ||
        hoveredRegion.regionId !== this.threePolysStore.hoveredMesh.regionId)
    ) {
      if (
        this.threePolysStore?.selectedMesh?.regionId &&
        this.threePolysStore.hoveredMesh.regionId == this.threePolysStore.selectedMesh.regionId
      ) {
        this.meshModifier.setColour(this.threePolysStore.hoveredMesh, 'selected')
      } else {
        this.meshModifier.setColour(this.threePolysStore.hoveredMesh, 'default')
      }
    }
  
    this.threePolysStore.setHoveredMesh(hoveredRegion, () => {
      // do nothing for now
    })
  }

  /**
   * 
   * @param {THREE.Mesh} clickedRegion 
   * @returns {void}
   */
  handleClickEvent(clickedRegion) {
    if (!this.threePolysStore) {
      console.warn('threePolysStore is not initialized in handleClickEvent');
      return;
    }

    if (!clickedRegion || !clickedRegion.regionId) {
      return false
    }

    this.meshModifier.setColour(clickedRegion, 'selectedEvent')
  
    if (
      this.threePolysStore?.selectedMesh?.regionId &&
      (!clickedRegion?.regionId ||
        clickedRegion.regionId !== this.threePolysStore.selectedMesh.regionId)
    ) {
      this.meshModifier.setColour(this.threePolysStore.selectedMesh, 'default')
    }
  
    this.threePolysStore.drillTo(this.threePolysStore.selectedMesh.regionId || 0, clickedRegion.regionId)
  }

  /**
   * Resize observer callback
   * @param {*} newSize 
   * 
   * @TODO: do this recursively?
   */
  onResize(newSize) {
    // Update any globe-specific properties that depend on size
  }

  render() {
    var cameraDistance = this.worldStage.model.camera.position.length()

    Object.values(this.gridMaterials).forEach(({ material, config }) => {
      fadeMaterialColourByCameraDistance(
        material,
        config.COLOR,
        config.COLOR_FINAL,
        cameraDistance,
        config.FADE_START * (configInstance.settings.CAMERA.MIN_ZOOM_DISTANCE + configInstance.settings.CAMERA.MAX_ZOOM_DISTANCE),
        config.FADE_END * (configInstance.settings.CAMERA.MIN_ZOOM_DISTANCE + configInstance.settings.CAMERA.MAX_ZOOM_DISTANCE),
        config.FADE_SPEED
      );
    })

    // Update starry sky
    if (this.starrySky) {
      this.starrySky.update();
    }
  }
}
