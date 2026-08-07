<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from 'vue';
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();
	const	selectedIndex = ref(0);
	let		lastMoveTime = 0;
	const	moveCooldown = 100;

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
		}
	};

	const	handleKeyDown = (e: KeyboardEvent) => {
		const	now = Date.now();

		if ((now - lastMoveTime) < moveCooldown) return;

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

		if (now - lastMoveTime < moveCooldown) return;

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
		const	translateY = `calc(-50% + ${distance * 80}px)`;
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
	<div class="absolute flex flex-col items-center justify-start z-20 w-full h-full overflow-hidden">
		<div class="mt-20 mb-10 text-yellow-300 text-9xl font-mono z-30 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
			PacMan3D
		</div>

		<div class="relative w-full h-125 mt-10">
			<button
				v-for="(btn, index) in menuButtons"
				:key="btn.label"
				:style="getItemStyle(index)"
				@click="handleMenuClick(btn.action)"
				class="absolute w-full text-center text-7xl font-mono text-yellow-300 transition-all duration-300 ease-out hover:cursor-pointer outline-none"
			>
				{{ btn.label }}
			</button>
		</div>
	</div>
</template>