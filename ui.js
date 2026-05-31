// HUD updates, screen overlays, and other canvas UI drawing.

// --- GAME SCREEN HELPERS ---

// Pause or resume the game and update the button label.
function setGamePaused(nextPausedState) {
  gamePaused = nextPausedState;

  if (gamePaused) {
    keysPressed.w = false;
    keysPressed.a = false;
    keysPressed.s = false;
    keysPressed.d = false;
  }

  if (pauseToggleButton) {
    if (gamePaused) {
      pauseToggleButton.textContent = "Resume";
    } else {
      pauseToggleButton.textContent = "Pause";
    }
  }
}

// Draw the pause overlay on top of the game.
function drawPauseOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
  ctx.font = "14px monospace";
  ctx.fillText(
    "Press Resume to continue",
    canvas.width / 2,
    canvas.height / 2 + 28,
  );
  ctx.textAlign = "start";
}

// Draw the game over or win overlay on top of the game.
function drawEndOverlay(titleText, subtitleText) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px monospace";
  ctx.textAlign = "center";
  ctx.fillText(titleText, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "16px monospace";
  ctx.fillText(subtitleText, canvas.width / 2, canvas.height / 2 + 22);
  ctx.font = "bold 16px monospace";
  ctx.fillText(
    "Final Score: " + gameScore,
    canvas.width / 2,
    canvas.height / 2 + 46,
  );
  ctx.font = "13px monospace";
  ctx.fillText(
    "Press R or Restart to begin again",
    canvas.width / 2,
    canvas.height / 2 + 70,
  );
  ctx.textAlign = "start";
}

// Draw the player body and gun line on the canvas.
function drawPlayerTop() {
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
}

// Update the HUD text on screen.
function updateHUD() {
  var elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
  var remainingSeconds = gameDurationSeconds - elapsedSeconds;

  if (remainingSeconds < 0) {
    remainingSeconds = 0;
  }

  var minutes = Math.floor(remainingSeconds / 60);
  var seconds = remainingSeconds % 60;
  var timerText = minutes + ":";

  if (seconds < 10) {
    timerText += "0" + seconds;
  } else {
    timerText += seconds;
  }

  hudHealth.textContent =
    "Health: " + player_health + " / " + player_max_health;
  hudScore.textContent = "Score: " + gameScore;
  hudTime.textContent = "Time: " + timerText;
  hudRoomAlert.textContent = roomAlertMessage;

  var hudShortcuts = document.getElementById("hudShortcuts");
  if (hudShortcuts) {
    hudShortcuts.textContent =
      "Move: WASD | Aim: Mouse | Fire: Left Click | Pause/Resume: P | Restart: R";
  }

  updateEnemyLegend();
}

// Show the enemy info panel with counts and simple descriptions.
function updateEnemyLegend() {
  var legendEl = document.getElementById("enemyInfo");
  if (!legendEl) {
    return;
  }

  var known = [
    {
      key: "normal",
      name: "Standard Bot",
      color: "#33ff33",
      features: "Patrols its room, fires on the player when alerted",
    },
    {
      key: "roamer",
      name: "Roamer",
      color: "#002b66",
      features: "Wanders and can leave its room to chase the player",
    },
    {
      key: "phase_blink",
      name: "Phase Bot",
      color: "#7fdcff",
      features: "Blinks (hidden/visible) on a timer but in the same room",
    },
    {
      key: "teleport_light_purple",
      name: "Teleport Bot",
      color: "#d7a8ff",
      features: "Teleports into other empty rooms",
    },
    {
      key: "explosive_red",
      name: "Explosive Bot",
      color: "#ff2b2b",
      features:
        "Explodes on death, if the player is in the room on explosion the player loses 3 health...so escape immediately!!!!",
    },
    {
      key: "pink_immune",
      name: "Pink_Immune",
      color: "#ff7ab8",
      features: "Immune bot with 10 health",
    },
  ];

  var counts = {};
  for (var i = 0; i < single_global_state_object.enemies.length; i++) {
    var enemy = single_global_state_object.enemies[i];
    var typeKey = enemy.type || "normal";

    if (!counts[typeKey]) {
      counts[typeKey] = { total: 0, color: enemy.color || null };
    }

    if (enemy.state !== BOT_STATE_DEATH) {
      counts[typeKey].total += 1;
    }

    if (!counts[typeKey].color && enemy.color) {
      counts[typeKey].color = enemy.color;
    }
  }

  for (var knownIndex = 0; knownIndex < known.length; knownIndex++) {
    var knownEntry = known[knownIndex];
    if (!counts[knownEntry.key]) {
      counts[knownEntry.key] = { total: 0, color: knownEntry.color };
    } else if (!counts[knownEntry.key].color) {
      counts[knownEntry.key].color = knownEntry.color;
    }
  }

  for (var typeName in counts) {
    var found = false;
    for (var lookupIndex = 0; lookupIndex < known.length; lookupIndex++) {
      if (known[lookupIndex].key === typeName) {
        found = true;
        break;
      }
    }

    if (!found) {
      known.push({
        key: typeName,
        name: typeName,
        color: counts[typeName].color || "#999",
        features: "(custom)",
      });
    }
  }

  var html = "";
  for (var rowIndex = 0; rowIndex < known.length; rowIndex++) {
    var meta = known[rowIndex];
    var entry = counts[meta.key] || { total: 0, color: meta.color };
    var count = entry.total || 0;
    var swatchColor = entry.color || meta.color || "#888";
    var dimClass = "";

    if (count === 0) {
      dimClass = "opacity:0.45;";
    }

    html +=
      '<div class="legendRow" style="' +
      dimClass +
      '">\n' +
      '  <div class="legendSwatch" style="background:' +
      swatchColor +
      '"></div>\n' +
      '  <div class="legendText">' +
      meta.name +
      '<div style="font-size:11px;color:#9fcde6">' +
      meta.features +
      "</div></div>\n" +
      '  <div class="legendCount">' +
      count +
      "</div>\n" +
      "</div>\n";
  }

  legendEl.innerHTML = html;
}
