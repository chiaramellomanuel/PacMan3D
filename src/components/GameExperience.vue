<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Experience } from '../game/Experience';

const canvasContainer = ref<HTMLElement | null>(null);

onMounted(() => {
	if (canvasContainer.value)
		new Experience(canvasContainer.value);
});
</script>

<template>
	<div ref="canvasContainer" class="game-container"></div>
</template>

<style scoped>
.game-container {
	width: 100vw;
	height: 100vh;
	overflow: hidden;
}
</style>