// Game constants

const BOT_STATE_IDLE = 0;
const BOT_STATE_ALERT = 1;
const BOT_STATE_CHASE = 2;
const BOT_STATE_ATTACK = 3;
const BOT_STATE_DEATH = 4;

const gameDurationSeconds = 300;

const gridColumns = 5;
const gridRows = 4;
const roomWidth = 110;
const roomHeight = 110;
const wallPadding = 40;
const roomDoorWidth = 40;
const roomDoorThickness = 12;

const visibilityRadius = 120;
const visibilityFovDeg = 100;

const enemyPatrolSpeed = 1.2;
const enemyPatrolWaitFrames = 45;
const enemyDetectionRange = 50;
const enemyVisionRange = 90;
const enemyVisionConeDeg = 70;
const enemyAlertDuration = 300;
const enemyChaseSpeed = 1.8;
const enemyAttackRange = 35;
const enemyAttackDamage = 1;
const enemyAttackCooldownFrames = 30;
const enemyMaxHealth = 3;
const enemyBulletDamage = 1;
const enemyBulletSpeed = 3;
const enemyKillScore = 1;

const specialTeleportRoomIndices = [2, 9, 18];
