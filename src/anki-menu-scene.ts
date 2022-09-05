import particleUrl from "../assets/particle.png";
import backButtonUrl from "../assets/back.png";
import gaspUrl from "../assets/gasp.mp3";
import { Background } from "./fx-background";
import { Stuff } from "./stuff";
import { addText } from "./utils";
import { ImageButton } from "./image-button";
import { gameHeight, gameWidth } from "./config";
import { AnswerButton } from "./answer-button";
import { getDeckNames, getPrimaryDeck, getNotes } from "./anki";
import { ankiGameSceneKey, AnkiGameSceneProps } from "./anki-game-scene";
import AnkiNote from "./ankiNote";
import { gameSelectSceneKey } from "./game-mode-select-scene";

export const ankiMenuSceneKey = "AnkiMenuScene";
export interface AnkiMenuSceneProps {
  deckName: string;
}

const MIN_QUESTION_NUMBER = 3;
const QUESTION_NUMBER_OPTIONS = [10, 20, 30, 50, 70, 100];

interface EaseOption {
  Easy: string;
  Normal: string;
  Hard: string;
  Random: string | null;
}
const EASE_OPTIONS = {
  Easy: "prop:ease>=3",
  Normal: "prop:ease>=1.5 prop:ease<3",
  Hard: "prop:ease<1.5",
  Random: null,
} as EaseOption;

// Select Anki Deck
export class AnkiMenuScene extends Phaser.Scene {
  private isHintOn = false;
  private background = new Background();
  private hintToggle!: AnswerButton;
  private buttons!: AnswerButton[];
  private backButton = new ImageButton("back-button", backButtonUrl);
  private startKey!: Phaser.Input.Keyboard.Key;
  private stuff: Stuff[] = [this.background, this.backButton];
  private deckNames: string[] = [];
  private selectedDeckName: string = "";
  private deckSize: number = QUESTION_NUMBER_OPTIONS[0];
  private ankiNotes: AnkiNote[] = [];
  private isLoadingNotes: boolean = true;
  private difficulty: keyof EaseOption = "Random";

  constructor() {
    super({
      key: ankiMenuSceneKey,
    });
  }

  preload(): void {
    this.stuff.map((thing) => thing.preload(this));
    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this.startKey.isDown = false;
    this.load.image("particle", particleUrl);
    this.load.audio("gasp", gaspUrl);
    getDeckNames().then((deckNames) => {
      this.deckNames = deckNames.sort();
      getPrimaryDeck().then((primaryDeck) => {
        this.createDeckNameSelect(this.deckNames, primaryDeck);
        this.createQuestionNumberSelect();
        this.loadNotes({
          deckName: primaryDeck,
          deckSize: this.deckSize,
          difficulty: this.difficulty,
        });
      });
    });
  }

  isReady(): boolean {
    return (
      this.deckSize >= MIN_QUESTION_NUMBER &&
      !this.isLoadingNotes
    );
  }

  updateHintToggle() {
    if (this.isHintOn) {
      this.hintToggle.setText("Hiragana is on");
    } else {
      this.hintToggle.setText("Hiragana is off");
    }
  }

  loadNotes({
    deckName,
    deckSize,
    difficulty,
    onFinishedLoading,
  }: {
    deckName: string;
    deckSize: number;
    difficulty: keyof EaseOption;
    onFinishedLoading?: () => void;
  }): void {
    this.isLoadingNotes = true;
    getNotes(deckName, deckSize, EASE_OPTIONS[difficulty]).then((notes) => {
      this.ankiNotes = notes["data"];
      this.selectedDeckName = deckName;
      // console.log('deckSize', deckSize)
      // console.log('length', this.ankiNotes.length)
      if (this.ankiNotes.length < deckSize) {
        for (let i = 0; i < QUESTION_NUMBER_OPTIONS.length-1; i++) {
          if (QUESTION_NUMBER_OPTIONS[i+1] > this.ankiNotes.length) {
            this.deckSize = QUESTION_NUMBER_OPTIONS[i];
            break;
          }
        }
      } else {
        this.deckSize = deckSize;
      }
      this.isLoadingNotes = false;
      if (onFinishedLoading) {
        onFinishedLoading();
      }
    });
  }

  onSelectDeckName(event: Event): void {
    this.loadNotes({
      deckName: (event.target as HTMLInputElement).value,
      deckSize: this.deckSize,
      difficulty: this.difficulty,
    });
  }

  onSelectDeckSize(event: Event): void {
    const selectedSize: number = parseInt(
      (event.target as HTMLInputElement).value,
      10
    );
    if (selectedSize >= MIN_QUESTION_NUMBER) {
      if (selectedSize > this.ankiNotes.length) {
        this.loadNotes({
          deckName: this.selectedDeckName,
          deckSize: selectedSize,
          difficulty: this.difficulty,
        });
      } else {
        this.deckSize = selectedSize;
      }
    }
  }

  onClickStart(difficultyText: keyof EaseOption): void {
    if (difficultyText === this.difficulty) {
      this.startGame();
    } else {
      this.loadNotes({
        deckName: this.selectedDeckName,
        deckSize: this.deckSize,
        difficulty: difficultyText,
        onFinishedLoading: () => this.startGame(),
      });
    }
  }

  startGame(): void {
    console.log("start", this.deckSize);
    this.sound.play("gasp");
    const sceneInfo: AnkiGameSceneProps = {
      showHint: this.isHintOn,
      ankiNotes: this.ankiNotes,
      deckName: this.selectedDeckName,
      deckSize: this.deckSize,
      difficulty: this.difficulty,
    };
    if (this.isReady()) {
      this.scene.start(ankiGameSceneKey, sceneInfo);
    }
  }

  createDeckNameSelect(deckNames: string[], selected: string): void {
    let deckNameSelect = this.add.dom(
      gameWidth / 2,
      gameHeight / 5,
      "select",
      "font-size: 2em; width: 50%; height:5%",
      "Phaser"
    );
    deckNameSelect.node.addEventListener("change", (e: Event) =>
      this.onSelectDeckName(e)
    );
    deckNames.forEach((deckName: string) => {
      var opt = document.createElement("option");
      opt.value = deckName;
      opt.innerHTML = deckName;
      if (selected && deckName === selected) {
        opt.selected = true;
      }
      deckNameSelect.node.appendChild(opt);
    });
  }

  createQuestionNumberSelect(): void {
    let questionNumberSelect = this.add.dom(
      gameWidth / 2,
      gameHeight / 3.5,
      "select",
      "font-size: 2em; width: 50%; height:5%",
      "Phaser"
    );
    questionNumberSelect.node.addEventListener("change", (e: Event) =>
      this.onSelectDeckSize(e)
    );
    QUESTION_NUMBER_OPTIONS.forEach((numberOfQuestions: number) => {
      var opt = document.createElement("option");
      opt.value = numberOfQuestions.toString();
      opt.innerHTML = numberOfQuestions.toString();
      questionNumberSelect.node.appendChild(opt);
    });
  }

  create(): void {
    this.stuff.map((thing) => thing.create(this));
    const title = addText(this, gameWidth / 8, gameHeight / 5, "Select Deck");
    title.setFontSize(0.02 * gameHeight);
    title.setOrigin(0.5);

    this.buttons = [];
    this.hintToggle = new AnswerButton(this);
    this.hintToggle.setXY(gameWidth / 2, gameHeight * 0.95);
    this.updateHintToggle();
    this.hintToggle.onPress = () => {
      this.isHintOn = !this.isHintOn;
      this.updateHintToggle();
    };

    const questionSelectLabel = addText(
      this,
      gameWidth / 7,
      gameHeight / 3.5,
      "Questions"
    );
    questionSelectLabel.setFontSize(0.02 * gameHeight);
    questionSelectLabel.setOrigin(0.5);

    for (let index = 0; index < Object.keys(EASE_OPTIONS).length; index++) {
      const difficultyText = Object.keys(EASE_OPTIONS)[index];
      const button = new AnswerButton(this);
      button.width = gameWidth * 0.35;
      const columnCount = 1;
      this.buttons.push(button);
      button.setText("" + difficultyText);
      const x = ((5.0 + 1.4 * (index % columnCount)) * gameWidth) / 10;
      const y =
        ((4.0 + 1.2 * Math.floor(index / columnCount)) * gameHeight) / 10;
      button.setXY(x, y);
      button.onPress = () =>
        this.onClickStart(difficultyText as keyof EaseOption);
    }

    this.backButton.setXY(
      this.game.scale.width * 0.01,
      0.034 * this.game.scale.height
    );
    this.backButton.onPress = () => {
      this.scene.start(gameSelectSceneKey);
    };
  }

  update(): void {
    this.stuff.map((thing) => {
      if (thing.update) thing.update(this);
    });
  }
}
