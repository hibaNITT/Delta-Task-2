// Keyboard, mouse, and touch input listeners.

// Update the stored mouse position.
function updateMousePosition(event) {
  var canvasBounds = canvas.getBoundingClientRect();
  var pointX = event.clientX;
  var pointY = event.clientY;

  if (event.touches && event.touches.length > 0) {
    pointX = event.touches[0].clientX;
    pointY = event.touches[0].clientY;
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    pointX = event.changedTouches[0].clientX;
    pointY = event.changedTouches[0].clientY;
  }

  mouseX = pointX - canvasBounds.left;
  mouseY = pointY - canvasBounds.top;
}

// Fire the player's weapon.
function handleGunFire(event) {
  if (window.soundManager) {
    window.soundManager.unlock();
  }

  if (gamePaused || gameOver || gameWon) {
    event.preventDefault();
    return;
  }

  var canvasBounds = canvas.getBoundingClientRect();
  var clickX = event.clientX;
  var clickY = event.clientY;

  if (event.touches && event.touches.length > 0) {
    clickX = event.touches[0].clientX;
    clickY = event.touches[0].clientY;
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    clickX = event.changedTouches[0].clientX;
    clickY = event.changedTouches[0].clientY;
  }

  clickX = clickX - canvasBounds.left;
  clickY = clickY - canvasBounds.top;

  if (
    clickX < 0 ||
    clickX > canvasBounds.width ||
    clickY < 0 ||
    clickY > canvasBounds.height
  ) {
    return;
  }

  if (
    event.button === 0 ||
    event.pointerType === "touch" ||
    event.type === "touchstart"
  ) {
    event.preventDefault();

    var distanceX = clickX - player_position_x;
    var distanceY = clickY - player_position_y;
    var currentAngle = Math.atan2(distanceY, distanceX);
    var bulletSpeed = 7;
    var velocityX = Math.cos(currentAngle) * bulletSpeed;
    var velocityY = Math.sin(currentAngle) * bulletSpeed;

    var newBullet = {
      x: player_position_x,
      y: player_position_y,
      vx: velocityX,
      vy: velocityY,
      radius: 4,
    };

    appendBulletNode(newBullet);

    if (window.soundManager) {
      window.soundManager.play("shoot");
    }
  }
}

// Keyboard input.
document.addEventListener("keydown", function (event) {
  if (window.soundManager) {
    window.soundManager.unlock();
  }

  var keyName = event.key.toLowerCase();

  if (keyName === "p") {
    event.preventDefault();
    if (!gameOver && !gameWon) {
      setGamePaused(!gamePaused);
    }
    return;
  }

  if (keyName === "r" && (gameOver || gameWon)) {
    event.preventDefault();
    resetGame();
    return;
  }

  if (keyName in keysPressed) {
    if (gamePaused || gameOver || gameWon) {
      event.preventDefault();
      return;
    }
    keysPressed[keyName] = true;
  }
});

document.addEventListener("keyup", function (event) {
  var keyName = event.key.toLowerCase();
  if (keyName in keysPressed) {
    keysPressed[keyName] = false;
  }
});

// Mouse and touch input.
if (window.PointerEvent) {
  canvas.addEventListener("pointermove", updateMousePosition);
  canvas.addEventListener("pointerdown", handleGunFire);
} else {
  canvas.addEventListener("mousemove", updateMousePosition);
  canvas.addEventListener("touchmove", updateMousePosition);
  canvas.addEventListener("mousedown", handleGunFire);
  canvas.addEventListener("touchstart", handleGunFire);
}

// Buttons.
pauseToggleButton.addEventListener("click", function () {
  setGamePaused(!gamePaused);
});

restartButton.addEventListener("click", function () {
  resetGame();
});
