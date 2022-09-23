import { Scene } from 'phaser';

export function createMap(scene: Scene) {
	const map = scene.make.tilemap({ key: 'island' });
	const tileset = map.addTilesetImage('island', 'tiles');
	let collideLayer!: Phaser.Tilemaps.TilemapLayer;

	// Add all layers to the scene
	map.getTileLayerNames().map((name) => {
		const layer = map.createLayer(name, tileset);

		// Find the collision layer
		if (layer.layer.name === 'Collision') {
			collideLayer = layer.setCollisionBetween(0, 2000).setVisible(false);
		}

		if (layer.layer.name.startsWith('oc')) {
			layer.setDepth(3);
		}

		return layer;
	});

	// Generate sign objects
	const signsLayer = map.getObjectLayer('sign');
	signsLayer.objects.map((o) =>
		scene.add.image(o.x! + 16, o.y! - 16, 'tiles', o.gid! - 1).setName('sign')
	);

	return {
		map,
		collideLayer,
	};
}
