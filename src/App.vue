<script setup lang="ts">
import GameExperience from './components/GameExperience.vue'
import GameHUD from './components/GameHUD.vue'
import { useGameStore } from './stores/gameStore'

const gameStore = useGameStore()
</script>

<template>
  <main>
	<GameHUD />
	<GameExperience />
  </main>
</template>
