
import { getGeoJsonData } from './silentplanet-rust-geo'
import { mapGeoJsonDataToGlobe } from './silentplanet-express-admin'

// @TODO this needs to be in polys.js?
/**
 * @param {number} context 
 * @param {boolean} visible 
 * @param {THREE.Material} material
 * @returns {Array<THREE.Mesh>}
 */
export async function loadAndCreatePertinentRegionMeshesFromRedis(context = 1, visible = true, material = null) {
  const data = await getGeoJsonData(context).catch((error) => {
    console.error('Error loading globe data:', error);
    throw error;
  })

  if (!data || !data.geos) return // @TODO throw an error instead

  let meshes = []

  data.geos.forEach((geo) => {


    // @TODO get the cached mesh instead of creating a new one

    const result = mapGeoJsonDataToGlobe(
      geo,
      visible,
      material
    )
    if (!result || !result.meshes) return

    meshes = meshes.concat(result.meshes)
  })

  return meshes;
}