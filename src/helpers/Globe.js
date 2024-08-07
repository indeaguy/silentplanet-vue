// Globe.js and Scene.js
import * as THREE from 'three'
import { Earcut } from 'three/src/extras/Earcut.js' // Import the earcut library for triangulation.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CSG } from 'three-csg-ts'


export class Globe {
  constructor(config, sceneRenderer) {
    this.config = config
    this.sceneRenderer = sceneRenderer
    this.sceneRenderer.controls.minDistance = this.config.RADIUS + this.config.MIN_DISTANCE
    this.sceneRenderer.controls.maxDistance = this.config.MAX_DISTANCE
    this.gridMaterials = {}

    // @TODO Consider if there's a way to optimize the grid creation, especially if you're creating many lines. If the grid lines don't change often, you might want to create them once and then show/hide or modify them, instead of recreating them frequently.
    this.createGrids(this.config.GRIDS)

    // handle resize
    this.sceneRenderer.addResizeObserver(this)
  }

  createSphere(rise = 0, color = null, side = null, wireframe = null, transparent = null, opacity = null) {

    let altitude = rise + this.config.RADIUS
    let materialColor = color ? color : this.config.FILL_COLOUR
    let sideValue = side ? side : THREE.DoubleSide
    //wireframeValue:  = wireframe ? wireframe : this.config.WIREFRAME,
    let wireframeValue = wireframe ? wireframe : parseInt(this.config.FILL_COLOUR, 16)
    let transparentValue = transparent ? transparent : this.config.TRANSPARENT
    let opacityValue = opacity ? opacity : this.config.OPACITY

    var sphereGeometry = new THREE.SphereGeometry(
      altitude,
      this.config.WIDTH_SEGMENTS,
      this.config.HEIGHT_SEGMENTS
    )
    // @todo use the observer patern here and make this a callback
    var sphereMaterial = new THREE.MeshBasicMaterial({
      color: parseInt(materialColor, 16),
      side: sideValue,
      wireframe: wireframeValue,
      transparent: transparentValue,
      opacity: opacityValue
    })
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    //this.sceneRenderer.scene.add(sphere)

    return sphere
  }

  createGrids(grids) {
    Object.entries(grids).forEach(([key, gridConfig]) => {
      const material = new THREE.LineBasicMaterial({ color: parseInt(gridConfig.COLOR, 16) })
      this.createGrid(gridConfig.LAT_DENSITY, gridConfig.LON_DENSITY, material)
      this.gridMaterials[key] = {
        material: material,
        config: gridConfig
      }
    })
  }

  createGrid(latDensity, lonDensity, material) {
    for (let i = -80; i <= 80; i += latDensity) {
      let theta = (90 - i) * (Math.PI / 180)
      let line = this.createLatitudeLine(theta, material)
      this.sceneRenderer.scene.add(line)
    }
    for (let i = -180; i <= 180; i += lonDensity) {
      let phi = (i + 180) * (Math.PI / 180)
      let line = this.createLongitudeLine(phi, material)
      this.sceneRenderer.scene.add(line)
    }
  }

  createLatitudeLine(theta, material) {
    var points = []
    for (let i = 0; i <= 360; i += 2) {
      let rad = Math.PI / 180
      let phi = i * rad
      let x = -(this.config.RADIUS * Math.sin(theta) * Math.cos(phi))
      let y = this.config.RADIUS * Math.cos(theta)
      let z = this.config.RADIUS * Math.sin(theta) * Math.sin(phi)
      points.push(new THREE.Vector3(x, y, z))
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points)
    var line = new THREE.Line(geometry, material)
    return line
  }

  createLongitudeLine(phi, material) {
    var points = []
    for (let i = 0; i <= 180; i += 2) {
      let rad = Math.PI / 180
      let theta = i * rad
      let x = -(this.config.RADIUS * Math.sin(theta) * Math.cos(phi))
      let y = this.config.RADIUS * Math.cos(theta)
      let z = this.config.RADIUS * Math.sin(theta) * Math.sin(phi)
      points.push(new THREE.Vector3(x, y, z))
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points)
    var line = new THREE.Line(geometry, material)
    return line
  }

  onResize(newSize) {
    this.sceneRenderer.controls.minDistance = this.config.RADIUS + this.config.MIN_DISTANCE
    this.sceneRenderer.controls.maxDistance = this.config.MAX_DISTANCE
  }

  // @TODO: fade with three colours based on distance:
  // invisible > vibrant > invisible
  fadeGrid(material, config, distance) {
    let normalized

    const fadeStart =
      config.FADE_START *
      (this.sceneRenderer.controls.minDistance + this.sceneRenderer.controls.maxDistance)
    const fadeEnd =
      config.FADE_END *
      (this.sceneRenderer.controls.minDistance + this.sceneRenderer.controls.maxDistance)
    if (distance > fadeEnd) {
      normalized = 1
    } else if (distance < fadeStart) {
      normalized = 0
    } else {
      normalized = (distance - fadeStart) / (fadeEnd - fadeStart)
    }

    var color1 = new THREE.Color(parseInt(config.COLOR_FINAL, 16)) // what it fades to
    var color2 = new THREE.Color(parseInt(config.COLOR, 16)) // what it fades from (config.COLOR);
    var color = color1.clone().lerp(color2, normalized)

    material.color.lerp(color, config.FADE_SPEED)
  }

  render() {
    //this.sceneRenderer.camera.position.z = 2;
    var distance = this.sceneRenderer.camera.position.length()

    Object.values(this.gridMaterials).forEach(({ material, config }) => {
      this.fadeGrid(material, config, distance)
    })
  }

  /**
   * Subdivides a triangle and creates mesh triangles.
   *
   * @param {Array<THREE.Vector3>} triangleVertices - The vertices of the triangle.
   * @param {number} depth - The depth of subdivision.
   * @param {number} radius - The radius of the sphere.
   * @param {number} rise - The distance from the surface of the sphere.
   * @param {Array<THREE.Mesh>} meshes - An array to store the created meshes.
   * @param {number} color - The color of the mesh.
   * @param {number} minEdgeLength - The minimum length of an edge.
   * @param {THREE.Mesh} polygonMesh - The mesh representing the original polygon.
   */
  subdivideTriangle(triangleVertices, depth, radius, rise, meshes, color, minEdgeLength, maxEdgeLength) {
    const edgeLengths = [
      triangleVertices[0].distanceTo(triangleVertices[1]),
      triangleVertices[1].distanceTo(triangleVertices[2]),
      triangleVertices[2].distanceTo(triangleVertices[0])
    ]
    const longestEdge = Math.max(...edgeLengths)

    // Check against the minimum edge length
    if (longestEdge < minEdgeLength) {
      depth = 0
    }

    if (depth <= 0) {
      // Base case: No more subdivision needed. Create the mesh triangle.
      const geometry = new THREE.BufferGeometry()
      const positions = triangleVertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z])
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setIndex([0, 1, 2])
      const material = new THREE.MeshLambertMaterial({
        color: color,
        side: THREE.DoubleSide,
        wireframe: true
      })
      const mesh = new THREE.Mesh(geometry, material)
      meshes.push(mesh)
      return
    }

    // @TODO is slerp really providing any benefit over this old way?

    // Calculate midpoints and ensure they lie on the surface of the sphere.
    // const edgeMidpoints = [
    //   triangleVertices[0]
    //     .clone()
    //     .lerp(triangleVertices[1], 0.5)
    //     .normalize()
    //     .multiplyScalar(radius + rise),
    //   triangleVertices[1]
    //     .clone()
    //     .lerp(triangleVertices[2], 0.5)
    //     .normalize()
    //     .multiplyScalar(radius + rise),
    //   triangleVertices[2]
    //     .clone()
    //     .lerp(triangleVertices[0], 0.5)
    //     .normalize()
    //     .multiplyScalar(radius + rise)
    // ]
    const edgeMidpoints = [
      this.slerp(triangleVertices[0], triangleVertices[1], 0.5).multiplyScalar(radius),
      this.slerp(triangleVertices[1], triangleVertices[2], 0.5).multiplyScalar(radius),
      this.slerp(triangleVertices[2], triangleVertices[0], 0.5).multiplyScalar(radius),
    ];

    // Define the new triangles.
    const newTriangles = [
      [triangleVertices[0], edgeMidpoints[0], edgeMidpoints[2]],
      [edgeMidpoints[0], triangleVertices[1], edgeMidpoints[1]],
      [edgeMidpoints[1], triangleVertices[2], edgeMidpoints[2]],
      [edgeMidpoints[2], edgeMidpoints[0], edgeMidpoints[1]]
    ]

    // Recursively subdivide each triangle.
    // meshes is being passed by reference here!
    for (let t of newTriangles) {
      this.subdivideTriangle(t, depth - 1, radius, rise, meshes, color, minEdgeLength)
    }
  }

  /**
   * Globe polygon helper methods
   */

  /**
   * Generate a sphere mesh based on the provided geojson data.
   *
   * @param {object} data - The data to be mapped onto the sphere in geojson format.
   * @param {boolean} visible - Whether the mesh should be visible.
   * @param {object} config - The configuration object.
   * @return {object} || false An object containing the generated meshes and polygonMeshes.
   */
  mapDataToSphere(
    data,
    visible = true,
    config = {} // maybe use a complex type here with default values
  ) {

    // @TODO use typescript for this
    if (!data || !data.features || !data.properties.name || !data.properties.regionId) return false

    let radius = config.SPHERE.RADIUS
    let color = parseInt(config.POLYGONS.COLOR, 16)
    let wireframeOnly = config.POLYGONS.WIREFRAME_ONLY ?? false;
    
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

            // @TODO make the third parameter 'rise' configurable
            const geometry = this.createGeometry(coordinates, radius, 1);
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
        let combinedGeometry = mergeBufferGeometries(geometries, false)

        totalCombinedGeometry.push(combinedGeometry)
      }
    }

    let mergedGoJsonFeatureMeshes = mergeBufferGeometries(totalCombinedGeometry, false)

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

    //this.sceneRenderer.scene.add(totalCombinedMeshes)

    /**
     * @TODO totalCombinedMeshes here is a cool looking cone with all all the polygons
     * connected at teh center. Return this if thats what we want to cache/use here.
     */

    // @TODO make this configurable
    // @TODO should only need to pass the altitude here
    // altitude is the height of the resulting mesh above the sphere
    let altitude = 0.8;
    let boundingSphere = this.createSphere(altitude, 0xff0000, 1, 1, 1, 0)

    // Convert THREE meshes to CSG objects
    const boundingSphereCsg = CSG.fromMesh(boundingSphere);
    const totalCombinedMeshesCsg = CSG.fromMesh(totalCombinedMeshes);

    // Perform an intersection so we just have a mesh hovering over the globe
    const intersectionCSG = boundingSphereCsg.subtract(totalCombinedMeshesCsg);

    // Convert the CSG result back to a THREE mesh
    const intersectionMesh = CSG.toMesh(intersectionCSG, boundingSphere.matrix, meshMaterial);

    // Adding all the data.properties from the geojson files to the mesh object
    Object.assign(intersectionMesh, data.properties);

    // @TODO should be able to remove this
    if (!data.properties.parentId) {
      intersectionMesh.parentId = 0; // Set to 0 if parentId is falsy
    }

    // @TODO consider convertng to indexed geometry
    //this.convertToIndexedGeometryWithThreshold(intersectionMesh);

    /**
     * @TODO
     * intersectionMesh here is a pyramid of the shape of the polygon with 
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
    const centerPosition = new THREE.Vector3(0, 0, 0);
    // @TODO this.removePointIndexed(intersectionMesh, centerPosition); // faster
    this.removePoint(intersectionMesh, centerPosition);

    intersectionMesh.visible = visible

    return { meshes: intersectionMesh }
  }

  // @TODO move this to a three helper somehwere or use something that already exists

  convertToIndexedGeometry(mesh) {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;

    // Maps to track unique vertices and their indices
    let uniqueVertices = new Map();
    let indices = [];
    let uniqueIndex = 0;

    // @TODO Threshold to consider vertices as the same (due to floating point precision issues) .. performance conerns though
    // ex. const threshold = 1e-4;

    for (let i = 0; i < vertexCount; i++) {
        let stride = i * 3;
        let vertex = new THREE.Vector3(positions[stride], positions[stride + 1], positions[stride + 2]);
        let key = `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`; // Key to track vertex uniqueness

        if (uniqueVertices.has(key)) {
            indices.push(uniqueVertices.get(key)); // Reuse existing vertex
        } else {
            // Add new unique vertex and update indices
            uniqueVertices.set(key, uniqueIndex);
            indices.push(uniqueIndex);
            uniqueIndex++;
        }
    }

    // Create new geometry with indices
    const indexedGeometry = new THREE.BufferGeometry();
    indexedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    indexedGeometry.setIndex(indices);

    // Optional: Copy other attributes if necessary
    if (geometry.attributes.normal) {
        indexedGeometry.setAttribute('normal', geometry.attributes.normal);
    }

    // Clean up old geometry and update mesh
    geometry.dispose();
    mesh.geometry = indexedGeometry;

    // Compute normals if needed
    mesh.geometry.computeVertexNormals();
}

convertToIndexedGeometryWithThreshold(mesh, threshold = 1e-4) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position.array;
  const vertexCount = positions.length / 3;

  let uniqueVertices = []; // List to store unique vertices
  let indices = [];
  let uniqueIndex = 0;

  for (let i = 0; i < vertexCount; i++) {
      let stride = i * 3;
      let vertex = new THREE.Vector3(positions[stride], positions[stride + 1], positions[stride + 2]);
      let isUnique = true;

      // Check if this vertex is within threshold distance of any already accepted unique vertex
      for (let j = 0; j < uniqueVertices.length; j++) {
          if (vertex.distanceTo(uniqueVertices[j].vertex) < threshold) {
              indices.push(uniqueVertices[j].index);
              isUnique = false;
              break;
          }
      }

      if (isUnique) {
          uniqueVertices.push({ vertex: vertex, index: uniqueIndex });
          indices.push(uniqueIndex);
          uniqueIndex++;
      }
  }

  // Create new geometry with indices
  const indexedGeometry = new THREE.BufferGeometry();
  indexedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  indexedGeometry.setIndex(indices);

  // Optional: Copy other attributes if necessary
  if (geometry.attributes.normal) {
      indexedGeometry.setAttribute('normal', geometry.attributes.normal);
  }

  // Clean up old geometry and update mesh
  geometry.dispose();
  mesh.geometry = indexedGeometry;

  // Compute normals if needed
  mesh.geometry.computeVertexNormals();
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

removePointIndexed(mesh, centerPoint) {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const indexArray = geometry.index.array;

    // Step 1: Identify the vertex index to remove
    let vertexToRemove = -1;
    for (let i = 0; i < positions.length; i += 3) {
        let v = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        if (v.distanceTo(centerPoint) < 0.001) { // Adjust the tolerance as necessary
            vertexToRemove = i / 3;
            break;
        }
    }

    if (vertexToRemove === -1) {
        //console.log("No vertex found at the specified centerPoint");
        return; // Vertex not found, no changes needed
    }

    // Step 2: Adjust the indices array to remove all faces containing the vertex
    let newIndices = [];
    for (let i = 0; i < indexArray.length; i += 3) {
        let a = indexArray[i], b = indexArray[i + 1], c = indexArray[i + 2];
        // Only add faces that do not include the vertexToRemove
        if (a !== vertexToRemove && b !== vertexToRemove && c !== vertexToRemove) {
            newIndices.push(a, b, c);
        }
    }

    // Step 3: Update the geometry's index
    geometry.setIndex(newIndices);
    geometry.index.needsUpdate = true;

    // Optionally, recompute the normals if the geometry looks distorted
    geometry.computeVertexNormals();
  }

  createGeometry(coordinates, radius, rise) {
    const altitude = radius + rise;
    const vertices = [];
    const indices = [];
  
    // Center vertex at the origin
    const centerVertexIndex = 0;
    vertices.push(0, 0, 0);  // This is the center point for all triangles
  
    coordinates.forEach(([lon, lat], index) => {
      const latRad = lat * (Math.PI / 180);  // Convert latitude to radians
      const lonRad = -lon * (Math.PI / 180);  // Convert longitude to radians and negate
  
      const x = altitude * Math.cos(latRad) * Math.cos(lonRad);
      const y = altitude * Math.sin(latRad);
      const z = altitude * Math.cos(latRad) * Math.sin(lonRad);
  
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

  /**
   * Generate a sphere mesh based on the provided geojson data.
   *
   * @param {object} data - The data to be mapped onto the sphere in geojson format.
   * @param {boolean} visible - Whether the mesh should be visible.
   * @param {object} config - The configuration object.
   * @return {object} || false An object containing the generated meshes and polygonMeshes.
   */
  mapDataToSphereOld(
    data,
    visible = true,
    config = {} // maybe use a complex type here with default values
  ) {
    // need features and a name
    if (!data || !data.features || !data.properties.name || !data.properties.regionId) return false

    let radius = config.SPHERE.RADIUS
    let color = parseInt(config.POLYGONS.COLOR, 16)
    let rise = config.POLYGONS.RISE ?? 0;
    let subdivisionDepth = config.POLYGONS.SUBDIVIDE_DEPTH ?? 3;
    let minEdgeLength = config.POLYGONS.MIN_EDGE_LENGTH ?? 0.05;
    let wireframeOnly = config.POLYGONS.WIREFRAME_ONLY ?? false;

    // Create an empty array to store mesh objects.
    let totalCombinedGeometry = []

    // Loop through features in the data.
    for (let feature of data.features) {
      if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
        continue
      }

      let meshes = []
      let geometries = []

      // Check the geometry type and prepare an array of polygons.
      let polygons =
        feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates

      for (let polygon of polygons) {

        // Extract the coordinates from the polygon data.
        let coordinates = polygon[0]

        // Foreach segment triangulate the polygon interior using Earcut.
        const allTriangles = Earcut.triangulate(coordinates.flat())

        for (let i = 0; i < allTriangles.length; i += 3) {
          const triangleIndices = [allTriangles[i], allTriangles[i + 1], allTriangles[i + 2]]

          // Convert triangle coordinates to 3D vectors on the sphere.
          const triangleVertices = triangleIndices.map((index) => {
            const vertex = coordinates[index]
            const latRad = vertex[1] * (Math.PI / 180)
            const lonRad = -vertex[0] * (Math.PI / 180)
            const x = radius * Math.cos(latRad) * Math.cos(lonRad)
            const y = radius * Math.sin(latRad)
            const z = radius * Math.cos(latRad) * Math.sin(lonRad)
            return new THREE.Vector3(x, y, z)
          })

          // Ensure the triangle vertices are in CCW order.
          const orderedVertices = this.ensureCCW(triangleVertices)

          // Use the subdivideTriangle method to handle potential triangle subdivisions.
          // meshes is being passed by reference here!
          this.subdivideTriangle(
            orderedVertices,
            subdivisionDepth,
            radius,
            rise,
            meshes,
            color,
            minEdgeLength
          )
        }

        meshes.forEach((mesh) => {
          geometries.push(mesh.geometry)
        })

        // Merge all geometries into one
        let combinedGeometry = mergeBufferGeometries(geometries, false)

        totalCombinedGeometry.push(combinedGeometry)
      }
    }

    // @todo add abstraction for combining meshes and cache this for later use don't process in runtime
    let mergedGoJsonFeatureMeshes = mergeBufferGeometries(totalCombinedGeometry, false)

    let totalCombinedMeshes = new THREE.Mesh(
      mergedGoJsonFeatureMeshes,
      new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        wireframe: wireframeOnly
      })
    )
    totalCombinedMeshes.visible = visible
    
    // Adding all the data.properties from the geojson files to the mesh object
    Object.assign(totalCombinedMeshes, data.properties);

    if (!data.properties.parentId) {
      totalCombinedMeshes.parentId = 0; // Set to 0 if parentId is falsy
    }

    return { meshes: totalCombinedMeshes }
  }
  // Helper function to ensure counter clockwise order for a given triangle.
  ensureCCW(vertices) {
    // Using the shoelace formula to calculate the signed area of a triangle.
    const area =
      (vertices[1].x - vertices[0].x) * (vertices[2].y - vertices[0].y) -
      (vertices[2].x - vertices[0].x) * (vertices[1].y - vertices[0].y)

    // If the area is negative, the winding is CW and we need to swap vertices.
    if (area < 0) {
      const temp = vertices[1]
      vertices[1] = vertices[2]
      vertices[2] = temp
    }
    return vertices
  }

  slerp(point1, point2, t) {
    const angle = Math.acos(point1.dot(point2));
    const sinTotal = Math.sin(angle);
    const ratioA = Math.sin((1 - t) * angle) / sinTotal;
    const ratioB = Math.sin(t * angle) / sinTotal;
    const x = point1.clone().multiplyScalar(ratioA).add(point2.clone().multiplyScalar(ratioB));
    return x.normalize();
  }

calculateDistance(coord1, coord2) {
    // This is a placeholder. Use a more accurate geographic distance calculation suitable for your precision needs
    return Math.sqrt(Math.pow(coord2[0] - coord1[0], 2) + Math.pow(coord2[1] - coord1[1], 2));
}

}
