<script setup lang="ts">
	import InGameUI from '../UI/InGameUI.vue';
	import PauseMenu from '../UI/PauseMenu.vue';
	import MainMenu from '../UI/MainMenu.vue';
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();
</script>

<template>
	<MainMenu v-if="!gameStore.isGameStarted"/>
	<InGameUI v-if="gameStore.isGameStarted"/>
	<PauseMenu v-if="gameStore.isPaused && gameStore.isGameStarted"/>
</template>