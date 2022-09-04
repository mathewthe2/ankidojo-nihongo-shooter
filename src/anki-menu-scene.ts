import { Background } from "./fx-background";
import { Stuff } from "./stuff";
import { addText } from "./utils";
import { gameHeight, gameWidth } from "./config";
import { AnswerButton } from "./answer-button";
import { getDeckNames, getPrimaryDeck, getNotes } from "./anki";
import { ankiGameSceneKey, AnkiGameSceneProps } from "./anki-game-scene";
import AnkiNote from "./ankiNote";

export const ankiMenuSceneKey = "AnkiMenuScene";
export interface AnkiMenuSceneProps {
  deckName: string;
}

// Select Anki Deck
export class AnkiMenuScene extends Phaser.Scene {
  private background = new Background();
  private stuff: Stuff[] = [this.background];
  private deckNames: string[] = [];
  private ankiNotes: AnkiNote[] = [];
  private isLoadingNotes: boolean = true;

  constructor() {
    super({
      key: ankiMenuSceneKey,
    });
  }

  preload(): void {
    this.stuff.map((thing) => thing.preload(this));
    this.load.html("dropdown", "select.html");
    getDeckNames().then((deckNames) => {
      this.deckNames = deckNames.sort();
      getPrimaryDeck().then((primaryDeck)=>{
        this.createDeckNameSelect(this.deckNames, primaryDeck);
        this.createQuestionNumberSelect();
        getNotes(primaryDeck).then(notes=>{
          this.ankiNotes = notes['data'];
          this.isLoadingNotes = false;
        });
      });
    });
  }

  loadNotes(event: Event): void {
    this.isLoadingNotes = true;
    getNotes((event.target as HTMLInputElement).value).then(notes=>{
      this.ankiNotes = notes['data']
      this.isLoadingNotes = false;
    });
  }

  createDeckNameSelect(deckNames: string[], selected: string): void {
    let dropdown = this.add.dom(
      gameWidth / 2,
      gameHeight / 20,
      "select",
      "font-size: 2em; width: 50%; height:5%",
      "Phaser"
    );
    // dropdown.node.onchange = event => deckNames[select.selectedIndex];
    dropdown.node.addEventListener("change", (e:Event)=>this.loadNotes(e));
    deckNames.forEach((deckName: string) => {
      var opt = document.createElement("option");
      opt.value = deckName;
      opt.innerHTML = deckName;
      if (selected && deckName === selected) {
        opt.selected = true;
      }
      dropdown.node.appendChild(opt);
    });
  }
  
  createQuestionNumberSelect(): void {
    let dropdown = this.add.dom(
        gameWidth / 2,
        gameHeight /5,
        "select",
        "font-size: 2em; width: 50%; height:5%",
        "Phaser"
      );
      [10, 20, 50, 100].forEach((numberOfQuestions: number) => {
        var opt = document.createElement("option");
        opt.value = numberOfQuestions.toString();
        opt.innerHTML = numberOfQuestions.toString();
        dropdown.node.appendChild(opt);
      });
  }

  create(): void {
    this.stuff.map((thing) => thing.create(this));
    const title = addText(this, gameWidth / 8, gameHeight / 20, "Select Deck");
    title.setFontSize(0.02 * gameHeight);
    title.setOrigin(0.5);

    const questionSelectLabel = addText(this, gameWidth / 8, gameHeight / 5, "Questions");
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
      // const sceneInfo: AnkiMenuSceneProps = {
      //   deckName: '',
      // };
      const sceneInfo: AnkiGameSceneProps = {
        level: 1,
        showHint: false,
        ankiNotes: this.ankiNotes
      };
      if (!this.isLoadingNotes) {
        this.scene.start(ankiGameSceneKey, sceneInfo);
      }
    };

  }

  update(): void {
    this.stuff.map((thing) => {
      if (thing.update) thing.update(this);
    });
  }
}
