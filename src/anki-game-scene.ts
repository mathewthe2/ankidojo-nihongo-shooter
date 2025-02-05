import "phaser";
import shipUrl from "../assets/ship-01.png";
import backButtonUrl from "../assets/back.png";
import shipThrustUrl from "../assets/ship-01-thrust.png";
import gaspUrl from "../assets/gasp.mp3";
import { AnswerButton } from "./answer-button";
import { AnkiWordGame } from "./anki-words";
import { Rays } from "./rays";
import { Explosion } from "./fx-explosion";
import { Background } from "./fx-background";
import { Stuff } from "./stuff";
import { gameHeight, gameWidth } from "./config";
import { HealthBar } from "./fx-hp-bar";
import { Enemy } from "./fx-enemy";
import { ManyExplosions } from "./fx-many-explosions";
import { addText } from "./utils";
import { ImageButton } from "./image-button";
import { TimerBar } from "./fx-timer-bar";
import { Planet } from "./fx-planet";
import { medalTimeSeconds } from "./scoring";
import AnkiNote from "./ankiNote";
import { ankiMenuSceneKey } from "./anki-menu-scene";
import { AnkiDoneData, ankiDoneSceneKey } from "./anki-done-scene";

export const ankiGameSceneKey = "AnkiGameScene";

export interface AnkiGameSceneProps {
  showHint: boolean;
  ankiNotes: AnkiNote[];
  deckName: string;
  deckSize: number;
  difficulty: string;
}

const { LEFT, RIGHT, UP, ONE, TWO, THREE } = Phaser.Input.Keyboard.KeyCodes;
const keyCodes = {
  left: LEFT,
  right: RIGHT,
  up: UP,
  one: ONE,
  two: TWO,
  three: THREE,
};
type KeysType = { [name in keyof typeof keyCodes]: Phaser.Input.Keyboard.Key };

export class AnkiGameScene extends Phaser.Scene {
  private startTime!: number;
  private showHint!: boolean;

  private ship!: Phaser.GameObjects.Container;
  private buttons!: AnswerButton[];
  private definitionBox!: AnswerButton;
  private wordsGame!: AnkiWordGame;
  private scoreText!: Phaser.GameObjects.Text;
  private rays = new Rays();
  private explosion = new Explosion();
  private manyExplosions = new ManyExplosions();
  private background = new Background();
  private planet = new Planet();
  private hpBar = new HealthBar();
  private timerBar = new TimerBar();
  private enemy = new Enemy();
  private backButton = new ImageButton("back-button", backButtonUrl);
  private stuff: Stuff[] = [
    this.rays,
    this.explosion,
    this.background,
    this.planet,
    this.hpBar,
    this.timerBar,
    this.enemy,
    this.manyExplosions,
    this.backButton,
  ];
  private isGameOver = false;
  private keys!: KeysType;
  private ankiNotes!: AnkiNote[];
  private deckName!: string;
  private deckSize!: number;
  private difficulty!: string;

  constructor() {
    super({
      key: ankiGameSceneKey,
    });
  }

  init(props: AnkiGameSceneProps) {
    this.showHint = props.showHint;
    if (props.showHint === undefined) {
      this.showHint = true;
    }
    this.ankiNotes = props.ankiNotes;
    this.deckName = props.deckName;
    this.deckSize = props.deckSize;
    this.difficulty = props.difficulty;
    this.startTime = Date.now();
  }

  preload(): void {
    this.stuff.map((thing) => thing.preload(this));

    this.wordsGame = new AnkiWordGame(this.ankiNotes, this.deckSize);
    this.buttons = [];
    this.isGameOver = false;

    this.load.spritesheet("ship-sheet", shipUrl, {
      frameWidth: 48,
      frameHeight: 48,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("ship-thrust-sheet", shipThrustUrl, {
      frameWidth: 16,
      frameHeight: 10,
      margin: 0,
      spacing: 0,
    });

    this.load.audio("gasp", gaspUrl);
  }

  create(): void {
    this.stuff.map((thing) => thing.create(this));

    // GameAnalytics.addProgressionEvent(EGAProgressionStatus.Start, this.language, "level" + this.level);

    for (const _ of this.wordsGame.buttonWords) {
      const button = new AnswerButton(this);
      this.buttons.push(button);
    }

    this.definitionBox = new AnswerButton(this);
    this.definitionBox.setXY(
      this.game.scale.width / 2,
      0.3 * this.game.scale.height
    );

    this.backButton.setXY(
      this.game.scale.width * 0.01,
      0.034 * this.game.scale.height
    );
    this.backButton.onPress = () => {
      // GameAnalytics.addProgressionEvent(EGAProgressionStatus.Fail, this.language, "level" + this.level);
      this.scene.start(ankiMenuSceneKey);
    };

    this.scoreText = addText(this, 0, 0, "HP: 100");
    this.scoreText.setFontSize((2.4 * gameHeight) / 100);
    this.scoreText.depth = 11;
    this.enemy.chooseEnemy(this.deckSize);

    this.updateWordButtons();

    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("ship-sheet", {
        frames: [0, 1, 0, 3, 4, 0],
      }),
      frameRate: 5,
      repeat: -1,
    });
    const ship = this.add.sprite(0, 0, "ship");
    ship.play("player-idle");

    this.anims.create({
      key: "thrust-idle",
      frames: this.anims.generateFrameNumbers("ship-thrust-sheet", {
        frames: [0, 1],
      }),
      frameRate: 4,
      repeat: -1,
    });
    const thrust = this.add.sprite(0, 20, "ship-thrust");
    thrust.play("thrust-idle");

    this.ship = this.add.container(0, 0, [ship, thrust]);
    this.ship.x = gameWidth / 2;
    this.ship.y = gameHeight * 0.86;
    this.ship.scale = gameHeight / 600;

    this.keys = this.input.keyboard.addKeys(keyCodes) as KeysType;
  }

  update(): void {
    if (this.isGameOver) {
      return;
    }
    this.stuff.map((thing) => {
      if (thing.update) thing.update(this);
    });

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.left) ||
      Phaser.Input.Keyboard.JustDown(this.keys.one)
    ) {
      this.guessAnswer(0);
    }
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.two)
    ) {
      this.guessAnswer(1);
    }
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.right) ||
      Phaser.Input.Keyboard.JustDown(this.keys.three)
    ) {
      this.guessAnswer(2);
    }

    const durationSeconds = (Date.now() - this.startTime) / 1000.0;
    let percentTimeLeft =
      (medalTimeSeconds - durationSeconds) / medalTimeSeconds;
    if (percentTimeLeft < 0) {
      percentTimeLeft = 0;
    }
    this.timerBar.setPercent(percentTimeLeft);
    if (percentTimeLeft < 0.2) {
      this.planet.reveal(this);
    }
  }

  enemyX(index: number) {
    const wi = this.game.scale.width;
    const enemies = [wi * 0.25, wi * 0.5, wi * 0.75];
    return enemies[index];
  }

  enemyY(index: number) {
    // one up, one down
    return ((57 + ((index + 1) % 2) * 14) * gameHeight) / 100;
  }

  async guessAnswer(index: number) {
    if (this.isGameOver) {
      return;
    }
    const result = this.wordsGame.tryAnswer(index);

    this.ship.setX(this.enemyX(index));
    this.rays.setX(this.enemyX(index));
    this.explosion.setXY(this.enemyX(index), this.enemyY(index));

    if (result.success) {
      this.rays.fire();
      this.explosion.fire();
    } else {
      this.rays.fireBlocked();
      this.explosion.shield();
    }

    if (result.gameOver) {
      this.isGameOver = true;
      const endTime = Date.now();
      const durationSeconds = (endTime - this.startTime) / 1000.0;
      const data: AnkiDoneData = {
        duration: durationSeconds,
        mistakes: this.wordsGame.mistakes,
        corrects: this.wordsGame.corrects,
        deckName: this.deckName,
        deckSize: this.deckSize,
        difficulty: this.difficulty,
      };
      console.log("level over", data);
      try {
        await this.manyExplosions.fire();
      } catch (err) {
        console.warn("strange error", err);
        // I don't know how to avoid the
        // "Uncaught (in promise) TypeError: Cannot read property 'play' of undefined"
        // when I mash buttons on the second go
      }
      // GameAnalytics.addProgressionEvent(EGAProgressionStatus.Complete,
      //   this.language, "level" + this.level, "mistakes" + this.wordsGame.mistakes, Math.floor(durationSeconds));
      this.scene.start(ankiDoneSceneKey, data);
    } else {
      this.updateWordButtons();
    }
  }

  updateWordButtons() {
    for (const [index, word] of this.wordsGame.buttonWords.entries()) {
      const button = this.buttons[index];
      let buttonText = word.kanji;
      if ((this.showHint || !buttonText) && (word.kanji !== word.hiragana)) {
        buttonText += "\n" + word.hiragana;
      }
      button.setText(buttonText.trim());
      button.setXY(this.enemyX(index), this.enemyY(index));
      button.onPress = () => {
        console.log("press", index, word.id);
        this.guessAnswer(index);
      };
    }

    const answerWord = this.wordsGame.getAnswerWord();
    this.definitionBox.setText(answerWord.english);

    const percentLifeLeft =
      this.wordsGame.remainingWords() / this.wordsGame.totalWords();
    this.hpBar.setPercent(percentLifeLeft);
    this.scoreText.setText("HP: " + this.wordsGame.remainingWords() * 10);
  }
}
