<script setup>

    import { Scene } from '../helpers/Scene.js';
    import { Globe } from '../helpers/Globe.js';
    import { DataLoader } from '../helpers/DataLoader.js';
    import { RayTracer } from '../helpers/RayTracer.js';
    import { onMounted, onBeforeUnmount, inject } from 'vue';

    // import the CONFIG
    import config from '../assets/globe-settings.json';

    let renderer, globe, rayTracer;

    const polygonContent = inject('polygonContent');

    // @TODO render accessible non-threejs alternative as well/instead
    // this makes sure the base-globe element is loaded in the dom first
    onMounted(() => {
      renderer = new Scene(config.CAMERA, config.SCENE, 'base-globe');
      globe = new Globe(config.SPHERE, renderer); 
      globe.createSphere();
      renderer.renderables.push(globe);

      // @TODO get this from redis or something similar
      const loader = new DataLoader('geojson/usa.geojson');
      
      loader.loadData().then(data => {
        const result = globe.mapDataToSphere(data, config.SPHERE.RADIUS, parseInt(config.POLYGONS.COLOR, 16), config.POLYGONS.RISE, config.POLYGONS.SUBDIVIDE_DEPTH, config.POLYGONS.MIN_EDGE_LENGTH);
        result.meshes.forEach(mesh => renderer.scene.add(mesh));
      });

      rayTracer = new RayTracer(renderer.scene, renderer.camera);
      renderer.animate();

      setupEventListeners();
    });

    // @TODO update so that anything added here automatically gets removed by onBeforeUnmount as well
    function setupEventListeners() {
      window.addEventListener('resize', () => renderer.onWindowResize(), false);
      window.addEventListener('mousemove', (event) => rayTracer.onMouseMove(event), false);
    }

    // prevent memory leaks!
    onBeforeUnmount(() => {
      window.removeEventListener('resize', renderer.onWindowResize);
      window.removeEventListener('mousemove', rayTracer.onMouseMove);
      // Any other cleanup code...
    });

    
    /**
     * When the user clicks on the globe
     *
     * @param {type} event - description of the event parameter
     * @return {type} no return value
     */
    function globeClick(event) {

      polygonContent.value = 'anything';

    }

</script>

<template>
  <div @click="globeClick" id="base-globe"></div>
</template>