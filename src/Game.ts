export default class Game extends Phaser.Scene {
	constructor() {
		super('game');
	}

	preload() {}

	create() {
		const map = this.make.tilemap({ key: 'island' });
		const tileset = map.addTilesetImage('island', 'tiles');
		map.getTileLayerNames().map((name) => map.createLayer(name, tileset));

		// const debugGraphics = this.add.graphics().setAlpha(0.7);
		// layers.forEach((layer) => {
		// 	layer.setCollisionByProperty({ collides: true });
		// 	layer.renderDebug(debugGraphics, {
		// 		tileColor: null,
		// 		collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
		// 		faceColor: new Phaser.Display.Color(40, 39, 37, 255),
		// 	});
		// 	return layer;
		// });

		const charParts = ['wr1', 'rh1', 'shr1', 'pr1', 'fr1'];
		const char = charParts.map((part) => {
			const sprite = this.add.sprite(256, 256, 'char', part);
			sprite.scale = 2;
			return sprite;
		});
	}
}
