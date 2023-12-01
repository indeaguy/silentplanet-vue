<script setup>

    import { Scene } from '../helpers/Scene.js';
    import { Globe } from '../helpers/Globe.js';
    import { DataLoader } from '../helpers/DataLoader.js';
    import { RayTracer } from '../helpers/RayTracer.js';
    import { onMounted } from 'vue';

    // import the CONFIG
    import config from '../assets/globe-settings.json';

    let renderer, globe, rayTracer;


    // this makes sure the base-globe element is loaded in the dom first
    onMounted(() => {
      renderer = new Scene(config.CAMERA, config.SCENE, 'base-globe');
      globe = new Globe(config.SPHERE, renderer); 
      globe.createSphere();
      renderer.renderables.push(globe);

      const loader = new DataLoader('geojson/usa.geojson');
      
      loader.loadData().then(data => {
        const result = loader.mapDataToSphere(data, config.SPHERE.RADIUS, config.POLYGONS.COLOR, config.POLYGONS.RISE, config.POLYGONS.SUBDIVIDE_DEPTH, config.POLYGONS.MIN_EDGE_LENGTH);
        result.meshes.forEach(mesh => renderer.scene.add(mesh));
      });

      rayTracer = new RayTracer(renderer.scene, renderer.camera);
      renderer.animate();

      setupEventListeners();
    });

    function setupEventListeners() {
      window.addEventListener('resize', () => renderer.onWindowResize(), false);
      window.addEventListener('mousemove', (event) => rayTracer.onMouseMove(event), false);
    }

</script>

<template>
  <div id="base-globe"></div>
</template>