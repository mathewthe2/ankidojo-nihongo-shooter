import "phaser";
import { ankiMenuSceneKey } from "./anki-menu-scene";
import { AnswerButton } from "./answer-button";
import { gameHeight, gameWidth } from "./config";
import { Background } from "./fx-background";
import { UI } from "./fx-ui";
import { whichStarFrame } from "./scoring";
import { storage } from "./storage";
import { Stuff } from "./stuff";
import { addText } from "./utils";

export const ankiDoneSceneKey = "AnkiDoneScene";
export interface AnkiDoneData {
  corrects: number;
  mistakes: number;
  duration: number;
  deckName: string;
  deckSize: number;
  difficulty: string;
}

export class AnkiDoneScene extends Phaser.Scene {
  private ankiDoneData!: AnkiDoneData;
  private background = new Background();
  private buttons!: AnswerButton[];
  private ui = new UI();

  private stuff: Stuff[] = [this.background, this.ui];

  constructor() {
    super({
      key: ankiDoneSceneKey,
    });
  }

  init(props: any) {
    console.log("props", props);
    this.ankiDoneData = props;
  }

  preload(): void {
    this.stuff.map((thing) => thing.preload(this));
  }

  create(): void {
    this.buttons = [];
    this.stuff.map((thing) => thing.create(this));
    const titleText = `${this.ankiDoneData.deckName} on ${this.ankiDoneData.difficulty}`;
    const title = addText(this, gameWidth / 2, 0.05 * gameHeight, titleText);
    title.setFontSize(0.04 * gameHeight);
    title.setAlign("center");
    title.setOrigin(0.5);

    const rows = [
      "Hits: " + this.ankiDoneData.corrects,
      "Misses: " + this.ankiDoneData.mistakes,
      `In: ${this.ankiDoneData.duration} seconds`,
    ];

    const bestAnkiSpeed = storage.bestAnkiSpeed.get(
      this.ankiDoneData.deckName,
      this.ankiDoneData.deckSize,
      this.ankiDoneData.difficulty
    );

    let newRecord = false;
    if (this.ankiDoneData.mistakes == 0) {
      if (
        !bestAnkiSpeed ||
        (bestAnkiSpeed && this.ankiDoneData.duration < bestAnkiSpeed)
      ) {
        storage.bestAnkiSpeed.set(
          this.ankiDoneData.deckName,
          this.ankiDoneData.deckSize,
          this.ankiDoneData.difficulty,
          this.ankiDoneData.duration
        );
        newRecord = true;
      }
    }
    if (newRecord) {
      rows.push(`New best speed!`);
    } else {
      if (bestAnkiSpeed) {
        rows.push(`Best: ${bestAnkiSpeed} seconds`);
      } else {
        rows.push("Get zero misses\nto beat the level");
      }
    }

    for (const [index, element] of rows.entries()) {
      const text = addText(
        this,
        gameWidth / 8,
        ((20 + index * 7) * gameHeight) / 100,
        element
      );
      text.setFontSize(0.04 * gameHeight);
      title.setOrigin(0.5);
    }

    const button = new AnswerButton(this);
    this.buttons.push(button);
    button.setText("COOL");
    button.setXY(this.game.scale.width / 2, this.game.scale.height * 0.8);
    button.onPress = () => {
      this.scene.start(ankiMenuSceneKey);
    };

    const starFrame = whichStarFrame(
      this.ankiDoneData.duration,
      this.ankiDoneData.mistakes
    );
    const sprite = this.ui.sprite(starFrame);
    sprite.x = gameWidth / 2;
    sprite.y = 0.16 * gameHeight;
  }

  update(): void {
    this.stuff.map((thing) => {
      if (thing.update) thing.update(this);
    });
  }
}
