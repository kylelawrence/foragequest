export const cellSize = 32;
export const initialPlayerPos = { x: 3, y: 4 };
export const initialForagableDistance = 5;
export const initialForagableCount = 20;
export const spriteOffset = 16;
export const questSize = 5;

// Input configuration
export type AcceptedKeys = 'W' | 'A' | 'S' | 'D' | 'SHIFT';
export type KeyConfig = Record<AcceptedKeys, { isDown: boolean }>;

export const stickDeadZone = 0.3;
export const key = {
	left: 0,
	right: 1,
	up: 2,
	down: 3,
	shift: 4,
};

export const button = {
	a: 0,
	b: 1,
	x: 2,
	y: 3,
	l1: 4,
	r1: 5,
	l2: 6,
	r2: 7,
	share: 8,
	menu: 9,
	l3: 10,
	r3: 11,
	up: 12,
	down: 13,
	left: 14,
	right: 15,
};

// Parts of the character
export const charParts = ['char', 'hair', 'shirt', 'pants', 'shoes'];

export function gridPos(i: number) {
	return i * cellSize;
}
