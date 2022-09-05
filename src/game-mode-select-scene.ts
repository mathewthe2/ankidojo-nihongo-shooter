import { Background } from "./fx-background";
import { Stuff } from "./stuff";
import { addText } from "./utils";
import { gameHeight, gameWidth } from "./config";
import { AnswerButton } from "./answer-button";
import { menuSceneKey, MenuSceneProps } from './menu-scene';
import { ankiMenuSceneKey, AnkiMenuSceneProps } from "./anki-menu-scene";

export const gameSelectSceneKey = "GameSelectScene";
export const defaultLanguage = "japanese"
// Select Game Mode
// Start - New Game by Anki game decks and mapped cards
// Classic - redirects to original game with lang=Japanese
export class GameModeSelectScene extends Phaser.Scene {
  private background = new Background();
  private stuff: Stuff[] = [this.background];

  constructor() {
    super({
      key: gameSelectSceneKey,
    });
  }

  preload(): void {
    this.stuff.map((thing) => thing.preload(this));
  }

  create(): void {
    this.stuff.map((thing) => thing.create(this));
    const title = addText(
      this,
      gameWidth / 2,
      gameHeight / 20,
      "Nihongo Shooter+"
    );
    title.setFontSize(0.05 * gameHeight);
    title.setAlign("center");
    title.setOrigin(0.5);

    const columnCount = 1;
    const startButton = new AnswerButton(this);
    startButton.width = 400;
    startButton.setText("Start");
    let x = ((5.04 + 3.4 * (0 % columnCount)) * gameWidth) / 10;
    let y = ((2.4 + 2 * Math.floor(0 / columnCount)) * gameHeight) / 10;
    startButton.setXY(x, y);

    startButton.onPress = () => {
        const sceneInfo: AnkiMenuSceneProps = {
          deckName: '',
        };
        this.scene.start(ankiMenuSceneKey, sceneInfo);
      };

    const classicButton = new AnswerButton(this);
    classicButton.width = 400;
    classicButton.setText("Classic");
    x = ((5.04 + 3.4 * (1 % columnCount)) * gameWidth) / 10;
    y = ((2.4 + 2 * Math.floor(1 / columnCount)) * gameHeight) / 10;
    classicButton.setXY(x, y);

    classicButton.onPress = () => {
        const sceneInfo: MenuSceneProps = {
          language: defaultLanguage,
        };
        this.scene.start(menuSceneKey, sceneInfo);
      };
  }

  update(): void {
    this.stuff.map((thing) => {
      if (thing.update) thing.update(this);
    });
  }
}
