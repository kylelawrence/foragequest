import { Scene } from 'phaser';
import { cellSize, gridPos, questSize } from './utils';

export function createInventory(scene: Scene) {
	const inventory = scene.add.group();
	// Create inventory
	for (let i = 0; i < questSize; i++) {
		inventory.add(
			scene.add
				.rectangle(gridPos(i + 7) - 5, gridPos(12) + 10, cellSize, cellSize, 0xffffff, 0.5)
				.setStrokeStyle(2, 0xffffff)
				.setOrigin(0, 0)
				.setScrollFactor(0)
		);
	}
	inventory.setVisible(false);
	return inventory;
}
