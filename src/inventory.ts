import { Scene } from 'phaser';
import { cellSize, gridPos } from './utils';

export function createInventory(scene: Scene) {
	// Create inventory
	for (let i = 0; i < 6; i++) {
		scene.add
			.rectangle(gridPos(i), 0, cellSize, cellSize, 0xffffff, 0.5)
			.setStrokeStyle(2, 0xffffff)
			.setOrigin(0, 0)
			.setScrollFactor(0);
	}
}
