<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const gameStore = useGameStore();

	const selectMap = () => {
		gameStore.appState = "TRANSITIONING";
	}
</script>

<template>
	<div class="absolute inset-0 w-full h-full z-20 px-12 text-yellow-300 text-7xl font-mono">
		<button
			@click="gameStore.selectedMapId = gameStore.prevMapId"
			class="absolute left-12 top-1/2 -translate-y-1/2 transition-all duration-100 hover:cursor-pointer hover:scale-110 active:scale-90 outline-none"
		>
			<i-pixelarticons-arrow-left-box />
		</button>
		<button
			@click="gameStore.selectedMapId = gameStore.nextMapId"
			class="absolute right-12 top-1/2 -translate-y-1/2 transition-all duration-100 hover:cursor-pointer hover:scale-110 active:scale-90 outline-none"
		>
			<i-pixelarticons-arrow-right-box />
		</button>
		<button
			@click="selectMap"
			class="absolute bottom-32 left-1/2 -translate-x-1/2 outline-none transition-all duration-100 hover:cursor-pointer hover:scale-110 active:scale-90"
		>
			<img
				src="/UI/MapSelection/Select_text.png"
				alt="Select"
			/>
		</button>
	</div>
</template>