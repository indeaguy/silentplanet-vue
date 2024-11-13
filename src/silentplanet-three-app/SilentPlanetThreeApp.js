import { configInstance } from './services/silentplanet-rust-geo';
import { getWorldStageController, createMeshModifier } from './make-these-libs/three-world-stage';
import {
  createGlowingMeshPhongMaterial,
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
import * as THREE from 'three';

export class SilentPlanetThree {
  constructor(elementId, threePolysStore) {
    this.gridMaterials = {};
    this.worldStage = null;
    this.threePolysStore = threePolysStore;
    this.elementId = elementId;
    this.meshStates = null;
    this.starrySky = null;
    this.uiMeshes = [];

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
      specular: specular,
    });
    sphere = createSphere({
      radius: configInstance.settings.SPHERE.RADIUS,
      widthSegments: configInstance.settings.SPHERE.WIDTH_SEGMENTS,
      heightSegments: configInstance.settings.SPHERE.HEIGHT_SEGMENTS,
      material: sphereMaterial
    });
    sphere.renderOrder = 1;
    this.worldStage.model.scene.add(sphere)

    // Create inner sphere with transparent texture
    const innerTexture = loadTexture('/src/assets/images/landmass/blue-earth-4096-2048.png');
    innerTexture.transparent = true;

    const innerSphereMaterial = createMeshBasicMaterial({
      map: innerTexture,
      transparent: true,
      side: THREE.FrontSide,
      color: 0xffffff,
      depthWrite: true,
      depthTest: true,
      alphaTest: 0.1
    });
    
    const innerSphere = createSphere({
      radius: configInstance.settings.SPHERE.RADIUS * 0.999,
      widthSegments: configInstance.settings.SPHERE.WIDTH_SEGMENTS,
      heightSegments: configInstance.settings.SPHERE.HEIGHT_SEGMENTS,
      material: innerSphereMaterial
    });
    innerSphere.renderOrder = 0;
    this.worldStage.model.scene.add(innerSphere);

    grids = this.createGrids()
    Object.values(grids).forEach(gridArray => {
      gridArray.forEach(line => {
        this.worldStage.model.scene.add(line)
      })
    })

    this.meshStates = createMeshModifier({
      initial: createMeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7,
        depthWrite: true,
        depthTest: true,
        renderOrder: 2
      }),
      default: createMeshBasicMaterial({
        color: 0x87cefa,
        transparent: true,
        opacity: 0.7,
        depthWrite: true,
        depthTest: true,
        renderOrder: 2
      }),
      event: createGlowingMeshPhongMaterial({
        color: 0x87cefa,
        glowColor: 0x87cefa,
        glowIntensity: 100,
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true,
        renderOrder: 2
      }),
      selected: createGlowingMeshPhongMaterial({
        color: 0xFFD700,
        glowColor: 0xFFD700,
        glowIntensity: 0.5,
        transparent: true,
        opacity: 0.7,
        depthWrite: true,
        depthTest: true,
        renderOrder: 2
      }),
      selectedEvent: createGlowingMeshPhongMaterial({
        color: 0xFFD700,
        glowColor: 0xFFD700,
        glowIntensity: 100,
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true,
        renderOrder: 2
      })
    });

    // @TODO anything added here has to be removed in onBeforeUnmount?
    // @TODO don't load these from scratch every time
    // @TODO use object literal property value shorthand with default values
    const initialMeshes = await loadAndCreatePertinentRegionMeshesFromRedis(1, true, this.meshStates.getStateMaterial('initial'))

    // @TODO n+1 issue here. load them batches
    this.loadChildMeshes(initialMeshes)

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
        const childMeshes = await loadAndCreatePertinentRegionMeshesFromRedis(mesh.regionId, false, this.meshStates.getStateMaterial('initial'))

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
   * Handles hover events for regions
   * @param {THREE.Mesh} hoveredRegion 
   */
  handleHoverEvent(hoveredRegion) {
    const store = this.threePolysStore;
    const prevHovered = store?.hoveredMesh;
    const selected = store?.selectedMesh;

    // Handle new hover
    if (hoveredRegion?.regionId && hoveredRegion.regionId !== prevHovered?.regionId) {
      const isSelected = hoveredRegion.regionId === selected?.regionId;
      this.meshStates.setMaterial(hoveredRegion, isSelected ? 'selectedEvent' : 'event');
    }

    // Handle hover exit
    if (prevHovered?.regionId && (!hoveredRegion?.regionId || hoveredRegion.regionId !== prevHovered.regionId)) {
      const isSelected = prevHovered.regionId === selected?.regionId;
      this.meshStates.setMaterial(prevHovered, isSelected ? 'selected' : 'default');
    }

    // Update store
    store.setHoveredMesh(hoveredRegion, () => {
      // Callback function (currently empty)
    });
  }

  /**
   * Handles click events for regions
   * @param {THREE.Mesh} clickedRegion 
   * @returns {boolean}
   */
  handleClickEvent(clickedRegion) {
    if (!this.threePolysStore) {
      console.warn('threePolysStore is not initialized in handleClickEvent');
      return false;
    }

    if (!clickedRegion?.regionId) {
      return false;
    }

    const store = this.threePolysStore;
    const prevSelected = store.selectedMesh;

    // Set color for clicked region
    this.meshStates.setMaterial(clickedRegion, 'selectedEvent');

    // Reset color for previously selected region if different
    if (prevSelected?.regionId && prevSelected.regionId !== clickedRegion.regionId) {
      this.meshStates.setMaterial(prevSelected, 'default');
    }

    // Update store
    store.drillTo(prevSelected?.regionId || 0, clickedRegion.regionId);

    return true;
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

  /**
   * Add a UI mesh to the scene
   * @param {THREE.Mesh} mesh 
   */
  addUIMesh(mesh) {
    this.uiMeshes.push(mesh);
    this.worldStage.model.scene.add(mesh);
  }

  /**
   * Remove a UI mesh from the scene
   * @param {THREE.Mesh} mesh 
   */
  removeUIMesh(mesh) {
    const index = this.uiMeshes.indexOf(mesh);
    if (index > -1) {
      this.uiMeshes.splice(index, 1);
      this.worldStage.model.scene.remove(mesh);
    }
  }

  render() {
    var cameraDistance = this.worldStage.model.camera.position.length();

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
    });

    // Update UI meshes to face camera
    this.uiMeshes.forEach(mesh => {
      if (mesh.lookAt) {
        mesh.lookAt(this.worldStage.model.camera.position);
      }
    });

    // Update starry sky
    if (this.starrySky) {
      this.starrySky.update();
    }
  }
}
