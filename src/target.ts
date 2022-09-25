import { Scene } from 'phaser';
import { cellSize, gridPos, initialPlayerPos } from './utils';

export function createTarget(scene: Scene) {
	return scene.add
		.rectangle(gridPos(3), gridPos(5), cellSize, cellSize, undefined)
		.setOrigin(0)
		.setStrokeStyle(2, 0xff0000, 0.6);
}
