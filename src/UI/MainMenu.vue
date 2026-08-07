<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();

	const	menuButtons = [
		{ label: 'Play', action: 'play' },
		{ label: 'Leaderboard', action: 'leaderboard' },
		{ label: 'Stats', action: 'stats' },
		{ label: 'Settings', action: 'settings' }
	];

	const	handleMenuClick = (action: string) => {
		if (action === "play")
		{
			gameStore.resetGame();
			console.log("play");
		}
	};

</script>

<template>
	<div class="absolute flex flex-col items-center justify-evenly z-20 w-full h-full">
		<div class="flex items-center justify-center">
			<div class="text-yellow-300 text-9xl font-mono">
				PacMan3D
			</div>
		</div>
		<div class="flex flex-col items-center justify-center text-7xl space-y-4 text-yellow-300">
			<button
				v-for="btn in menuButtons"
				:key="btn.label"
				@click="handleMenuClick(btn.action)"
				class="transition-all duration-100 hover:cursor-pointer hover:scale-110 active:scale-90"
			>
				{{ btn.label }}
			</button>
		</div>

	</div>
</template>