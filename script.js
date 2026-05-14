$(document).ready(function () {

    var sessionHighScore = 0;
    var lanes = [16, 159, 301, 444];

    function GameObject(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
        this.element = null;
    }

    GameObject.prototype.isCollidingWith = function (other) {
        var padding = 10;
        return !(
            this.y + padding + (this.height - padding * 2) < other.y + padding ||
            this.y + padding > other.y + padding + (other.height - padding * 2) ||
            this.x + padding + (this.width - padding * 2) < other.x + padding ||
            this.x + padding > other.x + padding + (other.width - padding * 2)
        );
    };

    function Player() {
        GameObject.call(this, 110, 120);
        this.currentLane = 1;
        this.element = $('#player');
        this.resetPosition();
    }

    Player.prototype = Object.create(GameObject.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.resetPosition = function () {
        this.currentLane = 1;
        this.x = lanes[this.currentLane];
        this.y = 500;
        this.updateDOM();
    };

    Player.prototype.move = function (direction) {
        if (direction === 'left' && this.currentLane > 0) {
            this.currentLane--;
        } else if (direction === 'right' && this.currentLane < 3) {
            this.currentLane++;
        }
        this.x = lanes[this.currentLane];
        this.updateDOM();
    };

    Player.prototype.updateDOM = function () {
        this.element.css({ left: this.x + 'px', top: this.y + 'px' });
    };

    function Enemy(speed) {
        GameObject.call(this, 110, 120);
        var randomLaneIndex = Math.floor(Math.random() * lanes.length);
        this.x = lanes[randomLaneIndex];
        this.y = -150;
        this.speed = speed;

        this.element = $('<div class="car enemy"></div>');
        $('#game-area').append(this.element);
        this.updateDOM();
    }

    Enemy.prototype = Object.create(GameObject.prototype);
    Enemy.prototype.constructor = Enemy;

    Enemy.prototype.moveDown = function () {
        this.y += this.speed;
        this.updateDOM();
    };

    Enemy.prototype.updateDOM = function () {
        this.element.css({ left: this.x + 'px', top: this.y + 'px' });
    };

    Enemy.prototype.destroy = function () {
        this.element.remove();
    };

    var player = new Player();
    var enemies = [];
    var gameLoop;
    var spawnLoop;

    var gameState = {
        isRunning: false,
        score: 0,
        level: 1,
        enemySpeed: 5,
        spawnRate: 1000
    };

    function updateScore() {
        gameState.score += 10;
        $('#score').text(gameState.score);

        if (gameState.score >= 100 && gameState.level === 1) levelUp(2, 8, 800, '1.5s');
        else if (gameState.score >= 200 && gameState.level === 2) levelUp(3, 11, 600, '1.0s');
        else if (gameState.score >= 300 && gameState.level === 3) levelUp(4, 15, 500, '0.6s');
    }

    function levelUp(newLevel, newSpeed, newSpawnRate, roadAnimSpeed) {
        gameState.level = newLevel;
        gameState.enemySpeed = newSpeed;
        $('#level').text(gameState.level);

        for (var i = 0; i < enemies.length; i++) {
            enemies[i].speed = newSpeed;
        }

        $('#game-area').css('animation-duration', roadAnimSpeed);

        clearInterval(spawnLoop);
        spawnLoop = setInterval(spawnEnemy, newSpawnRate);
    }

    function spawnEnemy() {
        if (!gameState.isRunning) return;
        if (enemies.length < 3) {
            enemies.push(new Enemy(gameState.enemySpeed));
        }
    }

    function resetGame() {
        gameState.isRunning = true;
        gameState.score = 0;
        gameState.level = 1;
        gameState.enemySpeed = 5;

        $('#score').text('0');
        $('#level').text('1');
        $('#start-btn').text('RESTART');
        $('#game-area').css('animation-duration', '2s').addClass('road-moving');

        enemies.forEach(function (enemy) { enemy.destroy(); });
        enemies = [];

        player.resetPosition();

        clearInterval(gameLoop);
        clearInterval(spawnLoop);

        spawnLoop = setInterval(spawnEnemy, 1000);
        gameLoop = setInterval(updateFrame, 20);
    }

    function gameOver() {
        gameState.isRunning = false;
        clearInterval(gameLoop);
        clearInterval(spawnLoop);

        $('#game-area').removeClass('road-moving');
        $('#start-btn').text('PLAY AGAIN');

        var isNewHighScore = false;
        if (gameState.score > sessionHighScore) {
            sessionHighScore = gameState.score;
            isNewHighScore = true;
            $('#high-score').text(sessionHighScore);
        }

        Swal.fire({
            title: isNewHighScore && gameState.score > 0 ? "NEW HIGH SCORE!" : "CRASHED!",
            html: `
                <div style="font-size: 1.2em; margin-bottom: 10px;">Game Over!</div>
                <div><b>Score:</b> ${gameState.score}</div>
                <div><b>High Score:</b> ${sessionHighScore}</div>
            `,
            icon: isNewHighScore && gameState.score > 0 ? "success" : "error",
            draggable: true,
            confirmButtonText: "Play Again",
            confirmButtonColor: "#2e8b57",
            allowOutsideClick: false,
            heightAuto: false,

            background: "transparent",
            customClass: {
                popup: 'glass-alert'
            }

        }).then((result) => {
            if (result.isConfirmed) {
                resetGame();
            }
        });
    }

    function updateFrame() {
        if (!gameState.isRunning) return;

        for (var i = 0; i < enemies.length; i++) {
            var currentEnemy = enemies[i];
            currentEnemy.moveDown();

            if (player.isCollidingWith(currentEnemy)) {
                gameOver();
                return;
            }

            if (currentEnemy.y > 649) {
                currentEnemy.destroy();
                enemies.splice(i, 1);
                i--;
                updateScore();
            }
        }
    }

    $('#start-btn').click(function () {
        resetGame();
    });

    $(document).keydown(function (e) {
        if (!gameState.isRunning) return;

        if (e.key === "ArrowLeft") {
            player.move('left');
        } else if (e.key === "ArrowRight") {
            player.move('right');
        }
    });
});