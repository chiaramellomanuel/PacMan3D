<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from 'vue';
	import { useGameStore } from '../stores/gameStore';
	import { HUD_CONFIG } from '../game/Config';

	const	gameStore = useGameStore();
	const	baseUrl = import.meta.env.BASE_URL;
	const	selectedIndex = ref(0);
	let		lastMoveTime = 0;

	const	menuButtons = [
		{ label: `${baseUrl}UI/MainMenu/Play_text.png`, action: 'play' },
		{ label: `${baseUrl}UI/MainMenu/Leaderboard_text.png`, action: 'leaderboard' },
		{ label: `${baseUrl}UI/MainMenu/Stats_text.png`, action: 'stats' },
		{ label: `${baseUrl}UI/MainMenu/Settings_text.png`, action: 'settings' }
	];

	const	handleMenuClick = (action: string) => {
		if (action === "play")
		{
			gameStore.appState = "MAP_PREVIEW";
		}
	};

	const	handleKeyDown = (e: KeyboardEvent) => {
		const	now = Date.now();

		if ((now - lastMoveTime) < HUD_CONFIG.MAIN_MENU_MOVE_CD) return;

		if (e.key === 'ArrowDown' && selectedIndex.value < (menuButtons.length - 1)) {
			selectedIndex.value = selectedIndex.value + 1;
			lastMoveTime = now;
		}
		else if (e.key === 'ArrowUp' && selectedIndex.value > 0) {
			selectedIndex.value = selectedIndex.value - 1;
			lastMoveTime = now;
		}
		else if (e.key === 'Enter')
			handleMenuClick(menuButtons[selectedIndex.value].action);
	};

	const	handleWheel = (e: WheelEvent) => {
		const	now = Date.now();

		if (now - lastMoveTime < HUD_CONFIG.MAIN_MENU_MOVE_CD) return;

		if (e.deltaY > 0 && selectedIndex.value < (menuButtons.length - 1)) {
			selectedIndex.value = selectedIndex.value + 1;
			lastMoveTime = now;
		}
		else if (e.deltaY < 0 && selectedIndex.value > 0) {
			selectedIndex.value = selectedIndex.value - 1;
			lastMoveTime = now;
		}
	};

	const	getItemStyle = (index: number) => {
		const	distance = index - selectedIndex.value;
		const	translateY = `calc(-50% + ${distance * HUD_CONFIG.MAIN_MENU_Y_DIST}px)`;
		const	scale = distance === 0 ? 1 : 0.5;
		const	opacity = distance === 0 ? 1 : (Math.abs(distance) === 1 ? 0.4 : 0);

		return {
			top: '50%',
			transform: `translateY(${translateY}) scale(${scale})`,
			opacity: opacity,
			zIndex: distance === 0 ? 10 : 5
		};
	};

	onMounted(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('wheel', handleWheel);
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('wheel', handleWheel);
	})

</script>

<template>
	<div class="absolute flex flex-col items-center justify-center z-20 w-full h-full overflow-hidden">
		<img
			src="/UI/MainMenu/Title_text.png"
			alt="Title"
		/>

		<div class="relative flex justify-center w-full h-125 mt-10">
			<button
				v-for="(btn, index) in menuButtons"
				:key="btn.label"
				:style="getItemStyle(index)"
				@click="handleMenuClick(btn.action)"
				class="absolute transition-all duration-300 ease-out hover:cursor-pointer outline-none"
			>
				<img
					:src="btn.label"
					:alt="btn.action"
				/>
			</button>
		</div>
	</div>
</template>