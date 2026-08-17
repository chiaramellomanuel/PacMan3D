import * as THREE from 'three'
import { WebGPURenderer, Timer, } from 'three/webgpu'
import { PacMan } from './PacMan'
import { Map } from './Map'
import { Ghost } from './Ghost'
import { GHOST_PERSONALITY, GHOST_STATE, DIRECTIONS } from './Constants'
import { useGameStore } from '../stores/gameStore'

export class Experience {
	private renderer: WebGPURenderer;
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private timer: Timer;
	private pacman: PacMan | null = null;
	private map: Map | null = null;
	private lookTarget = new THREE.Vector3();
	private blinky: Ghost | null = null;
	private pinky: Ghost | null = null;
	private inky: Ghost | null = null;
	private clyde: Ghost | null = null;
	private ghostTimer: number = 0;
	private ghostsExited: number = 0;
	private doorPosition = new THREE.Vector3;
	private pacmanSpawn = new THREE.Vector3;
	private ghostsSpawn: THREE.Vector3[] | null = null;
	private gameStore = useGameStore();
	private powerUpTimer: any = null;

	public	mapWrapper: THREE.Group;
	public	mapContainer: THREE.Group;
	public	leftWrapper: THREE.Group;
	public	leftContainer: THREE.Group;
	public	rightWrapper: THREE.Group;
	public	rightContainer:	THREE.Group;

	constructor (container: HTMLElement) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x5F5CFF);

		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.set(0, 30, 20);
		this.camera.lookAt(0, 0, 0);

		this.renderer = new WebGPURenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(this.renderer.domElement);

		this.timer = new Timer();

		this.mapWrapper = new THREE.Group();
		this.scene.add(this.mapWrapper);
		this.mapContainer = new THREE.Group();
		this.mapWrapper.add(this.mapContainer);

		this.leftWrapper = new THREE.Group();
		this.scene.add(this.leftWrapper);
		this.leftContainer = new THREE.Group();
		this.leftWrapper.add(this.leftContainer);

		this.rightWrapper = new THREE.Group();
		this.scene.add(this.rightWrapper);
		this.rightContainer = new THREE.Group();
		this.rightWrapper.add(this.rightContainer);

		this.setupLights();
		this.initEngine();

		window.addEventListener('resize', () => this.onWindowResize());
	}

	private setupLights() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
		this.scene.add(ambientLight);

		const directLight = new THREE.DirectionalLight(0xffffff, 2.0);
		directLight.position.set(0, 10, 7);
		this.scene.add(directLight);
	}

	private async initEngine() {
		await this.renderer.init();
		this.startLoop();
	}
	
	public async loadMapPreview(mapUrl: string = 'map_data.json') {
		if (this.map)
			this.mapContainer.clear();
		if (this.pacman)
			this.pacman.destroy();

		this.mapWrapper.scale.set(1, 1, 1);
		this.mapWrapper.rotation.set(0, 0, 0);
		this.mapContainer.position.set(0, 0, 0);
		
		this.map = new Map(this.mapContainer as any);
		this.map.onPowerPelletEaten = () => this.triggerPowerPellet();
		await this.map.load(mapUrl);
		
		const cols = this.map.grid[0].length;
		const rows = this.map.grid.length;
		const tileSize = this.map.tileSize;
		const offsetX = this.map.offset.x;
		const offsetZ = this.map.offset.z;

		const centerX = offsetX + ((cols - 1) * tileSize) / 2;
		const centerZ = offsetZ + ((rows - 1) * tileSize) / 2;

		this.doorPosition = this.map.getDoorPosition();
		this.pacmanSpawn = this.map.getPacmanSpawnPoint();
		this.ghostsSpawn = this.map.getGhostSpawnPoints();

		const referencePoint = this.ghostsSpawn[2];
		const dx = this.doorPosition.x - referencePoint.x;
		const dz = this.doorPosition.z - referencePoint.z;

		let spawnDir = DIRECTIONS.UP;
		if (Math.abs(dx) > Math.abs(dz))
			spawnDir = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
		else
			spawnDir = dz > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;

		this.blinky	= new Ghost(this.mapContainer as any, 0xff0000, this.ghostsSpawn[0], GHOST_PERSONALITY.CHASER, spawnDir);
		this.pinky	= new Ghost(this.mapContainer as any, 0xffb8ff, this.ghostsSpawn[1], GHOST_PERSONALITY.RANDOM, spawnDir);
		this.inky	= new Ghost(this.mapContainer as any, 0x00ffff, this.ghostsSpawn[2], GHOST_PERSONALITY.RANDOM, spawnDir);
		this.clyde	= new Ghost(this.mapContainer as any, 0xffb852, this.ghostsSpawn[3], GHOST_PERSONALITY.RANDOM, spawnDir);
	
		this.pacman = new PacMan(this.mapContainer as any, this.pacmanSpawn);

		this.mapContainer.position.set(-centerX, 0, -centerZ);
		this.mapWrapper.scale.set(0.4, 0.4, 0.4);

	}
	
	private checkCollisions() {
		if (!this.pacman?.mesh || this.gameStore.appState !== "PLAYING" || this.gameStore.isPaused || this.gameStore.isGameOver) return;

		const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
		const pacmanPos = this.pacman.mesh.position;
		const collisionThreshold = 1.2;

		for (const ghost of ghosts) {
			if (!ghost?.mesh) continue;

			const dist = pacmanPos.distanceTo(ghost.mesh.position);
			
			if (dist < collisionThreshold) {
				if (ghost.state === GHOST_STATE.FRIGHTENED) {
					this.gameStore.eatGhost();
					ghost.beEaten(this.doorPosition);
				}
				else if (ghost.state === GHOST_STATE.HUNTING || ghost.state === GHOST_STATE.EXITING) {
					this.handlePlayerDeath();
					break ;
				}
			}
		}
	}

	private handlePlayerDeath() {
		this.gameStore.isPaused = true;
		this.gameStore.loseLife();

		if (this.gameStore.isGameOver) {
			alert("GAME OVER!");
			this.gameStore.resetGame();
			window.location.reload();
		}
		else {
			setTimeout(() => {
				this.resetPositions();
				this.gameStore.isPaused = false;
			}, 1500);
		}
	}

	private resetPositions() {
		if (this.pacman?.mesh)
			this.pacman.mesh.position.set(this.pacmanSpawn.x, 0, this.pacmanSpawn.z);
		if (!this.ghostsSpawn) return;

		const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

		ghosts.forEach((ghost, index) => {
			if (ghost && this.ghostsSpawn && this.ghostsSpawn[index]) {
				const spawn = this.ghostsSpawn[index];
				ghost.mesh?.position.set(spawn.x, 0, spawn.z);
				ghost.state = GHOST_STATE.IN_BOX;
				ghost.stopFlashing();
				ghost.updateAppearance(ghost.originalColor);
			}
		});

		this.ghostTimer = 0;
		this.ghostsExited = 0;
	}

	private updateGhosts(delta: number) {
		if (!this.map) return;

		this.ghostTimer += delta;
		const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
		const pacmanPos = this.pacman?.mesh?.position;

		if (this.ghostTimer > 5 && this.ghostsExited < ghosts.length) {
			const currentGhost = ghosts[this.ghostsExited];
			if (currentGhost) {
				currentGhost.startExit(this.doorPosition);
				this.ghostsExited++;
				this.ghostTimer = 0;
			}
		}
		
		ghosts.forEach(g => {
			if (g) g.update(delta, this.map!, pacmanPos);
		});
	}

	private triggerPowerPellet() {
		this.gameStore.resetGhostMultiplier();
		const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
		
		ghosts.forEach(ghost => {
			if (ghost?.state !== GHOST_STATE.EATEN){
				ghost?.setFrightened();
				ghost?.stopFlashing();
			}
		});

		if (this.powerUpTimer)
			clearTimeout(this.powerUpTimer);

		this.powerUpTimer = setTimeout(() => {
			ghosts.forEach(ghost => ghost?.setFlashing());

			this.powerUpTimer = setTimeout(() => {
				ghosts.forEach(ghost => ghost?.setNormal())
				this.powerUpTimer = null;
			}, 3000);
		}, 7000);
	}

	private onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
	
	private startLoop() {
		const animate = () => {
			requestAnimationFrame(animate);
			this.timer.update();
			const delta = Math.min(this.timer.getDelta(), 0.033);

			// --- PREVIEW MODE ---
			if (this.gameStore.appState === "MAP_PREVIEW"){
				this.mapWrapper.rotation.y -= 0.3 * delta;

				this.camera.position.set(0, 30, 20);
				this.lookTarget.set(0, 0, 0);
				this.camera.lookAt(this.lookTarget);
			}

			// --- TRANSITION MODE ---
			if (this.gameStore.appState === "TRANSITIONING") {
				const lerpFactor = 5 * delta;

				//Calculating fastest rotational route to 0
				let currentRot = this.mapWrapper.rotation.y % (Math.PI * 2);
				if (currentRot < -Math.PI) currentRot += Math.PI * 2;
				if (currentRot > Math.PI) currentRot -= Math.PI * 2;
				this.mapWrapper.rotation.y = currentRot;

				this.mapWrapper.rotation.y = THREE.MathUtils.lerp(this.mapWrapper.rotation.y, 0, lerpFactor);
				this.mapWrapper.scale.lerp(new THREE.Vector3(1, 1, 1), lerpFactor);
				this.mapContainer.position.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);

				if (this.pacmanSpawn) {
					const targetCamPos = new THREE.Vector3(
						this.pacmanSpawn.x,
						30,
						this.pacmanSpawn.z + 20
					);

					this.camera.position.lerp(targetCamPos, lerpFactor);

					this.lookTarget.lerp(this.pacmanSpawn, lerpFactor);
					this.camera.lookAt(this.lookTarget);
				}

				if (Math.abs(this.mapWrapper.rotation.y) < 0.01 && this.mapWrapper.scale.x > 0.99) {
					this.mapWrapper.rotation.y = 0;
					this.mapWrapper.scale.set(1, 1, 1);
					this.mapContainer.position.set(0, 0, 0);

					this.gameStore.appState = "PLAYING";
				}
			}

			if (!this.map || this.gameStore.appState !== "PLAYING" || this.gameStore.isPaused) {
				this.renderer.render(this.scene, this.camera);
				return;
			}

			if (this.pacman && this.map)
			{
				this.pacman.update(delta, this.map);
				this.checkCollisions();
				this.updateGhosts(delta);

				if (this.pacman.mesh) {
					const pPos = this.pacman.mesh.position;
					const cameraHeight = 30;
					const offsetZ = 20;
					const lerpFactor = 0.1;

					this.camera.position.x += (pPos.x - this.camera.position.x) * lerpFactor;
					this.camera.position.z += ((pPos.z + offsetZ) - this.camera.position.z) * lerpFactor;
					this.camera.position.y = cameraHeight;

					this.lookTarget.x += (pPos.x - this.lookTarget.x) * lerpFactor;
					this.lookTarget.z += (pPos.z - this.lookTarget.z) * lerpFactor;
					this.lookTarget.y = 0;

					this.camera.lookAt(this.lookTarget);
				}
			}
			this.renderer.render(this.scene, this.camera);
		};
		animate();
	}
}