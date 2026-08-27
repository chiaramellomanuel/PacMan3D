<script setup lang="ts">
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();

	const	menuButtons = [
		{ label: '/UI/PauseMenu/Restart_text.png', action: 'restart' },
		{ label: '/UI/PauseMenu/Quit_text.png', action: 'quit' }
	];

	const	handleMenuClick = (action: string) => {
		if (action === "resume")
			gameStore.appState = gameStore.prevState;
		else if (action === "restart") //temporary solution
			window.location.reload();
	};
</script>

<template>
	<div class="absolute flex items-center justify-center w-full h-full bg-black/60">
		<div class="flex flex-col justify-between items-center w-full sm:w-120 md:w-130 lg:w-150 h-170 bg-blue-900 border-2 border-yellow-300 rounded-sm text-yellow-300 font-mono">
			<div class="text-7xl mt-20">
				<div v-if="gameStore.isLevelClear">
					<img
						src="/UI/GameOverMenu/Win_text.png"
						alt="You Win!"
					/>
				</div>
				<div v-else>
					<img
						src="/UI/GameOverMenu/Lose_text.png"
						alt="You Lose"
					/>
				</div>
			</div>
			
			<div class="text-yellow-300 text-7xl">
				<div></div>
				<div> {{ gameStore.score }} </div>
			</div>

			<div class="flex items-center justify-center space-x-24 mb-12 ">
				<button
					v-for="btn in menuButtons"
					:key="btn.label"
					@click="handleMenuClick(btn.action)"
					class="hover:scale-110 active:scale-90 hover:cursor-pointer transition-transform duration-100"
				>
					<img class="h-12 w-auto"
						:src="btn.label"
						:alt="btn.action"
					/>
				</button>
			</div>
		</div>
	</div>
</template>