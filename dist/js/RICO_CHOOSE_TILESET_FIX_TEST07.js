(function() {
  'use strict';

  if(typeof TileSetChoosePreset === 'undefined' || typeof TileSet === 'undefined') {
    console.error('[RICO TEST07] TileSet chooser classes not found.');
    return;
  }

  var previewRequestSerial = 0;
  var presetRequestSerial = 0;

  function findPresetDescription(preset) {
    for(var category in CharacterSetPresets) {
      if(!CharacterSetPresets.hasOwnProperty(category)) continue;

      var sets = CharacterSetPresets[category].characterSets;
      for(var i=0;i<sets.length;i++) {
        var set=sets[i];

        if(set.id === preset) {
          return {
            width:set.width || 8,
            height:set.height || 8,
            type:typeof set.type !== 'undefined' ? set.type : 'ascii',
            name:set.name || '',
            filename:preset + '.png'
          };
        }

        if(typeof set.options !== 'undefined') {
          for(var j=0;j<set.options.length;j++) {
            if(set.options[j].id === preset) {
              return {
                width:set.width || 8,
                height:set.height || 8,
                type:typeof set.type !== 'undefined' ? set.type : 'ascii',
                name:set.name || '',
                filename:preset + '.png'
              };
            }
          }
        }
      }
    }
    return null;
  }

  TileSetChoosePreset.prototype.setPreviewCharacterset = function(charsetId) {
    this.previewCharsetId = charsetId;
    this.previewCharsetDescription = this.getCharacterSetDescription(charsetId);

    var requestId = ++previewRequestSerial;
    var self=this;

    var filename = charsetId + '.png';
    var url = (this.type === 'vector' ? 'vectorsets/' : 'charsets/') +
              filename + '?ricoPreview=' + requestId;

    var img = new Image();
    this.img = img;

    img.onload = function() {
      if(self.img !== img || requestId !== previewRequestSerial) return;

      self.setPreviewFromImg({
        img: img,
        interpret: self.type !== 'vector'
      });

      console.log('[RICO TEST07] Preview loaded:', charsetId);
    };

    img.onerror = function() {
      if(self.img !== img || requestId !== previewRequestSerial) return;
      console.error('[RICO TEST07] Preview image failed:', url);
    };

    img.src = url;
  };

  var originalSetToPreset = TileSet.prototype.setToPreset;

  TileSet.prototype.setToPreset = function(preset, callback) {
    var mode='textmode';
    var pos=preset.indexOf(':');

    if(pos !== -1) {
      mode=preset.substring(0,pos);
      preset=preset.substring(pos+1);
    }

    if(mode === 'vector') {
      return originalSetToPreset.call(this, 'vector:' + preset, callback);
    }

    var desc=findPresetDescription(preset);
    if(!desc) {
      console.error('[RICO TEST07] Unknown preset:', preset);
      return originalSetToPreset.call(this, preset, callback);
    }

    var self=this;
    var requestId=++presetRequestSerial;
    var img=new Image();
    var url='charsets/' + desc.filename + '?ricoApply=' + requestId;

    img.onload=function() {
      self.type=desc.type;
      self.customCharacterset=preset !== 'petscii';
      self.label=desc.name;
      self.preset=preset;

      self.setCharDimensions(desc.width,desc.height);
      self.importImage(img);
      self.setSortMethods();

      console.log('[RICO TEST07] Tile set applied:', preset);

      if(callback) callback();
    };

    img.onerror=function() {
      console.error('[RICO TEST07] Tile set image failed:', url);
    };

    img.src=url;
  };

  window.RICO_TEST07_TILESET_LOADER=true;
  console.log('[RICO TEST07] Choose Tile Set image loader installed.');
})();