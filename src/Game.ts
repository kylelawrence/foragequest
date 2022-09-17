const output = document.getElementById('gamepad')!;
const stickDeadZone = 0.2;

function gridPos(i: number) {
	return i * 32 + 16;
}

// Input readings indexes
const left = 0;
const right = 1;
const up = 2;
const down = 3;
const shift = 4;
const space = 5;

export default class Game extends Phaser.Scene {
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private character!: Phaser.Physics.Arcade.Group;
	private charDirectionRight: boolean; // Currently facing right?
	private activeForagable: Phaser.Types.Physics.Arcade.GameObjectWithBody | null = null;

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.cursors = this.input.keyboard.createCursorKeys();
	}

	collideForagable: ArcadePhysicsCallback = (a, b) => {
		this.activeForagable = a.name.startsWith('fora') ? a : b;
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
			this.physics.add.sprite(gridPos(7), gridPos(4), 'forage', 0),
			this.physics.add.sprite(gridPos(17), gridPos(1), 'forage', 1),
			this.physics.add.sprite(gridPos(1), gridPos(18), 'forage', 2),
			this.physics.add.sprite(gridPos(15), gridPos(17), 'forage', 3),
		];
		foragables.forEach((sprite, i) => {
			sprite.setName(`foragable-${i}`);
			sprite.setImmovable(true);
			sprite.setScale(2);
		});

		// Create character from spritesheet
		const charParts = ['char', 'hair', 'shirt', 'pants', 'shoes'];
		this.character = this.physics.add.group(
			charParts.map((part) => {
				const sprite = this.physics.add.sprite(
					gridPos(7),
					gridPos(7),
					'char',
					`${part}-walk-right-1`
				);
				sprite.setName(`char-${part}`);
				sprite.setScale(2);

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
				sprite.setCollideWorldBounds(true);

				return sprite;
			})
		);

		// Collide player with map and foragables
		this.physics.add.collider(this.character, collideLayer);
		this.physics.add.collider(this.character, foragables, this.collideForagable);

		// Follow camera to player and restrict to map bounds
		this.cameras.main.setBounds(0, 0, 640, 630, true);
		this.cameras.main.startFollow(this.character.getChildren()[0], true);

		// Show debug grid
		// this.add.grid(32, 32, 2048, 2048, 32, 32, undefined, undefined, 300, 0.2);
	}

	update(/*time: number, delta: number*/) {
		if (!this.cursors || !this.character) {
			return;
		}

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
		const inAHurry = keysDown[shift] || padDirections[shift];
		const speed = inAHurry ? 200 : 150;

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

		// Collect foragables
		if ((keysDown[space] || padDirections[space]) && this.activeForagable) {
			const foragable = this.activeForagable;
			this.activeForagable = null;
			foragable.destroy(true);
		}

		// If we're to be moving
		const direction = this.charDirectionRight ? 'right' : 'left';
		if (xVelocity !== 0 || yVelocity !== 0) {
			// Play the correct walking animation
			this.character.playAnimation(`${inAHurry ? 'run' : 'walk'}-${direction}`, '1');
		} else {
			// Otherwise reset to standing the direction we were moving
			this.character.playAnimation(`stand-${direction}`);
		}

		// Set velocity
		this.character.setVelocity(xVelocity, yVelocity);
	}
}
