// Globe.js and Scene.js
import * as THREE from 'three'
import { Earcut } from 'three/src/extras/Earcut.js' // Import the earcut library for triangulation.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

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

  createSphere() {
    var sphereGeometry = new THREE.SphereGeometry(
      this.config.RADIUS,
      this.config.WIDTH_SEGMENTS,
      this.config.HEIGHT_SEGMENTS
    )
    var sphereMaterial = new THREE.MeshBasicMaterial({
      color: parseInt(this.config.FILL_COLOUR, 16),
      side: THREE.DoubleSide,
      wireframe: parseInt(this.config.FILL_COLOUR, 16),
      wireframe: this.config.WIREFRAME,
      transparent: this.config.TRANSPARENT,
      opacity: this.config.OPACITY
    })
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    this.sceneRenderer.scene.add(sphere)
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
  subdivideTriangle(triangleVertices, depth, radius, rise, meshes, color, minEdgeLength) {
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
      const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        wireframe: false
      })
      const mesh = new THREE.Mesh(geometry, material)
      meshes.push(mesh)
      return
    }

    // Calculate midpoints and ensure they lie on the surface of the sphere.
    const edgeMidpoints = [
      triangleVertices[0]
        .clone()
        .lerp(triangleVertices[1], 0.5)
        .normalize()
        .multiplyScalar(radius + rise),
      triangleVertices[1]
        .clone()
        .lerp(triangleVertices[2], 0.5)
        .normalize()
        .multiplyScalar(radius + rise),
      triangleVertices[2]
        .clone()
        .lerp(triangleVertices[0], 0.5)
        .normalize()
        .multiplyScalar(radius + rise)
    ]

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
   * @param {number} radius - The radius of the sphere.
   * @param {string} color - The color of the sphere.
   * @param {number} rise - The rise of the sphere from the radius.
   * @param {number} subdivisionDepth - The depth of subdivision for the triangles.
   * @param {number} minEdgeLength - The minimum length of the triangle edges.
   * @return {object} An object containing the generated meshes and polygonMeshes.
   */
  mapDataToSphere(data, radius, color, rise = 0, subdivisionDepth = 3, minEdgeLength = 0.05) {
    // Calculate the altitude from the radius and rise.
    let altitude = radius + rise

    // Create an empty array to store mesh objects.
    let geoJsonFeatureMeshes = []

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
        // Extract the coordinates from the polygon data.
        let coordinates = polygon[0]

        // Triangulate the polygon interior using Earcut.
        const triangles = Earcut.triangulate(coordinates.flat())

        // Iterate through the triangle indices and create triangles.
        for (let i = 0; i < triangles.length; i += 3) {
          const triangleIndices = [triangles[i], triangles[i + 1], triangles[i + 2]]

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

        // Create a single mesh with the combined geometry
        // @TODO make it configurable whether the mesh is double sided
        let combinedMesh = new THREE.Mesh(
          combinedGeometry,
          new THREE.MeshBasicMaterial({ 
            color: color,
            side: THREE.DoubleSide })
        )

        // Assign the properties from the geojson to the mesh
        if (feature.properties.name) {
          combinedMesh.name = feature.properties.name
        }

        geoJsonFeatureMeshes.push(combinedMesh)
      }
    }

    return { meshes: geoJsonFeatureMeshes }
  }

  // Helper function to ensure CCW order for a given triangle.
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
}
