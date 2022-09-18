const output = document.getElementById('gamepad')!;

const cellSize = 32;
const initialPlayerPos = { x: 3, y: 3 };
const initialForagableDistance = 5;
const initialForagableCount = 20;

// Input configuration
type AcceptedKeys = 'W' | 'A' | 'S' | 'D' | 'SHIFT' | 'TAB' | 'SPACE';
type KeyConfig = Record<AcceptedKeys, { isDown: boolean }>;

const left = 0,
	right = 1,
	up = 2,
	down = 3,
	shift = 4,
	space = 5,
	tab = 6;
const stickDeadZone = 0.2;

// Parts of the character
const charParts = ['char', 'hair', 'shirt', 'pants', 'shoes'];

function gridPos(i: number) {
	return i * cellSize + 16;
}

export default class Game extends Phaser.Scene {
	private character!: Phaser.Physics.Arcade.Group;
	private keys!: KeyConfig;

	private charDirectionRight: boolean; // Currently facing right?
	private activeForagable: Phaser.Types.Physics.Arcade.GameObjectWithBody | null = null;

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.keys = <KeyConfig>this.input.keyboard.addKeys('W,A,S,D,SHIFT,TAB,SPACE');
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

			if (layer.layer.name.startsWith('oc')) {
				layer.setDepth(3);
			}

			return layer;
		});

		const signsLayer = map.getObjectLayer('sign');
		const signs = this.add.group(
			signsLayer.objects.map((o) => {
				return this.physics.add.staticImage(o.x! + 16, o.y! - 16, 'tiles', o.gid! - 1);
			})
		);

		const takenPositions = new Set();
		const foragables: Phaser.Types.Physics.Arcade.SpriteWithStaticBody[] = [];
		for (var i = 0; i < initialForagableCount; i++) {
			// Find a random position on the map that isn't on the collide layer or near the player
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
				takenPositions.has(positionString) ||
				distanceToChar < initialForagableDistance
			);

			takenPositions.add(positionString);
			const foragable = this.physics.add.staticSprite(
				gridPos(position.x),
				gridPos(position.y),
				'forage',
				Math.round(Math.random() * 5)
			);
			foragable.setName(`foragable-${i}`);
			foragable.setScale(2);
			foragable.body.setSize(22, 22, false);
			foragable.body.setOffset(-2, -2);

			foragables.push(foragable);
		}

		// Create character from spritesheet
		this.character = this.physics.add.group(
			charParts.map((part) => {
				const sprite = this.physics.add.sprite(
					gridPos(initialPlayerPos.x),
					gridPos(initialPlayerPos.y),
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
				sprite.body.setSize(sprite.width / 5, sprite.height / 6, false);
				sprite.body.setOffset(13, 27);
				sprite.setCollideWorldBounds(true);

				return sprite;
			})
		);

		this.character.setDepth(1);

		// Collide player with map and foragables
		this.physics.add.collider(this.character, collideLayer);
		this.physics.add.collider(this.character, foragables, this.collideForagable);
		this.physics.add.collider(this.character, signs, this.collideSign);

		// Follow camera to player and restrict to map bounds
		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels, true);
		this.cameras.main.startFollow(this.character.getChildren()[0], true);

		// Show debug grid
		const shouldAddGrid = false;
		if (shouldAddGrid) {
			this.add.grid(
				0,
				0,
				cellSize * map.width * 2,
				cellSize * map.height * 2,
				cellSize,
				cellSize,
				undefined,
				undefined,
				300,
				0.2
			);
		}
	}

	update(/*time: number, delta: number*/) {
		if (!this.keys || !this.character) {
			return;
		}

		// Arrow keys
		const keysDown = [
			this.keys.A?.isDown,
			this.keys.D?.isDown,
			this.keys.W?.isDown,
			this.keys.S?.isDown,
			this.keys.SHIFT?.isDown,
			this.keys.SPACE?.isDown,
			this.keys.TAB?.isDown,
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
				padDirections[tab] = pad.Y;
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
