// @TODO: there's some SAUCE here, protect this logic in the backend
// @TODO: add the ability to get the lat/lon from cartesian coordinates

/**
 * Converts latitude and longitude pairs to a geometry on a sphere.
 * 
 * @param {Array<Array<number>>} coordinates - An array of [longitude, latitude] pairs.
 *                                             Each pair should be in degrees.
 *                                             The coordinates should form a closed loop,
 *                                             i.e., the first and last coordinates should be the same.
 * @param {Array<number>} centerVertex - The center vertex of the geometry.
 * @returns {Object} An object containing the vertices and indices of the geometry.
 */
export function getCartesianGeometryData(coordinates, centerVertex) {
  const vertices = createVerticesFromCoordinates(coordinates, centerVertex);
  const indices = createIndices(vertices.length / 3);
  return { vertices, indices };
}

function createVerticesFromCoordinates(coordinates, centerVertex) {
  const vertices = [
    ...centerVertex // Center vertex - [x, y, z]
  ];

  coordinates.forEach(([lon, lat]) => {
    const [x, y, z] = convertLatLonToCartesian(lat, lon);
    vertices.push(x, y, z);
  });

  return vertices;
}

function convertLatLonToCartesian(lat, lon) {
  const latRad = lat * (Math.PI / 180);
  const lonRad = -lon * (Math.PI / 180);

  const x = Math.cos(latRad) * Math.cos(lonRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

function createIndices(vertexCount) {
  const indices = [];
  for (let i = 1; i < vertexCount; i++) {
    indices.push(0, i, (i % (vertexCount - 1)) + 1);
  }
  return indices;
}