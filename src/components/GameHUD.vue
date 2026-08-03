<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();
</script>

<template>
	<div class="absolute w-full h-full">
		<div class="flex justify-between">
			<div class="flex-col mt-5 ml-5 z-10 text-yellow-400 font-mono">
				<div class="flex">
					<img
						v-for="n in gameStore.lives"
						:key="n"
						src="/Life.png"
						class="w-12 h-12"
						alt="Life"
					/>
				</div>
				<div class="score">SCORE: {{ gameStore.score }}</div>
			</div>
			<button
				class="flex items-center justify-center mr-5 mt-5 w-12 h-12 border rounded-xs bg-blue-200/40 border-blue-500 text-yellow-400 transition-scale duration-100 hover:cursor-pointer hover:scale-110 active:scale-90"
				@click="gameStore.pauseGame()"
			>
				<i-pixelarticons-pause class="w-10 h-10"/>
			</button>
		</div>
	</div>
</template>