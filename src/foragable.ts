import { Scene, Tilemaps, Types } from 'phaser';
import {
	gridPos,
	initialForagableCount,
	initialForagableDistance,
	initialPlayerPos,
	spriteOffset,
} from './utils';

export type ForagableMap = Map<string, Phaser.Types.Physics.Arcade.SpriteWithStaticBody>;

export function createForagables(
	scene: Scene,
	map: Tilemaps.Tilemap,
	collideLayer: Tilemaps.TilemapLayer
) {
	const foragables: Map<string, Types.Physics.Arcade.SpriteWithStaticBody> = new Map();
	for (let i = 0; i < initialForagableCount; i++) {
		// Find a random position on the map that isn't:
		// On the collide layer
		// On the same spot as another foragable
		// Near the player starting position
		let position;
		let positionString;
		let distanceToChar;
		do {
			position = {
				x: Math.round(Math.random() * map.width),
				y: Math.round(Math.random() * map.height),
			};
			positionString = `${position.x},${position.y}`;
			distanceToChar =
				Math.abs(initialPlayerPos.x - position.x) +
				Math.abs(initialPlayerPos.y - position.y);
		} while (
			!!collideLayer.getTileAt(position.x, position.y) ||
			foragables.has(positionString) ||
			distanceToChar < initialForagableDistance
		);

		const type = Math.round(Math.random() * 5);
		const foragable = scene.physics.add
			.staticSprite(
				gridPos(position.x) + spriteOffset,
				gridPos(position.y) + spriteOffset,
				'forage',
				type
			)
			.setData('type', type)
			.setName(`foragable-${i}`)
			.setScale(2)
			.setOffset(-2, -2)
			.setBodySize(22, 22, false);

		foragables.set(positionString, foragable);
	}

	return foragables;
}
