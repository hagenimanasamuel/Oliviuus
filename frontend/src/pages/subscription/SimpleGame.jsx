import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const UmukinoWoKwiruka = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    let car;
    let obstacles;
    let amasimu;
    let score = 0;
    let umubareWamamoto;
    let timer;
    let timeLeft = 60;
    let gameOver = false;
    let cursors;
    let amanotaText;
    let igiheText;
    let imirongo;

    function preload() {
      // Create simple graphics instead of loading images
      this.load.baseURL = 'data:image/png;base64,';
      
      // Red car (player)
      const carGraphics = this.cache.addImage('car', '', createCarGraphics());
      
      // Green obstacles
      const obstacleGraphics = this.cache.addImage('obstacle', '', createObstacleGraphics());
      
      // Yellow coins
      const coinGraphics = this.cache.addImage('coin', '', createCoinGraphics());
      
      // Road lines
      const lineGraphics = this.cache.addImage('line', '', createLineGraphics());
    }

    function createCarGraphics() {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 70;
      const ctx = canvas.getContext('2d');
      
      // Red car body
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(5, 0, 30, 50);
      ctx.fillRect(0, 20, 40, 30);
      
      // Windows
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(10, 5, 20, 15);
      
      // Wheels
      ctx.fillStyle = '#333333';
      ctx.fillRect(5, 45, 8, 8);
      ctx.fillRect(27, 45, 8, 8);
      ctx.fillRect(5, 10, 8, 8);
      ctx.fillRect(27, 10, 8, 8);
      
      return canvas.toDataURL().split(',')[1];
    }

    function createObstacleGraphics() {
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      
      // Green obstacle
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, 50, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.fillText('STOP', 5, 30);
      
      return canvas.toDataURL().split(',')[1];
    }

    function createCoinGraphics() {
      const canvas = document.createElement('canvas');
      canvas.width = 30;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      
      // Yellow coin
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(15, 15, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.arc(15, 15, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      return canvas.toDataURL().split(',')[1];
    }

    function createLineGraphics() {
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      
      // White road line
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 10, 30);
      
      return canvas.toDataURL().split(',')[1];
    }

    function create() {
      // Add road background
      this.add.rectangle(400, 300, 800, 600, 0x666666);
      
      // Create road lines (middle divider)
      imirongo = this.physics.add.group();
      for (let i = 0; i < 20; i++) {
        const line = imirongo.create(400, i * 60, 'line');
        line.setVelocityY(200);
      }

      // Create player car
      car = this.physics.add.sprite(400, 500, 'car');
      car.setCollideWorldBounds(true);

      // Create obstacles
      obstacles = this.physics.add.group();
      
      // Create coins
      amasimu = this.physics.add.group();

      // Setup controls
      cursors = this.input.keyboard.createCursorKeys();

      // Create score and timer text
      amanotaText = this.add.text(16, 16, 'Amanota: 0', { 
        fontSize: '24px', 
        fill: '#FFFFFF',
        fontFamily: 'Arial'
      });

      igiheText = this.add.text(600, 16, 'Igihe: 60', { 
        fontSize: '24px', 
        fill: '#FFFFFF',
        fontFamily: 'Arial'
      });

      // Game instructions
      this.add.text(250, 550, 'Koresha arrow keys kugirango utware imodoka!', {
        fontSize: '16px',
        fill: '#FFFFFF',
        fontFamily: 'Arial'
      });

      // Timer event
      timer = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
      });

      // Spawn obstacles and coins
      this.time.addEvent({
        delay: 1500,
        callback: spawnObstacle,
        callbackScope: this,
        loop: true
      });

      this.time.addEvent({
        delay: 1000,
        callback: spawnCoin,
        callbackScope: this,
        loop: true
      });

      // Collisions
      this.physics.add.overlap(car, amasimu, collectCoin, null, this);
      this.physics.add.collider(car, obstacles, hitObstacle, null, this);
    }

    function spawnObstacle() {
      if (gameOver) return;
      
      const x = Phaser.Math.Between(100, 700);
      const obstacle = obstacles.create(x, -50, 'obstacle');
      obstacle.setVelocityY(Phaser.Math.Between(150, 250));
      obstacle.setAngularVelocity(Phaser.Math.Between(-50, 50));
    }

    function spawnCoin() {
      if (gameOver) return;
      
      const x = Phaser.Math.Between(100, 700);
      const coin = amasimu.create(x, -30, 'coin');
      coin.setVelocityY(Phaser.Math.Between(100, 200));
    }

    function collectCoin(car, coin) {
      coin.disableBody(true, true);
      score += 10;
      amanotaText.setText('Amanota: ' + score);
    }

    function hitObstacle(car, obstacle) {
      obstacle.disableBody(true, true);
      score = Math.max(0, score - 5);
      amanotaText.setText('Amanota: ' + score);
    }

    function updateTimer() {
      timeLeft--;
      igiheText.setText('Igihe: ' + timeLeft);
      
      if (timeLeft <= 0) {
        endGame();
      }
    }

    function endGame() {
      gameOver = true;
      timer.remove();
      
      // Stop all objects
      obstacles.clear(true, true);
      amasimu.clear(true, true);
      imirongo.clear(true, true);
      
      // Display final score
      const finalScore = this.add.text(400, 250, 'Umukino Warangije!', {
        fontSize: '32px',
        fill: '#FFFFFF',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      this.add.text(400, 300, 'Amanota Yawe: ' + score, {
        fontSize: '28px',
        fill: '#FFD700',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      if (score >= 100) {
        this.add.text(400, 350, 'Utsinze! 🏆', {
          fontSize: '32px',
          fill: '#00FF00',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
      } else {
        this.add.text(400, 350, 'Ongera ugerageze! 💪', {
          fontSize: '32px',
          fill: '#FF0000',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
      }
      
      this.add.text(400, 400, 'Kanda R kugirango utangire nanone', {
        fontSize: '20px',
        fill: '#FFFFFF',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }

    function update() {
      if (gameOver) {
        // Restart game when R is pressed
        if (cursors.space.isDown) {
          this.scene.restart();
        }
        return;
      }

      // Car controls
      if (cursors.left.isDown) {
        car.setVelocityX(-300);
      } else if (cursors.right.isDown) {
        car.setVelocityX(300);
      } else {
        car.setVelocityX(0);
      }

      if (cursors.up.isDown) {
        car.setVelocityY(-300);
      } else if (cursors.down.isDown) {
        car.setVelocityY(300);
      } else {
        car.setVelocityY(0);
      }

      // Clean up objects that go off screen
      obstacles.getChildren().forEach(obstacle => {
        if (obstacle.y > 650) {
          obstacle.disableBody(true, true);
        }
      });

      amasimu.getChildren().forEach(coin => {
        if (coin.y > 650) {
          coin.disableBody(true, true);
        }
      });
    }

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Umukino Wo Kwiruka - Igitaragaza</h2>
      <div ref={gameRef} />
      <div style={{ marginTop: '10px', color: '#666' }}>
        <p><strong>Amabwiriza:</strong> Twara imodoka yawe ukwira amasimu (Zahabu) udakubita ibyago (Ibirara)</p>
        <p><strong>Intego:</strong> Kunga amanota menshi mumabura minota!</p>
      </div>
    </div>
  );
};

export default UmukinoWoKwiruka;