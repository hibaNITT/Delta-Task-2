// Small helper functions for room math, collision checks, and effects.

// --- ROOM HELPERS ---

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

  walls.push({
    x: roomX,
    y: roomY,
    width: roomWidth,
    height: wallThickness,
  });

  walls.push({
    x: roomX,
    y: roomY + roomHeight - wallThickness,
    width: roomWidth,
    height: wallThickness,
  });

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

function isSpecialTeleportRoom(roomIndex) {
  for (var i = 0; i < specialTeleportRoomIndices.length; i++) {
    if (specialTeleportRoomIndices[i] === roomIndex) {
      return true;
    }
  }

  return false;
}

function isRoomEmptyAndUnowned(roomIndex, ignoreBot) {
  for (var i = 0; i < single_global_state_object.enemies.length; i++) {
    var bot = single_global_state_object.enemies[i];

    if (bot === ignoreBot || bot.state === BOT_STATE_DEATH) {
      continue;
    }

    if (
      bot.currentRoomIndex === roomIndex ||
      bot.ownedRoomIndex === roomIndex
    ) {
      return false;
    }
  }

  return true;
}

function canPlayerEnterRoom(roomIndex) {
  if (!isSpecialTeleportRoom(roomIndex)) {
    return true;
  }

  if (!playerHasDestroyedAnyBot) {
    return false;
  }

  return isRoomEmptyAndUnowned(roomIndex, null);
}

function showRoomAlert(message) {
  roomAlertMessage = message;
  roomAlertTimer = 120;
}

// --- EXPLOSION HELPERS ---

function triggerExplosionEffect(centerX, centerY) {
  var sparks = [];

  for (var i = 0; i < 10; i++) {
    var angle = (Math.PI * 2 * i) / 10;
    sparks.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * (1.5 + Math.random() * 2.5),
      vy: Math.sin(angle) * (1.5 + Math.random() * 2.5),
      life: 16 + Math.floor(Math.random() * 8),
    });
  }

  explosionEffects.push({
    x: centerX,
    y: centerY,
    radius: 6,
    maxRadius: 65,
    life: 24,
    maxLife: 24,
    sparks: sparks,
  });
}

function updateExplosionEffects() {
  for (var i = explosionEffects.length - 1; i >= 0; i--) {
    var effect = explosionEffects[i];
    effect.life -= 1;

    for (var s = 0; s < effect.sparks.length; s++) {
      effect.sparks[s].x += effect.sparks[s].vx;
      effect.sparks[s].y += effect.sparks[s].vy;
      effect.sparks[s].life -= 1;
    }

    if (effect.life <= 0) {
      explosionEffects.splice(i, 1);
    }
  }
}

function drawExplosionEffects() {
  for (var i = 0; i < explosionEffects.length; i++) {
    var effect = explosionEffects[i];
    var lifeRatio = effect.life / effect.maxLife;
    var currentRadius =
      effect.radius + (effect.maxRadius - effect.radius) * (1 - lifeRatio);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.beginPath();
    ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 80, 0, " + 0.18 * lifeRatio + ")";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(effect.x, effect.y, currentRadius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 230, 90, " + 0.22 * lifeRatio + ")";
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + 0.85 * lifeRatio + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (var s = 0; s < effect.sparks.length; s++) {
      var spark = effect.sparks[s];
      if (spark.life <= 0) {
        continue;
      }

      ctx.strokeStyle = "rgba(255, 180, 40, " + spark.life / 24 + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(spark.x, spark.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function blockPlayerFromRoom(pointX, pointY) {
  if (playerHasDestroyedAnyBot) {
    return false;
  }

  for (var i = 0; i < specialTeleportRoomIndices.length; i++) {
    var roomIndex = specialTeleportRoomIndices[i];
    var room = sectorRooms[roomIndex];

    if (!room) {
      continue;
    }

    if (darkSpacePoint_inRect(pointX, pointY, room)) {
      return true;
    }
  }

  return false;
}

// --- SAT AND RAYCAST HELPERS ---

function darkSpaceVector_create(x, y) {
  return { x: x, y: y };
}

function darkSpaceVector_line(vectorA, vectorB) {
  return {
    x: vectorA.x - vectorB.x,
    y: vectorA.y - vectorB.y,
  };
}

function darkSpaceVector_perpendicular(vector) {
  return {
    x: -vector.y,
    y: vector.x,
  };
}

function darkSpaceVector_normalize(vector) {
  var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function darkSpaceVector_formula(point, axis) {
  return point.x * axis.x + point.y * axis.y;
}

function darkSpaceProject_circle(circle, axis) {
  var centerProjected = darkSpaceVector_formula(circle, axis);

  return {
    min: centerProjected - circle.radius,
    max: centerProjected + circle.radius,
  };
}

function darkSpaceProject_box(box, axis) {
  var corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];

  var initialProjected = darkSpaceVector_formula(corners[0], axis);
  var min = initialProjected;
  var max = initialProjected;

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

function darkSpaceOverlap_check(shadowA, shadowB) {
  if (shadowA.max < shadowB.min || shadowB.max < shadowA.min) {
    return false;
  }

  return true;
}

function darkSpaceCollision_circleWithBox(circle, box) {
  var checkAxes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  var closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  var closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

  var cornerAxisX = circle.x - closestX;
  var cornerAxisY = circle.y - closestY;
  var distance = Math.sqrt(
    cornerAxisX * cornerAxisX + cornerAxisY * cornerAxisY,
  );

  if (distance !== 0) {
    checkAxes.push({
      x: cornerAxisX / distance,
      y: cornerAxisY / distance,
    });
  }

  for (var i = 0; i < checkAxes.length; i++) {
    var currentAxis = checkAxes[i];
    var playerShadow = darkSpaceProject_circle(circle, currentAxis);
    var wallShadow = darkSpaceProject_box(box, currentAxis);
    var overlapping = darkSpaceOverlap_check(playerShadow, wallShadow);

    if (!overlapping) {
      return false;
    }
  }

  return true;
}

function getCollisionRoomsForWallChecks() {
  if (single_global_state_object.activeRoom) {
    return [single_global_state_object.activeRoom];
  }

  return sectorRooms;
}

function darkSpaceRaycast_box(originX, originY, directionX, directionY, box) {
  var epsilon = 0.000001;
  var minT = 0;
  var maxT = Infinity;

  if (Math.abs(directionX) < epsilon) {
    if (originX < box.x || originX > box.x + box.width) {
      return null;
    }
  } else {
    var tx1 = (box.x - originX) / directionX;
    var tx2 = (box.x + box.width - originX) / directionX;
    minT = Math.max(minT, Math.min(tx1, tx2));
    maxT = Math.min(maxT, Math.max(tx1, tx2));
  }

  if (Math.abs(directionY) < epsilon) {
    if (originY < box.y || originY > box.y + box.height) {
      return null;
    }
  } else {
    var ty1 = (box.y - originY) / directionY;
    var ty2 = (box.y + box.height - originY) / directionY;
    minT = Math.max(minT, Math.min(ty1, ty2));
    maxT = Math.min(maxT, Math.max(ty1, ty2));
  }

  if (maxT < minT || maxT < 0) {
    return null;
  }

  return Math.max(0, minT);
}

function darkSpaceRaycast_wallRooms(
  originX,
  originY,
  directionX,
  directionY,
  maxDistance,
) {
  var roomsToCheck = getCollisionRoomsForWallChecks();
  var closestHit = maxDistance;
  var foundHit = false;

  for (var r = 0; r < roomsToCheck.length; r++) {
    var targetRoom = roomsToCheck[r];

    for (var w = 0; w < targetRoom.collisionWalls.length; w++) {
      var wallBox = targetRoom.collisionWalls[w];
      var hitDistance = darkSpaceRaycast_box(
        originX,
        originY,
        directionX,
        directionY,
        wallBox,
      );

      if (
        hitDistance !== null &&
        hitDistance <= closestHit &&
        hitDistance <= maxDistance
      ) {
        closestHit = hitDistance;
        foundHit = true;
      }
    }
  }

  return {
    hit: foundHit,
    distance: closestHit,
  };
}

function getClampedGunPoint(originX, originY, angle, maxDistance, padding) {
  var directionX = Math.cos(angle);
  var directionY = Math.sin(angle);
  var wallHit = darkSpaceRaycast_wallRooms(
    originX,
    originY,
    directionX,
    directionY,
    maxDistance,
  );
  var cappedDistance = maxDistance;

  if (wallHit.hit) {
    cappedDistance = Math.max(0, wallHit.distance - padding);
  }

  return {
    x: originX + directionX * cappedDistance,
    y: originY + directionY * cappedDistance,
    distance: cappedDistance,
    blockedByWall: wallHit.hit,
  };
}
