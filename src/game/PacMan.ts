import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Map } from './Map'
import { DIRECTIONS } from './Constants'
import { useGameStore } from '../stores/gameStore';
import { GAME_CONFIG } from './Config';


export class PacMan {
	public mesh: THREE.Group | null = null;
	private scene: THREE.Group;
	public currentDir = DIRECTIONS.NONE;
	private nextDir = DIRECTIONS.NONE;
	private gameStore = useGameStore();

	private static loadPromise: Promise<THREE.Group> | null = null;

	constructor(scene: THREE.Group, startPoint: {x: number, z: number}) {
		this.scene = scene;
		this.loadModel(startPoint);
		this.setupInput();
	}

	private async loadModel(startPoint: {x: number, z: number}) {
		if (!PacMan.loadPromise) {
			PacMan.loadPromise = new Promise((resolve) => {
				const loader = new GLTFLoader();
				loader.load(`${import.meta.env.BASE_URL}models/PacMan.glb`, (gltf) => {
					resolve(gltf.scene);
				});
			});
		}

		const baseModel = await PacMan.loadPromise;

		this.mesh = baseModel.clone();

		this.mesh.position.set(startPoint.x, 0, startPoint.z);
		this.mesh.rotation.y = 0;
		this.scene.add(this.mesh);
	}

	private handleKeyDown = (e: KeyboardEvent) => {
		if (this.gameStore.appState !== "PLAYING") return;

		switch(e.key.toLowerCase()) {
			case 'arrowup':		case 'w': this.nextDir = DIRECTIONS.UP; break;
			case 'arrowdown':	case 's': this.nextDir = DIRECTIONS.DOWN; break;
			case 'arrowleft':	case 'a': this.nextDir = DIRECTIONS.LEFT; break;
			case 'arrowright':	case 'd': this.nextDir = DIRECTIONS.RIGHT; break;
		}
		if (this.currentDir === DIRECTIONS.NONE) this.currentDir = this.nextDir;
	}

	private setupInput()
	{
		window.addEventListener('keydown', this.handleKeyDown);
	}

	public destroy() {
		window.removeEventListener('keydown', this.handleKeyDown);
		
		if (this.mesh) {
			this.scene.remove(this.mesh);
			this.mesh = null;
		}
	}

	public update(delta: number, map: Map) {
		if (!this.mesh) return;

		const moveStep = GAME_CONFIG.PACMAN_BASE_SPEED * Math.min(delta, 0.1);
		const posX = this.mesh.position.x;
		const posZ = this.mesh.position.z;

		const centerX = Math.round(posX / map.tileSize) * map.tileSize;
		const centerZ = Math.round(posZ / map.tileSize) * map.tileSize;

		const distToCenter = Math.max(Math.abs(posX - centerX), Math.abs(posZ - centerZ));
		
		if (distToCenter < moveStep) {
			this.mesh.position.set(centerX, 0, centerZ);

			const destination = map.getTeleportDestination(centerX, centerZ);
			if (destination) {
				const exitOffset = 0.5;
				this.mesh.position.set(
					destination.x + this.currentDir.x * exitOffset,
					0,
					destination.z + this.currentDir.z * exitOffset
				);
				return;
			}
			
			if (this.nextDir !== DIRECTIONS.NONE && this.nextDir !== this.currentDir) {
				const targetX = centerX + this.nextDir.x * map.tileSize;
				const targetZ = centerZ + this.nextDir.z * map.tileSize;

				if (!map.isWall(targetX, targetZ))
					this.currentDir = this.nextDir;
			}

			const nextX = centerX + this.currentDir.x * map.tileSize;
			const nextZ = centerZ + this.currentDir.z * map.tileSize;
			if (map.isWall(nextX, nextZ))
				this.currentDir = DIRECTIONS.NONE;
		}


		if (this.currentDir !== DIRECTIONS.NONE) {
				this.mesh.position.x += this.currentDir.x * moveStep;
				this.mesh.position.z += this.currentDir.z * moveStep;

				if (this.currentDir.z !== 0)
					this.mesh.position.x += (centerX - this.mesh.position.x) * 0.2;
				if (this.currentDir.x !== 0)
					this.mesh.position.z += (centerZ - this.mesh.position.z) * 0.2;

				this.mesh.rotation.y = this.currentDir.angle;
		}

		map.checkPellet(this.mesh.position.x, this.mesh.position.z);
	}
}