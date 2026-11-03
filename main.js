import Phaser from "phaser";

class AdventureScene extends Phaser.Scene {
  constructor() {
    super("AdventureScene");
    this.playerHP = 100;
    this.exp = 0;
    this.level = 1;
    this.slimeHP = 30;
    this.lastAttack = 0;
  }

  create() {
    const w = 960, h = 540;
    this.physics.world.setBounds(0, 0, w, h);

    // Sky and distant hills
    this.add.rectangle(w/2, h/2, w, h, 0x8ed6ef);
    this.add.ellipse(160, 360, 420, 190, 0x83bd79);
    this.add.ellipse(720, 355, 520, 220, 0x6eaa6a);

    // Ground
    this.add.rectangle(w/2, 500, w, 80, 0x4d9b45);
    this.add.rectangle(w/2, 466, w, 10, 0x8bc34a);

    // Simple village props
    this.add.rectangle(770, 390, 120, 95, 0xb96b42);
    this.add.triangle(770, 325, -78, 35, 78, 35, 0x78452f).setOrigin(0.5);
    this.add.rectangle(770, 405, 28, 55, 0x553b2b);
    this.add.rectangle(120, 410, 18, 70, 0x76502e);
    this.add.circle(120, 360, 42, 0x2f8b45);
    this.add.circle(92, 377, 27, 0x399b4b);
    this.add.circle(145, 377, 27, 0x399b4b);

    // Player, built from simple original shapes
    this.player = this.add.container(230, 420);
    const body = this.add.rectangle(0, 18, 28, 38, 0x2868bd);
    const head = this.add.circle(0, -12, 16, 0xf0c49a);
    const helmet = this.add.arc(0, -14, 18, 180, 360, false, 0xb8c4d1).setStrokeStyle(3, 0x34495e);
    const visor = this.add.rectangle(5, -10, 16, 5, 0x34495e);
    const legs = this.add.rectangle(0, 43, 25, 12, 0x493b35);
    this.player.add([body, head, helmet, visor, legs]);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(28, 58);
    this.player.body.setOffset(-14, -27);
    this.player.body.setGravityY(900);

    // Slime enemy
    this.slime = this.add.container(560, 438);
    const slimeShape = this.add.ellipse(0, 0, 58, 38, 0x4bd66b);
    const eye1 = this.add.circle(-10, -5, 4, 0x183b2a);
    const eye2 = this.add.circle(10, -5, 4, 0x183b2a);
    this.slime.add([slimeShape, eye1, eye2]);
    this.physics.add.existing(this.slime);
    this.slime.body.setImmovable(true);
    this.slime.body.setAllowGravity(false);
    this.slime.body.setSize(54, 35);
    this.slime.body.setOffset(-27, -17);

    this.keys = this.input.keyboard.addKeys({
      left: "LEFT", right: "RIGHT", a: "A", d: "D",
      jump: "SPACE", up: "UP", w: "W", attack: "J"
    });

    this.physics.add.collider(this.player, this.slime, () => {
      if (this.time.now > (this.lastBump || 0) + 900) {
        this.lastBump = this.time.now;
        this.playerHP = Math.max(0, this.playerHP - 8);
        this.updateHud();
      }
    });

    this.createHud();
    this.updateHud();
    this.add.text(480, 24, "GREENFIELD VILLAGE", {
      fontFamily: "Arial", fontSize: "18px", color: "#21432a",
      fontStyle: "bold", stroke: "#ffffff", strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(480, 520, "Prototype build 0.1", {
      fontSize: "12px", color: "#ffffff"
    }).setOrigin(0.5);
  }

  createHud() {
    this.hudBg = this.add.rectangle(18, 18, 300, 76, 0x17202a, 0.82).setOrigin(0);
    this.hpLabel = this.add.text(30, 27, "", { fontSize: "15px", color: "#ffffff" });
    this.hpBarBg = this.add.rectangle(115, 36, 150, 12, 0x5b2525);
    this.hpBar = this.add.rectangle(40, 36, 150, 12, 0xe74c3c).setOrigin(0, 0.5);
    this.expLabel = this.add.text(30, 55, "", { fontSize: "15px", color: "#ffffff" });
    this.expBarBg = this.add.rectangle(115, 64, 150, 10, 0x34495e);
    this.expBar = this.add.rectangle(40, 64, 0, 10, 0xf1c40f).setOrigin(0, 0.5);
    this.slimeLabel = this.add.text(560, 390, "SLIME  30/30", {
      fontSize: "13px", color: "#143b20", fontStyle: "bold",
      stroke: "#ffffff", strokeThickness: 3
    }).setOrigin(0.5);
  }

  updateHud() {
    this.hpLabel.setText(`HP  ${this.playerHP}/100`);
    this.hpBar.width = 150 * this.playerHP / 100;
    this.expLabel.setText(`LV ${this.level}   EXP ${this.exp}/${this.level * 20}`);
    this.expBar.width = 150 * this.exp / (this.level * 20);
    this.slimeLabel.setText(this.slimeHP > 0 ? `SLIME  ${this.slimeHP}/30` : "SLIME DEFEATED!");
  }

  attack() {
    if (this.time.now < this.lastAttack + 450) return;
    this.lastAttack = this.time.now;
    const facing = this.player.scaleX;
    const inRange = this.slimeHP > 0 &&
      Math.abs(this.player.x - this.slime.x) < 88 &&
      ((this.slime.x - this.player.x) * facing) > 0;

    const slash = this.add.rectangle(this.player.x + facing * 34, this.player.y - 8, 38, 5, 0xfff2a6);
    this.tweens.add({ targets: slash, alpha: 0, duration: 180, onComplete: () => slash.destroy() });

    if (inRange) {
      this.slimeHP = Math.max(0, this.slimeHP - 10);
      this.slime.setScale(1.15, 0.8);
      this.time.delayedCall(100, () => this.slime.setScale(1, 1));
      if (this.slimeHP === 0) {
        this.exp += 10;
        if (this.exp >= this.level * 20) {
          this.exp -= this.level * 20;
          this.level += 1;
          this.playerHP = Math.min(100, this.playerHP + 20);
          this.add.text(this.player.x, this.player.y - 75, "LEVEL UP!", {
            fontSize: "22px", color: "#fff36b", stroke: "#493b18", strokeThickness: 4
          }).setOrigin(0.5);
        }
      }
      this.updateHud();
    }
  }

  update() {
    if (this.playerHP <= 0) {
      this.player.body.setVelocityX(0);
      this.add.text(480, 250, "You fainted! Refresh to try again.", {
        fontSize: "24px", color: "#ffffff", backgroundColor: "#7b241c", padding: 12
      }).setOrigin(0.5);
      this.scene.pause();
      return;
    }

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    if (left) {
      this.player.body.setVelocityX(-210);
      this.player.scaleX = -1;
    } else if (right) {
      this.player.body.setVelocityX(210);
      this.player.scaleX = 1;
    } else {
      this.player.body.setVelocityX(0);
    }

    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    if ((Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
         Phaser.Input.Keyboard.JustDown(this.keys.up) ||
         Phaser.Input.Keyboard.JustDown(this.keys.w)) && grounded) {
      this.player.body.setVelocityY(-430);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) this.attack();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game",
  backgroundColor: "#8ed6ef",
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [AdventureScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);
