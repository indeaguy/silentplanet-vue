// Globe.js and Scene.js
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CSG } from 'three-csg-ts'
import { Grid } from './Grid.js'
// @TODO encapsulation problem here! This must aleady be initialized somewhere.
import configInstance from './Config.js';
// @TODO export these from a better place and rename to utilss
import { fadeMeshColourByCameraDistance, createSphere } from './make-these-libs/three-world-stage/modules/MeshModifier/helpers/ThreeMeshHelpers';

export class Globe {
  constructor(worldStageModel) {
    this.worldStageModel = worldStageModel
    this.gridMaterials = {}
    this.grid = new Grid(configInstance.settings.SPHERE.GRIDS)

    // handle resize
    this.worldStageModel.addResizeObserver(this)
  }

  createGrids() {
    return this.grid.createGrids();
  }

  /**
   * Resize observer callback
   * @param {*} newSize 
   */
  onResize(newSize) {
    // Update any globe-specific properties that depend on size
  }

  render() {
    // @TODO probably should use radius instead of min zoom distance
    var cameraDistance = this.worldStageModel.camera.position.length()

    Object.values(this.grid.gridMaterials).forEach(({ material, config }) => {
      fadeMeshColourByCameraDistance(
        { material },  // Wrap material in an object to simulate a mesh
        config.COLOR,
        config.COLOR_FINAL,
        cameraDistance,
        config.FADE_START * (configInstance.settings.CAMERA.MIN_ZOOM_DISTANCE + configInstance.settings.CAMERA.MAX_ZOOM_DISTANCE),
        config.FADE_END * (configInstance.settings.CAMERA.MIN_ZOOM_DISTANCE + configInstance.settings.CAMERA.MAX_ZOOM_DISTANCE),
        config.FADE_SPEED
      );
    })
  }

  /**
   * Generate a globe mesh based on the provided geojson data.
   *
   * @param {object} data - The data to be mapped onto the globe in geojson format.
   * @param {boolean} visible - Whether the mesh should be visible.
   * @param {object} config - The configuration object.
   * @return {object} || false An object containing the generated meshes and polygonMeshes.
   */
  mapDataToGlobe(
    data,
    visible = true,
    config = {}
  ) {

    // @TODO use typescript for this
    if (!data || !data.features || !data.properties.name || !data.properties.regionId) return false

    let radius = configInstance.settings.SPHERE.RADIUS
    let color = parseInt(configInstance.settings.POLYGONS.COLOR, 16)
    let wireframeOnly = configInstance.settings.POLYGONS.WIREFRAME_ONLY ?? false;
    let altitude = configInstance.settings.POLYGONS.RISE ?? 0;
    let centerPosition = new THREE.Vector3(
      configInstance.settings.SPHERE.CENTER[0], 
      configInstance.settings.SPHERE.CENTER[1], 
      configInstance.settings.SPHERE.CENTER[2]
    );
    
    // Create an empty array to store mesh objects.
    let totalCombinedGeometry = []

    // Loop through features in the data.
    for (let feature of data.features) {
      if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
        continue
      }

      //let combinedGeometry = new THREE.BufferGeometry();
      let meshes = []
      let geometries = []

      // Check the geometry type and prepare an array of polygons.
      let polygons =
        feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates

      for (let polygon of polygons) {

        let coordinates = [polygon[0]] // @TODO lets create this array elsewhere

        coordinates.forEach(coordinates => {
          // @TODO some config here
            console.log("Creating geometry for coordinates:", coordinates);

            // This is where the magic happens
            const geometry = this.createBufferGeometryFromLatLonPairs(coordinates);
            if (!geometry) {
                console.error("Failed to create geometry for coordinates:", coordinates);
            } else {
                geometries.push(geometry);
            }
        });
      

        meshes.forEach((mesh) => {
          geometries.push(mesh.geometry)
        })

        // Merge all geometries into one
        let combinedGeometry = mergeGeometries(geometries, false)

        totalCombinedGeometry.push(combinedGeometry)
      }
    }

    let mergedGoJsonFeatureMeshes = mergeGeometries(totalCombinedGeometry, false)

    // @TODO use createStandardMeshMaterial instead
    let meshMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      wireframe: wireframeOnly
    })

    let totalCombinedMeshes = new THREE.Mesh(
      mergedGoJsonFeatureMeshes,
      meshMaterial
    )

    if (!totalCombinedMeshes.geometry) {
      console.error("No geometry found in totalCombinedMeshes", totalCombinedMeshes);
    }
    totalCombinedMeshes.geometry.computeVertexNormals();

    /**
     * @TODO totalCombinedMeshes here is a cool looking cone with all all the polygons
     * connected at teh center. Return this if thats what we want to cache/use here.
     */

    let boundingSphere = createSphere({
      radius: configInstance.settings.POLYGONS.RISE + configInstance.settings.SPHERE.RADIUS,
      widthSegments: configInstance.settings.SPHERE.WIDTH_SEGMENTS,
      heightSegments: configInstance.settings.SPHERE.HEIGHT_SEGMENTS
    });

    // Convert THREE meshes to CSG objects
    const boundingSphereCsg = CSG.fromMesh(boundingSphere);
    const totalCombinedMeshesCsg = CSG.fromMesh(totalCombinedMeshes);

    // Perform an intersection so we just have a mesh hovering over the globe
    const intersectionCSG = boundingSphereCsg.subtract(totalCombinedMeshesCsg);

    // Convert the CSG result back to a THREE mesh
    const intersectionMesh = CSG.toMesh(intersectionCSG, boundingSphere.matrix, meshMaterial);

    // Adding all the data.properties from the geojson files to the mesh object
    Object.assign(intersectionMesh, data.properties);

    /**
     * @TODO 
     * Consider converting the intersectionMesh to 'indexed geometry' here
     * to improve rendering performance.
     * See the WiP helper methods convertToIndexedGeometryWithThreshold, removePointIndexed
     */

    /**
     * @TODO
     * intersectionMesh at this point is a pyramid of the shape of the polygon with 
     * the the point of the pyramid at the center of the sphere
     * the bottom of the pyramid extends outside he base sphere by the altitide
     * return that if we want to cache/use it
     */

    /**
     * @TODO 
     * if we subtract the base globe from intersectionMesh here
     * we can make a volumous mesh above the surface of the globe with the height of the altitide
     * make that and return that here if we want it.
     */

    // remove the point at the center of the sphere from the mesh so we only have whats on the surface left
    // @TODO this.removePointIndexed(intersectionMesh, centerPosition); // faster?
    this.removePoint(intersectionMesh, centerPosition);

    intersectionMesh.visible = visible

    return { meshes: intersectionMesh }
  }

  removePoint(mesh, centerPoint, tolerance = 0.001) {
    const positions = mesh.geometry.attributes.position.array;
    let newPositions = [];
    
    // Iterate over each set of three vertices (each triangle)
    for (let i = 0; i < positions.length; i += 9) {
        // Extract each vertex of the triangle
        const v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
        const v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
        const v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);

        // Check if any vertex is within the tolerance distance of the centerPoint
        if (!(v1.distanceTo(centerPoint) < tolerance || v2.distanceTo(centerPoint) < tolerance || v3.distanceTo(centerPoint) < tolerance)) {
            // If no vertex is close enough to centerPoint, keep this triangle
            newPositions.push(
                v1.x, v1.y, v1.z,
                v2.x, v2.y, v2.z,
                v3.x, v3.y, v3.z
            );
        }
    }

    // Update geometry with the new positions
    mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();  // Recompute normals if needed
  }

  /**
   * This is where the magic happens. Creates a geometry from an array of coordinates.
   * @param {Array<Array<number>>} coordinates - An array of [longitude, latitude] pairs.
   *                                             Each pair should be in degrees.
   *                                             The coordinates should form a closed loop,
   *                                             i.e., the first and last coordinates should be the same.
   * @returns {THREE.BufferGeometry} The created geometry.
   */
  createBufferGeometryFromLatLonPairs(coordinates) {
    const vertices = [];
    const indices = [];
  
    // Center vertex at the origin
    const centerVertexIndex = 0;
    vertices.push(
      configInstance.settings.SPHERE.CENTER[0], 
      configInstance.settings.SPHERE.CENTER[1], 
      configInstance.settings.SPHERE.CENTER[2]
    );  // This is the center point for all triangles
  
    coordinates.forEach(([lon, lat], index) => {
      const latRad = lat * (Math.PI / 180);  // Convert latitude to radians
      const lonRad = -lon * (Math.PI / 180);  // Convert longitude to radians and negate
  
      const x = Math.cos(latRad) * Math.cos(lonRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.sin(lonRad);
  
      vertices.push(x, y, z);
    });
  
    // Create triangles connecting each vertex with the center and the next vertex
    for (let i = 1; i <= vertices.length / 3 - 1; i++) {
      indices.push(centerVertexIndex, i, (i % (vertices.length / 3 - 1)) + 1);
    }
  
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    return geometry;
  }
}
