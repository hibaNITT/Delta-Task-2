// Roamer enemy type: when in CHASE state it wanders around the room
function makeRoamerBot(bot) {
  bot.type = "roamer";
  bot.color = "#002b66";
  bot.roamTargetX = bot.x;
  bot.roamTargetY = bot.y;
  bot.roamTimer = 0;
  // Give roamers higher health by default
  bot.maxHealth = 5;
  bot.health = 5;
}

// Light blue bot that disappears and reappears in the same room on a timer.
function makeBlinkingLightBlueBot(bot) {
  bot.type = "phase_blink";
  bot.color = "#7fdcff";
  bot.visibleTimer = 50;
  bot.hiddenTimer = 90;
  bot.blinkTimer = bot.visibleTimer;
  bot.isHidden = false;
  bot.maxHealth = 5;
  bot.health = 5;
}

// Light purple bot that can teleport between special empty rooms.
function makeLightPurpleTeleportBot(bot) {
  bot.type = "teleport_light_purple";
  bot.color = "#d7a8ff";
  bot.maxHealth = 3;
  bot.health = 3;
  bot.teleportCooldownFrames = 180;
  bot.teleportTimer = bot.teleportCooldownFrames;
}

// Red bot that explodes when it dies.
function makeExplosiveRedBot(bot) {
  bot.type = "explosive_red";
  bot.color = "#ff2b2b";
  bot.maxHealth = 3;
  bot.health = 3;
  bot.explosionRadius = 65;
  bot.explosionDamage = 3;
}

function updateBlinkingLightBlueBot(bot) {
  if (bot.type !== "phase_blink") {
    return;
  }

  if (typeof bot.blinkTimer !== "number") {
    bot.blinkTimer = bot.isHidden ? bot.hiddenTimer : bot.visibleTimer;
  }

  if (bot.blinkTimer > 0) {
    bot.blinkTimer -= 1;
    return;
  }

  bot.isHidden = !bot.isHidden;
  bot.blinkTimer = bot.isHidden ? bot.hiddenTimer : bot.visibleTimer;

  if (bot.isHidden) {
    bot.vx = 0;
    bot.vy = 0;
  }
}
//to make the bots pink
function makePinkTenHealthBot(bot) {
  bot.type = "pink_tank";
  bot.color = "#ff7ab8";
  bot.maxHealth = 10;
  bot.health = 10;
}

function applyEnemyVariantForRoom(bot, roomIndex) {
  var roamerRooms = [0, 6, 15];
  var pinkRooms = [1, 7, 12];
  var blinkingLightBlueRooms = [5, 14, 8];
  var lightPurpleTeleportRooms = [2, 9, 18];
  var explosiveRedRooms = [3, 10, 19];

  //making enemy bot function calls

  if (pinkRooms.indexOf(roomIndex) !== -1) {
    makePinkTenHealthBot(bot);
  }

  if (roamerRooms.indexOf(roomIndex) !== -1) {
    if (typeof makeRoamerBot === "function") {
      makeRoamerBot(bot);
    } else {
      bot.type = "roamer";
      bot.color = "#002b66";
      bot.maxHealth = 5;
      bot.health = 5;
    }
  }

  if (blinkingLightBlueRooms.indexOf(roomIndex) !== -1) {
    makeBlinkingLightBlueBot(bot);
  }

  if (lightPurpleTeleportRooms.indexOf(roomIndex) !== -1) {
    makeLightPurpleTeleportBot(bot);
    bot.displayName =
      "Bot " + (lightPurpleTeleportRooms.indexOf(roomIndex) + 1);
  }

  if (explosiveRedRooms.indexOf(roomIndex) !== -1) {
    makeExplosiveRedBot(bot);
    bot.displayName =
      "Explosive Bot " + (explosiveRedRooms.indexOf(roomIndex) + 1);
  }
}

function updateRoamerChase(bot) {
  // Roamer chase behavior: follow the player but with occasional wandering offsets
  // and allow leaving the original room to pursue the player.
  if (!bot.roamTimer || bot.roamTimer <= 0) {
    // pick a dynamic target near the player
    var angle = Math.random() * Math.PI * 2;
    var radius = 20 + Math.random() * 80; // 20-100 px orbit
    bot.roamTargetX = player_position_x + Math.cos(angle) * radius;
    bot.roamTargetY = player_position_y + Math.sin(angle) * radius;
    bot.roamTimer = 30 + Math.floor(Math.random() * 90); // 0.5-2 seconds
  }

  var dx = bot.roamTargetX - bot.x;
  var dy = bot.roamTargetY - bot.y;
  var dist = Math.sqrt(dx * dx + dy * dy) || 1;

  var speed = typeof enemyChaseSpeed !== "undefined" ? enemyChaseSpeed : 1.8;
  bot.vx = (dx / dist) * speed;
  bot.vy = (dy / dist) * speed;
  bot.x += bot.vx;
  bot.y += bot.vy;
  bot.facingAngle = Math.atan2(bot.vy, bot.vx);
  bot.roamTimer -= 1;
}

// Check if an enemy can currently see the player.
function enemyCanSeePlayer(bot) {
  var dx = player_position_x - bot.x;
  var dy = player_position_y - bot.y;
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > enemyVisionRange) {
    return false;
  }

  if (distance === 0) {
    return true;
  }

  var angleToPlayer = Math.atan2(dy, dx);
  var halfCone = (enemyVisionConeDeg * Math.PI) / 180 / 2;
  var angleDiff = angleToPlayer - bot.facingAngle;

  while (angleDiff > Math.PI) {
    angleDiff -= Math.PI * 2;
  }

  while (angleDiff < -Math.PI) {
    angleDiff += Math.PI * 2;
  }

  return Math.abs(angleDiff) <= halfCone;
}

// Find empty rooms that a teleport bot can move into.
function getEligibleTeleportRooms(bot) {
  var eligibleRooms = [];

  for (var roomIndex = 0; roomIndex < sectorRooms.length; roomIndex++) {
    if (roomIndex === bot.currentRoomIndex) {
      continue;
    }

    if (isRoomEmptyAndUnowned(roomIndex, bot)) {
      eligibleRooms.push(roomIndex);
    }
  }

  return eligibleRooms;
}

// Teleport the purple bot into another empty room when its timer ends.
function tryTeleportLightPurpleBot(bot) {
  if (bot.type !== "teleport_light_purple") {
    return;
  }

  if (typeof bot.teleportTimer !== "number") {
    bot.teleportTimer = bot.teleportCooldownFrames || 180;
  }

  if (bot.teleportTimer > 0) {
    bot.teleportTimer -= 1;
    return;
  }

  var availableRooms = getEligibleTeleportRooms(bot);

  if (availableRooms.length > 0) {
    var fromRoomIndex = bot.currentRoomIndex;
    var pickIndex = Math.floor(Math.random() * availableRooms.length);
    var nextRoomIndex = availableRooms[pickIndex];
    var nextRoom = sectorRooms[nextRoomIndex];
    var fromRoom = sectorRooms[fromRoomIndex];
    var botName = bot.displayName || "Bot";

    if (fromRoom && nextRoom) {
      showRoomAlert(
        botName +
          " teleported from " +
          fromRoom.name +
          " to " +
          nextRoom.name +
          ".",
      );
    }

    bot.x = nextRoom.x + nextRoom.width / 2;
    bot.y = nextRoom.y + nextRoom.height / 2;
    bot.currentRoomIndex = nextRoomIndex;
    bot.ownedRoomIndex = nextRoomIndex;
    bot.patrolTargetX = bot.x;
    bot.patrolTargetY = bot.y;
    bot.vx = 0;
    bot.vy = 0;
  }

  bot.teleportTimer = bot.teleportCooldownFrames || 180;
}

// Return the room assigned to this enemy.
function getBotAssignedRoom(bot) {
  return (
    sectorRooms[bot.ownedRoomIndex] || sectorRooms[bot.currentRoomIndex] || null
  );
}

// Keep normal enemies inside their assigned room.
function keepBotInsideAssignedRoom(bot, room) {
  if (!room || bot.type === "roamer") {
    return;
  }

  bot.x = Math.max(
    room.x + bot.radius,
    Math.min(bot.x, room.x + room.width - bot.radius),
  );
  bot.y = Math.max(
    room.y + bot.radius,
    Math.min(bot.y, room.y + room.height - bot.radius),
  );
}

// Keep the current room index updated for each enemy.
function syncBotRoomIndex(bot) {
  if (bot.type === "roamer" || bot.type === "teleport_light_purple") {
    bot.currentRoomIndex = findPlayerCurrentRoomIndex(bot.x, bot.y);
    return;
  }

  bot.currentRoomIndex = bot.ownedRoomIndex;
}

// Update all enemy movement and attack behavior.
function updateEnemyUnits() {
  var currentBots = single_global_state_object.enemies;
  var activeRoomIndex = single_global_state_object.activeRoomIndex;

  for (var i = 0; i < currentBots.length; i++) {
    var bot = currentBots[i];

    if (bot.state === BOT_STATE_DEATH) {
      continue;
    }

    if (typeof updateBlinkingLightBlueBot === "function") {
      updateBlinkingLightBlueBot(bot);

      if (bot.isHidden) {
        bot.vx = 0;
        bot.vy = 0;
        continue;
      }
    }

    if (bot.type === "teleport_light_purple") {
      tryTeleportLightPurpleBot(bot);
    }

    if (
      bot.type !== "roamer" &&
      bot.type !== "teleport_light_purple" &&
      bot.currentRoomIndex !== activeRoomIndex
    ) {
      continue;
    }

    var room = getBotAssignedRoom(bot);
    if (!room) {
      continue;
    }

    var distanceToPlayerX = player_position_x - bot.x;
    var distanceToPlayerY = player_position_y - bot.y;
    var distanceToPlayer = Math.sqrt(
      distanceToPlayerX * distanceToPlayerX +
        distanceToPlayerY * distanceToPlayerY,
    );

    if (bot.state === BOT_STATE_IDLE && enemyCanSeePlayer(bot)) {
      bot.state = BOT_STATE_ALERT;
      bot.alertTimer = enemyAlertDuration;
      bot.waitTimer = 0;
      bot.patrolTargetX = bot.x;
      bot.patrolTargetY = bot.y;
    }

    if (bot.state === BOT_STATE_IDLE) {
      if (bot.waitTimer > 0) {
        bot.waitTimer -= 1;
      } else {
        var dx = bot.patrolTargetX - bot.x;
        var dy = bot.patrolTargetY - bot.y;
        var distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (distanceToTarget < 4) {
          bot.waitTimer = enemyPatrolWaitFrames;
          bot.patrolTargetX = room.x + 16 + Math.random() * (room.width - 32);
          bot.patrolTargetY = room.y + 16 + Math.random() * (room.height - 32);
        } else {
          bot.vx = (dx / distanceToTarget) * enemyPatrolSpeed;
          bot.vy = (dy / distanceToTarget) * enemyPatrolSpeed;
          bot.x += bot.vx;
          bot.y += bot.vy;
          bot.facingAngle = Math.atan2(bot.vy, bot.vx);
        }
      }

      keepBotInsideAssignedRoom(bot, room);
    } else if (bot.state === BOT_STATE_ALERT) {
      if (bot.alertTimer > 0) {
        bot.alertTimer -= 1;
      }

      bot.vx = 0;
      bot.vy = 0;

      if (bot.alertTimer <= 0) {
        bot.state = BOT_STATE_CHASE;
      }
    } else if (bot.state === BOT_STATE_CHASE) {
      if (distanceToPlayer === 0) {
        distanceToPlayer = 1;
      }

      if (bot.type === "roamer" && typeof updateRoamerChase === "function") {
        updateRoamerChase(bot);

        var toPlayerX = player_position_x - bot.x;
        var toPlayerY = player_position_y - bot.y;
        var toPlayerDist = Math.sqrt(
          toPlayerX * toPlayerX + toPlayerY * toPlayerY,
        );

        if (toPlayerDist <= enemyAttackRange) {
          bot.vx = 0;
          bot.vy = 0;
          bot.facingAngle = Math.atan2(toPlayerY, toPlayerX);
          bot.state = BOT_STATE_ATTACK;
        }
      } else {
        if (distanceToPlayer > enemyAttackRange) {
          bot.vx = (distanceToPlayerX / distanceToPlayer) * enemyChaseSpeed;
          bot.vy = (distanceToPlayerY / distanceToPlayer) * enemyChaseSpeed;
          bot.x += bot.vx;
          bot.y += bot.vy;
          bot.facingAngle = Math.atan2(bot.vy, bot.vx);
        } else {
          bot.vx = 0;
          bot.vy = 0;
          bot.facingAngle = Math.atan2(distanceToPlayerY, distanceToPlayerX);
          bot.state = BOT_STATE_ATTACK;
        }

        keepBotInsideAssignedRoom(bot, room);
      }
    } else if (bot.state === BOT_STATE_ATTACK) {
      bot.vx = 0;
      bot.vy = 0;
      bot.facingAngle = Math.atan2(distanceToPlayerY, distanceToPlayerX);

      if (distanceToPlayer > enemyAttackRange + 12) {
        bot.state = BOT_STATE_CHASE;
        bot.attackCooldownTimer = 0;
        continue;
      }

      if (bot.attackCooldownTimer > 0) {
        bot.attackCooldownTimer -= 1;
      } else {
        spawnEnemyBullet(bot, player_position_x, player_position_y);
        bot.attackCooldownTimer = enemyAttackCooldownFrames;
      }
    }

    syncBotRoomIndex(bot);
  }
}

// Draw enemy bodies and health bars.
function drawEnemyUnits() {
  var currentBots = single_global_state_object.enemies;

  for (var i = 0; i < currentBots.length; i++) {
    var bot = currentBots[i];

    if (bot.isHidden) {
      continue;
    }

    if (bot.state === BOT_STATE_DEATH && !(bot.dying && bot.deathTimer > 0)) {
      continue;
    }

    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.radius + 2, 0, Math.PI * 2);

    var alpha = 1;
    if (bot.state === BOT_STATE_DEATH && bot.dying && bot.deathTimerMax) {
      alpha = Math.max(0, bot.deathTimer / bot.deathTimerMax);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = bot.color || "#FF3333";
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    var barHeight = 4;
    var barWidth = Math.max(24, (bot.maxHealth || 3) * 8);
    var segmentWidth = barWidth / (bot.maxHealth || 3);
    var barX = bot.x - barWidth / 2;
    var barY = bot.y - bot.radius - 12;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    for (var segment = 0; segment < (bot.maxHealth || 3); segment++) {
      ctx.fillStyle = segment < bot.health ? "#33ff33" : "#143014";
      ctx.fillRect(
        barX + segment * segmentWidth + 1,
        barY + 1,
        segmentWidth - 2,
        barHeight - 2,
      );
    }
  }
}

// Update enemy-fired bullets.
function updateEnemyBullets() {
  for (
    var i = single_global_state_object.enemyBullets.length - 1;
    i >= 0;
    i--
  ) {
    var bullet = single_global_state_object.enemyBullets[i];

    advanceBulletWithWallChecks(bullet);

    var playerDistanceX = bullet.x - player_position_x;
    var playerDistanceY = bullet.y - player_position_y;
    var playerDistance = Math.sqrt(
      playerDistanceX * playerDistanceX + playerDistanceY * playerDistanceY,
    );

    if (playerDistance <= bullet.radius + 10) {
      player_health -= 1;
      playerHitFlashTimer = 12;

      if (player_health < 0) {
        player_health = 0;
      }

      if (player_health <= 0) {
        gameOver = true;
      }

      single_global_state_object.enemyBullets.splice(i, 1);
      continue;
    }

    if (
      bullet.x < -10 ||
      bullet.x > canvas.width + 10 ||
      bullet.y < -10 ||
      bullet.y > canvas.height + 10
    ) {
      single_global_state_object.enemyBullets.splice(i, 1);
    }
  }
}

// Draw enemy-fired bullets.
function drawEnemyBullets() {
  for (var i = 0; i < single_global_state_object.enemyBullets.length; i++) {
    var bullet = single_global_state_object.enemyBullets[i];

    ctx.fillStyle = "#15ff00";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}
