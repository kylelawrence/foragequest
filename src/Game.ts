import { LEFT } from 'phaser';

const output = document.getElementById('gamepad')!;

const cellSize = 32;
const initialPlayerPos = { x: 3, y: 4 };
const initialForagableDistance = 5;
const initialForagableCount = 20;
const spriteOffset = 16;

// Input configuration
type AcceptedKeys = 'W' | 'A' | 'S' | 'D' | 'SHIFT' | 'TAB' | 'SPACE';
type KeyConfig = Record<AcceptedKeys, { isDown: boolean }>;

const stickDeadZone = 0.2;
const left = 0, // Key indexes
	right = 1,
	up = 2,
	down = 3,
	shift = 4,
	space = 5,
	tab = 6;

// Parts of the character
const charParts = ['char', 'hair', 'shirt', 'pants', 'shoes'];

function gridPos(i: number) {
	return i * cellSize;
}

export default class Game extends Phaser.Scene {
	private character!: Phaser.Physics.Arcade.Group;
	private keys!: KeyConfig;
	private target!: Phaser.GameObjects.Rectangle;
	private charDirectionRight: boolean; // Currently facing right?
	private foragables: Map<string, Phaser.Types.Physics.Arcade.SpriteWithStaticBody> = new Map();
	private targetPos: { x: number; y: number } = { x: 3, y: 5 };
	private inventory: Phaser.GameObjects.Sprite[] = [];

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.keys = <KeyConfig>this.input.keyboard.addKeys('W,A,S,D,SHIFT,TAB,SPACE');
	}

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
				collideLayer = layer.setCollisionBetween(0, 2000).setVisible(false);
			}

			if (layer.layer.name.startsWith('oc')) {
				layer.setDepth(3);
			}

			return layer;
		});

		// Generate sign objects
		const signsLayer = map.getObjectLayer('sign');
		const signs = signsLayer.objects.map((o) =>
			this.physics.add.staticImage(o.x! + 16, o.y! - 16, 'tiles', o.gid! - 1).setName('sign')
		);

		// Spawn foragables
		const takenPositions = new Set();
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
				takenPositions.has(positionString) ||
				distanceToChar < initialForagableDistance
			);

			takenPositions.add(positionString);
			const type = Math.round(Math.random() * 5);
			const foragable = this.physics.add
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

			this.foragables.set(positionString, foragable);
		}

		// Create character from spritesheet
		this.character = this.physics.add.group(
			charParts.map((part) => {
				const sprite = this.physics.add
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
					.setDepth(1);

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
				sprite.body.setSize(sprite.width / 5, sprite.height / 6, false).setOffset(13, 27);

				return sprite;
			})
		);

		// Add target rectangle
		this.target = this.add
			.rectangle(gridPos(3), gridPos(5), cellSize, cellSize, undefined)
			.setOrigin(0)
			.setStrokeStyle(2, 0xff0000, 0.6);

		// Collide player with map, foragables, and interactables
		this.physics.add.collider(this.character, collideLayer);
		this.physics.add.collider(this.character, Array.from(this.foragables.values()));

		// Follow camera to player and restrict to map bounds
		this.cameras.main
			.setBounds(0, 0, map.widthInPixels, map.heightInPixels, true)
			.startFollow(this.character.getChildren()[0], true);

		// Create inventory
		for (let i = 0; i < 6; i++) {
			this.add
				.rectangle(gridPos(i), 0, cellSize, cellSize, 0xffffff, 0.5)
				.setStrokeStyle(2, 0xffffff)
				.setOrigin(0, 0)
				.setScrollFactor(0);
		}

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
				0x0000bb,
				0.2
			);
			for (let x = 0; x < map.width; x++) {
				for (let y = 0; y < map.height; y++) {
					this.add.text(gridPos(x) - 12, gridPos(y) - 12, `${x},${y}`, {
						align: 'left',
						fontSize: '8px',
						fontFamily: 'sans-serif',
						color: '#000',
					});
				}
			}
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
		if (keysDown[space] || padDirections[space]) {
			const inventoryIndex = this.inventory.length;
			if (inventoryIndex >= 6) return;
			const targetPosString = `${this.targetPos.x},${this.targetPos.y}`;
			const foragable = this.foragables.get(targetPosString);
			if (foragable) {
				const type = foragable.getData('type');
				this.foragables.delete(targetPosString);
				foragable.destroy();

				this.inventory.push(
					this.add
						.sprite(gridPos(inventoryIndex), gridPos(0), 'forage', type)
						.setData('type', type)
						.setName(`foragable-${type}`)
						.setScale(2)
						.setOrigin(0)
						.setScrollFactor(0)
				);
			}
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

		// Move target square
		const char: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody =
			this.character.getFirstAlive();
		const charX = Math.floor(char.x / 32);
		const charY = Math.floor((char.y - 8) / 32);

		if (xVelocity < 0) {
			this.targetPos = { x: charX - 1, y: charY };
		} else if (xVelocity > 0) {
			this.targetPos = { x: charX + 1, y: charY };
		}

		if (yVelocity < 0) {
			this.targetPos = { x: charX, y: charY - 1 };
		} else if (yVelocity > 0) {
			this.targetPos = { x: charX, y: charY + 1 };
		}

		if (xVelocity || yVelocity) {
			this.target.setPosition(gridPos(this.targetPos.x), gridPos(this.targetPos.y));
		}
	}
}
