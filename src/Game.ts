import { Character, CharPart, createCharacter } from './character';
import { createDebugGrid } from './debugGrid';
import { createForagables, ForagableMap } from './foragable';
import { createInventory } from './inventory';
import { createMap } from './map';
import { createTarget } from './target';
import { button, gridPos, key, KeyConfig, stickDeadZone } from './utils';

const output = document.getElementById('gamepad')!;

export default class Game extends Phaser.Scene {
	private character!: Character;
	private charDirectionRight: boolean; // Currently facing right?
	private inventory: Phaser.GameObjects.Sprite[] = [];
	private target!: Phaser.GameObjects.Rectangle;
	private targetPos: { x: number; y: number } = { x: 3, y: 5 };
	private foragables: ForagableMap = new Map();
	private keys!: KeyConfig;

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.keys = <KeyConfig>this.input.keyboard.addKeys('W,A,S,D,SHIFT,TAB,SPACE');
	}

	create() {
		const { map, collideLayer } = createMap(this);

		this.foragables = createForagables(this, map, collideLayer);
		this.character = createCharacter(this);
		this.target = createTarget(this);
		createInventory(this);

		// createDebugGrid(this, map.width, map.height);

		// Collide player with map, foragables, and interactables
		this.physics.add.collider(this.character, collideLayer);
		this.physics.add.collider(this.character, Array.from(this.foragables.values()));

		// Follow camera to player and restrict to map bounds
		this.cameras.main
			.setBounds(0, 0, map.widthInPixels, map.heightInPixels, true)
			.startFollow(this.character.getChildren()[0], true);

		// Foragable collection on space / A
		this.input.keyboard.on('keydown-SPACE', () => {
			this.collectForagable();
		});

		this.input.gamepad.on('down', (_: any, b: Phaser.Input.Gamepad.Button) => {
			if (b.index === button.a) {
				this.collectForagable();
			}
		});
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
		];

		// Gamepad
		const padDirections = [false, false, false, false, false, false];
		if (this.input.gamepad.total) {
			const pad = this.input.gamepad.gamepads.find((pad) => !!pad);
			if (pad) {
				padDirections[key.left] = pad.leftStick.x < -stickDeadZone;
				padDirections[key.right] = pad.leftStick.x > stickDeadZone;
				padDirections[key.up] = pad.leftStick.y < -stickDeadZone;
				padDirections[key.down] = pad.leftStick.y > stickDeadZone;
				padDirections[key.shift] = pad.R2 > 0;
			}
		}

		// Start with zero velocity
		let xVelocity = 0;
		let yVelocity = 0;

		// If were in a hurry, run 50% faster
		const inAHurry = keysDown[key.shift] || padDirections[key.shift];
		const speed = inAHurry ? 200 : 150;

		// Left/right movement
		if (keysDown[key.left] || padDirections[key.left]) {
			xVelocity = -speed;
			this.charDirectionRight = false;
		} else if (keysDown[key.right] || padDirections[key.right]) {
			xVelocity = speed;
			this.charDirectionRight = true;
		}

		// Up/down movement
		if (keysDown[key.up] || padDirections[key.up]) {
			yVelocity = -speed;
		} else if (keysDown[key.down] || padDirections[key.down]) {
			yVelocity = speed;
		}

		// Slow down diagonal movement to mimic speed in a circle
		if (xVelocity !== 0 && yVelocity !== 0) {
			xVelocity *= 0.7;
			yVelocity *= 0.7;
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
		const char: CharPart = this.character.getFirstAlive();
		const charX = Math.floor(char.x / 32);
		const charY = Math.floor((char.y - 6) / 32);

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
			this.target.setVisible(true);
		}
	}

	collectForagable() {
		const inventoryIndex = this.inventory.length;
		if (inventoryIndex >= 6) return;

		const targetPosString = `${this.targetPos.x},${this.targetPos.y}`;
		const foragable = this.foragables.get(targetPosString);
		if (!foragable) return;

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
