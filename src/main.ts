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
		},
	},
	scene: [Preloader, Game],
	scale: {
		zoom: 1.4,
	},
});
