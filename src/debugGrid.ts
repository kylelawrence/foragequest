import { Scene } from 'phaser';
import { cellSize, gridPos } from './utils';

export function addDebugGrid(scene: Scene, width: number, height: number) {
	scene.add.grid(
		0,
		0,
		cellSize * width * 2,
		cellSize * height * 2,
		cellSize,
		cellSize,
		undefined,
		undefined,
		0x0000bb,
		0.2
	);
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			scene.add.text(gridPos(x), gridPos(y), `${x},${y}`, {
				align: 'left',
				fontSize: '8px',
				fontFamily: 'sans-serif',
				color: '#000',
			});
		}
	}
}
