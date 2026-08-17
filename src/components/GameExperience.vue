<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue';
	import { Experience } from '../game/Experience';
	import { useGameStore } from '../stores/gameStore';

	const canvasContainer = ref<HTMLElement | null>(null);
	const gameStore = useGameStore();

	let experience: Experience | null = null;

	onMounted(() => {
		if (canvasContainer.value) {
			experience = new Experience(canvasContainer.value);
		}
	});

	watch(() => gameStore.selectedMapId, (newUrl) => {
		if (experience)
			experience.loadMapPreview(newUrl);
	});

	watch(() => gameStore.appState, (newState) => {
		if (experience) {
			if (newState === 'MAP_PREVIEW')
				experience.loadMapPreview(gameStore.selectedMapId);
		}
	});
</script>

<template>
	<div ref="canvasContainer" class="w-full h-full overflow-hidden"></div>
</template>