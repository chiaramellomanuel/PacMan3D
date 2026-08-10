import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DIRECTIONS, GHOST_STATE, GHOST_PERSONALITY, MAP_INDEX,  type GhostState, type GhostPersonality } from './Constants';
import { Map } from './Map';

export class Ghost {
	public mesh: THREE.Group | null = null;
	public state: GhostState = GHOST_STATE.IN_BOX;
	private personality: GhostPersonality;
	private scene: THREE.Group;
	private exitTarget: THREE.Vector3 | null = null;
	private currentDir = DIRECTIONS.UP;
	private normalSpeed = 8;
	private eatenSpeed = 20;
	public originalColor: number;
	private flashInterval: any = null;

	constructor(scene: THREE.Group, color: number, startPos: { x: number, z: number }, personality: GhostPersonality, spawnDir: {x: number, z: number, angle: number}) {
		this.scene = scene;
		this.personality = personality;
		this.originalColor = color;

		this.currentDir = spawnDir;

		this.loadModel(color, startPos);
	}

	private loadModel(color: number, startPos: {x: number, z: number}) {
		const loader = new GLTFLoader();
		loader.load(`${import.meta.env.BASE_URL}models/Ghost.glb`, (gltf) => {
			this.mesh = gltf.scene;

			this.mesh.traverse((child) => {
				if ((child as THREE.Mesh).isMesh) {
					const mesh = child as THREE.Mesh;
					if (mesh.name.toLowerCase().includes('body')) {
						mesh.material = new THREE.MeshStandardMaterial({
							color: color,
							roughness: 0.3
						});
					}
				}
			});

			this.mesh.rotation.y = this.currentDir.angle;
			this.mesh.position.set(startPos.x, 0, startPos.z);
			this.scene.add(this.mesh);
		})
	}

	public update(delta: number, map: Map, target?: THREE.Vector3) {
		if (!this.mesh) return;

		const currentSpeed = (this.state === GHOST_STATE.EATEN) ? this.eatenSpeed : this.normalSpeed;
		const moveStep = currentSpeed * Math.min(delta, 0.1);
		const posX = this.mesh.position.x;
		const posZ = this.mesh.position.z;
		const centerX = Math.round(posX / map.tileSize) * map.tileSize;
		const centerZ = Math.round(posZ / map.tileSize) * map.tileSize;
		const distToCenter = Math.sqrt(Math.pow(posX - centerX, 2) + Math.pow(posZ - centerZ, 2));

		if (distToCenter < moveStep) {
			this.mesh.position.set(centerX, this.mesh.position.y, centerZ);
			const currentTile = map.getTileAt(centerX, centerZ);

			if (this.state === GHOST_STATE.EATEN && this.exitTarget) {
				if (currentTile === MAP_INDEX.GHOST_BOX || currentTile === MAP_INDEX.GHOST_SPAWN) {
					this.state = GHOST_STATE.IN_BOX;
					this.updateAppearance(this.originalColor);
					setTimeout(() => {
						this.startExit(this.exitTarget!);
					}, 2000);
				}
				else
					this.pickDirection(map, this.exitTarget);
			}

			else if (this.state === GHOST_STATE.EXITING && this.exitTarget) {
				if (currentTile !== MAP_INDEX.GHOST_BOX && currentTile !== MAP_INDEX.GHOST_SPAWN && currentTile !== MAP_INDEX.GHOST_DOOR)
					this.state = GHOST_STATE.HUNTING;
				else
					this.pickDirection(map, this.exitTarget);
			}

			else {
				const nextX = centerX + this.currentDir.x * map.tileSize;
				const nextZ = centerZ + this.currentDir.z * map.tileSize;

				const hitWall = map.isWall(nextX, nextZ, true);
				const isIntersection = this.isAtIntersection(map, centerX, centerZ);

				if (hitWall || isIntersection) {
					const activeTarget = (this.state === GHOST_STATE.HUNTING) ? target : undefined;
					this.pickDirection(map, activeTarget);
				}
			}
		}

		this.mesh.position.x += this.currentDir.x * moveStep;
		this.mesh.position.z += this.currentDir.z * moveStep;
		this.mesh.rotation.y = this.currentDir.angle;
	}

	public startExit(doorPos: THREE.Vector3) {
		this.exitTarget = doorPos;
		this.state = GHOST_STATE.EXITING;
	}

	private isAtIntersection(map: Map, cx: number, cz: number): boolean {
		if (this.currentDir.x !== 0) {
			const upFree = !map.isWall(cx, cz - map.tileSize, true);
			const downFree = !map.isWall(cx, cz + map.tileSize, true);
			return upFree || downFree;
		}

		if (this.currentDir.z !== 0) {
			const leftFree = !map.isWall(cx - map.tileSize, cz, true);
			const rightFree = !map.isWall(cx + map.tileSize, cz, true);
			return leftFree || rightFree;
		}

		return false;
	}


	private pickDirection(map: Map, target?: THREE.Vector3) {
		if (!this.mesh) return;

		const possibleDirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
		const curX = Math.round(this.mesh.position.x / map.tileSize) * map.tileSize;
		const curZ = Math.round(this.mesh.position.z / map.tileSize) * map.tileSize;

		const validDirs = possibleDirs.filter(dir => {
			const testX = curX + dir.x * map.tileSize;
			const testZ = curZ + dir.z * map.tileSize;
			const cell = map.getTileAt(testX, testZ);

			const isOpposite = (dir.x === -this.currentDir.x && dir.x !== 0) || 
							(dir.z === -this.currentDir.z && dir.z !== 0);

			if (this.state === GHOST_STATE.IN_BOX)
				return (cell === MAP_INDEX.GHOST_BOX || cell === MAP_INDEX.GHOST_SPAWN) && !isOpposite;
			
			if (this.state === GHOST_STATE.EXITING || this.state === GHOST_STATE.EATEN)
				return cell !== MAP_INDEX.WALL && !isOpposite;
			
			return (cell === MAP_INDEX.EMPTY || cell === MAP_INDEX.PELLET || cell === MAP_INDEX.POWER_PELLET || cell === MAP_INDEX.PACMAN_SPAWN) && !isOpposite;
		});

		if (validDirs.length === 0) {
			this.currentDir = {
				x: -this.currentDir.x,
				z: -this.currentDir.z,
				angle: this.currentDir.angle + Math.PI
			};
			return;
		}

		const shouldChase = (this.personality === GHOST_PERSONALITY.CHASER && this.state === GHOST_STATE.HUNTING) ||
							(this.state === GHOST_STATE.EXITING || this.state === GHOST_STATE.EATEN);
		const isFrightened = this.state === GHOST_STATE.FRIGHTENED;

		if ((shouldChase || isFrightened) && target) {
			let bestDir = validDirs[0];
			let targetDist = isFrightened ? 0 : Infinity;

			validDirs.forEach(dir => {
				const nextTileX = curX + dir.x * map.tileSize;
				const nextTileZ = curZ + dir.z * map.tileSize;

				const dist = Math.sqrt(
					Math.pow(nextTileX - target.x, 2) +
					Math.pow(nextTileZ - target.z, 2)
				);

				if (isFrightened) {
					if (dist > targetDist) {
						targetDist = dist;
						bestDir = dir;
					}
				}
				else {
					if (dist < targetDist) {
						targetDist = dist;
						bestDir = dir;
					}
				}
			});
			this.currentDir = bestDir;
		} 
		else
			this.currentDir = validDirs[Math.floor(Math.random() * validDirs.length)];
	}

	public setFrightened() {
		if (this.state === GHOST_STATE.IN_BOX || this.state === GHOST_STATE.EXITING) return;

		this.state = GHOST_STATE.FRIGHTENED;
		this.updateAppearance(0x0000ff);
	}

	public setFlashing() {
		if (this.state !== GHOST_STATE.FRIGHTENED) return;

		let isWhite = false;
		this.flashInterval = setInterval(() => {
			isWhite = !isWhite;
			this.updateAppearance(isWhite ? 0xffffff : 0x0000ff);
		}, 200);
	}

	public setNormal() {
		if (this.state !== GHOST_STATE.FRIGHTENED) return;

		this.stopFlashing();
		this.state = GHOST_STATE.HUNTING;
		this.updateAppearance(this.originalColor);
	}

	public beEaten(doorPos: THREE.Vector3) {
		this.stopFlashing();
		this.exitTarget = doorPos;
		this.state = GHOST_STATE.EATEN;
		this.updateAppearance(null);
	}

	public stopFlashing() {
		if (this.flashInterval) {
			clearInterval(this.flashInterval);
			this.flashInterval = null;
		}
	}
	public updateAppearance(color: number | null) {
		this.mesh?.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				const mesh = child as THREE.Mesh;

				if (mesh.name.toLowerCase().includes('body')) {
					const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

					materials.forEach((mat) => {
						const material = mat as THREE.Material;

						if (color == null)
							material.visible = false;
						else {
							material.visible = true;
							if ('color' in material) {
								(material as any).color.set(color);
							}
						}
					});
				}
			}
		});
	}
}