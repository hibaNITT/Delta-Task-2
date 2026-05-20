// Linking code to the HTML element
const canvas = document.getElementById("gameCanvas");

//This creates our drawing context (ctx) object.
// This is what we will use to draw on the canvas board..2d
const ctx = canvas.getContext("2d");

var player_position_x = 90; //  the player is inside Sector 1
var player_position_y = 85;

//CREATING ROOMS DYNAMICALLY

// Instantiating our 20-Room Map
var sectorRooms = [];

var gridColumns = 5;
var gridRows = 4;
var roomWidth = 136;
var roomHeight = 125;
var wallPadding = 20;

// Construct the 20 rooms dynamically
for (var row = 0; row < gridRows; row++) {
  for (var col = 0; col < gridColumns; col++) {
    // Calculate the exact pixel coordinates on the canvas for this room
    var roomX = wallPadding + col * (roomWidth + wallPadding);
    var roomY = wallPadding + row * (roomHeight + wallPadding);
    var sectorNumber = row * gridColumns + col + 1;

    // Create the individual room entity blueprint
    var roomZone = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      name: "Sector " + sectorNumber,
    };

    //SAT
    // Clockwise ordering of corners: Top-Left, Top-Right, Bottom-Right, Bottom-Left
    vertices: [
      { x: roomX, y: roomY }, // Corner 1
      { x: roomX + roomWidth, y: roomY }, // Corner 2
      { x: roomX + roomWidth, y: roomY + roomHeight }, // Corner 3
      { x: roomX, y: roomY + roomHeight }, // Corner 4
    ];

    //so to access this we can do sectorRooms[0].vertices[2]

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
  // Because these are separate if conditions rather than linked if/else statements,
  //if you hold down W and D at the exact same time, the engine will process both blocks and move you diagonally

  //detecting keyboard clicks
  var speed = 5;
  var radius = 15;

  if (keysPressed.w === true) {
    if (player_position_y - radius - speed >= 0) {
      player_position_y = player_position_y - speed;
    }
  }
  if (keysPressed.s === true) {
    if (player_position_y + radius + speed <= canvas.height) {
      player_position_y = player_position_y + speed;
    }
  }
  if (keysPressed.a === true) {
    if (player_position_x - radius - speed >= 0) {
      player_position_x = player_position_x - speed;
    }
  }
  if (keysPressed.d === true) {
    if (player_position_x + radius + speed <= canvas.width) {
      player_position_x = player_position_x + speed;
    }
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

    // Render the localized sector designation string in the corner
    ctx.fillStyle = "#00d2ff";
    ctx.font = "9px monospace";
    ctx.fillText(room.name, room.x + 6, room.y + 14);
  }

  //  player drawing styles
  ctx.fillStyle = "#ffff33";
  ctx.strokeStyle = "#000000"; // Black boundary outline
  ctx.lineWidth = 3;

  // Calculating the angle between player center and mouse cursor
  var distanceX = mouseX - player_position_x;
  var distanceY = mouseY - player_position_y;
  var angle = Math.atan2(distanceY, distanceX); //absolute angle (in radians)

  // Drawing the Weapon pointing line pointing toward the mouse
  var gunLength = 25;
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
  ctx.arc(player_position_x, player_position_y, 15, 0, Math.PI * 2);

  ctx.fill();
  ctx.stroke();

  var currentBullet = single_global_state_object.bulletHead;

  while (currentBullet !== null) {
    var nextBulletNode = currentBullet.next;

    // Update positions
    currentBullet.x += currentBullet.vx;
    currentBullet.y += currentBullet.vy;

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

function appendBulletNode(bulletData) {
  // linked list node package
  var newNode = {
    x: bulletData.x,
    y: bulletData.y,
    vx: bulletData.vx,
    vy: bulletData.vy,
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

    // Recalculate the current angle from the player to the cursor position
    var distanceX = mouseX - player_position_x;
    var distanceY = mouseY - player_position_y;
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
    };

    // Inject the bullet package directly into our linked list
    appendBulletNode(newBullet);
  }
});

// Manually start the loop for the very first time
mainGameLoop();
