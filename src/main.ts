import Phaser from 'phaser';
import Game from './Game';
import Preloader from './Preloader';

export default new Phaser.Game({
	type: Phaser.AUTO,
	width: 600,
	height: 450,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			// debug: true,
		},
	},
	input: {
		gamepad: true,
	},
	scene: [Preloader, Game],
	scale: {
		zoom: 1.4,
	},
	parent: 'app',
});
