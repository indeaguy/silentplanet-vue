import * as THREE from 'three';

export class MeshModifierView {
  updateMeshColor(mesh, colour) {
    if (mesh && mesh.material && colour && colour instanceof THREE.Color) {
      mesh.material.color.set(colour);
    }
  }

  toggleVisibility(mesh) {
    if (mesh) {
      mesh.visible = !mesh.visible;
    }
  }

  hideMesh(mesh) {
    if (mesh) {
      mesh.visible = false;
    }
  }

  showMesh(mesh) {
    if (mesh) {
      mesh.visible = true;
    }
  }

  fadeMeshColourByCameraDistance(material, fromColor, toColor, normalizedDistance, fadeSpeed) {
    const color = new THREE.Color().lerpColors(fromColor, toColor, normalizedDistance);
    material.color.lerp(color, fadeSpeed);
  }
}