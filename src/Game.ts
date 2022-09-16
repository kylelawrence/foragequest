const output = document.getElementById('gamepad')!;
const stickDeadZone = 0.2;

function pos(i: number) {
	return i * 32 + 16;
}

export default class Game extends Phaser.Scene {
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private character!: Phaser.Physics.Arcade.Sprite[];
	private charDirectionRight: boolean; // Currently facing right?
	private activeForagable: Phaser.Types.Physics.Arcade.GameObjectWithBody | null = null;

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.cursors = this.input.keyboard.createCursorKeys();
	}

	collideForagable: ArcadePhysicsCallback = (_, foragable) => {
		this.activeForagable = foragable;
	};

	create() {
		// Create the tileset
		const map = this.make.tilemap({ key: 'island' });
		const tileset = map.addTilesetImage('island', 'tiles');
		let collideLayer!: Phaser.Tilemaps.TilemapLayer;

		// Add all layers to the scene
		const layers = map.getTileLayerNames().map((name) => {
			const layer = map.createLayer(name, tileset);
			// Find the collision layer
			if (layer.layer.name === 'Collision') {
				collideLayer = layer.setCollisionBetween(0, 2000);
				layer.setVisible(false);
			}
			return layer;
		});

		const foragables = [
			this.physics.add.sprite(pos(7), pos(4), 'forage', 0),
			this.physics.add.sprite(pos(17), pos(1), 'forage', 1),
			this.physics.add.sprite(pos(1), pos(18), 'forage', 2),
			this.physics.add.sprite(pos(15), pos(17), 'forage', 3),
		];
		foragables.forEach((f) => {
			f.setImmovable(true);
			f.setScale(2);
		});

		// Create character from spritesheet
		const charParts = ['char', 'hair', 'shirt', 'pants', 'shoes'];
		this.character = charParts.map((part) => {
			const sprite = this.physics.add.sprite(
				256 - 16,
				256 - 16,
				'char',
				`${part}-walk-right-1`
			);
			sprite.scale = 2;

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
						frames: this.anims.generateFrameNames('char', {
							start: 1,
							end: 8,
							prefix: `${part}-walk-${direction}-`,
						}),
					});
				});
			});

			// Adjust the effective size of the sprite
			sprite.body.setSize(sprite.width / 6, sprite.height / 6, false);
			sprite.body.setOffset(14, 26);

			return sprite;
		});

		const char = this.character[0];
		char.setCollideWorldBounds(true);
		this.physics.add.collider(char, collideLayer);
		this.physics.add.collider(char, foragables, this.collideForagable);

		// this.add.grid(32, 32, 2048, 2048, 32, 32, undefined, undefined, 300, 0.2);

		// Follow camera to player and restrict to map bounds
		this.physics.world.setBounds(0, 0, 840, 630, true, true, true, true);
		this.cameras.main.setBounds(0, 0, 640, 630, true);
		this.cameras.main.startFollow(char, true);
	}

	update(/*time: number, delta: number*/) {
		if (!this.cursors || !this.character) {
			return;
		}

		// Input readings indexes
		const left = 0;
		const right = 1;
		const up = 2;
		const down = 3;
		const shift = 4;
		const space = 5;

		// Arrow keys
		const keysDown = [
			this.cursors.left?.isDown,
			this.cursors.right?.isDown,
			this.cursors.up?.isDown,
			this.cursors.down?.isDown,
			this.cursors.shift?.isDown,
			this.cursors.space?.isDown,
		];

		// Gamepad
		const padDirections = [false, false, false, false, false, false];
		if (this.input.gamepad.total) {
			const pad = this.input.gamepad.gamepads.find((pad) => !!pad);
			if (pad) {
				padDirections[left] = pad.leftStick.x < -stickDeadZone;
				padDirections[right] = pad.leftStick.x > stickDeadZone;
				padDirections[up] = pad.leftStick.y < -stickDeadZone;
				padDirections[down] = pad.leftStick.y > stickDeadZone;
				padDirections[shift] = pad.R2 > 0;
				padDirections[space] = pad.A;
			}
		}

		// Start with zero velocity
		let xVelocity = 0;
		let yVelocity = 0;

		// If were in a hurry, run 50% faster
		const hurry = keysDown[shift] || padDirections[shift];
		const speed = hurry ? 150 : 100;

		// Left/right movement
		if (keysDown[left] || padDirections[left]) {
			xVelocity = -speed;
			this.charDirectionRight = false;
		} else if (keysDown[right] || padDirections[right]) {
			xVelocity = speed;
			this.charDirectionRight = true;
		}

		// Up/down movement
		if (keysDown[up] || padDirections[up]) {
			yVelocity = -speed;
		} else if (keysDown[down] || padDirections[down]) {
			yVelocity = speed;
		}

		// Slow down diagonal movement to mimic speed in a circle
		if (xVelocity !== 0 && yVelocity !== 0) {
			xVelocity *= 0.7;
			yVelocity *= 0.7;
		}

		if ((keysDown[space] || padDirections[space]) && this.activeForagable) {
			const foragable = this.activeForagable;
			this.activeForagable = null;
			foragable.destroy(true);
		}

		// If we're moving
		const direction = this.charDirectionRight ? 'right' : 'left';
		if (xVelocity !== 0 || yVelocity !== 0) {
			// Play the correct walking animation
			this.character.forEach((part) => {
				const currentFrame = part.anims.currentFrame.index;
				part.anims.play(
					{
						key: `${hurry ? 'run' : 'walk'}-${direction}`,
						startFrame: currentFrame < 8 ? currentFrame : 1,
					},
					true
				);
			});
		} else {
			// Otherwise reset to standing the direction we were moving
			this.character.forEach((part) => {
				part.anims.play(`stand-${direction}`, true);
			});
		}

		const char = this.character[0];
		char.setVelocity(xVelocity, yVelocity);
		this.character.forEach((part, i) => {
			if (i === 0) return;
			part.setX(char.x);
			part.setY(char.y);
		});
	}
}
