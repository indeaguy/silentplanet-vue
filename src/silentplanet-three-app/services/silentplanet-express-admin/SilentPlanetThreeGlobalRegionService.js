import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getCartesianGeometryData } from './SilentPlanetCartesianGeometryService.js'
import { CSG } from 'three-csg-ts'
import { createSphere, removePoint } from '../../make-these-libs/three-helpers'
// @TODO encapsulation problem here! This must aleady be initialized somewhere.
// @TODO separate this concern
import { configInstance } from '../silentplanet-rust-geo';

/**
   * Generate a globe mesh based on the provided geojson data.
   *
   * @param {object} data - The data to be mapped onto the globe in geojson format.
   * @param {boolean} visible - Whether the mesh should be visible.
   * @param {THREE.Material} material - The material to be used for the mesh.
   * @return {object} || false An object containing the generated meshes and polygonMeshes.
   */
export function mapGeoJsonDataToGlobe(
    data,
    visible = true,
    material = null
  ) {

    if (!data || !data.features || !data.properties.name || !data.properties.regionId) return false

    let color = parseInt(configInstance.settings.POLYGONS.COLOR, 16)
    let wireframeOnly = configInstance.settings.POLYGONS.WIREFRAME_ONLY ?? false;
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

            // This is where some magic happens
            const geometry = createBufferGeometryFromLatLonPairs(coordinates);
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

    let totalCombinedMeshes = new THREE.Mesh(
      mergedGoJsonFeatureMeshes
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
    const intersectionMesh = CSG.toMesh(intersectionCSG, boundingSphere.matrix, material);

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
    removePoint(intersectionMesh, centerPosition);

    intersectionMesh.visible = visible

    return { meshes: intersectionMesh }
  }

  /**
   * This is where the magic happens. Creates a geometry from an array of coordinates.
   * @param {Array<Array<number>>} coordinates - An array of [longitude, latitude] pairs.
   *                                             Each pair should be in degrees.
   *                                             The coordinates should form a closed loop,
   *                                             i.e., the first and last coordinates should be the same.
   * @returns {THREE.BufferGeometry} The created geometry.
   */
  function createBufferGeometryFromLatLonPairs(coordinates) {
    const { vertices, indices } = getCartesianGeometryData(coordinates, configInstance.settings.SPHERE.CENTER);
    return constructThreeBufferGeometry(vertices, indices);  
  }

  function constructThreeBufferGeometry(vertices, indices) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    return geometry;
  }