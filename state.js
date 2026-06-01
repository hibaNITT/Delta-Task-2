// Game state variables, DOM references, and the generated room map.

var canvas = document.getElementById("gameCanvas");
var hudHealth = document.getElementById("hudHealth");
var hudScore = document.getElementById("hudScore");
var hudTime = document.getElementById("hudTime");
var hudRoomAlert = document.getElementById("hudRoomAlert");
var pauseToggleButton = document.getElementById("pauseToggleButton");
var restartButton = document.getElementById("restartButton");
var startGameButton = document.getElementById("startGameButton");
var rulesModal = document.getElementById("rulesModal");

var ctx = canvas.getContext("2d");

var player_position_x = 15;
var player_position_y = canvas.height / 2;
var player_max_health = 30;
var player_health = player_max_health;
var gameScore = 0;
var gameStartTime = Date.now();
var gamePaused = false;
var gameOver = false;
var gameWon = false;
var gameOverSoundPlayed = false;
var gameWonSoundPlayed = false;
var roomAlertMessage = "";
var roomAlertTimer = 0;
var explosionEffects = [];
var playerHitFlashTimer = 0;
var previousRoomIndex = null;
var playerHasDestroyedAnyBot = false;
var gameHasStarted = false;

var sectorRooms = [];

var totalGridWidth = gridColumns * roomWidth + (gridColumns + 1) * wallPadding;
var totalGridHeight = gridRows * roomHeight + (gridRows + 1) * wallPadding;
var startX = (canvas.width - totalGridWidth) / 2 + wallPadding;
var startY = (canvas.height - totalGridHeight) / 2 + wallPadding;

var single_global_state_object = {
  enemies: [],
  enemyBullets: [],
  bulletHead: null,
  bulletTail: null,
  activeRoomIndex: -1,
  activeRoom: null,
  player: {
    x: player_position_x,
    y: player_position_y,
    health: player_health,
    maxHealth: player_max_health,
  },
  frame: {
    elapsedSeconds: 0,
    remainingSeconds: gameDurationSeconds,
    score: gameScore,
    paused: gamePaused,
    over: gameOver,
    won: gameWon,
  },
};

var keysPressed = {
  w: false,
  a: false,
  s: false,
  d: false,
};

var mouseX = 400;
var mouseY = 300;

// Keeping the shared state object in sync with the current game values.
function singleGlobalStateObject(elapsedSeconds, remainingSeconds) {
  single_global_state_object.player.x = player_position_x;
  single_global_state_object.player.y = player_position_y;
  single_global_state_object.player.health = player_health;
  single_global_state_object.player.maxHealth = player_max_health;

  single_global_state_object.frame.elapsedSeconds = elapsedSeconds;
  single_global_state_object.frame.remainingSeconds = remainingSeconds;
  single_global_state_object.frame.score = gameScore;
  single_global_state_object.frame.paused = gamePaused;
  single_global_state_object.frame.over = gameOver;
  single_global_state_object.frame.won = gameWon;
}

for (var row = 0; row < gridRows; row++) {
  for (var col = 0; col < gridColumns; col++) {
    var roomX = startX + col * (roomWidth + wallPadding);
    var roomY = startY + row * (roomHeight + wallPadding);
    var sectorNumber = row * gridColumns + col + 1;
    var roomDoors = buildRoomDoors(
      roomX,
      roomY,
      roomWidth,
      roomHeight,
      row,
      col,
    );

    var roomZone = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      name: "Room " + sectorNumber,
      doors: roomDoors,
      collisionWalls: buildRoomCollisionWalls(
        roomX,
        roomY,
        roomWidth,
        roomHeight,
        roomDoors[0],
      ),
    };

    sectorRooms.push(roomZone);
  }
}
