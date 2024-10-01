import * as THREE from 'three';

// Export individual functions
export function updateMeshColor(mesh, colour) {
  if (mesh && mesh.material && colour && colour instanceof THREE.Color) {
    mesh.material.color.set(colour);
  }
}

export function toggleMeshVisibility(mesh) {
  if (mesh) {
    mesh.visible = !mesh.visible;
  }
}

export function hideMesh(mesh) {
  if (mesh) {
    mesh.visible = false;
  }
}

export function showMesh(mesh) {
  if (mesh) {
    mesh.visible = true;
  }
}

export function fadeMeshColourByCameraDistance(material, fromColor, toColor, normalizedDistance, fadeSpeed) {
  const color = new THREE.Color().lerpColors(fromColor, toColor, normalizedDistance);
  material.color.lerp(color, fadeSpeed);
}

// Keep the class for backward compatibility
export class MeshModifierView {
  updateMeshColor = updateMeshColor;
  toggleMeshVisibility = toggleMeshVisibility;
  hideMesh = hideMesh;
  showMesh = showMesh;
  fadeMeshColourByCameraDistance = fadeMeshColourByCameraDistance;
}