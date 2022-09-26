import { Character, CharPart, createCharacter } from './character';
import { createDebugGrid } from './debugGrid';
import { createForagables, ForagableMap } from './foragable';
import { createInventory } from './inventory';
import { createMap } from './map';
import { createQuestChoose } from './questChoose';
import { createTarget } from './target';
import { button, gridPos, key, KeyConfig, questSize, stickDeadZone } from './utils';

const output = document.getElementById('gamepad')!;

export default class Game extends Phaser.Scene {
	private character!: Character;
	private charDirectionRight: boolean; // Currently facing right?
	private inventory: Phaser.GameObjects.Sprite[] = [];
	private target!: Phaser.GameObjects.Rectangle;
	private targetPos = { x: 3, y: 5 };
	private foragables: ForagableMap = new Map();
	private keys!: KeyConfig;
	private questChoiceOpen = false;
	private selectedQuest: number[] | null = null;
	private inventoryBox!: Phaser.GameObjects.Group;
	private houseDoor = Phaser.Geom.Rectangle.FromXY(
		gridPos(3),
		gridPos(2),
		gridPos(4),
		gridPos(3)
	);

	constructor() {
		super('game');
		this.charDirectionRight = true;
	}

	preload() {
		this.keys = <KeyConfig>this.input.keyboard.addKeys('W,A,S,D,SHIFT,TAB,SPACE');
	}

	create() {
		const { map, collideLayer, signPositions } = createMap(this);

		const { foragableMap, foragableTypes } = createForagables(this, map, collideLayer);
		this.foragables = foragableMap;
		this.character = createCharacter(this);
		this.target = createTarget(this);
		this.inventoryBox = createInventory(this);
		const { defaultQuest, selectQuestDown, selectQuestUp, openQuestChoose, closeQuestChoose } =
			createQuestChoose(this, foragableTypes);

		// createDebugGrid(this, map.width, map.height);

		// Collide player with map, foragables, and interactables
		this.physics.add.collider(this.character, collideLayer);
		this.physics.add.collider(this.character, Array.from(this.foragables.values()));

		// Follow camera to player and restrict to map bounds
		this.cameras.main
			.setBounds(0, 0, map.widthInPixels, map.heightInPixels, true)
			.startFollow(this.character.getChildren()[0], true);

		const doAction = () => {
			// Choose a quest
			if (this.questChoiceOpen) {
				closeQuestChoose();
				this.inventoryBox.setVisible(true);
				this.questChoiceOpen = false;

				this.add
					.rectangle(0, 0, 165, 34, 0x222222, 1)
					.setStrokeStyle(2, 0xffffff, 1)
					.setOrigin(0, 0)
					.setDepth(10)
					.setScrollFactor(0);
				this.selectedQuest?.forEach((type, i) => {
					this.add
						.sprite(gridPos(i), gridPos(0), 'forage', type)
						.setData('type', type)
						.setName(`foragable-${type}`)
						.setScale(2)
						.setOrigin(0)
						.setScrollFactor(0)
						.setDepth(10);
				});
				return;
			}

			// Collect foragable
			if (this.selectedQuest) {
				this.collectForagable();
				return;
			}

			// Open quest dialog when touching sign
			const targetPosString = `${this.targetPos.x},${this.targetPos.y}`;
			if (signPositions.has(targetPosString)) {
				openQuestChoose();
				this.character.playAnimation(`stand-${this.charDirectionRight ? 'right' : 'left'}`);
				this.questChoiceOpen = true;
				this.selectedQuest = defaultQuest;
				return;
			}
		};

		this.input.keyboard.on('keydown-SPACE', () => {
			doAction();
		});

		this.input.keyboard.on('keydown-S', () => {
			if (this.questChoiceOpen) {
				this.selectedQuest = selectQuestDown();
			}
		});

		this.input.keyboard.on('keydown-W', () => {
			if (this.questChoiceOpen) {
				this.selectedQuest = selectQuestUp();
			}
		});

		this.input.gamepad.on('down', (_: any, b: Phaser.Input.Gamepad.Button) => {
			switch (b.index) {
				case button.a:
					doAction();
					break;
				case button.down:
					if (this.questChoiceOpen) {
						this.selectedQuest = selectQuestDown();
					}
					break;
				case button.up:
					if (this.questChoiceOpen) {
						this.selectedQuest = selectQuestUp();
					}
					break;
				default:
					break;
			}
		});
	}

	update(/*time: number, delta: number*/) {
		if (!this.keys || !this.character || this.questChoiceOpen) {
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
		if (xVelocity || yVelocity) {
			// Play the correct walking animation
			this.character.playAnimation(`${inAHurry ? 'run' : 'walk'}-${direction}`, '1');
		} else {
			// Otherwise reset to standing the direction we were moving
			this.character.playAnimation(`stand-${direction}`);
		}

		// Set character velocity
		this.character.setVelocity(xVelocity, yVelocity);

		// Move target square
		const char: CharPart = this.character.getFirstAlive();
		const charX = Math.floor(char.x / 32);
		const charY = Math.floor((char.y - 6) / 32);

		if (xVelocity) {
			this.targetPos = { x: charX + (xVelocity > 0 ? 1 : -1), y: charY };
		} else if (yVelocity) {
			this.targetPos = { x: charX, y: charY + (yVelocity > 0 ? 1 : -1) };
		}

		this.target.setPosition(gridPos(this.targetPos.x), gridPos(this.targetPos.y));

		if (
			this.selectedQuest &&
			Phaser.Geom.Rectangle.Overlaps(char.getBounds(), this.houseDoor)
		) {
			console.log('ur dun kid');
		}
	}

	collectForagable() {
		const inventoryIndex = this.inventory.length;
		if (inventoryIndex >= questSize) return;

		const targetPosString = `${this.targetPos.x},${this.targetPos.y}`;
		const foragable = this.foragables.get(targetPosString);
		if (!foragable) return;

		const type = foragable.getData('type');
		this.foragables.delete(targetPosString);
		foragable.destroy();

		this.inventory.push(
			this.add
				.sprite(gridPos(inventoryIndex + 7) - 5, gridPos(12) + 10, 'forage', type)
				.setData('type', type)
				.setName(`foragable-${type}`)
				.setScale(2)
				.setOrigin(0)
				.setScrollFactor(0)
		);
	}
}
