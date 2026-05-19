// Linking code to the HTML element
const canvas = document.getElementById("gameCanvas");

//This creates our drawing context (ctx) object.
// This is what we will use to draw on the canvas board..2d
const ctx = canvas.getContext("2d");

//Global Tracking Coordinates - center
var player_position_x = 400;
var player_position_y = 300;

//global State Object
// instead of having many arrays , we store the arrays in a dictionary
const single_global_state_object = {
  enemies: [],
  bullets: [],
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

// This is our first required custom vector helper function
//This simple helper takes two numbers and wraps them into a clean, easy vector coordinate package.
function darkSpaceVector_create(x, y) {
  return { x: x, y: y };
}

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
    player_position_y = player_position_y + speed; // Move DOWN
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

  // SCAN, UPDATE, AND RENDER ACTIVE PROJECTILES
  for (var i = 0; i < single_global_state_object.bullets.length; i++) {
    // Fetch the specific bullet out of our state container
    var bullet = single_global_state_object.bullets[i];

    // Advance the bullet coordinates by its trajectory velocity factors
    bullet.x = bullet.x + bullet.vx;
    bullet.y = bullet.y + bullet.vy;

    // Memory Cleanup Check
    if (
      bullet.x < -10 ||
      bullet.x > canvas.width + 10 ||
      bullet.y < -10 ||
      bullet.y > canvas.height + 10
    ) {
      // Delete exactly 1 item at our current index position (i)
      single_global_state_object.bullets.splice(i, 1); //This is JavaScript's built-in array eraser command.

      continue; // Skip the drawing lines below and move to the next bullet!
    }

    // Set the graphics styling
    ctx.fillStyle = "#ff3333";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    // 3. Draw the projectile shape ...A small 4-pixel radius circle
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  //It tells the browser window to call main_game_loop again right before the monitor refreshes next.
  //This creates an elegant, highly optimized, non-stop recursive animation loop.
  requestAnimationFrame(mainGameLoop);
}

//window is a built-in, ultimate master object created automatically.
//It represents the entire tab window that your webpage is running inside.

// Event Listener for When a key is pressed
window.addEventListener("keydown", function (event) {
  var keyName = event.key.toLowerCase(); //to avoid capslock
  if (keyName in keysPressed) {
    keysPressed[keyName] = true;
  }
});

//  Event Listener for When a key is released
window.addEventListener("keyup", function (event) {
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
window.addEventListener("mousedown", function (event) {
  // Only fire if the player clicks the primary left mouse button (button 0)
  if (event.button === 0) {
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

    // Inject the bullet package directly into our state object storage array
    single_global_state_object.bullets.push(newBullet);
  }
});

// Manually start the loop for the very first time
mainGameLoop();
