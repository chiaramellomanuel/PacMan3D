<script setup lang="ts">
import GameExperience from './components/GameExperience.vue'
import { useGameStore } from './stores/gameStore'

const gameStore = useGameStore()
</script>

<template>
  <main>
	<div class="hud">
		<div class="score">SCORE: {{ gameStore.score }}</div>
		<div class="lives">LIVES: {{ gameStore.lives }}</div>
	</div>

	<GameExperience />
  </main>
</template>

<style>
body { margin: 0; }
.hud {
	position: absolute;
	top: 20px;
	left: 20px;
	z-index: 10;
	color: yellow;
	font-family: 'Courier New', monospace;
	pointer-events: none;
}
button { pointer-events: auto; }
</style>