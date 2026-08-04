<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();

	const	menuButtons = [
		{ label: 'Resume', action: 'resume' },
		{ label: 'Restart', action: 'restart' },
		{ label: 'Quit', action: 'quit' }
	];

	const	handleMenuClick = (action: string) => {
		if (action === "resume")
			gameStore.pauseGame();
		else if (action === "restart") {
			// gameStore.resetGame();
			window.location.reload();
		}
	};
</script>

<template>
	<div class="absolute flex items-center justify-center w-full h-full bg-black/60">
		<div class="flex flex-col justify-center items-center space-y-40 w-full sm:w-120 md:w-130 lg:w-150 h-170 bg-black border-2 border-yellow-300 rounded-sm text-yellow-300 text-6xl font-mono">
			<button
				v-for="btn in menuButtons"
				:key="btn.label"
				@click="handleMenuClick(btn.action)"
				class="hover:scale-110 active:scale-90 hover:cursor-pointer transition-transform duration-100"
			>
				{{ btn.label }}
			</button>
		</div>
	</div>
</template>