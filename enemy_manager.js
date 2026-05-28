// Roamer enemy type: when in CHASE state it wanders around the room
function makeRoamer(bot) {
  bot.type = "roamer";
  bot.color = "#002b66";
  bot.roamTargetX = bot.x;
  bot.roamTargetY = bot.y;
  bot.roamTimer = 0;
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
