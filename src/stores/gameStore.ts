import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
	state: () => ({
		appState: 'MENU',
		score: 0,
		highScore: 0,
		ghostEatenMultiplier: 0,
		lives: 3,
		pelletsRemaining: 0,
		isGameStarted: false,
		isPaused: true,
		isGameOver: false,
		isLevelClear: false
	}),
	actions: {
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