export default class Game extends Phaser.Scene {
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private character!: Phaser.Physics.Arcade.Sprite[];
	private charDirectionRight: boolean;

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.cursors = this.input.keyboard.createCursorKeys();
	}

	create() {
		const map = this.make.tilemap({ key: 'island' });
		const tileset = map.addTilesetImage('island', 'tiles');
		const layerNames = map.getTileLayerNames();
		const layers = layerNames.map((name) => {
			const layer = map.createLayer(name, tileset);
			layer.setCollisionByProperty({ collides: true });
			return layer;
		});

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

		const charParts = ['char', 'hair', 'shirt', 'pants', 'shoes'];
		this.character = charParts.map((part) => {
			const sprite = this.physics.add.sprite(256, 256, 'char', `${part}-walk-right-1`);
			sprite.scale = 2;
			['right', 'left'].forEach((direction) => {
				sprite.anims.create({
					key: `stand-${direction}`,
					frames: [{ key: 'char', frame: `${part}-walk-${direction}-1` }],
				});
				sprite.anims.create({
					key: `walk-${direction}`,
					repeat: -1,
					frameRate: 10,
					frames: [
						...this.anims.generateFrameNames('char', {
							start: 2,
							end: 8,
							prefix: `${part}-walk-${direction}-`,
						}),
						{ key: 'char', frame: `${part}-walk-${direction}-1` },
					],
				});
			});
			sprite.body.collideWorldBounds = true;
			sprite.body.setSize(sprite.width / 6, sprite.height / 6, false);
			sprite.body.setOffset(14, 26);
			layers.forEach((layer) => this.physics.add.collider(sprite, layer));

			return sprite;
		});

		this.cameras.main.setBounds(0, 0, 640, 630, true);
		this.physics.world.setBounds(0, 0, 840, 630, true, true, true, true);

		this.cameras.main.startFollow(this.character[0], true);
	}

	update(/*time: number, delta: number*/) {
		if (!this.cursors || !this.character) {
			return;
		}

		const left = 0;
		const right = 1;
		const up = 2;
		const down = 3;
		const shift = 4;
		const keysDown = [
			this.cursors.left?.isDown,
			this.cursors.right?.isDown,
			this.cursors.up?.isDown,
			this.cursors.down?.isDown,
			this.cursors.shift?.isDown,
		];

		let xVelocity = 0;
		let yVelocity = 0;

		const speed = keysDown[shift] ? 150 : 100;
		if (keysDown[left]) {
			xVelocity = -speed;
			this.charDirectionRight = false;
		} else if (keysDown[right]) {
			xVelocity = speed;
			this.charDirectionRight = true;
		}

		if (keysDown[up]) {
			yVelocity = -speed;
		} else if (keysDown[down]) {
			yVelocity = speed;
		}

		if (xVelocity !== 0 && yVelocity !== 0) {
			xVelocity *= 0.7;
			yVelocity *= 0.7;
		}

		const direction = this.charDirectionRight ? 'right' : 'left';
		if (xVelocity !== 0 || yVelocity !== 0) {
			this.character.forEach((part) => {
				part.anims.play(`walk-${direction}`, true);
			});
		} else {
			this.character.forEach((part) => {
				part.anims.play(`stand-${direction}`, true);
			});
		}

		this.character.forEach((part) => {
			part.setVelocity(xVelocity, yVelocity);
		});
	}
}
