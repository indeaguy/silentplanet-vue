import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export class ThreeHelpers {

  /**
   * Create a three.js sphere mesh
   * 
   * @param radius the radius of the sphere
   * @param widthSegments the number of segments around the width of the sphere
   * @param heightSegments the number of segments around the height of the sphere
   * @param color the color of the sphere
   * @param side whether the sphere is double-sided
   * @param wireframe whether the sphere is wireframe
   * @param transparent whether the sphere is transparent
   * @param opacity the opacity of the sphere
   * @returns THREE.Mesh
   */
  public static createSphere(
    radius: number,
    widthSegments: number,
    heightSegments: number,
    color: string,
    side: THREE.Side = THREE.DoubleSide,
    wireframe: boolean = false,
    transparent: boolean = false,
    opacity: number = 1
  ): THREE.Mesh {
    const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: parseInt(color, 16),
      side,
      wireframe,
      transparent,
      opacity
    });
    return new THREE.Mesh(sphereGeometry, sphereMaterial);
  }

  /**
   * Create a three.js grid mesh around a sphere
   * 
   * @param radius the radius of the sphere
   * @param latDensity the number of lines around the latitude of the sphere
   * @param lonDensity the number of lines around the longitude of the sphere
   * @param color the color of the grid
   * @returns THREE.Group
   */
  public static createGrid(
    radius: number,
    latDensity: number,
    lonDensity: number,
    color: string
  ): THREE.Group {
    const gridGroup = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color: parseInt(color, 16) });

    for (let i = -80; i <= 80; i += latDensity) {
      let theta = (90 - i) * (Math.PI / 180);
      gridGroup.add(ThreeHelpers.createLatitudeLine(radius, theta, material));
    }
    for (let i = -180; i <= 180; i += lonDensity) {
      let phi = (i + 180) * (Math.PI / 180);
      gridGroup.add(ThreeHelpers.createLongitudeLine(radius, phi, material));
    }

    return gridGroup;
  }

  /**
   * Create a three.js latitude line mesh
   * 
   * @param radius the radius of the sphere
   * @param theta the latitude of the line
   * @param material the material of the line
   * @returns THREE.Line
   */
  private static createLatitudeLine(radius: number, theta: number, material: THREE.LineBasicMaterial): THREE.Line {
    const points = ThreeHelpers.generateCirclePoints(radius, theta, 360, 2);
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
  }

  /**
   * Create a three.js longitude line mesh
   * 
   * @param radius the radius of the sphere
   * @param phi the longitude of the line
   * @param material the material of the line
   * @returns THREE.Line
   */
  private static createLongitudeLine(radius: number, phi: number, material: THREE.LineBasicMaterial): THREE.Line {
    const points = ThreeHelpers.generateCirclePoints(radius, phi, 180, 2);
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
  }

  /**
   * Generate circle points
   * 
   * @param radius the radius of the circle
   * @param angle the angle of the circle
   * @param maxDegrees the maximum degrees of the circle
   * @param step the step of the circle
   * @returns THREE.Vector3[]
   */
  private static generateCirclePoints(radius: number, angle: number, maxDegrees: number, step: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= maxDegrees; i += step) {
      const rad = Math.PI / 180;
      const x = -(radius * Math.sin(angle) * Math.cos(i * rad));
      const y = radius * Math.cos(angle);
      const z = radius * Math.sin(angle) * Math.sin(i * rad);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  /**
   * Fade grid from camera distance
   * 
   * @param material the material of the grid
   * @param fadeStart the start of the fade
   * @param fadeEnd the end of the fade
   * @param colorFinal the final color of the grid
   * @param colorInitial the initial color of the grid
   * @param fadeSpeed the speed of the fade
   */
  public static fadeGridFromCameraDistance(
    material: THREE.LineBasicMaterial,
    fadeStart: number,
    fadeEnd: number,
    colorFinal: string,
    colorInitial: string,
    fadeSpeed: number,
    distance: number
  ): void {
    const normalized = ThreeHelpers.getNormalizedDistance(distance, fadeStart, fadeEnd);
    const color1 = new THREE.Color(parseInt(colorFinal, 16));
    const color2 = new THREE.Color(parseInt(colorInitial, 16));
    const color = color1.clone().lerp(color2, normalized);
    material.color.lerp(color, fadeSpeed);
  }

  /**
   * Get normalized distance (value between 0 and 1) based on the given range
   * 
   * @param distance Current distance value
   * @param start Start of the range
   * @param end End of the range
   * @returns Normalized value (0 to 1) representing distance's position in the range
   */
  private static getNormalizedDistance(distance: number, start: number, end: number): number {
    if (distance > end) return 1;
    if (distance < start) return 0;
    return (distance - start) / (end - start);
  }

/**
 * Subdivides a triangle of three vertices into smaller triangles by recursively subdividing the longest edge
 * 
 * @param triangleVertices the vertices of the triangle
 * @param depth the depth of subdivision
 * @param radius the radius of the sphere
 * @param rise the distance from the surface of the sphere
 * @param color the color of the triangle
 * @param minEdgeLength the minimum edge length of the triangle
 * @returns THREE.Mesh
 */
  public static subdivideTriangle(
    triangleVertices: THREE.Vector3[],
    depth: number,
    radius: number,
    rise: number,
    color: number,
    minEdgeLength: number
  ): THREE.Mesh {
    if (depth <= 0 || Math.max(...ThreeHelpers.getEdgeLengths(triangleVertices)) < minEdgeLength) {
      return ThreeHelpers.createTriangleMesh(triangleVertices, color);
    }

    const edgeMidpoints = ThreeHelpers.calculateEdgeMidpoints(triangleVertices, radius);
    const newTriangles = ThreeHelpers.createSubdividedTriangles(triangleVertices, edgeMidpoints);

    const meshes = newTriangles.map(t => 
      ThreeHelpers.subdivideTriangle(t, depth - 1, radius, rise, color, minEdgeLength)
    );

    return ThreeHelpers.mergeMeshes(meshes);
  }

  /**
   * Get the lengths of the edges of a triangle
   * @param vertices 
   * @returns number<>
   */
  private static getEdgeLengths(vertices: THREE.Vector3[]): Array<number> {
    return [
      vertices[0].distanceTo(vertices[1]),
      vertices[1].distanceTo(vertices[2]),
      vertices[2].distanceTo(vertices[0])
    ];
  }

  /**
   * Create a triangle mesh from three vertices
   * 
   * @param vertices the vertices of the triangle
   * @param color the color of the triangle
   * @returns THREE.Mesh
   */
  private static createTriangleMesh(vertices: THREE.Vector3[], color: number): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const positions = vertices.flatMap(v => [v.x, v.y, v.z]);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex([0, 1, 2]);
    const material = new THREE.MeshLambertMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe: true
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Calculate the edge midpoints of a triangle
   * 
   * @param vertices the vertices of the triangle
   * @param radius the radius of the sphere
   * @returns THREE.Vector3[]
   */
  private static calculateEdgeMidpoints(vertices: THREE.Vector3[], radius: number): THREE.Vector3[] {
    return [
      ThreeHelpers.slerp(vertices[0], vertices[1], 0.5).multiplyScalar(radius),
      ThreeHelpers.slerp(vertices[1], vertices[2], 0.5).multiplyScalar(radius),
      ThreeHelpers.slerp(vertices[2], vertices[0], 0.5).multiplyScalar(radius),
    ];
  }

  /**
   * Create the subdivided triangles
   * 
   * @param vertices the vertices of the triangle
   * @param midpoints the midpoints of the triangle
   * @returns THREE.Vector3[][]
   */
  private static createSubdividedTriangles(vertices: THREE.Vector3[], midpoints: THREE.Vector3[]): THREE.Vector3[][] {
    return [
      [vertices[0], midpoints[0], midpoints[2]],
      [midpoints[0], vertices[1], midpoints[1]],
      [midpoints[1], vertices[2], midpoints[2]],
      [midpoints[2], midpoints[0], midpoints[1]]
    ];
  }

  private static mergeMeshes(meshes: THREE.Mesh[]): THREE.Mesh {
    const geometries = meshes.map(mesh => mesh.geometry);
    const mergedGeometry = mergeBufferGeometries(geometries);
    return new THREE.Mesh(mergedGeometry, meshes[0].material);
  }

  // Spherical linear interpolation
  private static slerp(v1: THREE.Vector3, v2: THREE.Vector3, t: number): THREE.Vector3 {
    const v1Norm = v1.clone().normalize();
    const v2Norm = v2.clone().normalize();
    const theta = Math.acos(v1Norm.dot(v2Norm));
    const sinTheta = Math.sin(theta);

    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;

    return new THREE.Vector3().addScaledVector(v1Norm, w1).addScaledVector(v2Norm, w2);
  }

  // Geometry conversion and manipulation
  public static convertToIndexedGeometryWithThreshold(mesh: THREE.Mesh, threshold: number = 1e-4): void {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;

    let uniqueVertices: { vertex: THREE.Vector3, index: number }[] = [];
    let indices: number[] = [];

    for (let i = 0; i < vertexCount; i++) {
      let stride = i * 3;
      let vertex = new THREE.Vector3(positions[stride], positions[stride + 1], positions[stride + 2]);
      let uniqueIndex = ThreeHelpers.findOrAddUniqueVertex(uniqueVertices, vertex, threshold);
      indices.push(uniqueIndex);
    }

    const indexedGeometry = new THREE.BufferGeometry();
    indexedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    indexedGeometry.setIndex(indices);

    if (geometry.attributes.normal) {
      indexedGeometry.setAttribute('normal', geometry.attributes.normal);
    }

    geometry.dispose();
    mesh.geometry = indexedGeometry;
    mesh.geometry.computeVertexNormals();
  }

  private static findOrAddUniqueVertex(uniqueVertices: { vertex: THREE.Vector3, index: number }[], vertex: THREE.Vector3, threshold: number): number {
    for (let j = 0; j < uniqueVertices.length; j++) {
      if (vertex.distanceTo(uniqueVertices[j].vertex) < threshold) {
        return uniqueVertices[j].index;
      }
    }
    let newIndex = uniqueVertices.length;
    uniqueVertices.push({ vertex, index: newIndex });
    return newIndex;
  }

  public static removePoint(mesh: THREE.Mesh, centerPoint: THREE.Vector3, tolerance: number = 0.001): void {
    const positions = mesh.geometry.attributes.position.array;
    let newPositions: number[] = [];
    
    for (let i = 0; i < positions.length; i += 9) {
      const v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
      const v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
      const v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);

      if (!(v1.distanceTo(centerPoint) < tolerance || v2.distanceTo(centerPoint) < tolerance || v3.distanceTo(centerPoint) < tolerance)) {
        newPositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
      }
    }

    mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  public static removePointIndexed(mesh: THREE.Mesh, centerPoint: THREE.Vector3): void {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const indexArray = geometry.index!.array;

    let vertexToRemove = ThreeHelpers.findVertexToRemove(positions, centerPoint);
    if (vertexToRemove === -1) return;

    let newIndices = ThreeHelpers.filterIndices(indexArray, vertexToRemove);

    geometry.setIndex(newIndices);
    geometry.index!.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private static findVertexToRemove(positions: ArrayLike<number>, centerPoint: THREE.Vector3): number {
    for (let i = 0; i < positions.length; i += 3) {
      let v = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      if (v.distanceTo(centerPoint) < 0.001) {
        return i / 3;
      }
    }
    return -1;
  }

  private static filterIndices(indexArray: ArrayLike<number>, vertexToRemove: number): number[] {
    let newIndices: number[] = [];
    for (let i = 0; i < indexArray.length; i += 3) {
      let a = indexArray[i], b = indexArray[i + 1], c = indexArray[i + 2];
      if (a !== vertexToRemove && b !== vertexToRemove && c !== vertexToRemove) {
        newIndices.push(a, b, c);
      }
    }
    return newIndices;
  }

  public static createGeometry(coordinates: [number, number][], radius: number, rise: number): THREE.BufferGeometry {
    const altitude = radius + rise;
    const vertices: number[] = [0, 0, 0];
    const indices: number[] = [];
  
    coordinates.forEach(([lon, lat], index) => {
      const latRad = lat * (Math.PI / 180);
      const lonRad = -lon * (Math.PI / 180);
  
      const x = altitude * Math.cos(latRad) * Math.cos(lonRad);
      const y = altitude * Math.sin(latRad);
      const z = altitude * Math.cos(latRad) * Math.sin(lonRad);
  
      vertices.push(x, y, z);
  
      if (index > 0) {
        indices.push(0, index, index + 1);
      }
    });
  
    indices.push(0, coordinates.length, 1);
  
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
  
    return geometry;
  }
}