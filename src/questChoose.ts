import { Scene, Display } from 'phaser';
import { gridPos } from './utils';

let selectedQuest = 0;

export function createQuestChoose(scene: Scene, foragableTypes: number[]) {
	const group = scene.add.group();

	const zone = scene.add.zone(0, 0, 600, 450).setOrigin(0, 0);
	const innerZone = scene.add.zone(0, 0, 300, 200).setOrigin(0, 0);

	const background = scene.add
		.rectangle(0, 0, 300, 200, 0x222222, 1)
		.setStrokeStyle(2, 0xffffff, 1)
		.setOrigin(0, 0)
		.setDepth(10)
		.setScrollFactor(0);

	const title = scene.add.text(0, 0, 'Choose a quest.').setDepth(10).setScrollFactor(0);

	group.addMultiple([zone, innerZone, background, title]);

	Display.Align.In.Center(innerZone, zone);
	Display.Align.In.Center(background, innerZone);
	Display.Align.In.TopCenter(title, innerZone, undefined, -10);

	const types = [...foragableTypes];
	const quests: number[][] = [];
	for (let questIndex = 0; questIndex < 4; questIndex++) {
		const quest = types.splice(0, 5);
		quest.sort();
		quests.push(quest);
		quest.forEach((type, i) => {
			const foragable = scene.add
				.sprite(0, 0, 'forage', type)
				.setScale(2)
				.setOrigin(0)
				.setScrollFactor(0)
				.setDepth(10);
			group.add(foragable);
			Display.Align.In.TopLeft(foragable, innerZone, -75 - i * 35, -36 - questIndex * 40);
		});
		if (questIndex === 0) continue;
		const separator = scene.add
			.line(0, 0, 0, 0, 175, 0, 0xffffff, 1)
			.setDepth(10)
			.setScrollFactor(0);
		group.add(separator);
		Display.Align.In.TopLeft(separator, innerZone, -75, -34 - questIndex * 40);
	}

	const selector = scene.add
		.triangle(0, 0, 0, 0, 0, 16, 10, 8, 0xffffff, 1)
		.setDepth(10)
		.setOrigin(0)
		.setScrollFactor(0);
	group.add(selector);

	group.setVisible(false);

	Display.Align.In.TopLeft(selector, innerZone, -45, -46 - selectedQuest * 40);

	const selectQuestUp = () => {
		if (selectedQuest !== 0) selectedQuest--;
		Display.Align.In.TopLeft(selector, innerZone, -45, -46 - selectedQuest * 40);
		return quests[selectedQuest];
	};

	const selectQuestDown = () => {
		if (selectedQuest !== 3) selectedQuest++;
		Display.Align.In.TopLeft(selector, innerZone, -45, -46 - selectedQuest * 40);
		return quests[selectedQuest];
	};

	const openQuestChoose = () => {
		group.setVisible(true);
	};

	const closeQuestChoose = () => {
		group.setVisible(false);
	};

	return {
		selectQuestUp,
		selectQuestDown,
		defaultQuest: quests[0],
		openQuestChoose,
		closeQuestChoose,
	};
}
