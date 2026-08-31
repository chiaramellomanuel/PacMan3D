import { defineStore } from 'pinia'

export type appState =	'MENU' |
						'MAP_PREVIEW' |
						'MAP_PREVIEW_NEXT' |
						'MAP_PREVIEW_PREV' |
						'TRANSITIONING' |
						'PLAYING' |
						'PAUSED' |
						'RESPAWN' |
						'GAME_OVER';

export interface MapManifest {
	id: string;
	name: string;
	author: string;
	fileUrl: string;
}

export const useGameStore = defineStore('game', {
	state: () => ({
		appState: 'MENU' as appState,
		prevState: 'MENU' as appState,

		selectedMapId: 'level_01',
		avaiableMaps: [
			{ id: 'level_01', name: 'Level 01', author: 'Official', fileUrl: '/maps/level_01.json' },
			{ id: 'level_02', name: 'Level 02', author: 'Official', fileUrl: '/maps/level_02.json' },
			{ id: 'level_03', name: 'Level 03', author: 'Official', fileUrl: '/maps/level_03.json' },
			{ id: 'level_04', name: 'Level 04', author: 'Official', fileUrl: '/maps/level_04.json' },
			{ id: 'test', name:'test_level', author: 'Official', fileUrl:'/maps/test_level.json' },
			{ id: 'giga', name: 'Gigantic', author: 'Official', fileUrl: '/maps/level_gigantic.json' }
		] as MapManifest[],
		
		loadedMapData: {} as Record<string, any>,

		score: 0,
		highScore: 0,
		ghostEatenMultiplier: 0,
		lives: 1,
		pelletsRemaining: 0,
		isLevelClear: false
	}),

	getters: {
		mapName: (state) => {
			const	currentIndex = state.avaiableMaps.findIndex(m => m.id === state.selectedMapId);
			return state.avaiableMaps[currentIndex].name;
		},

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
		},

		prevprevMapId: (state) => {
			const	total = state.avaiableMaps.length;
			if (total <= 2) return state.selectedMapId;

			const	currentIndex = state.avaiableMaps.findIndex(m => m.id === state.selectedMapId);
			if (currentIndex < 2) return state.selectedMapId;
			
			const	prevprevIndex = currentIndex - 2;
			return state.avaiableMaps[prevprevIndex].id;
		},

		nextnextMapId: (state) => {
			const	total = state.avaiableMaps.length;
			if (total <= 2) return state.selectedMapId;

			const	currentIndex = state.avaiableMaps.findIndex(m => m.id === state.selectedMapId);
			if (currentIndex >= state.avaiableMaps.length - 2) return state.selectedMapId;
		
			const	nextnextIndex = currentIndex + 2;
			return state.avaiableMaps[nextnextIndex].id;
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

			console.log(this.pelletsRemaining);

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
				this.appState = "GAME_OVER"
		},

		resetGame() {
			this.score = 0;
			this.lives = 3;
			this.appState = "PLAYING";
			this.isLevelClear = false;
		}
	}
})