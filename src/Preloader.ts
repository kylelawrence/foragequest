import Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
	constructor() {
		super('preloader');
	}

	preload() {
		this.load.spritesheet('tiles', 'assets/Serene_Village_32x32.png', {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.tilemapTiledJSON('island', 'assets/testmap.json');
		this.load.atlas('char', 'assets/char.png', 'assets/char.json');
		this.load.spritesheet('forage', 'assets/forage.png', { frameWidth: 16, frameHeight: 16 });
	}

	create() {
		this.scene.start('game');
	}
}
