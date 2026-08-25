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

	watch(() => gameStore.appState, (newState) => {
		if (experience) {
			if (newState === 'MAP_PREVIEW')
				experience.loadMapPreview(gameStore.prevMapId, gameStore.selectedMapId, gameStore.nextMapId);
		}
	});
</script>

<template>
	<div ref="canvasContainer" class="w-full h-full overflow-hidden"></div>
</template>