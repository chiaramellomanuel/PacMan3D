<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const gameStore = useGameStore();

	const selectMap = () => {
		gameStore.appState = "TRANSITIONING";
	}
</script>

<template>
	<div class="absolute inset-0 w-full h-full z-20 px-12 text-yellow-300 text-7xl font-mono">
		<div class="absolute left-12 top-1/2 -translate-y-1/2">
			<i-pixelarticons-arrow-left-box />
		</div>
		<div class="absolute right-12 top-1/2 -translate-y-1/2">
			<i-pixelarticons-arrow-right-box />
		</div>
		<div
			@click="selectMap"
			class="absolute bottom-32 left-1/2 -translate-x-1/2 text-center"
		>
			Select
		</div>
	</div>
</template>