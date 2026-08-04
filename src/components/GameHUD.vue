<script setup lang="ts">
	import InGameUI from '../UI/InGameUI.vue';
	import MenuUI from '../UI/PauseMenu.vue';
	import { useGameStore } from '../stores/gameStore';

	const	gameStore = useGameStore();
</script>

<template>
	<InGameUI />
	<MenuUI v-if="gameStore.isPaused"/>
</template>