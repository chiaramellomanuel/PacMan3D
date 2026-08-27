<script setup lang="ts">
	import InGameUI from '../UI/InGameUI.vue';
	import PauseMenu from '../UI/PauseMenu.vue';
	import MainMenu from '../UI/MainMenu.vue';
	import MapSelection from '../UI/MapSelection.vue';
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();
</script>

<template>
	<MainMenu v-if="gameStore.appState === 'MENU'"/>
	<MapSelection v-if="gameStore.appState === 'MAP_PREVIEW' ||
						gameStore.appState === 'MAP_PREVIEW_NEXT' ||
						gameStore.appState === 'MAP_PREVIEW_PREV'" />
	<InGameUI v-if="gameStore.appState === 'PLAYING' ||
					gameStore.appState === 'PAUSED'"/>
	<PauseMenu v-if="gameStore.appState === 'PAUSED'"/>
</template>