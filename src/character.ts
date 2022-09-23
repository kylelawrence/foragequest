import { Scene } from 'phaser';
import { cellSize, charParts, gridPos, initialPlayerPos, spriteOffset } from './utils';

export type Character = Phaser.Physics.Arcade.Group;

export function createCharacter(scene: Scene) {
	// Create character from spritesheet
	return scene.physics.add.group(
		charParts.map((part) => {
			const sprite = scene.physics.add
				.sprite(
					gridPos(initialPlayerPos.x) + spriteOffset,
					gridPos(initialPlayerPos.y) + spriteOffset,
					'char',
					`${part}-walk-right-1`
				)
				.setName(`char-${part}`)
				.setScale(2)
				.setOrigin(0.5, 1)
				.setCollideWorldBounds(true)
				.setOffset(13, 27)
				.setDepth(1);
			sprite.body.setSize(cellSize / 5, cellSize / 6, false);

			// Make animations for each direction
			['right', 'left'].forEach((direction) => {
				// Standing still
				sprite.anims.create({
					key: `stand-${direction}`,
					frames: [{ key: 'char', frame: `${part}-walk-${direction}-1` }],
				});

				// Walk and run
				[
					{ prefix: 'walk', rate: 10 },
					{ prefix: 'run', rate: 15 },
				].forEach(({ prefix, rate }) => {
					sprite.anims.create({
						key: `${prefix}-${direction}`,
						repeat: -1,
						frameRate: rate,
						frames: scene.anims.generateFrameNames('char', {
							start: 1,
							end: 8,
							prefix: `${part}-walk-${direction}-`,
						}),
					});
				});
			});

			return sprite;
		})
	);
}
