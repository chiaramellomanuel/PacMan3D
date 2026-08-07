import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MAP_INDEX } from './Constants'
import { useGameStore } from '../stores/gameStore'

export class Map {
	private	scene:			THREE.Group;
	public	grid:			number[][] = [];
	public	tileSize:		number = 2;
	public	offset =		{ x: 0, z: 0 };
	private doorMesh:		THREE.Mesh | null = null;
	private	wallMesh:		THREE.InstancedMesh | null = null;
	private	pelletMesh:		THREE.InstancedMesh | null = null;
	private	powerMesh:		THREE.InstancedMesh | null = null;
	private	pelletIndices:	(number | null)[][] = [];
	private	powerIndices:	(number | null)[][] = [];
	private	gameStore =		useGameStore();
	private	teleportLinks =	new globalThis.Map<string, THREE.Vector3>();
	private dummy =			new THREE.Object3D();
	public	onPowerPelletEaten: (() => void) | null = null;

	constructor(scene: THREE.Group) {
		this.scene = scene;
	}

	async load(mapUrl: string = 'map_data.json') {
		const response = await fetch(`${import.meta.env.BASE_URL}${mapUrl}`);
		const data = await response.json();

		this.grid = data.grid;
		this.tileSize = data.tileSize;
		this.offset = data.offset;

		if (data.teleports)
			this.setupTeleportLinks(data.teleports);

		await this.generate();
		await this.generateDoor();
		await this.generatePellets();
	}

	private setupTeleportLinks(teleports: any[]) {
		teleports.forEach(pair => {
			const posA = new THREE.Vector3(
				pair.point_A.col * this.tileSize + this.offset.x,
				0,
				pair.point_A.row * this.tileSize + this.offset.z
			);
			
			const posB = new THREE.Vector3(
				pair.point_B.col * this.tileSize + this.offset.x,
				0,
				pair.point_B.row * this.tileSize + this.offset.z
			);

			this.teleportLinks.set(`${posA.x},${posA.z}`, posB);
			this.teleportLinks.set(`${posB.x},${posB.z}`, posA);
		});
	}

	public getTeleportDestination(x: number, z: number): THREE.Vector3 | null {
		const key = `${Math.round(x)},${Math.round(z)}`;
		return this.teleportLinks.get(key) || null;
	}

	private async generate() {
		const loader = new GLTFLoader();

		return new Promise<void>((resolve) => {
			loader.load(`${import.meta.env.BASE_URL}models/Map_cube.glb`, (gltf) => {
				let sourceMesh: THREE.Mesh | undefined;

				gltf.scene.traverse((child) => {
					if ((child instanceof THREE.Mesh))
						sourceMesh = child;
				});
				if (!sourceMesh) return;

				const geometry = sourceMesh.geometry;
				const material = sourceMesh.material;

				const wallPositions: THREE.Vector3[] = [];
				for (let row = 0; row < this.grid.length; row++) {
					for (let col = 0; col < this.grid[row].length; col++) {
						if (this.grid[row][col] === MAP_INDEX.WALL) {
							wallPositions.push(new THREE.Vector3(
								col * this.tileSize + this.offset.x,
								0,
								row * this.tileSize + this.offset.z
							));
						}
					}
				}

				this.wallMesh = new THREE.InstancedMesh(geometry, material, wallPositions.length);
				wallPositions.forEach((pos, i) => {
					this.dummy.position.copy(pos);
					this.dummy.updateMatrix();
					this.wallMesh!.setMatrixAt(i, this.dummy.matrix);
				});

				this.scene.add(this.wallMesh);
				resolve();
			});
		});
	}

	private async generateDoor()
	{
		const doorPos = this.getDoorPosition();

		if (doorPos.x === 0 && doorPos.z === 0) return;

		const geometry = new THREE.BoxGeometry(this.tileSize, 2, 0.2);
		const material = new THREE.MeshStandardMaterial({
			color: 0xadd8e6,
			transparent: true,
			opacity: 0.6
		});

		this.doorMesh = new THREE.Mesh(geometry, material);
		this.doorMesh.position.set(doorPos.x, 1, doorPos.z);
		this.scene.add(this.doorMesh);
	}

	private async generatePellets() {
		const pelletGeometry = new THREE.SphereGeometry(0.2, 8, 8);
		const powerGeometry = new THREE.SphereGeometry(0.8, 8, 8);
		const material = new THREE.MeshStandardMaterial({
			color: 0xffcc00,
			emissive: 0xffaa00,
			emissiveIntensity: 0.5
		});

		this.pelletIndices = this.grid.map(row => row.map(() => null));
		this.powerIndices = this.grid.map(row => row.map(() => null));

		const pelletPositions:	THREE.Vector3[] = [];
		const powerPositions:	THREE.Vector3[] = [];
		let pelletIndex = 0;
		let powerIndex = 0;

		for (let row = 0; row < this.grid.length; row++) {
			for (let col = 0; col < this.grid[row].length; col++) {
				const cell = this.grid[row][col];
				
				if (cell === MAP_INDEX.PELLET) {
					pelletPositions.push(new THREE.Vector3(
						col * this.tileSize + this.offset.x,
						1,
						row * this.tileSize + this.offset.z
					));
					this.pelletIndices[row][col] = pelletIndex++;
				}
				else if (cell === MAP_INDEX.POWER_PELLET) {
					powerPositions.push(new THREE.Vector3(
						col * this.tileSize + this.offset.x,
						1,
						row * this.tileSize + this.offset.z
					));
					this.powerIndices[row][col] = powerIndex++;
				}
			}
		}

		this.gameStore.pelletsRemaining = pelletIndex + powerIndex;

		this.pelletMesh = new THREE.InstancedMesh(pelletGeometry, material, pelletPositions.length);
		this.powerMesh = new THREE.InstancedMesh(powerGeometry, material, powerPositions.length);

		pelletPositions.forEach((pos, i) => {
			this.dummy.position.copy(pos);
			this.dummy.updateMatrix();
			this.pelletMesh!.setMatrixAt(i, this.dummy.matrix);
		});

		powerPositions.forEach((pos, i) => {
			this.dummy.position.copy(pos);
			this.dummy.updateMatrix();
			this.powerMesh!.setMatrixAt(i, this.dummy.matrix);
		})

		this.scene.add(this.pelletMesh);
		this.scene.add(this.powerMesh);
	}

	
	public checkPellet(x: number, z: number) {
		const col = Math.round((x - this.offset.x) / this.tileSize);
		const row = Math.round((z - this.offset.z) / this.tileSize);
		
		if (!this.grid[row]) return;
		const cellType = this.grid[row][col];

		if (cellType === MAP_INDEX.PELLET && this.pelletMesh) {
			const instanceIndex = this.pelletIndices[row][col];
			if (instanceIndex !== null)
				this.eatPellet(row, col, instanceIndex, this.pelletMesh, 10);
		}
		else if (cellType === MAP_INDEX.POWER_PELLET && this.powerMesh) {
			const instanceIndex = this.powerIndices[row][col];
			if (instanceIndex !== null) {
				this.eatPellet(row, col, instanceIndex, this.powerMesh, 50);

				if (this.onPowerPelletEaten)
					this.onPowerPelletEaten();
			}
		}
	}

	private eatPellet(row: number, col: number, index: number, mesh: THREE.InstancedMesh, points: number) {
		this.grid[row][col] = MAP_INDEX.EMPTY;

		this.dummy.position.set(
			col * this.tileSize + this.offset.x,
			100,
			row * this.tileSize + this.offset.z
		)
		this.dummy.updateMatrix();

		mesh.setMatrixAt(index, this.dummy.matrix);
		mesh.instanceMatrix.needsUpdate = true;

		this.gameStore.pelletEaten(points);

		if (this.gameStore.isLevelClear) {
			alert("YOU WIN!");
			this.gameStore.resetGame();
			window.location.reload();
		}
	}

	public isWall(x: number, z: number, isGhost: boolean = false): boolean {
		const col = Math.round((x - this.offset.x) / this.tileSize);
		const row = Math.round((z - this.offset.z) / this.tileSize);

		if (this.grid[row] && this.grid[row][col] !== undefined) {
			const cell = this.grid[row][col];
			if (cell === MAP_INDEX.WALL) return true;

			if (!isGhost && (cell === MAP_INDEX.GHOST_BOX || cell === MAP_INDEX.GHOST_SPAWN)) return true;

			return false;
		}
		return true;
	}

	public getPacmanSpawnPoint(): THREE.Vector3 {
		for (let row = 0; row < this.grid.length; row++) {
			for (let col = 0; col < this.grid[row].length; col++) {
				if (this.grid[row][col] === MAP_INDEX.PACMAN_SPAWN)
					return new THREE.Vector3 (
				col * this.tileSize + this.offset.x,
				0,
				row * this.tileSize + this.offset.z
			);
		}
	}
		return new THREE.Vector3(1, 0, 1);
	}

	public getGhostSpawnPoints(): THREE.Vector3[] {
		const points: { x: number, z: number }[] = [];

		for (let row = 0; row < this.grid.length; row++) {
			for (let col = 0; col < this.grid[row].length; col++) {
				if (this.grid[row][col] === MAP_INDEX.GHOST_BOX) {
					points.push({
						x: col * this.tileSize + this.offset.x,
						z: row * this.tileSize + this.offset.z
					});
				}
			}
		}

		points.sort((a, b) => {
			if (a.z !== b.z) 
				return a.z - b.z;
			return a.x - b.x;
		});

		return points.map(p => new THREE.Vector3(p.x, 0.5, p.z));
	}

	public getDoorPosition(): THREE.Vector3 {
		for (let row = 0; row < this.grid.length; row++) {
			for (let col = 0; col < this.grid[row].length; col++) {
				if (this.grid[row][col] === MAP_INDEX.GHOST_DOOR) {
					return new THREE.Vector3(
						col * this.tileSize + this.offset.x,
						0,
						row * this.tileSize + this.offset.z
					);
				}
			}
		}
		return new THREE.Vector3(0, 0, 0);
	}

	public getTileAt(x: number, z: number): number {
		const col = Math.round((x - this.offset.x) / this.tileSize);
		const row = Math.round((z - this.offset.z) / this.tileSize);
		return (this.grid[row] && this.grid[row][col] !== undefined) ? this.grid[row][col] : 1;
	}
}