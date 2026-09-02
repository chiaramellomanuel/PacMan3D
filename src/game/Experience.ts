import * as THREE from 'three'
import { WebGPURenderer, Timer, ClippingGroup } from 'three/webgpu'
import { PacMan } from './PacMan'
import { Map } from './Map'
import { Ghost } from './Ghost'
import { GHOST_PERSONALITY, GHOST_STATE, DIRECTIONS } from './Constants'
import { useGameStore } from '../stores/gameStore'
import { GAME_CONFIG, ENGINE_CONFIG, MAP_PREVIEW_CONFIG } from './Config'

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
	private powerUpTimer: number = 0;
	private flashTimer: number = 0;
	private	respawnTimer: number = 0;

	private	baseClipLimit = 40;
	private	mapPlanes!: THREE.Plane[];
	private	leftPlanes!: THREE.Plane[];
	private	rightPlanes!: THREE.Plane[];
	private	farLeftPlanes!: THREE.Plane[];
	private	farRightPlanes!: THREE.Plane[];

	public	mapWrapper: ClippingGroup;
	public	mapContainer: THREE.Group;
	public	leftWrapper: ClippingGroup;
	public	leftContainer: THREE.Group;
	public	rightWrapper: ClippingGroup;
	public	rightContainer:	THREE.Group;
	public	farLeftWrapper: ClippingGroup;
	public	farLeftContainer: THREE.Group;
	public	farRightWrapper: ClippingGroup;
	public	farRightContainer: THREE.Group;

	constructor (container: HTMLElement) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x5F5CFF);

		this.camera = new THREE.PerspectiveCamera(ENGINE_CONFIG.CAMERA_FOV, window.innerWidth / window.innerHeight, ENGINE_CONFIG.CAMERA_NEAR, ENGINE_CONFIG.CAMERA_FAR);
		this.camera.position.copy(ENGINE_CONFIG.CAMERA_POS);
		this.camera.lookAt(0, 0, 0);

		this.renderer = new WebGPURenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(this.renderer.domElement);

		this.timer = new Timer();

		this.mapWrapper = new ClippingGroup();
		this.scene.add(this.mapWrapper);
		this.mapContainer = new THREE.Group();
		this.mapWrapper.add(this.mapContainer);

		this.leftWrapper = new ClippingGroup();
		this.scene.add(this.leftWrapper);
		this.leftContainer = new THREE.Group();
		this.leftWrapper.add(this.leftContainer);

		this.rightWrapper = new ClippingGroup();
		this.scene.add(this.rightWrapper);
		this.rightContainer = new THREE.Group();
		this.rightWrapper.add(this.rightContainer);

		this.farLeftWrapper = new ClippingGroup();
		this.scene.add(this.farLeftWrapper);
		this.farLeftContainer = new THREE.Group();
		this.farLeftWrapper.add(this.farLeftContainer);

		this.farRightWrapper = new ClippingGroup();
		this.scene.add(this.farRightWrapper);
		this.farRightContainer = new THREE.Group();
		this.farRightWrapper.add(this.farRightContainer);

		this.mapPlanes = this.createClippingBox();
		this.leftPlanes = this.createClippingBox();
		this.rightPlanes = this.createClippingBox();
		this.farLeftPlanes = this.createClippingBox();
		this.farRightPlanes = this.createClippingBox();

		this.mapWrapper.clippingPlanes = this.mapPlanes;
		this.leftWrapper.clippingPlanes = this.leftPlanes;
		this.rightWrapper.clippingPlanes = this.rightPlanes;
		this.farLeftWrapper.clippingPlanes = this.farLeftPlanes;
		this.farRightWrapper.clippingPlanes = this.farRightPlanes;

		this.setupLights();
		this.initEngine();

		window.addEventListener('resize', () => this.onWindowResize());
	}

	private	createClippingBox(): THREE.Plane[] {
		return [
			new THREE.Plane(new THREE.Vector3(-1, 0, 0), this.baseClipLimit),
			new THREE.Plane(new THREE.Vector3(1, 0, 0), this.baseClipLimit),
			new THREE.Plane(new THREE.Vector3(0, 0, -1), this.baseClipLimit),
			new THREE.Plane(new THREE.Vector3(0, 0, 1), this.baseClipLimit)
		];
	}

	private setupLights() {
		const ambientLight = new THREE.AmbientLight(ENGINE_CONFIG.AMBIENT_LIGHT_COLOR, ENGINE_CONFIG.AMBIENT_LIGHT_INTENSITY);
		this.scene.add(ambientLight);

		const directLight = new THREE.DirectionalLight(ENGINE_CONFIG.DIRECT_LIGHT_COLOR, ENGINE_CONFIG.DIRECT_LIGHT_INTENSITY);
		directLight.position.copy(ENGINE_CONFIG.DIRECT_LIGHT_POS);
		this.scene.add(directLight);
	}

	private async initEngine() {
		await this.renderer.init();
		this.startLoop();
	}
	
	public async loadMapPreview(prevId: string, currentId: string, nextId: string, prevprevId: string, nextnextId: string) {
		const	tempLeft = new THREE.Group();
		const	tempCenter = new THREE.Group();
		const	tempRight = new THREE.Group();
		const	tempFarLeft = new THREE.Group();
		const	tempFarRight = new THREE.Group();

		const	prevMap = new Map(tempLeft as any);
		const	currentMap = new Map(tempCenter as any);
		const	nextMap = new Map(tempRight as any);
		const	prevprevMap = new Map(tempFarLeft as any);
		const	nextnextMap = new Map(tempFarRight as any);

		const loadPromises: Promise<void>[] = [];
		loadPromises.push(currentMap.load(currentId));

		if (prevId !== currentId)
			loadPromises.push(prevMap.load(prevId));
		if (nextId !== currentId)
			loadPromises.push(nextMap.load(nextId));
		if (prevprevId != currentId)
			loadPromises.push(prevprevMap.load(prevprevId));
		if (nextnextId != currentId)
			loadPromises.push(nextnextMap.load(nextnextId));

		await Promise.all(loadPromises);

		this.leftContainer.clear();
		this.mapContainer.clear();
		this.rightContainer.clear();
		this.farLeftContainer.clear();
		this.farRightContainer.clear();
		if (this.pacman) this.pacman.destroy();
		if (this.blinky) this.blinky.destroy();
		if (this.pinky) this.pinky.destroy();
		if (this.inky) this.inky.destroy();
		if (this.clyde) this.clyde.destroy();

		if (tempLeft.children.length > 0) this.leftContainer.add(...tempLeft.children);
		if (tempCenter.children.length > 0) this.mapContainer.add(...tempCenter.children);
		if (tempRight.children.length > 0) this.rightContainer.add(...tempRight.children);
		if (tempFarLeft.children.length > 0) this.farLeftContainer.add(...tempFarLeft.children);
		if (tempFarRight.children.length > 0) this.farRightContainer.add(...tempFarRight.children);

		this.map = currentMap;

		this.setupPreviewVisual(this.map, this.mapContainer, this.mapWrapper, MAP_PREVIEW_CONFIG.MAP_POS.center, MAP_PREVIEW_CONFIG.SELECTED_SCALE);
		
		if (prevId !== currentId)
			this.setupPreviewVisual(prevMap, this.leftContainer, this.leftWrapper, MAP_PREVIEW_CONFIG.MAP_POS.left, MAP_PREVIEW_CONFIG.SIDE_SCALE);
		else
			this.leftWrapper.visible = false;

		if (nextId !== currentId)
			this.setupPreviewVisual(nextMap, this.rightContainer, this.rightWrapper, MAP_PREVIEW_CONFIG.MAP_POS.right, MAP_PREVIEW_CONFIG.SIDE_SCALE);
		else
			this.rightWrapper.visible = false;

		if (prevprevId !== currentId)
			this.setupPreviewVisual(prevprevMap, this.farLeftContainer, this.farLeftWrapper, MAP_PREVIEW_CONFIG.MAP_POS.farLeft, MAP_PREVIEW_CONFIG.SIDE_SCALE);
		else
			this.farLeftWrapper.visible = false;

		if (nextnextId !== currentId)
			this.setupPreviewVisual(nextnextMap, this.farRightContainer, this.farRightWrapper, MAP_PREVIEW_CONFIG.MAP_POS.farRight, MAP_PREVIEW_CONFIG.SIDE_SCALE);
		else
			this.farRightWrapper.visible = false;

		this.map.onPowerPelletEaten = () => this.triggerPowerPellet();
		
		this.doorPosition = this.map.getDoorPosition();
		this.pacmanSpawn = this.map.getPacmanSpawnPoint();
		this.ghostsSpawn = this.map.getGhostSpawnPoints();

		if (this.ghostsSpawn) {
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
		}
	
		this.pacman = new PacMan(this.mapContainer as any, this.pacmanSpawn);
	}
	
	private setupPreviewVisual(map: Map, container: THREE.Group, wrapper: THREE.Group, posX: number, scaleMult: number) {
		const cols = map.grid[0].length;
		const rows = map.grid.length;
		const tileSize = map.tileSize;
		const offsetX = map.offset.x;
		const offsetZ = map.offset.z;

		const centerX = offsetX + ((cols - 1) * tileSize) / 2;
		const centerZ = offsetZ + ((rows - 1) * tileSize) / 2;

		container.position.set(-centerX, 0, -centerZ);

		const factor = this.getResponsiveFactor();
		const finalScale = scaleMult * factor;
		const finalPosX = posX * factor;

		wrapper.scale.set(finalScale, finalScale, finalScale);
		wrapper.position.set(finalPosX, 0, 0);
		wrapper.rotation.set(0, 0, 0);
		wrapper.visible = true;
	}

	private getResponsiveFactor(): number {
		return Math.min(Math.max(window.innerWidth / 1920, 0.6), 1);
	}

	private checkCollisions() {
		if (!this.pacman?.mesh || this.gameStore.appState !== "PLAYING") return;

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
		this.gameStore.loseLife();
		if (this.gameStore.appState !== "GAME_OVER") {
			this.gameStore.appState = "RESPAWN";
			this.respawnTimer = GAME_CONFIG.PACMAN_RESPAWN_DELAY_SEC;
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

		if (this.ghostTimer > GAME_CONFIG.GHOST_EXIT_TIMER && this.ghostsExited < ghosts.length) {
			const currentGhost = ghosts[this.ghostsExited];
			if (currentGhost) {
				currentGhost.startExit(this.doorPosition);
				this.ghostsExited++;
				this.ghostTimer = 0;
			}
		}

		if (this.powerUpTimer > 0) {
			this.powerUpTimer -= delta;

			if (this.powerUpTimer <= GAME_CONFIG.GHOST_FLASH_DURATION) {
				this.flashTimer += delta;
				if (this.flashTimer >= GAME_CONFIG.GHOST_FLASH_INTERVAL && this.flashTimer < (GAME_CONFIG.GHOST_FLASH_INTERVAL * 2))
					ghosts.forEach(g => g?.setFlashing(0xffffff));
				else if (this.flashTimer >= (GAME_CONFIG.GHOST_FLASH_INTERVAL * 2)) {
					this.flashTimer = 0;
					ghosts.forEach(g => g?.setFlashing(0x0000ff));
				}
			}
		}
		else if (this.powerUpTimer < 0) {
			ghosts.forEach(g => g?.setNormal());
			this.powerUpTimer = 0;
		}
		
		ghosts.forEach(g => {
			if (g) g.update(delta, this.map!, pacmanPos);
		});
	}

	private triggerPowerPellet() {
		this.gameStore.resetGhostMultiplier();
		const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
		
		this.powerUpTimer = GAME_CONFIG.POWER_PELLET_DURATION;

		ghosts.forEach(ghost => {
			if (ghost?.state !== GHOST_STATE.EATEN){
				ghost?.setFrightened();
			}
		});
	}

	private onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		if (this.gameStore.appState === "MAP_PREVIEW") {
			const factor = this.getResponsiveFactor();

			this.mapWrapper.scale.setScalar(MAP_PREVIEW_CONFIG.SELECTED_SCALE * factor);
			this.mapWrapper.position.set(MAP_PREVIEW_CONFIG.MAP_POS.center, 0, 0);

			this.leftWrapper.scale.setScalar(MAP_PREVIEW_CONFIG.SIDE_SCALE * factor);
			this.leftWrapper.position.set(MAP_PREVIEW_CONFIG.MAP_POS.left * factor, 0, 0);

			this.rightWrapper.scale.setScalar(MAP_PREVIEW_CONFIG.SIDE_SCALE * factor);
			this.rightWrapper.position.set(MAP_PREVIEW_CONFIG.MAP_POS.right * factor, 0, 0);
		}
	}

	private mapPreview(delta: number) {
		const	lerpFactor = MAP_PREVIEW_CONFIG.MAP_CAROUSEL_LERP * delta;
		const	factor = this.getResponsiveFactor();
		const	targetSideScale = MAP_PREVIEW_CONFIG.SIDE_SCALE * factor;
		const	targetCenterScale = MAP_PREVIEW_CONFIG.SELECTED_SCALE * factor;

		if (this.gameStore.appState === "MAP_PREVIEW_NEXT") {
			this.leftWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.farLeft  * factor, 0, 0), lerpFactor);
			this.mapWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.left * factor, 0, 0), lerpFactor);
			this.mapWrapper.scale.lerp(new THREE.Vector3(targetSideScale, targetSideScale, targetSideScale), lerpFactor);
			this.rightWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.center, 0, 0), lerpFactor);
			this.rightWrapper.scale.lerp(new THREE.Vector3(targetCenterScale, targetCenterScale, targetCenterScale), lerpFactor);
			this.farRightWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.right * factor, 0, 0), lerpFactor);

			this.rotationToZero(lerpFactor);
			if (this.rightWrapper.position.x <= 0.1) {
				this.gameStore.selectedMapId = this.gameStore.nextMapId;
				this.gameStore.appState = "MAP_PREVIEW";
			}
		}
		else if (this.gameStore.appState === "MAP_PREVIEW_PREV") {
			this.leftWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.center, 0, 0), lerpFactor);
			this.leftWrapper.scale.lerp(new THREE.Vector3(targetCenterScale, targetCenterScale, targetCenterScale), lerpFactor);
			this.mapWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.right * factor, 0, 0), lerpFactor);
			this.mapWrapper.scale.lerp(new THREE.Vector3(targetSideScale, targetSideScale, targetSideScale), lerpFactor);
			this.rightWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.farRight * factor, 0, 0), lerpFactor);
			this.farLeftWrapper.position.lerp(new THREE.Vector3(MAP_PREVIEW_CONFIG.MAP_POS.left * factor, 0, 0), lerpFactor);

			this.rotationToZero(lerpFactor);
			if (this.leftWrapper.position.x >= -0.1) {
				this.gameStore.selectedMapId = this.gameStore.prevMapId;
				this.gameStore.appState = "MAP_PREVIEW";
			}
		}

		this.mapWrapper.rotation.y -= MAP_PREVIEW_CONFIG.MAP_ROTATION * delta;

		this.camera.position.copy(ENGINE_CONFIG.CAMERA_POS);
		this.lookTarget.set(0, 0, 0);
		this.camera.lookAt(this.lookTarget);
	}

	private transitionToGame(delta: number) {
		this.leftWrapper.visible = false;
		this.rightWrapper.visible = false;

		const lerpFactor = MAP_PREVIEW_CONFIG.GAME_TRANSITION_LERP * delta;

		this.rotationToZero(lerpFactor);

		this.mapWrapper.scale.lerp(new THREE.Vector3(1, 1, 1), lerpFactor);
		this.mapContainer.position.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);

		if (this.pacmanSpawn) {
			const targetCamPos = new THREE.Vector3(
				this.pacmanSpawn.x,
				ENGINE_CONFIG.CAMERA_POS.y,
				this.pacmanSpawn.z + ENGINE_CONFIG.CAMERA_POS.z
			);

			this.camera.position.lerp(targetCamPos, lerpFactor);
			this.lookTarget.lerp(this.pacmanSpawn, lerpFactor);
			this.camera.lookAt(this.lookTarget);
		}

		if (Math.abs(this.mapWrapper.rotation.y) < 0.01 && this.mapWrapper.scale.x > 0.99) {
			this.mapWrapper.rotation.y = 0;
			this.mapWrapper.scale.set(1, 1, 1);
			this.mapContainer.position.set(0, 0, 0);

			if (this.map)
				this.gameStore.setTotalPellets(this.map.getTotalPellets());
			this.gameStore.appState = "PLAYING";
		}
	}

	//Calculates fastest rotation route to 0
	private rotationToZero(lerpFactor: number) {
		let currentRot = this.mapWrapper.rotation.y % (Math.PI * 2);
		if (currentRot < -Math.PI) currentRot += Math.PI * 2;
		if (currentRot > Math.PI) currentRot -= Math.PI *2;
		this.mapWrapper.rotation.y = currentRot;

		this.mapWrapper.rotation.y = THREE.MathUtils.lerp(this.mapWrapper.rotation.y, 0, lerpFactor);
	}

	private	updateClippingBoxes() {
		this.updateSingleBox(this.mapPlanes, this.mapWrapper);
		this.updateSingleBox(this.leftPlanes, this.leftWrapper);
		this.updateSingleBox(this.rightPlanes, this.rightWrapper);
		this.updateSingleBox(this.farLeftPlanes, this.farLeftWrapper);
		this.updateSingleBox(this.farRightPlanes, this.farRightWrapper);
	}

	private	updateSingleBox(planes: THREE.Plane[], wrapper: ClippingGroup) {
		if (!wrapper.visible) return;

		const	currentLimit = this.baseClipLimit * wrapper.scale.x;
		const	centerX = wrapper.position.x + this.lookTarget.x;
		const	centerZ = wrapper.position.z + this.lookTarget.z;

		planes[0].constant = centerX + currentLimit;
		planes[1].constant = currentLimit - centerX;
		planes[2].constant = centerZ + currentLimit;
		planes[3].constant = currentLimit - centerZ;	
	}
	
	private startLoop() {
		const animate = () => {
			requestAnimationFrame(animate);
			this.timer.update();
			const delta = Math.min(this.timer.getDelta(), 0.033);

			if (this.gameStore.appState === "MAP_PREVIEW" ||
				this.gameStore.appState === "MAP_PREVIEW_NEXT" ||
				this.gameStore.appState === "MAP_PREVIEW_PREV"
			)
				this.mapPreview(delta);

			if (this.gameStore.appState === "TRANSITIONING")
				this.transitionToGame(delta);

			if (this.gameStore.appState === "RESPAWN") {
				this.respawnTimer -= delta;

				if (this.respawnTimer <= 0) {
					this.resetPositions();
					this.gameStore.appState = "PLAYING";
				}
			}
			this.updateClippingBoxes();

			if (!this.map || this.gameStore.appState !== "PLAYING") {
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
					const lerpFactor = ENGINE_CONFIG.CAMERA_LERP * delta;

					this.camera.position.x += (pPos.x - this.camera.position.x) * lerpFactor;
					this.camera.position.z += ((pPos.z + ENGINE_CONFIG.CAMERA_POS.z) - this.camera.position.z) * lerpFactor;
					this.camera.position.y = ENGINE_CONFIG.CAMERA_POS.y;

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