// Core game logic, enemy spawning, the game loop, and rendering.

// --- BULLET HELPERS ---

// Add a new bullet node to the linked list.
function appendBulletNode(bulletData) {
  var newNode = {
    x: bulletData.x,
    y: bulletData.y,
    vx: bulletData.vx,
    vy: bulletData.vy,
    radius: bulletData.radius || 4,
    next: null,
    prev: null,
  };

  if (single_global_state_object.bulletHead === null) {
    single_global_state_object.bulletHead = newNode;
    single_global_state_object.bulletTail = newNode;
  } else {
    newNode.prev = single_global_state_object.bulletTail;
    single_global_state_object.bulletTail.next = newNode;
    single_global_state_object.bulletTail = newNode;
  }
}

// --- ENEMY SPAWNING ---

// Spawn one enemy in the center of every room.
function spawnEnemiesInRooms() {
  single_global_state_object.enemies = [];

  for (var i = 0; i < sectorRooms.length; i++) {
    var room = sectorRooms[i];
    var centerX = room.x + room.width / 2;
    var centerY = room.y + room.height / 2;

    var enemyBot = {
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 8,
      health: enemyMaxHealth,
      maxHealth: enemyMaxHealth,
      state: BOT_STATE_IDLE,
      currentRoomIndex: i,
      ownedRoomIndex: i,
      patrolTargetX: centerX,
      patrolTargetY: centerY,
      waitTimer: 0,
      alertTimer: 0,
      attackCooldownTimer: 0,
      facingAngle: Math.random() * Math.PI * 2,
      type: "normal",
      color: "#33ff33",
    };

    enemyBot.patrolTargetX = room.x + 16 + Math.random() * (room.width - 32);
    enemyBot.patrolTargetY = room.y + 16 + Math.random() * (room.height - 32);

    if (typeof applyEnemyVariantForRoom === "function") {
      applyEnemyVariantForRoom(enemyBot, i);
    }

    single_global_state_object.enemies.push(enemyBot);
  }
}

// --- PLAYER BULLET HELPERS ---

// Spawn a bullet fired by an enemy.
function spawnEnemyBullet(bot, targetX, targetY) {
  var dx = targetX - bot.x;
  var dy = targetY - bot.y;
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    distance = 1;
  }

  single_global_state_object.enemyBullets.push({
    x: bot.x,
    y: bot.y,
    vx: (dx / distance) * enemyBulletSpeed,
    vy: (dy / distance) * enemyBulletSpeed,
    radius: 3,
  });
}

// Move a bullet one step at a time and keep checking for wall bounces.
function advanceBulletWithWallChecks(bullet) {
  var travelDistance = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

  if (travelDistance === 0) {
    return;
  }

  var stepCount = Math.max(1, Math.ceil(travelDistance));

  for (var step = 0; step < stepCount; step++) {
    var currentSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

    if (currentSpeed === 0) {
      break;
    }

    bullet.x += bullet.vx / currentSpeed;
    bullet.y += bullet.vy / currentSpeed;

    reflectBulletFromWalls(bullet);
  }
}

// Reflect bullets from room walls.
function reflectBulletFromWalls(bullet) {
  for (var r = 0; r < sectorRooms.length; r++) {
    var activeRoom = sectorRooms[r];

    for (var w = 0; w < activeRoom.collisionWalls.length; w++) {
      var wallBox = activeRoom.collisionWalls[w];

      if (darkSpaceCollision_circleWithBox(bullet, wallBox)) {
        var xAxis = { x: 1, y: 0 };
        var yAxis = { x: 0, y: 1 };

        var bulletSpanX = darkSpaceProject_circle(bullet, xAxis);
        var wallSpanX = darkSpaceProject_box(wallBox, xAxis);
        var bulletSpanY = darkSpaceProject_circle(bullet, yAxis);
        var wallSpanY = darkSpaceProject_box(wallBox, yAxis);

        var overlapXamt =
          Math.min(bulletSpanX.max, wallSpanX.max) -
          Math.max(bulletSpanX.min, wallSpanX.min);
        var overlapYamt =
          Math.min(bulletSpanY.max, wallSpanY.max) -
          Math.max(bulletSpanY.min, wallSpanY.min);

        if (overlapXamt < overlapYamt) {
          var nx = bullet.x - (wallBox.x + wallBox.width / 2);
          var n = { x: Math.sign(nx) || 1, y: 0 };

          var dot = bullet.vx * n.x + bullet.vy * n.y;
          bullet.vx = bullet.vx - 2 * dot * n.x;
          bullet.vy = bullet.vy - 2 * dot * n.y;

          if (n.x > 0) {
            bullet.x = wallBox.x + wallBox.width + (bullet.radius || 4) + 0.2;
          } else {
            bullet.x = wallBox.x - (bullet.radius || 4) - 0.2;
          }
        } else {
          var ny = bullet.y - (wallBox.y + wallBox.height / 2);
          var n = { x: 0, y: Math.sign(ny) || 1 };

          var dotY = bullet.vx * n.x + bullet.vy * n.y;
          bullet.vx = bullet.vx - 2 * dotY * n.x;
          bullet.vy = bullet.vy - 2 * dotY * n.y;

          if (n.y > 0) {
            bullet.y = wallBox.y + wallBox.height + (bullet.radius || 4) + 0.2;
          } else {
            bullet.y = wallBox.y - (bullet.radius || 4) - 0.2;
          }
        }

        return true;
      }
    }
  }

  return false;
}

// --- GAME LOOP ---

// Remove dead enemies after their fade timer finishes.
function cleanupDeadEnemies() {
  for (var i = single_global_state_object.enemies.length - 1; i >= 0; i--) {
    var bot = single_global_state_object.enemies[i];

    if (bot.state === BOT_STATE_DEATH && bot.dying) {
      bot.deathTimer = (bot.deathTimer || 0) - 1;

      if (bot.deathTimer <= 0) {
        var roomIndex = bot.ownedRoomIndex;
        single_global_state_object.enemies.splice(i, 1);

        var stillAlive = false;
        for (var j = 0; j < single_global_state_object.enemies.length; j++) {
          var other = single_global_state_object.enemies[j];
          if (
            (other.ownedRoomIndex === roomIndex ||
              other.currentRoomIndex === roomIndex) &&
            other.state !== BOT_STATE_DEATH
          ) {
            stillAlive = true;
            break;
          }
        }

        if (!stillAlive && sectorRooms[roomIndex]) {
          sectorRooms[roomIndex].cleared = true;
          showRoomAlert((sectorRooms[roomIndex].name || "Room") + " cleared");
        }
      }
    }
  }
}

// Reset the game back to its starting state.
function resetGame() {
  player_position_x = 15;
  player_position_y = canvas.height / 2;
  player_health = player_max_health;
  gameScore = 0;
  gameStartTime = Date.now();
  gameOver = false;
  gameWon = false;
  gameOverSoundPlayed = false;
  gameWonSoundPlayed = false;
  previousRoomIndex = null;
  roomAlertMessage = "";
  roomAlertTimer = 0;
  explosionEffects = [];
  playerHasDestroyedAnyBot = false;

  keysPressed.w = false;
  keysPressed.a = false;
  keysPressed.s = false;
  keysPressed.d = false;

  single_global_state_object.bulletHead = null;
  single_global_state_object.bulletTail = null;
  single_global_state_object.enemyBullets = [];

  spawnEnemiesInRooms();
  setGamePaused(false);
  updateHUD();
}

// Main game loop.
function main_game_loop() {
  //check
  if (!gameHasStarted) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(main_game_loop);
    return;
  }

  if (roomAlertTimer > 0) {
    roomAlertTimer -= 1;
    if (roomAlertTimer === 0) {
      roomAlertMessage = "";
    }
  }

  if (playerHitFlashTimer > 0) {
    playerHitFlashTimer -= 1;
  }

  updateExplosionEffects();

  var currentRoomIndex = findPlayerCurrentRoomIndex(
    player_position_x,
    player_position_y,
  );

  if (
    previousRoomIndex !== null &&
    currentRoomIndex !== previousRoomIndex &&
    window.soundManager
  ) {
    window.soundManager.play("roomTransition");
  }

  previousRoomIndex = currentRoomIndex;

  single_global_state_object.activeRoomIndex = currentRoomIndex;
  single_global_state_object.activeRoom =
    currentRoomIndex >= 0 ? sectorRooms[currentRoomIndex] : null;

  var elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
  var remainingSeconds = gameDurationSeconds - elapsedSeconds;
  singleGlobalStateObject(elapsedSeconds, remainingSeconds);

  if (player_health <= 0) {
    gameOver = true;
    if (!gameOverSoundPlayed && window.soundManager) {
      window.soundManager.play("gameOver");
      gameOverSoundPlayed = true;
    }
  }

  if (remainingSeconds <= 0) {
    gameOver = true;
    if (!gameOverSoundPlayed && window.soundManager) {
      window.soundManager.play("gameOver");
      gameOverSoundPlayed = true;
    }
  }

  if (!gameOver && !gameWon) {
    var livingEnemyCount = 0;
    for (
      var enemyIndex = 0;
      enemyIndex < single_global_state_object.enemies.length;
      enemyIndex++
    ) {
      if (
        single_global_state_object.enemies[enemyIndex].state !== BOT_STATE_DEATH
      ) {
        livingEnemyCount += 1;
      }
    }

    if (
      livingEnemyCount === 0 &&
      single_global_state_object.enemies.length > 0
    ) {
      gameWon = true;
      if (!gameWonSoundPlayed && window.soundManager) {
        window.soundManager.play("gameWin");
        gameWonSoundPlayed = true;
      }
    }
  }

  if (gameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEndOverlay("Game Over", "Press Restart to try again");
    updateHUD();
    requestAnimationFrame(main_game_loop);
    return;
  }

  if (gameWon) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEndOverlay("Sector Cleared", "All hostile bots eliminated");
    updateHUD();
    requestAnimationFrame(main_game_loop);
    return;
  }

  if (gamePaused) {
    drawPauseOverlay();
    updateHUD();
    requestAnimationFrame(main_game_loop);
    return;
  }

  var speed = 3;
  var radius = 10;

  var previousPlayerX = player_position_x;
  var previousPlayerY = player_position_y;
  var roomIndexBeforeMove = findPlayerCurrentRoomIndex(
    previousPlayerX,
    previousPlayerY,
  );

  var next_x = player_position_x;
  var next_y = player_position_y;

  if (keysPressed.w === true) {
    if (player_position_y - radius - speed >= 0) {
      next_y = player_position_y - speed;
    }
  }
  if (keysPressed.s === true) {
    if (player_position_y + radius + speed <= canvas.height) {
      next_y = player_position_y + speed;
    }
  }
  if (keysPressed.a === true) {
    if (player_position_x - radius - speed >= 0) {
      next_x = player_position_x - speed;
    }
  }
  if (keysPressed.d === true) {
    if (player_position_x + radius + speed <= canvas.width) {
      next_x = player_position_x + speed;
    }
  }

  var futureX = { x: next_x, y: player_position_y, radius: radius };
  var futureY = { x: player_position_x, y: next_y, radius: radius };

  var blockX = false;
  var blockY = false;

  var roomsToCheck = [];
  if (single_global_state_object.activeRoom) {
    roomsToCheck.push(single_global_state_object.activeRoom);
  } else {
    roomsToCheck = sectorRooms;
  }

  for (var r = 0; r < roomsToCheck.length; r++) {
    var targetRoom = roomsToCheck[r];

    for (var w = 0; w < targetRoom.collisionWalls.length; w++) {
      var wallBox = targetRoom.collisionWalls[w];

      if (!blockX && darkSpaceCollision_circleWithBox(futureX, wallBox)) {
        var collidesWithDoorX = false;
        for (var di = 0; di < targetRoom.doors.length; di++) {
          var doorRect = targetRoom.doors[di];
          if (darkSpaceCollision_circleWithBox(futureX, doorRect)) {
            collidesWithDoorX = true;
            break;
          }
        }

        if (!collidesWithDoorX) {
          blockX = true;
        }
      }

      if (!blockY && darkSpaceCollision_circleWithBox(futureY, wallBox)) {
        var collidesWithDoorY = false;
        for (var di2 = 0; di2 < targetRoom.doors.length; di2++) {
          var doorRectY = targetRoom.doors[di2];
          if (darkSpaceCollision_circleWithBox(futureY, doorRectY)) {
            collidesWithDoorY = true;
            break;
          }
        }

        if (!collidesWithDoorY) {
          blockY = true;
        }
      }
    }

    if (blockX && blockY) {
      break;
    }
  }

  var deltaX = next_x - player_position_x;
  var deltaY = next_y - player_position_y;
  var bounceFactor = 0.2;

  if (!blockX) {
    player_position_x = next_x;
  } else if (deltaX !== 0) {
    player_position_x =
      player_position_x - Math.sign(deltaX) * Math.abs(deltaX) * bounceFactor;
  }

  if (!blockY) {
    player_position_y = next_y;
  } else if (deltaY !== 0) {
    player_position_y =
      player_position_y - Math.sign(deltaY) * Math.abs(deltaY) * bounceFactor;
  }

  var roomIndexAfterMove = findPlayerCurrentRoomIndex(
    player_position_x,
    player_position_y,
  );

  if (
    roomIndexAfterMove !== -1 &&
    roomIndexAfterMove !== roomIndexBeforeMove &&
    !canPlayerEnterRoom(roomIndexAfterMove)
  ) {
    player_position_x = previousPlayerX;
    player_position_y = previousPlayerY;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (var roomIndex = 0; roomIndex < sectorRooms.length; roomIndex++) {
    var room = sectorRooms[roomIndex];

    ctx.fillStyle = "rgba(12, 24, 18, 0.85)";
    ctx.fillRect(room.x, room.y, room.width, room.height);

    ctx.strokeStyle = "#00d2ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.width, room.height);

    ctx.fillStyle = "#051a05";
    for (var doorIndex = 0; doorIndex < room.doors.length; doorIndex++) {
      var door = room.doors[doorIndex];
      ctx.fillRect(door.x, door.y, door.width, door.height);
    }

    ctx.fillStyle = "#00d2ff";
    ctx.font = "9px monospace";
    ctx.fillText(room.name, room.x + 6, room.y + 14);
  }

  ctx.fillStyle = "#ffff33";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;

  updateEnemyUnits();
  drawEnemyUnits();
  updateEnemyBullets();
  drawEnemyBullets();
  drawExplosionEffects();

  var distanceX = mouseX - player_position_x;
  var distanceY = mouseY - player_position_y;
  var angle = Math.atan2(distanceY, distanceX);

  var gunLength = 15;
  var gunX = player_position_x + Math.cos(angle) * gunLength;
  var gunY = player_position_y + Math.sin(angle) * gunLength;

  ctx.strokeStyle = "#ffff33";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(player_position_x, player_position_y);
  ctx.lineTo(gunX, gunY);
  ctx.stroke();

  ctx.fillStyle = "#ffff33";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player_position_x, player_position_y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  updateHUD();

  var currentBullet = single_global_state_object.bulletHead;

  while (currentBullet !== null) {
    var nextBulletNode = currentBullet.next;

    if (blockPlayerFromRoom(currentBullet.x, currentBullet.y)) {
      if (currentBullet.prev !== null) {
        currentBullet.prev.next = currentBullet.next;
      } else {
        single_global_state_object.bulletHead = currentBullet.next;
      }

      if (currentBullet.next !== null) {
        currentBullet.next.prev = currentBullet.prev;
      } else {
        single_global_state_object.bulletTail = currentBullet.prev;
      }

      currentBullet = nextBulletNode;
      continue;
    }

    currentBullet.x += currentBullet.vx;
    currentBullet.y += currentBullet.vy;

    if (blockPlayerFromRoom(currentBullet.x, currentBullet.y)) {
      if (currentBullet.prev !== null) {
        currentBullet.prev.next = currentBullet.next;
      } else {
        single_global_state_object.bulletHead = currentBullet.next;
      }

      if (currentBullet.next !== null) {
        currentBullet.next.prev = currentBullet.prev;
      } else {
        single_global_state_object.bulletTail = currentBullet.prev;
      }

      currentBullet = nextBulletNode;
      continue;
    }

    reflectBulletFromWalls(currentBullet);

    var bulletHitEnemy = false;
    for (var e = 0; e < single_global_state_object.enemies.length; e++) {
      var enemy = single_global_state_object.enemies[e];

      if (enemy.state === BOT_STATE_DEATH || enemy.isHidden) {
        continue;
      }

      var enemyDistanceX = currentBullet.x - enemy.x;
      var enemyDistanceY = currentBullet.y - enemy.y;
      var enemyDistance = Math.sqrt(
        enemyDistanceX * enemyDistanceX + enemyDistanceY * enemyDistanceY,
      );

      if (enemyDistance <= currentBullet.radius + enemy.radius) {
        enemy.health -= 1;

        if (enemy.health <= 0) {
          enemy.health = 0;
          enemy.state = BOT_STATE_DEATH;

          if (!enemy.dying) {
            enemy.dying = true;
            enemy.deathTimerMax = 30;
            enemy.deathTimer = enemy.deathTimerMax;
            if (enemy.type !== "explosive_red") {
              triggerExplosionEffect(enemy.x, enemy.y);
            }
          }

          if (enemy.displayName) {
            showRoomAlert(enemy.displayName + " was destroyed");
          }

          if (enemy.type === "explosive_red") {
            triggerExplosionEffect(enemy.x, enemy.y);

            var playerExplosionDistanceX = player_position_x - enemy.x;
            var playerExplosionDistanceY = player_position_y - enemy.y;
            var playerExplosionDistance = Math.sqrt(
              playerExplosionDistanceX * playerExplosionDistanceX +
                playerExplosionDistanceY * playerExplosionDistanceY,
            );

            if (playerExplosionDistance <= (enemy.explosionRadius || 65)) {
              player_health -= enemy.explosionDamage || 3;
              playerHitFlashTimer = 18;

              if (player_health < 0) {
                player_health = 0;
              }

              showRoomAlert(
                (enemy.displayName || "Explosive Bot") + " exploded!",
              );
            }
          }

          playerHasDestroyedAnyBot = true;
          gameScore += enemyKillScore;
        }

        if (currentBullet.prev !== null) {
          currentBullet.prev.next = currentBullet.next;
        } else {
          single_global_state_object.bulletHead = currentBullet.next;
        }

        if (currentBullet.next !== null) {
          currentBullet.next.prev = currentBullet.prev;
        } else {
          single_global_state_object.bulletTail = currentBullet.prev;
        }

        bulletHitEnemy = true;
        break;
      }
    }

    if (bulletHitEnemy) {
      currentBullet = nextBulletNode;
      continue;
    }

    if (
      currentBullet.x < -10 ||
      currentBullet.x > canvas.width + 10 ||
      currentBullet.y < -10 ||
      currentBullet.y > canvas.height + 10
    ) {
      if (currentBullet.prev !== null) {
        currentBullet.prev.next = currentBullet.next;
      } else {
        single_global_state_object.bulletHead = currentBullet.next;
      }

      if (currentBullet.next !== null) {
        currentBullet.next.prev = currentBullet.prev;
      } else {
        single_global_state_object.bulletTail = currentBullet.prev;
      }

      currentBullet = nextBulletNode;
      continue;
    }

    ctx.fillStyle = "#ff3333";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(currentBullet.x, currentBullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    currentBullet = nextBulletNode;
  }

  cleanupDeadEnemies();
  renderVisibilityCone();
  drawPlayerTop();

  if (playerHitFlashTimer > 0) {
    var alpha = Math.min(0.9, (playerHitFlashTimer / 18) * 0.9);
    ctx.save();
    ctx.fillStyle = "rgba(255,0,0," + alpha + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  requestAnimationFrame(main_game_loop);
}

// --- CONE RENDERING ---

// Draw the black visibility cone and then redraw the visible scene inside it.
function renderVisibilityCone() {
  var ang = Math.atan2(mouseY - player_position_y, mouseX - player_position_x);
  var half = (visibilityFovDeg * Math.PI) / 180 / 2;
  var r = visibilityRadius;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(player_position_x, player_position_y);
  ctx.arc(
    player_position_x,
    player_position_y,
    r,
    ang - half,
    ang + half,
    false,
  );
  ctx.closePath();
  ctx.clip();

  drawSceneInsideCone();

  ctx.restore();
}

// Redraw the scene inside the visible cone.
function drawSceneInsideCone() {
  ctx.fillStyle = "#051a05";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (var r = 0; r < sectorRooms.length; r++) {
    var room = sectorRooms[r];

    ctx.fillStyle = "rgba(12, 24, 18, 0.85)";
    ctx.fillRect(room.x, room.y, room.width, room.height);

    ctx.strokeStyle = "#00d2ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.width, room.height);

    ctx.fillStyle = "#051a05";
    for (var d = 0; d < room.doors.length; d++) {
      var door = room.doors[d];
      ctx.fillRect(door.x, door.y, door.width, door.height);
    }

    ctx.fillStyle = "#00d2ff";
    ctx.font = "9px monospace";
    ctx.fillText(room.name, room.x + 6, room.y + 14);
  }

  drawEnemyUnits();
  drawEnemyBullets();
  drawExplosionEffects();

  var currentBullet = single_global_state_object.bulletHead;
  while (currentBullet !== null) {
    ctx.fillStyle = "#ff3333";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(currentBullet.x, currentBullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    currentBullet = currentBullet.next;
  }

  drawPlayerTop();
}
