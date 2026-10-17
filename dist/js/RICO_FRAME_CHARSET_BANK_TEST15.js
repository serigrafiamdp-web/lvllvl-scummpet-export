(function() {
  'use strict';

  if(typeof Frames === 'undefined' || typeof Graphic === 'undefined') {
    console.error('[RICO TEST15] Frames/Graphic not found.');
    return;
  }

  var FIELD = 'charsetBank';

  function normaliseBank(value) {
    value = parseInt(value, 10);
    return value === 2 ? 2 : 1;
  }

  function ensureFrameBank(frameObject) {
    if(!frameObject) return 1;
    if(typeof frameObject[FIELD] === 'undefined') {
      frameObject[FIELD] = 1;
    } else {
      frameObject[FIELD] = normaliseBank(frameObject[FIELD]);
    }
    return frameObject[FIELD];
  }

  function getCurrentFrameObject(framesController) {
    if(!framesController || !framesController.editor || !framesController.editor.graphic) {
      return null;
    }

    var graphic = framesController.editor.graphic;
    var frameIndex = graphic.getCurrentFrame();
    if(frameIndex < 0 || frameIndex >= graphic.frames.length) return null;
    return graphic.frames[frameIndex];
  }

  function refreshBankField(framesController) {
    var input = document.getElementById('ricoCharsetBank');
    if(!input) return;

    var frameObject = getCurrentFrameObject(framesController);
    input.value = ensureFrameBank(frameObject);
  }

  function setCurrentFrameBank(framesController, value) {
    var bank = parseInt(value, 10);
    if(bank !== 1 && bank !== 2) {
      refreshBankField(framesController);
      return false;
    }

    var frameObject = getCurrentFrameObject(framesController);
    if(!frameObject) {
      refreshBankField(framesController);
      return false;
    }

    frameObject[FIELD] = bank;
    refreshBankField(framesController);
    console.log('[RICO TEST15] Frame ' + (framesController.editor.graphic.getCurrentFrame() + 1) + ' -> CHARSET BANK ' + bank);
    return true;
  }

  function installBankControl(framesController) {
    if(document.getElementById('ricoCharsetBankHolder')) {
      refreshBankField(framesController);
      return true;
    }

    var durationInput = document.getElementById('frameDuration');
    if(!durationInput) return false;

    var $duration = $('#frameDuration');
    var $separator = $duration.nextAll('.frameControlSeparator').first();
    if($separator.length === 0) return false;

    var html = '';
    html += '<span id="ricoCharsetBankHolder" style="display:inline-block; margin-left:10px; margin-right:8px; white-space:nowrap;">';
    html += '  <label class="gridinfo-label" for="ricoCharsetBank">Charset Bank:</label>';
    html += '  <input size="1" type="number" class="number integer" id="ricoCharsetBank" min="1" max="2" step="1" value="1"';
    html += '         style="width:42px; box-sizing:border-box;" title="Charset Bank for this frame (1 or 2)" />';
    html += '</span>';

    $separator.before(html);

    $('#ricoCharsetBank').on('change', function() {
      setCurrentFrameBank(framesController, this.value);
    });

    $('#ricoCharsetBank').on('keyup', function() {
      var value = parseInt(this.value, 10);
      if(value === 1 || value === 2) {
        setCurrentFrameBank(framesController, value);
      }
    });

    $('#ricoCharsetBank').on('blur', function() {
      refreshBankField(framesController);
    });

    refreshBankField(framesController);
    console.log('[RICO TEST15] Charset Bank frame control installed.');
    return true;
  }

  // Hook the native frame UI only after frames.html has been loaded.
  var originalInitEvents = Frames.prototype.initEvents;
  Frames.prototype.initEvents = function() {
    var result = originalInitEvents.apply(this, arguments);
    installBankControl(this);
    return result;
  };

  // Every navigation path (arrows, number field, timeline, playback) converges here.
  var originalGotoFrame = Frames.prototype.gotoFrame;
  Frames.prototype.gotoFrame = function(frame) {
    var result = originalGotoFrame.apply(this, arguments);
    refreshBankField(this);
    return result;
  };

  // Old projects and newly grown frame arrays default to BANK 1.
  var originalSetFrameCount = Graphic.prototype.setFrameCount;
  Graphic.prototype.setFrameCount = function(frameCount) {
    var result = originalSetFrameCount.apply(this, arguments);
    for(var i = 0; i < this.frames.length; i++) {
      ensureFrameBank(this.frames[i]);
    }
    return result;
  };

  // A genuinely new/inserted frame defaults to BANK 1 unless restored data already has a value.
  var originalInsertFrame = Graphic.prototype.insertFrame;
  Graphic.prototype.insertFrame = function(frame, duration, frameData, layerFrameData) {
    var newFrame = originalInsertFrame.apply(this, arguments);
    if(newFrame >= 0 && newFrame < this.frames.length) {
      ensureFrameBank(this.frames[newFrame]);
    }
    return newFrame;
  };

  // Duplicating a frame keeps the source frame's bank, just like its visual content/duration.
  var originalDuplicateFrame = Graphic.prototype.duplicateFrame;
  Graphic.prototype.duplicateFrame = function(frame) {
    var sourceFrame = (typeof frame === 'undefined') ? this.currentFrame : parseInt(frame, 10);
    var sourceBank = 1;
    if(sourceFrame >= 0 && sourceFrame < this.frames.length) {
      sourceBank = ensureFrameBank(this.frames[sourceFrame]);
    }

    var newFrame = originalDuplicateFrame.apply(this, arguments);
    if(newFrame >= 0 && newFrame < this.frames.length) {
      this.frames[newFrame][FIELD] = sourceBank;
    }
    return newFrame;
  };

  window.RICO_TEST15_FRAME_CHARSET_BANK = true;
  console.log('[RICO TEST15] Per-frame Charset Bank hook loaded.');
})();
