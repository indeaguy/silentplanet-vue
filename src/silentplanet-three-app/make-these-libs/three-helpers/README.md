# Three Helpers

This directory contains helper functions and utilities for working with Three.js in the Silent Planet project.

## Contents

The `three-helpers` module provides the following utilities:

- Visibility helpers
- Color manipulation helpers
- Shape creation helpers
- Material creation helpers

## Usage

Import the required helpers in your main application file:

```javascript
import {
    toggleMeshVisibility,
    hideMesh,
    showMesh,
    updateMeshColour,
    newThreeColour,
    fadeMeshColourByCameraDistance,
    createSphere,
    createBasicMeshBasicMaterial,
    createMeshBasicMaterial
} from './three-helpers';
```

Then use them in your Three.js application as needed:

```javascript
// Toggle visibility of a mesh
toggleMeshVisibility(myMesh);

// Create a new sphere
const sphere = createSphere(radius, widthSegments, heightSegments);

// Update mesh color
updateMeshColour(myMesh, newColor);

// Create a basic material
const material = createMeshBasicMaterial(color, opacity);
```

## Available Functions

### Visibility

- `toggleMeshVisibility(mesh)`: Toggle the visibility of a mesh
- `hideMesh(mesh)`: Hide a mesh
- `showMesh(mesh)`: Show a mesh

### Colors

- `updateMeshColour(mesh, color)`: Update the color of a mesh
- `newThreeColour(color)`: Create a new Three.js color
- `fadeMeshColourByCameraDistance(mesh, camera, minDistance, maxDistance)`: Fade mesh color based on camera distance

### Shapes

- `createSphere(radius, widthSegments, heightSegments)`: Create a sphere geometry

### Materials

- `createBasicMeshBasicMaterial(options)`: Create a basic mesh material
- `createMeshBasicMaterial(color, opacity)`: Create a mesh basic material with color and opacity

## Documentation

For detailed documentation on each helper function, please refer to the comments within the source files in the `utils` directory.

## Contributing

If you'd like to add new helpers or improve existing ones, please submit a pull request with your changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
