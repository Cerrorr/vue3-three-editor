<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { threeService } from "@/three/core/ThreeService";

const threeContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (threeContainer.value) {
    threeService.init(threeContainer.value, { backgroundColor: 0x222222 });
  }
})
</script>

<template>
 <div ref="threeContainer" id="three-container"></div>
</template>

<style scoped>
  #three-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
