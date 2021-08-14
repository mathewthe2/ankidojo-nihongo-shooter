import 'phaser';
import particleUrl from '../assets/particle.png';
import shipUrl from '../assets/ship-01.png';
import shipThrustUrl from '../assets/ship-01-thrust.png';
import gaspUrl from '../assets/gasp.mp3';
import { AnswerButton } from './answer-button';
import { WordGame } from './words';
import { Rays } from './rays';
import { Explosion } from './fx-explosion';
import { Background } from './fx-background';
import { Stuff } from './stuff';


export class GameScene extends Phaser.Scene {
  private level: number = 1;
  private startKey!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ship!: Phaser.GameObjects.Container;
  private buttons!: AnswerButton[];
  private definitionBox!: AnswerButton;
  private wordsGame!: WordGame;
  private scoreText!: Phaser.GameObjects.Text;
  private rays = new Rays();
  private explosion = new Explosion();
  private background = new Background();
  private stuff: Stuff[] = [
    this.rays,
    this.explosion,
    this.background,
  ];

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  init(props: any) {
    this.level = props.level || 1;
  }

  preload(): void {
    console.log('level', this.level);
    this.stuff.map(thing => thing.preload(this));

    this.wordsGame = new WordGame();
    this.buttons = [];
    
    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S,
    );
    this.startKey.isDown = false;
    this.load.image('particle', particleUrl);
    // this.load.image('ship', shipUrl);
    // this.load.image('ship-thrust', shipThrustUrl);

    this.load.spritesheet(
      "ship-sheet",
      shipUrl,
      {
        frameWidth: 48,
        frameHeight: 48,
        margin: 0,
        spacing: 0,
      }
    );
    this.load.spritesheet(
      "ship-thrust-sheet",
      shipThrustUrl,
      {
        frameWidth: 16,
        frameHeight: 10,
        margin: 0,
        spacing: 0,
      }
    );

    this.load.audio('gasp', gaspUrl);

  }

  enemyX(index: number) {
    const wi = this.game.scale.width;
    const enemies = [wi * 0.25, wi * 0.5, wi * 0.75];
    return enemies[index];
  }

  enemyY(index: number) {
    // one up, one down
    return 80 + (index % 2) * 80;
  }

  guessAnswer(index: number) {
    const success = this.wordsGame.tryAnswer(index);

    this.ship.setX(this.enemyX(index))
    this.rays.setX(this.enemyX(index));
    this.explosion.sprite.x = this.enemyX(index);
    this.explosion.sprite.y = this.enemyY(index);

    if (success) {
      this.rays.fire();
      this.explosion.fire();
      console.log("YES!");
    } else {
      this.rays.fireBlocked();
      this.explosion.shield();
      console.log("no :(");
    }
    console.log("score", this.wordsGame.score);
    this.updateWordButtons();
  }

  updateWordButtons() {
    for (const [index, word] of this.wordsGame.buttonWords.entries()) {
      const button = this.buttons[index];
      button.setText(word.kanji + '\n' + word.hiragana);
      button.setXY(this.enemyX(index), this.enemyY(index));
      button.onPress = () => {
        console.log('press', index, word.id);
        this.guessAnswer(index);
      }
    }

    const answerWord = this.wordsGame.getAnswerWord();
    this.definitionBox.setText(answerWord.english);

    this.scoreText.setText("Score: " + this.wordsGame.score);
  }

  create(): void {
    this.stuff.map(thing => thing.create(this));

    this.explosion.sprite.depth = 20;
    this.cursors = this.input.keyboard.createCursorKeys();

    for (const _ of this.wordsGame.buttonWords) {
      const button = new AnswerButton(this);
      this.buttons.push(button);
    }

    this.definitionBox = new AnswerButton(this);
    this.definitionBox.setXY(this.game.scale.width / 2, this.game.scale.height * 0.7);
    
    this.scoreText = this.add.text(0, 0, 'Score: 0', {
      fontSize: '20px',
      fontFamily: "Helvetica",
    });

    this.updateWordButtons();

    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("ship-sheet", {frames: [0, 1, 0, 3, 4, 0]}),
      frameRate: 5,
      repeat: -1
    });
    const ship = this.add.sprite(0, 0, 'ship');
    ship.play('player-idle');

    this.anims.create({
      key: "thrust-idle",
      frames: this.anims.generateFrameNumbers("ship-thrust-sheet", {frames: [0, 1]}),
      frameRate: 4,
      repeat: -1
    });
    const thrust = this.add.sprite(0, 20, 'ship-thrust');
    thrust.play('thrust-idle');

    this.ship = this.add.container(0, 0, [ship, thrust]);
    this.ship.x = this.game.scale.width / 2;
    this.ship.y = this.game.scale.height * 0.86;
  }

  update(): void {
    this.stuff.map(thing => {
      if (thing.update) thing.update(this)
    });

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.guessAnswer(0);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.guessAnswer(1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.guessAnswer(2);
    }

    // if (this.startKey.isDown) {
    //   this.sound.play('gasp');
    //   this.scene.start(this);
    // }

  }
}