<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();
</script>

<template>
	<div class="absolute top-0 left-0 z-10 w-full pointer-events-none p-4 border-b border-yellow-300 bg-black">
		<div class="relative flex justify-between items-center w-full">
			<div class="flex relative z-10">
				<img
					v-for="n in gameStore.lives"
					:key="n"
					src="/UI/InGame/Life.png"
					class="w-12 h-12"
					alt="Life"
				/>
			</div>
			<div class="absolute inset-x-0 text-center text-4xl text-yellow-300 font-mono"
			>
				{{ String(gameStore.score).padStart(5, '0') }}
			</div>
			<button
				@click="gameStore.appState = 'PAUSED'"
				class="flex relative z-10 w-12 h-12 items-center justify-center border border-yellow-300 rounded-xs hover:scale-110 hover:cursor-pointer active:scale-90 transition-transform duration-100 pointer-events-auto"
			>
				<i-pixelarticons-pause class="w-10 h-10 text-yellow-300"/>
			</button>
		</div>
	</div>
</template>