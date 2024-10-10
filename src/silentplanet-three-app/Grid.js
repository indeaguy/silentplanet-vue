import * as THREE from 'three';
import { configInstance } from './services/silentplanet-rust-geo';

export class Grid {
  constructor() {
    this.gridMaterials = {};
  }

  createGrids() {
    let grids = this.createSphericalGrids(configInstance.settings.SPHERE.GRIDS);
    this.gridMaterials = this.createGridMaterials(configInstance.settings.SPHERE.GRIDS);
    this.applyMaterialToGridLines(grids);
    return grids;
  }

  createSphericalGrids(gridConfigs) {
    const allGridLines = {};
    Object.entries(gridConfigs).forEach(([key, gridConfig]) => {
      const grid = this.createSphericalGridLines(gridConfig.LAT_DENSITY, gridConfig.LON_DENSITY, key)
      allGridLines[key] = grid;
    })
    return allGridLines;
  }
  
  createGridMaterials(gridConfigs) {
    const materials = {};
    Object.entries(gridConfigs).forEach(([key, gridConfig]) => {
      materials[key] = {
        material: new THREE.LineBasicMaterial({ color: parseInt(gridConfig.COLOR, 16) }),
        config: gridConfig
      }
    });
    return materials;
  }

  createSphericalGridLines(latDensity, lonDensity, gridKey) {
    const lines = []
    for (let i = -80; i <= 80; i += latDensity) {
      let theta = (90 - i) * (Math.PI / 180)
      let line = this.createLatitudeLine(theta)
      line.gridKey = gridKey;
      lines.push(line)
    }
    for (let i = -180; i <= 180; i += lonDensity) {
      let phi = (i + 180) * (Math.PI / 180)
      let line = this.createLongitudeLine(phi)
      line.gridKey = gridKey;
      lines.push(line)
    }
    return lines
  }

  createLatitudeLine(theta) {
    var points = []
    for (let i = 0; i <= 360; i += 2) {
      let rad = Math.PI / 180
      let phi = i * rad
      let x = -(configInstance.settings.SPHERE.RADIUS * Math.sin(theta) * Math.cos(phi))
      let y = configInstance.settings.SPHERE.RADIUS * Math.cos(theta)
      let z = configInstance.settings.SPHERE.RADIUS * Math.sin(theta) * Math.sin(phi)
      points.push(new THREE.Vector3(x, y, z))
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points)
    return new THREE.Line(geometry)
  }

  createLongitudeLine(phi) {
    var points = []
    for (let i = 0; i <= 180; i += 2) {
      let rad = Math.PI / 180
      let theta = i * rad
      let x = -(configInstance.settings.SPHERE.RADIUS * Math.sin(theta) * Math.cos(phi))
      let y = configInstance.settings.SPHERE.RADIUS * Math.cos(theta)
      let z = configInstance.settings.SPHERE.RADIUS * Math.sin(theta) * Math.sin(phi)
      points.push(new THREE.Vector3(x, y, z))
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points)
    return new THREE.Line(geometry)
  }

  applyMaterialToGridLines(grids) {
    Object.entries(grids).forEach(([gridKey, gridLines]) => {
      const material = this.gridMaterials[gridKey].material;
      gridLines.forEach(line => {
        line.material = material;
      });
    });
  }
}
