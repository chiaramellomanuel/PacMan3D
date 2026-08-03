<script setup lang="ts">
	import { onMounted, ref } from 'vue';
	import { Experience } from '../game/Experience';

	const canvasContainer = ref<HTMLElement | null>(null);

	onMounted(() => {
		if (canvasContainer.value)
			new Experience(canvasContainer.value);
	});
</script>

<template>
	<div ref="canvasContainer" class="w-full h-full overflow-hidden"></div>
</template>