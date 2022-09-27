import { Scene, Display } from 'phaser';
import { gridPos } from './utils';

let selectedQuest = 0;

export function createQuestOver(
	scene: Scene,
	collected: number[],
	quest: number[],
	questStart: number
) {
	const group = scene.add.group();

	const zone = scene.add.zone(0, 0, 600, 450).setOrigin(0, 0);
	const innerZone = scene.add.zone(0, 0, 300, 200).setOrigin(0, 0);

	const background = scene.add
		.rectangle(0, 0, 300, 200, 0x222222, 1)
		.setStrokeStyle(2, 0xffffff, 1)
		.setOrigin(0, 0)
		.setDepth(10)
		.setScrollFactor(0);

	const title = scene.add.text(0, 0, 'Quest over!').setDepth(10).setScrollFactor(0);
	const questSummary = scene.add.text(0, 0, 'Your quest was:').setDepth(10).setScrollFactor(0);
	const collectionSummary = scene.add
		.text(0, 0, 'And you collected:')
		.setDepth(10)
		.setScrollFactor(0);

	const finishTime = (scene.time.now - questStart) / 1000;
	const timeTitle = scene.add
		.text(0, 0, `In: ${finishTime.toFixed(1)}s`, { align: 'left' })
		.setDepth(10)
		.setScrollFactor(0);

	let finishScore = 0;
	const questCheck = [...quest];
	collected.forEach((type) => {
		const found = questCheck.indexOf(type);
		if (found > -1) {
			questCheck.splice(found, 1);
			finishScore += 1000;
		}
	});
	finishScore = Math.max(0, ((40 - finishTime) / 40) * finishScore);

	const scoreTitle = scene.add
		.text(0, 0, `Score: ${Math.round(finishScore)}`, { align: 'left' })
		.setDepth(10)
		.setScrollFactor(0);

	group.addMultiple([zone, innerZone, background, title]);

	Display.Align.In.Center(innerZone, zone);
	Display.Align.In.Center(background, innerZone);
	Display.Align.In.TopCenter(title, innerZone, undefined, -10);
	Display.Align.In.TopCenter(questSummary, innerZone, undefined, -40);
	Display.Align.In.TopCenter(collectionSummary, innerZone, undefined, -100);
	Display.Align.In.TopLeft(timeTitle, innerZone, -20, -170);
	Display.Align.In.TopRight(scoreTitle, innerZone, -20, -170);

	quest.forEach((type, i) => {
		const foragable = scene.add
			.sprite(0, 0, 'forage', type)
			.setScale(2)
			.setOrigin(0)
			.setScrollFactor(0)
			.setDepth(10);
		group.add(foragable);
		Display.Align.In.TopLeft(foragable, innerZone, -60 - i * 35, -56);
	});

	collected.sort().forEach((type, i) => {
		const foragable = scene.add
			.sprite(0, 0, 'forage', type)
			.setScale(2)
			.setOrigin(0)
			.setScrollFactor(0)
			.setDepth(10);
		group.add(foragable);
		Display.Align.In.TopLeft(foragable, innerZone, -60 - i * 35, -116);
	});
}
