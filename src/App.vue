<script setup lang="ts">
import GameExperience from './components/GameExperience.vue'
import { useGameStore } from './stores/gameStore'

const gameStore = useGameStore()
</script>

<template>
  <main>
	<div class="absolute mt-5 ml-5 z-10 pointer-events-none text-yellow-400 font-mono">
		<div class="score">SCORE: {{ gameStore.score }}</div>
		<div class="lives">LIVES: {{ gameStore.lives }}</div>
	</div>

	<GameExperience />
  </main>
</template>
