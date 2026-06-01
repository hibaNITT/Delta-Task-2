// It loads sound files from the sounds/ folder and plays them by name.

var soundManager = {
  sounds: {},
  unlocked: false,

  load: function (name, filePath, volume) {
    var audio = new Audio(filePath);
    audio.preload = "auto";
    audio.volume = typeof volume === "number" ? volume : 1;
    this.sounds[name] = audio;
  },

  //fix in the room transision sound - debug code
  unlock: function () {
    if (this.unlocked) {
      return;
    }

    this.unlocked = true;

    for (var name in this.sounds) {
      if (Object.prototype.hasOwnProperty.call(this.sounds, name)) {
        let audio = this.sounds[name];
        audio.muted = true;
        audio
          .play()
          .then(function () {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch(function () {
            audio.muted = false;
            // Ignore unlock errors; the sound can still be played later.
          });
      }
    }
  },

  play: function (name) {
    var audio = this.sounds[name];

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    audio.play().catch(function () {
      // Ignore autoplay restrictions or blocked playback.
    });
  },
};

soundManager.load("shoot", "sounds/shooting.mp3", 0.4);
soundManager.load("roomTransition", "sounds/room transition.mp3", 0.5);
soundManager.load("gameWin", "sounds/game win.mp3", 0.6);
soundManager.load("gameOver", "sounds/game over.mp3", 0.6);

window.soundManager = soundManager;
