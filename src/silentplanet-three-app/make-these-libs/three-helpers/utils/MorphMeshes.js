import * as THREE from 'three'

/**
 * Remove a point from a mesh
 * 
 * @param {THREE.Mesh} mesh 
 * @param {THREE.Vector3} pointToRemove 
 * @param {number} tolerance 
 */
export function removePoint(mesh, pointToRemove, tolerance = 0.001) {
  const positions = mesh.geometry.attributes.position.array;
  let newPositions = [];
  
  // Iterate over each set of three vertices (each triangle)
  for (let i = 0; i < positions.length; i += 9) {
      // Extract each vertex of the triangle
      const v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
      const v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
      const v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);

      // Check if any vertex is within the tolerance distance of the pointToRemove
      if (!(v1.distanceTo(pointToRemove) < tolerance || v2.distanceTo(pointToRemove) < tolerance || v3.distanceTo(pointToRemove) < tolerance)) {
          // If no vertex is close enough to pointToRemove, keep this triangle
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