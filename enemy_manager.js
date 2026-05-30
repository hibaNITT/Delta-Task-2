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
  var pinkRooms = [1, 7, 12];
  var blinkingLightBlueRooms = [5, 14];
  var lightPurpleTeleportRooms = [2, 9, 18];

  //making enemy bot function calls

  if (pinkRooms.indexOf(roomIndex) !== -1) {
    makePinkTenHealthBot(bot);
  }

  if (blinkingLightBlueRooms.indexOf(roomIndex) !== -1) {
    makeBlinkingLightBlueBot(bot);
  }

  if (lightPurpleTeleportRooms.indexOf(roomIndex) !== -1) {
    makeLightPurpleTeleportBot(bot);
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
