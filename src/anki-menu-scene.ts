import { Background } from "./fx-background";
import { Stuff } from "./stuff";
import backButtonUrl from '../assets/back.png';
import { addText } from "./utils";
import { ImageButton } from './image-button';
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

const QUESTION_NUMBER_OPTIONS = [10, 20, 30, 50, 70, 100];

// Select Anki Deck
export class AnkiMenuScene extends Phaser.Scene {
  private background = new Background();
  private backButton = new ImageButton('back-button', backButtonUrl);
  private stuff: Stuff[] = [this.background, this.backButton];
  private deckNames: string[] = [];
  private selectedDeckName: string = '';
  private deckSize: number = QUESTION_NUMBER_OPTIONS[0];
  private ankiNotes: AnkiNote[] = [];
  private isLoadingNotes: boolean = true;

  constructor() {
    super({
      key: ankiMenuSceneKey,
    });
  }

  preload(): void {
    this.stuff.map((thing) => thing.preload(this));
    getDeckNames().then((deckNames) => {
      this.deckNames = deckNames.sort();
      getPrimaryDeck().then((primaryDeck)=>{
        this.createDeckNameSelect(this.deckNames, primaryDeck);
        this.createQuestionNumberSelect();
        getNotes(primaryDeck, this.deckSize).then(notes=>{
          this.ankiNotes = notes['data'];
          this.selectedDeckName = primaryDeck;
          this.isLoadingNotes = false;
        });
      });
    });
  }

  loadNotes(deckName: string, deckSize: number): void {
    this.isLoadingNotes = true;
    getNotes(deckName, deckSize).then(notes=>{
      this.ankiNotes = notes['data'];
      this.selectedDeckName = deckName;
      this.deckSize = deckSize;
      this.isLoadingNotes = false;
    });
  }

  onSelectDeckName(event: Event): void {
    this.loadNotes((event.target as HTMLInputElement).value, this.deckSize);
  }

  onSelectDeckSize(event: Event): void {
    const selectedSize:number = parseInt((event.target as HTMLInputElement).value, 10);
    if (selectedSize >= 3) {
      if (selectedSize > this.ankiNotes.length) {
        this.loadNotes(this.selectedDeckName, selectedSize);
      } else {
        this.deckSize = selectedSize;
      }
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
    // dropdown.node.onchange = event => deckNames[select.selectedIndex];
    deckNameSelect.node.addEventListener("change", (e:Event)=>this.onSelectDeckName(e));
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
      questionNumberSelect.node.addEventListener("change", (e:Event)=>this.onSelectDeckSize(e));
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

    const questionSelectLabel = addText(this, gameWidth / 7, gameHeight / 3.5, "Questions");
    questionSelectLabel.setFontSize(0.02 * gameHeight);
    questionSelectLabel.setOrigin(0.5);

    const columnCount = 1;
    const startButton = new AnswerButton(this);
    startButton.width = 400;
    startButton.setText("Start");
    let x = ((5.04 + 3.4 * (1 % columnCount)) * gameWidth) / 10;
    let y = ((2.4 + 2 * Math.floor(1 / columnCount)) * gameHeight) / 10;
    startButton.setXY(x, y);

    startButton.onPress = () => {
      const sceneInfo: AnkiGameSceneProps = {
        showHint: false,
        ankiNotes: this.ankiNotes,
        deckName: this.selectedDeckName,
        deckSize: this.deckSize
      };
      if (!this.isLoadingNotes) {
        this.scene.start(ankiGameSceneKey, sceneInfo);
      }
    };

    this.backButton.setXY(this.game.scale.width * 0.01, 0.034 * this.game.scale.height);
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
