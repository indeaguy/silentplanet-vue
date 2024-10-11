import * as THREE from 'three';

/**
 * Creates a circular line
 * 
 * @param {number} radius 
 * @param {number} angle 
 * @param {boolean} isHorizontal if true, the line is horizontal (ex. latitude line), otherwise it's vertical (ex. longitude line)  
 * @returns {THREE.Line}
 */
export function createCircularLine(radius, angle, isHorizontal = true) {
  const points = []
  const steps = isHorizontal ? 360 : 180
  const rad = Math.PI / 180

  for (let i = 0; i <= steps; i += 2) {
    const theta = isHorizontal ? angle : i * rad
    const phi = isHorizontal ? i * rad : angle
    
    const x = -(radius * Math.sin(theta) * Math.cos(phi))
    const y = radius * Math.cos(theta)
    const z = radius * Math.sin(theta) * Math.sin(phi)
    
    points.push(new THREE.Vector3(x, y, z))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geometry)
}

/**
 * Creates grid lines in a sphere shape
 * 
 * @param {number} radius 
 * @param {number} latDensity 
 * @param {number} lonDensity 
 * @param {string | number} gridKey 
 * @returns {THREE.Line[]}
 * 
 * @TODO performance issues! Increasing the radius here can cause the browser to crash!
 */
export function createSphericalGridLines(radius, latDensity, lonDensity, gridKey) {
  const lines = []
  for (let i = -80; i <= 80; i += latDensity) {
    let theta = (90 - i) * (Math.PI / 180)
    // create latitude lines
    let line = createCircularLine(radius, theta, true);
    line.gridKey = gridKey;
    lines.push(line)
  }
  for (let i = -180; i <= 180; i += lonDensity) {
    let phi = (i + 180) * (Math.PI / 180)
    // create longitude lines
    let line = createCircularLine(radius, phi, false);
    line.gridKey = gridKey;
    lines.push(line)
  }
  return lines
}