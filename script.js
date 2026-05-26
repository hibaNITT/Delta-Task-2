// Linking code to the HTML element
const canvas = document.getElementById("gameCanvas");
const hudHealth = document.getElementById("hudHealth");
const hudScore = document.getElementById("hudScore");
const hudTime = document.getElementById("hudTime");

//This creates our drawing context (ctx) object.
// This is what we will use to draw on the canvas board..2d
const ctx = canvas.getContext("2d");

// Place the player outside the generated room grid (left edge)
var player_position_x = 15;
var player_position_y = canvas.height / 2;
var player_max_health = 10;
var player_health = player_max_health;
var gameScore = 0;
var gameStartTime = Date.now();

//CREATING ROOMS DYNAMICALLY

// Instantiating our 20-Room Map
var sectorRooms = [];

var gridColumns = 5;
var gridRows = 4;
var roomWidth = 110;
var roomHeight = 110;
var wallPadding = 40;

// Calculate centered starting offsets so the whole grid is centered within the canvas
var totalGridWidth = gridColumns * roomWidth + (gridColumns + 1) * wallPadding;
var totalGridHeight = gridRows * roomHeight + (gridRows + 1) * wallPadding;
var startX = (canvas.width - totalGridWidth) / 2 + wallPadding;
var startY = (canvas.height - totalGridHeight) / 2 + wallPadding;

// Door settings for room transitions
var roomDoorWidth = 40;
var roomDoorThickness = 12;

function darkSpacePoint_inRect(pointX, pointY, rectangle) {
  return (
    pointX >= rectangle.x &&
    pointX <= rectangle.x + rectangle.width &&
    pointY >= rectangle.y &&
    pointY <= rectangle.y + rectangle.height
  );
}

function buildRoomDoors(roomX, roomY, roomWidth, roomHeight, row, col) {
  var halfDoor = roomDoorWidth / 2;
  var halfThickness = roomDoorThickness / 2;

  // Keep one door per room, but place it on a side that makes entry practical.
  // Left-most rooms open on the left so the player can enter from the starting side.
  if (col === 0) {
    return [
      {
        side: "left",
        x: roomX - halfThickness,
        y: roomY + roomHeight / 2 - halfDoor,
        width: roomDoorThickness,
        height: roomDoorWidth,
      },
    ];
  }

  if (row === 0) {
    return [
      {
        side: "top",
        x: roomX + roomWidth / 2 - halfDoor,
        y: roomY - halfThickness,
        width: roomDoorWidth,
        height: roomDoorThickness,
      },
    ];
  }

  if (col === gridColumns - 1) {
    return [
      {
        side: "right",
        x: roomX + roomWidth - halfThickness,
        y: roomY + roomHeight / 2 - halfDoor,
        width: roomDoorThickness,
        height: roomDoorWidth,
      },
    ];
  }

  if (row === gridRows - 1) {
    return [
      {
        side: "bottom",
        x: roomX + roomWidth / 2 - halfDoor,
        y: roomY + roomHeight - halfThickness,
        width: roomDoorWidth,
        height: roomDoorThickness,
      },
    ];
  }

  return [
    {
      side: "left",
      x: roomX - halfThickness,
      y: roomY + roomHeight / 2 - halfDoor,
      width: roomDoorThickness,
      height: roomDoorWidth,
    },
  ];
}

function darkSpacePoint_inAnyDoor(pointX, pointY, room) {
  for (var i = 0; i < room.doors.length; i++) {
    if (darkSpacePoint_inRect(pointX, pointY, room.doors[i])) {
      return true;
    }
  }

  return false;
}

function buildRoomCollisionWalls(roomX, roomY, roomWidth, roomHeight, door) {
  var wallThickness = 6;
  var walls = [];

  // Top wall
  walls.push({
    x: roomX,
    y: roomY,
    width: roomWidth,
    height: wallThickness,
  });

  // Bottom wall
  walls.push({
    x: roomX,
    y: roomY + roomHeight - wallThickness,
    width: roomWidth,
    height: wallThickness,
  });

  // Left wall, split around the door opening when the door is on the left side.
  if (door.side === "left") {
    walls.push({
      x: roomX,
      y: roomY + wallThickness,
      width: wallThickness,
      height: Math.max(0, door.y - (roomY + wallThickness)),
    });
    walls.push({
      x: roomX,
      y: door.y + door.height,
      width: wallThickness,
      height: Math.max(
        0,
        roomY + roomHeight - wallThickness - (door.y + door.height),
      ),
    });
  } else {
    walls.push({
      x: roomX,
      y: roomY + wallThickness,
      width: wallThickness,
      height: roomHeight - wallThickness * 2,
    });
  }

  // Right wall, split around the door opening when the door is on the right side.
  if (door.side === "right") {
    walls.push({
      x: roomX + roomWidth - wallThickness,
      y: roomY + wallThickness,
      width: wallThickness,
      height: Math.max(0, door.y - (roomY + wallThickness)),
    });
    walls.push({
      x: roomX + roomWidth - wallThickness,
      y: door.y + door.height,
      width: wallThickness,
      height: Math.max(
        0,
        roomY + roomHeight - wallThickness - (door.y + door.height),
      ),
    });
  } else {
    walls.push({
      x: roomX + roomWidth - wallThickness,
      y: roomY + wallThickness,
      width: wallThickness,
      height: roomHeight - wallThickness * 2,
    });
  }

  // Top wall, split around the door opening when the door is on the top side.
  if (door.side === "top") {
    walls.push({
      x: roomX + wallThickness,
      y: roomY,
      width: Math.max(0, door.x - (roomX + wallThickness)),
      height: wallThickness,
    });
    walls.push({
      x: door.x + door.width,
      y: roomY,
      width: Math.max(
        0,
        roomX + roomWidth - wallThickness - (door.x + door.width),
      ),
      height: wallThickness,
    });
  }

  // Bottom wall, split around the door opening when the door is on the bottom side.
  if (door.side === "bottom") {
    walls.push({
      x: roomX + wallThickness,
      y: roomY + roomHeight - wallThickness,
      width: Math.max(0, door.x - (roomX + wallThickness)),
      height: wallThickness,
    });
    walls.push({
      x: door.x + door.width,
      y: roomY + roomHeight - wallThickness,
      width: Math.max(
        0,
        roomX + roomWidth - wallThickness - (door.x + door.width),
      ),
      height: wallThickness,
    });
  }

  return walls;
}

function findPlayerCurrentRoomIndex(pointX, pointY) {
  for (var i = 0; i < sectorRooms.length; i++) {
    var room = sectorRooms[i];

    if (darkSpacePoint_inRect(pointX, pointY, room)) {
      return i;
    }

    if (darkSpacePoint_inAnyDoor(pointX, pointY, room)) {
      return i;
    }
  }

  return -1;
}

//declaring state of enemy bots
//assigning numbers to each state so that its easy to apply checks

var BOT_STATE_IDLE = 0;
var BOT_STATE_ALERT = 1;
var BOT_STATE_CHASE = 2;
var BOT_STATE_ATTACK = 3;
var BOT_STATE_DEATH = 4;

var enemyPatrolSpeed = 1.2;
var enemyPatrolWaitFrames = 45;
var enemyDetectionRange = 50;
var enemyAlertDuration = 300;
var enemyChaseSpeed = 1.8;
var enemyAttackRange = 28;
var enemyAttackDamage = 1;
var enemyAttackCooldownFrames = 30;
var enemyMaxHealth = 3;
var enemyBulletDamage = 1;
var enemyKillScore = 1;

// Construct the 20 rooms dynamically
for (var row = 0; row < gridRows; row++) {
  for (var col = 0; col < gridColumns; col++) {
    // Calculate the exact pixel coordinates on the canvas for this room
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

    // Create the individual room entity blueprint
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

    // Push it into our master map registry array
    sectorRooms.push(roomZone);
  }
}

//global State Object
// instead of having many arrays , we store the arrays in a dictionary
const single_global_state_object = {
  enemies: [],
  bulletHead: null, // FIRST bullet node in our chain
  bulletTail: null, // LAST bullet node in our chain
  activeRoomIndex: -1,
  activeRoom: null,
};

// Input State Dictionary
var keysPressed = {
  w: false,
  a: false,
  s: false,
  d: false,
};

//your weapon system default-aims neatly forward.
var mouseX = 400;
var mouseY = 300;

// GAME LOOP -  runs 60 times per sec
function mainGameLoop() {
  var currentRoomIndex = findPlayerCurrentRoomIndex(
    player_position_x,
    player_position_y,
  );

  single_global_state_object.activeRoomIndex = currentRoomIndex;
  single_global_state_object.activeRoom =
    currentRoomIndex >= 0 ? sectorRooms[currentRoomIndex] : null;

  // Because these are separate if conditions rather than linked if/else statements,
  //if you hold down W and D at the exact same time, the engine will process both blocks and move you diagonally

  //detecting keyboard clicks
  var speed = 5;
  var radius = 10;

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

  //INTEGRATING THE SAT LOGIC
  //INTEGRATING THE SAT LOGIC

  // Prepare three tentative positions: X-only and Y-only
  var futureX = { x: next_x, y: player_position_y, radius: radius };
  var futureY = { x: player_position_x, y: next_y, radius: radius };

  // Track whether movement along each axis is blocked
  var blockX = false;
  var blockY = false;

  for (var r = 0; r < sectorRooms.length; r++) {
    var targetRoom = sectorRooms[r];

    // Only the wall strips should block movement.
    // The door gap is left out of these collisions

    for (var w = 0; w < targetRoom.collisionWalls.length; w++) {
      var wallBox = targetRoom.collisionWalls[w];

      if (!blockX && darkSpaceCollision_circleWithBox(futureX, wallBox)) {
        blockX = true;
      }
      if (!blockY && darkSpaceCollision_circleWithBox(futureY, wallBox)) {
        blockY = true;
      }
    }

    if (blockX && blockY) break;
  }

  // Compute deltas attempted this frame
  var deltaX = next_x - player_position_x;
  var deltaY = next_y - player_position_y;

  // Weaker bounce factor per user request
  var bounceFactor = 0.2;

  // Apply X movement or a small bounce if blocked
  if (!blockX) {
    player_position_x = next_x;
  } else if (deltaX !== 0) {
    player_position_x =
      player_position_x - Math.sign(deltaX) * Math.abs(deltaX) * bounceFactor;
  }

  // Apply Y movement or a small bounce if blocked
  if (!blockY) {
    player_position_y = next_y;
  } else if (deltaY !== 0) {
    player_position_y =
      player_position_y - Math.sign(deltaY) * Math.abs(deltaY) * bounceFactor;
  }

  // Wiping the rectangle canvas completely clean
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //rendering the 20 room facility
  for (var r = 0; r < sectorRooms.length; r++) {
    var room = sectorRooms[r];

    // Paint the interior floors
    ctx.fillStyle = "rgba(12, 24, 18, 0.85)";
    ctx.fillRect(room.x, room.y, room.width, room.height);

    // Draw the solid outer perimeter walls
    ctx.strokeStyle = "#00d2ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.width, room.height);

    // Cut openings in the wall outline so the room has visible doors.
    ctx.fillStyle = "#051a05";
    for (var d = 0; d < room.doors.length; d++) {
      var door = room.doors[d];
      ctx.fillRect(door.x, door.y, door.width, door.height);
    }

    // Render the localized sector designation string in the corner
    ctx.fillStyle = "#00d2ff";
    ctx.font = "9px monospace";
    ctx.fillText(room.name, room.x + 6, room.y + 14);
  }

  //  player drawing styles
  ctx.fillStyle = "#ffff33";
  ctx.strokeStyle = "#000000"; // Black boundary outline
  ctx.lineWidth = 3;

  updateEnemyUnits();
  drawEnemyUnits();

  // Calculating the angle between player center and mouse cursor
  var distanceX = mouseX - player_position_x;
  var distanceY = mouseY - player_position_y;
  var angle = Math.atan2(distanceY, distanceX); //absolute angle (in radians)

  // Drawing the Weapon pointing line pointing toward the mouse
  var gunLength = 15;
  var gunX = player_position_x + Math.cos(angle) * gunLength;
  var gunY = player_position_y + Math.sin(angle) * gunLength;

  ctx.strokeStyle = "#ffff33"; // Make the gun match the yellow player body
  ctx.lineWidth = 5; // Make the gun thick and visible

  ctx.beginPath();
  ctx.moveTo(player_position_x, player_position_y); // Start line at player center
  ctx.lineTo(gunX, gunY); // Draw line outward toward mouse direction
  ctx.stroke();

  // In canvas programming, items drawn first sit underneath items drawn later.
  //  Render the core player circle over the top of the gun base
  ctx.fillStyle = "#ffff33";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;

  // Drawing the player shape .. A full circle or arc

  // Tells the canvas rendering engine to start tracking a brand new line sequence or geometric shape path.
  ctx.beginPath();

  //general syntax to draw this - .arc(x,y,radius,start,end)....here 360
  ctx.arc(player_position_x, player_position_y, 10, 0, Math.PI * 2);

  ctx.fill();
  ctx.stroke();

  updateHUD();

  var currentBullet = single_global_state_object.bulletHead;

  while (currentBullet !== null) {
    var nextBulletNode = currentBullet.next;

    // Update positions
    currentBullet.x += currentBullet.vx;
    currentBullet.y += currentBullet.vy;

    //BOUNCE DETECTOR
    for (var r = 0; r < sectorRooms.length; r++) {
      var activeRoom = sectorRooms[r];

      if (darkSpaceCollision_circleWithBox(currentBullet, activeRoom)) {
        var xAxis = { x: 1, y: 0 };
        var yAxis = { x: 0, y: 1 };

        // Measure shadow overlap on the horizontal axis
        var bulletSpanX = darkSpaceProject_circle(currentBullet, xAxis);
        var roomSpanX = darkSpaceProject_box(activeRoom, xAxis);
        // Measure shadow overlap on the vertical axis
        var bulletSpanY = darkSpaceProject_circle(currentBullet, yAxis);
        var roomSpanY = darkSpaceProject_box(activeRoom, yAxis);

        // Compute penetration amounts along each axis (how far they overlap)
        var overlapXamt =
          Math.min(bulletSpanX.max, roomSpanX.max) -
          Math.max(bulletSpanX.min, roomSpanX.min);
        var overlapYamt =
          Math.min(bulletSpanY.max, roomSpanY.max) -
          Math.max(bulletSpanY.min, roomSpanY.min);

        // Angle of Incidence Reflection Engine: resolve along smallest penetration axis
        if (overlapXamt < overlapYamt) {
          // Struck a vertical face (side wall): invert horizontal velocity
          currentBullet.vx = -currentBullet.vx;

          // Push bullet just outside the wall on the X axis
          if (currentBullet.x < activeRoom.x + activeRoom.width / 2) {
            currentBullet.x = activeRoom.x - (currentBullet.radius || 4) - 0.1;
          } else {
            currentBullet.x =
              activeRoom.x +
              activeRoom.width +
              (currentBullet.radius || 4) +
              0.1;
          }
        } else {
          // Struck a horizontal face (ceiling/floor): invert vertical velocity
          currentBullet.vy = -currentBullet.vy;

          // Push bullet just outside the wall on the Y axis
          if (currentBullet.y < activeRoom.y + activeRoom.height / 2) {
            currentBullet.y = activeRoom.y - (currentBullet.radius || 4) - 0.1;
          } else {
            currentBullet.y =
              activeRoom.y +
              activeRoom.height +
              (currentBullet.radius || 4) +
              0.1;
          }
        }

        break; // Impact resolved for this bullet frame ... skip remaining rooms
      }
    }

    // Check if the bullet hits any enemy bot.
    for (var e = 0; e < single_global_state_object.enemies.length; e++) {
      var enemyBot = single_global_state_object.enemies[e];

      if (enemyBot.state === BOT_STATE_DEATH) {
        continue;
      }

      var enemyDistanceX = currentBullet.x - enemyBot.x;
      var enemyDistanceY = currentBullet.y - enemyBot.y;
      var enemyHitDistance = Math.sqrt(
        enemyDistanceX * enemyDistanceX + enemyDistanceY * enemyDistanceY,
      );

      if (enemyHitDistance <= currentBullet.radius + enemyBot.radius) {
        enemyBot.health -= enemyBulletDamage;

        if (enemyBot.health <= 0) {
          enemyBot.health = 0;
          enemyBot.state = BOT_STATE_DEATH;
          enemyBot.vx = 0;
          enemyBot.vy = 0;
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

        currentBullet = nextBulletNode;
        continue;
      }
    }

    // Offscreen Cleanup
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

    // Drawing bullet
    ctx.fillStyle = "#ff3333";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(currentBullet.x, currentBullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    currentBullet = nextBulletNode;
  }

  //It tells the browser window to call main_game_loop again right before the monitor refreshes next.
  //This creates an elegant, highly optimized, non-stop recursive animation loop.
  requestAnimationFrame(mainGameLoop);
}

function updateHUD() {
  var elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

  hudHealth.textContent =
    "Health: " + player_health + " / " + player_max_health;
  hudScore.textContent = "Score: " + gameScore;
  hudTime.textContent = "Time: " + elapsedSeconds + "s";
}

function appendBulletNode(bulletData) {
  // linked list node package
  var newNode = {
    x: bulletData.x,
    y: bulletData.y,
    vx: bulletData.vx,
    vy: bulletData.vy,
    radius: bulletData.radius || 4,
    next: null,
    prev: null,
  };

  //  If our chain is completely empty, this new node becomes both the Head and Tail
  if (single_global_state_object.bulletHead === null) {
    single_global_state_object.bulletHead = newNode;
    single_global_state_object.bulletTail = newNode;
  } else {
    // Otherwise, attatching the current tail node to our incoming node's back
    newNode.prev = single_global_state_object.bulletTail;

    //attatching the old tail's forward  to point to our incoming node
    single_global_state_object.bulletTail.next = newNode;

    // incrementing our main pointer
    single_global_state_object.bulletTail = newNode;
  }
}

// Function to dynamically place an enemy at the center of each sector room
function spawnEnemiesInRooms() {
  // Clear any existing items in the array to avoid double spawning
  single_global_state_object.enemies = [];

  // Loop through all 20 rooms generated in our grid
  for (var i = 0; i < sectorRooms.length; i++) {
    var room = sectorRooms[i];

    // Calculating the exact center coordinates of the room
    var centerX = room.x + room.width / 2;
    var centerY = room.y + room.height / 2;

    // Construct the complete blueprint object for this specific bot
    var enemyBot = {
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * 2, // Random starting X speed between -1 and 1
      vy: (Math.random() - 0.5) * 2, // Random starting Y speed between -1 and 1
      radius: 8, // Physical size of the bot
      health: enemyMaxHealth, // Takes a few bullet hits to destroy
      maxHealth: enemyMaxHealth, // Tracking baseline for a future health bar
      state: BOT_STATE_IDLE, // Begins in the idle state machine phase
      currentRoomIndex: i, // Remembers which room number it belongs to
      patrolTargetX: centerX,
      patrolTargetY: centerY,
      waitTimer: 0,
      alertTimer: 0,
      attackCooldownTimer: 0,
    };

    // Push the newly created bot into our master state dictionary array
    single_global_state_object.enemies.push(enemyBot);
  }
}

// Call the function immediately to populate the map when the script runs
spawnEnemiesInRooms();

// SAT helper functions

// This is our first required custom vector helper function
//This simple helper takes two numbers and wraps them into a clean, easy vector coordinate package.
function darkSpaceVector_create(x, y) {
  return { x: x, y: y };
}

// Calculate a vector line running from pointB to pointA
function darkSpaceVector_line(vectorA, vectorB) {
  return {
    x: vectorA.x - vectorB.x,
    y: vectorA.y - vectorB.y,
  };
}

// Rotate a vector line by 90 degrees to find the perpendicular angle of a wall
function darkSpaceVector_perpendicular(vector) {
  return {
    x: -vector.y,
    y: vector.x,
  };
}

// Shrinking a directional vector down to a length of 1 unit...normalize
function darkSpaceVector_normalize(vector) {
  var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

  // Safety check: Avoid dividing by zero if the line has no length
  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

//Project a single coordinate point onto a tracking normal axis (Dot Product Formula)
function darkSpaceVector_formula(point, axis) {
  return point.x * axis.x + point.y * axis.y;
}

// Flatten a full circle entity into a 1D min/max shadow line along a given axis
function darkSpaceProject_circle(circle, axis) {
  // Finding where the absolute center point lands on the axis line
  var centerProjected = darkSpaceVector_formula(circle, axis);

  // Stretching out the shadow span in both directions by the circle's radius length
  return {
    min: centerProjected - circle.radius,
    max: centerProjected + circle.radius,
  };
}

// Flatten a 4-cornered wall e into a 1D shadow line
function darkSpaceProject_box(box, axis) {
  // Collect all 4 corner coordinates of the rectangular obstacle
  var corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];

  // Project the very first corner to set an initial baseline
  var initialProjected = darkSpaceVector_formula(corners[0], axis);
  var min = initialProjected;
  var max = initialProjected;

  // Looping through the remaining 3 corners to find the absolute extreme boundaries
  for (var i = 1; i < corners.length; i++) {
    var currentProjected = darkSpaceVector_formula(corners[i], axis);

    if (currentProjected < min) {
      min = currentProjected;
    }
    if (currentProjected > max) {
      max = currentProjected;
    }
  }

  return { min: min, max: max };
}

// Checking if two projected shadow overlap each other on an axis
function darkSpaceOverlap_check(shadowA, shadowB) {
  if (shadowA.max < shadowB.min || shadowB.max < shadowA.min) {
    return false;
  }
  return true;
}

//  Separating Axis Theorem - collision

function darkSpaceCollision_circleWithBox(circle, box) {
  // A standard grid box provides two primary structural axes to check
  var checkAxes = [
    { x: 1, y: 0 }, // Horizontal check line
    { x: 0, y: 1 }, // Vertical check line
  ];

  // Finding the box corner point that sits closest to our circle center
  var closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  var closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

  // Calculating a specialized vector tracking from that corner to the circle center
  var cornerAxisX = circle.x - closestX;
  var cornerAxisY = circle.y - closestY;
  var distance = Math.sqrt(
    cornerAxisX * cornerAxisX + cornerAxisY * cornerAxisY,
  );

  // If the distance is not zero, turn this vector into a clean tracking axis unit line
  if (distance !== 0) {
    checkAxes.push({
      x: cornerAxisX / distance,
      y: cornerAxisY / distance,
    });
  }

  // Loop through every single tracking axis to search for an exit gap
  for (var i = 0; i < checkAxes.length; i++) {
    var currentAxis = checkAxes[i];

    // Flatten both entities into 1D shadows along this specific line
    var playerShadow = darkSpaceProject_circle(circle, currentAxis);
    var wallShadow = darkSpaceProject_box(box, currentAxis);

    // Check if their shadows are currently touching
    var overlapping = darkSpaceOverlap_check(playerShadow, wallShadow);

    // If even one axis has a gap (no overlap), they are absolutely not colliding
    if (!overlapping) {
      return false;
    }
  }

  // If every single shadow overlapped perfectly, we have a confirmed collision
  return true;
}

//window is a built-in, ultimate master object created automatically.
//It represents the entire tab window that your webpage is running inside.

// Event Listener for When a key is pressed
document.addEventListener("keydown", function (event) {
  var keyName = event.key.toLowerCase(); //to avoid capslock
  if (keyName in keysPressed) {
    keysPressed[keyName] = true;
  }
});

//  Event Listener for When a key is released
document.addEventListener("keyup", function (event) {
  var keyName = event.key.toLowerCase();
  if (keyName in keysPressed) {
    keysPressed[keyName] = false;
  }
});

// Update enemy patrol movement before drawing them
function updateEnemyUnits() {
  var currentBots = single_global_state_object.enemies;

  for (var i = 0; i < currentBots.length; i++) {
    var bot = currentBots[i];

    if (bot.state === BOT_STATE_DEATH) {
      continue;
    }

    var room = sectorRooms[bot.currentRoomIndex];

    //calculating distance to player
    var distanceToPlayerX = player_position_x - bot.x;
    var distanceToPlayerY = player_position_y - bot.y;
    var distanceToPlayer = Math.sqrt(
      distanceToPlayerX * distanceToPlayerX +
        distanceToPlayerY * distanceToPlayerY,
    );

    if (
      bot.state === BOT_STATE_IDLE &&
      distanceToPlayer <= enemyDetectionRange
    ) {
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
        }
      }

      // Keep patrol enemies inside their assigned room boundaries.
      bot.x = Math.max(
        room.x + bot.radius,
        Math.min(bot.x, room.x + room.width - bot.radius),
      );
      bot.y = Math.max(
        room.y + bot.radius,
        Math.min(bot.y, room.y + room.height - bot.radius),
      );
    } else if (bot.state === BOT_STATE_ALERT) {
      if (bot.alertTimer > 0) {
        bot.alertTimer -= 1;
      }
      //so alert state is for the player to get aware , then when alert timer ends the bot starts to attack
      // Stay locked in place while alert so the next step can turn this into chase.
      bot.vx = 0;
      bot.vy = 0;

      // Once the alert timer ends, switch into chase.
      if (bot.alertTimer <= 0) {
        bot.state = BOT_STATE_CHASE;
      }
    } else if (bot.state === BOT_STATE_CHASE) {
      bot.vx = (distanceToPlayerX / distanceToPlayer) * enemyChaseSpeed;
      bot.vy = (distanceToPlayerY / distanceToPlayer) * enemyChaseSpeed;
      bot.x += bot.vx;
      bot.y += bot.vy;

      if (distanceToPlayer <= enemyAttackRange) {
        if (bot.attackCooldownTimer > 0) {
          bot.attackCooldownTimer -= 1;
        } else {
          player_health -= enemyAttackDamage;
          if (player_health < 0) {
            player_health = 0;
          }
          bot.attackCooldownTimer = enemyAttackCooldownFrames;
        }
      } else {
        bot.attackCooldownTimer = 0;
      }

      // Keep chasing enemies inside their assigned room boundaries.
      bot.x = Math.max(
        room.x + bot.radius,
        Math.min(bot.x, room.x + room.width - bot.radius),
      );
      bot.y = Math.max(
        room.y + bot.radius,
        Math.min(bot.y, room.y + room.height - bot.radius),
      );
    }
  }
}

//rendering enimies on canvas
function drawEnemyUnits() {
  //  Pull the live array of enemies from our global state
  var currentBots = single_global_state_object.enemies;

  // Loop through every single bot
  for (var i = 0; i < currentBots.length; i++) {
    var bot = currentBots[i];

    if (bot.state === BOT_STATE_DEATH) {
      continue;
    }

    //  Begin a fresh drawing path on the canvas context
    ctx.beginPath();

    //bot body
    ctx.arc(bot.x, bot.y, 10, 0, Math.PI * 2);

    ctx.fillStyle = "#FF3333";
    ctx.fill();
    ctx.closePath();
  }
}

// Hardware Listener for Mouse Tracking
window.addEventListener("mousemove", function (event) {
  //  where the canvas sits relative to the entire webpage browser screen
  var canvasBounds = canvas.getBoundingClientRect();

  // Extract screen coordinates and subtract the canvas position offset
  mouseX = event.clientX - canvasBounds.left;
  mouseY = event.clientY - canvasBounds.top;
});

// Hardware Listener for gun shooting - Mouse Clicks
canvas.addEventListener("mousedown", function (event) {
  // Only fire if the player clicks the primary left mouse button (button 0)
  if (event.button === 0) {
    event.preventDefault();

    // Use the actual click coordinates (not the last mousemove) so bullets match click angle
    var canvasBounds = canvas.getBoundingClientRect();
    var clickX = event.clientX - canvasBounds.left;
    var clickY = event.clientY - canvasBounds.top;

    // Recalculate the current angle from the player to the click position
    var distanceX = clickX - player_position_x;
    var distanceY = clickY - player_position_y;
    var currentAngle = Math.atan2(distanceY, distanceX);

    // Find the exact tip of the gun where the bullet should appear
    var gunLength = 25;
    var bulletStartX = player_position_x + Math.cos(currentAngle) * gunLength;
    var bulletStartY = player_position_y + Math.sin(currentAngle) * gunLength;

    // speed factor
    var bulletSpeed = 7;

    // Break down the angle into velocity increments
    var velocityX = Math.cos(currentAngle) * bulletSpeed;
    var velocityY = Math.sin(currentAngle) * bulletSpeed;

    // Assemble the complete projectile property package...this is created for every click
    var newBullet = {
      x: bulletStartX,
      y: bulletStartY,
      vx: velocityX,
      vy: velocityY,
      radius: 4,
    };

    // Inject the bullet package directly into our linked list
    appendBulletNode(newBullet);
  }
});

// Manually start the loop for the very first time
mainGameLoop();
