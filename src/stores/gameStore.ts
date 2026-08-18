import { defineStore } from 'pinia'

export type appState = 'MENU' | 'MAP_PREVIEW' | 'TRANSITIONING' | 'PLAYING' | 'GAME_OVER';

export interface MapManifest {
	id: string;
	name: string;
	author: string;
	fileUrl: string;
}

export const useGameStore = defineStore('game', {
	state: () => ({
		appState: 'MENU' as appState,

		selectedMapId: 'level_01',
		avaiableMaps: [
			{ id: 'level_01', name: 'Level 01', author: 'Official', fileUrl: '/maps/level_01.json' },
			{ id: 'level_02', name: 'Level 02', author: 'Official', fileUrl: '/maps/level_02.json' }
		] as MapManifest[],
		
		loadedMapData: {} as Record<string, any>,

		score: 0,
		highScore: 0,
		ghostEatenMultiplier: 0,
		lives: 3,
		pelletsRemaining: 0,
		isGameStarted: false,
		isPaused: false,
		isGameOver: false,
		isLevelClear: false
	}),

	getters: {
		prevMapId: (state) => {
			const total = state.avaiableMaps.length;
			if (total <= 1) return state.selectedMapId;

			const currentIndex = state.avaiableMaps.findIndex(m => m.id === state.selectedMapId);
			if (currentIndex === 0) return state.selectedMapId;
			const prevIndex = currentIndex - 1;

			return state.avaiableMaps[prevIndex].id;
		},

		nextMapId: state => {
			const total = state.avaiableMaps.length;
			if (total <= 1) return state.selectedMapId;

			const currentIndex = state.avaiableMaps.findIndex(m => m.id === state.selectedMapId);
			if (currentIndex === state.avaiableMaps.length - 1) return state.selectedMapId;
			const nextIndex = currentIndex + 1;

			return state.avaiableMaps[nextIndex].id;
		}
	},

	actions: {

		async fetchMapData(mapId: string) {
			if (this.loadedMapData[mapId]) return this.loadedMapData[mapId];

			const mapConfig = this.avaiableMaps.find(m => m.id === mapId);
			if (!mapConfig) {
				console.error(`Map ${mapId} not found`);
				return null;
			}

			try {
				const response = await fetch(mapConfig.fileUrl);
				if (!response.ok) throw new Error('Network response was not ok');
				const data = await response.json();

				this.loadedMapData[mapId] = data;
				return data;
			} catch (error) {
				console.error("Map data loading error:", error);
				return null;
			}
		},

		pelletEaten(points: number = 10) {
			this.score += points
			this.pelletsRemaining--

			if (this.pelletsRemaining <= 0)
				this.isLevelClear = true
		},

		setTotalPellets(count: number) {
			this.pelletsRemaining = count
			this.isLevelClear = false
		},

		resetGhostMultiplier() {
			this.ghostEatenMultiplier = 0;
		},

		eatGhost() {
			this.ghostEatenMultiplier++;

			const points = Math.pow(2, this.ghostEatenMultiplier) * 100;
			this.score += points;
			return points;
		},

		loseLife() {
			if (this.lives > 0) {
				this.lives--
				if (this.score >= 200)
					this.score -= 200
				else
					this.score = 0
			}
			if (this.lives === 0)
				this.isGameOver = true
		},
		
		pauseGame() {
			this.isPaused = !this.isPaused;
		},

		resetGame() {
			this.score = 0
			this.lives = 3
			this.isGameOver = false
			this.isLevelClear = false
			this.isPaused = false;
			this.isGameStarted = true;
		}
	}
})