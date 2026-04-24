export const DIRECTIONS = {
	UP:		{ x: 0, z: -1, angle: Math.PI / 2 },
	DOWN:	{ x: 0, z: 1, angle: -Math.PI / 2 },
	LEFT:	{ x: -1, z: 0, angle: Math.PI },
	RIGHT:	{ x: 1, z: 0, angle: 0},
	NONE:	{ x: 0, z: 0, angle: 0 }
};

export const GHOST_STATE = {
	IN_BOX:		'IN_BOX',
	EXITING:	'EXITING',
	HUNTING:	'HUNTING',
	FRIGHTENED:	'FRIGHTENED',
	EATEN:		'EATEN'
} as const;

export type GhostState = typeof GHOST_STATE[keyof typeof GHOST_STATE];

export const GHOST_PERSONALITY = {
	CHASER: 'CHASER',
	RANDOM: 'RANDOM'
} as const;

export type GhostPersonality = typeof GHOST_PERSONALITY[keyof typeof GHOST_PERSONALITY];

export const MAP_INDEX = {
	EMPTY:			0,
	WALL:			1,
	PELLET:			2,
	PACMAN_SPAWN:	3,
	GHOST_BOX:		4,
	GHOST_SPAWN:	5,
	GHOST_DOOR:		6,
	POWER_PELLET:	7
}