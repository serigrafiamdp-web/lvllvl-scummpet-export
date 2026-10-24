/* RICO TEST269 — Oil's Well trainer: experimental level select.
 * UI-only insertion + guarded writes into the RUNNING game's emulated RAM.
 * Never modifies the PRG file on disk, emulator core, importers or MASTER.
 * Based on disassembly of user-supplied "ricos oil.prg" COPY SOFT:
 *   $22 stage 0..7; $23 stage*4
 *   $946D starts level introduction and sets $33=3, $3C=7
 *   stage $33=3 -> $86BD JSR $8E81 reloads $A000+stage*1024
 *   $8E81 copies map to $6000 and writes level Color RAM.
 * This prototype queues state 3 with $3C=1, so the game's original
 * state-handler performs the load on its next eligible iteration.
 * Experimental: still requires visual verification in the running game.
 */
(function () {
  'use strict';
  if (typeof ImportC64Formats === 'undefined' ||
      !window.RICO_TEST268_COMPACT_CONTROLS) {
    console.error('[TEST269] TEST268 prerequisite missing');
    return;
  }
  var style = document.createElement('style');
  style.id = 'rico-test269-warp-style';
  style.textContent =
    '#ricoTest269Warp{display:inline-flex;align-items:center;gap:7px;' +
    'flex-wrap:wrap;font-size:12px;border-left:1px solid #444;' +
    'padding-left:12px;margin-left:2px;}' +
    '#ricoTest269Warp label{font-weight:600;color:#c4d1e1;}' +
    '#ricoTest269Level{font:12px system-ui,sans-serif;background:#252d38;' +
    'color:#eee;border:1px solid #64717d;border-radius:3px;padding:3px 5px;}' +
    '#ricoTest269DoWarp{font:12px system-ui,sans-serif;background:#285b83;' +
    'border:1px solid #5f92ba;border-radius:3px;padding:4px 11px;' +
    'color:#fff;cursor:pointer;}' +
    '#ricoTest269DoWarp:hover{background:#3678a9;}' +
    '#ricoTest269Msg{color:#9dabbb;font-size:11px;width:100%;min-height:14px;}';
  document.head.appendChild(style);

  var init = ImportC64Formats.prototype.initContent;
  ImportC64Formats.prototype.initContent = function () {
    var result = init.apply(this, arguments);
    ensureUI();
    return result;
  };

  function sample(addr) {
    return c64_cpuReadNS(addr & 65535) & 255;
  }
  function isOils() {
    if (typeof c64_ready === 'undefined' || !c64_ready ||
        typeof c64_cpuReadNS !== 'function') return false;
    // Distinguish the relocated Oil's Well build from other running PRGs.
    return sample(0x8004) === 0xc3 &&
           sample(0x8005) === 0xc2 &&
           sample(0x8006) === 0xcd &&
           sample(0x8007) === 0x38 &&
           sample(0x8008) === 0x30 &&
           sample(0x8b63) === 0xe6 &&
           sample(0x8b64) === 0x22 &&
           sample(0x8b65) === 0xa5 &&
           sample(0x8b66) === 0x22 &&
           sample(0x8e81) === 0xa2 &&
           sample(0x8e82) === 0x28;
  }
  function setMessage(msg, error) {
    var e = document.getElementById('ricoTest269Msg');
    if (!e) return;
    e.textContent = msg;
    e.style.color = error ? '#ff9a81' : '#a7d9aa';
  }
  function doWarp() {
    var pick = document.getElementById('ricoTest269Level');
    if (!pick) return;
    var selected = Number(pick.value);
    if (!Number.isInteger(selected) || selected < 1 || selected > 8) {
      setMessage('Nivel no válido (1–8).', true);
      return;
    }
    if (typeof c64_cpuWrite !== 'function' || !isOils()) {
      setMessage('Cargá y ejecutá el PRG original Oil\'s Well antes de usar Warp.', true);
      return;
    }
    var target = selected - 1;
    var current = sample(0x22);
    if (current > 7) {
      setMessage('El juego no está en un nivel reconocible ($22=' +
        current.toString(16) + ').', true);
      return;
    }
    if (typeof c64_getPC === 'function') {
      var pc = c64_getPC() & 65535;
      // Refuse to mutate memory while BASIC or the original loader runs.
      if (pc < 0x8000 || pc >= 0xd000) {
        setMessage('Iniciá la partida; el código del juego aún no está ejecutándose.', true);
        return;
      }
    }

    var wasRunning = true;
    if (typeof debugger_isRunning === 'function') {
      try { wasRunning = !!debugger_isRunning(); } catch (e) {}
    }
    try {
      if (typeof debugger_pause === 'function') debugger_pause();
      // TEST269: request the existing game's level-load state. No PC jumps,
      // code patching, binary editing, or generic trainer claims.
      c64_cpuWrite(0x22, target);
      c64_cpuWrite(0x23, (target * 4) & 255);
      c64_cpuWrite(0x33, 3);
      c64_cpuWrite(0x3c, 1);
      setMessage('Warp nivel ' + selected +
        ' solicitado (antes ' + (current + 1) +
        '). Comprobá el mapa y los colores en el emulador.', false);
    } catch (e) {
      setMessage('No se pudo solicitar Warp: ' + (e && e.message || e), true);
    } finally {
      if (wasRunning && typeof debugger_play === 'function') {
        try { debugger_play(); } catch (e) {}
      }
    }
  }

  function ensureUI() {
    if (document.getElementById('ricoTest269Warp')) return;
    var footer = document.getElementById('ricoTest268Footer');
    if (!footer) return;
    var widget = document.createElement('div');
    widget.id = 'ricoTest269Warp';
    var label = document.createElement('label');
    label.setAttribute('for', 'ricoTest269Level');
    label.textContent = 'Oil\'s Well · Nivel';
    var select = document.createElement('select');
    select.id = 'ricoTest269Level';
    for (var n = 1; n <= 8; n++) {
      var option = document.createElement('option');
      option.value = String(n);
      option.textContent = String(n);
      select.appendChild(option);
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'ricoTest269DoWarp';
    btn.textContent = 'Warp';
    btn.addEventListener('click', doWarp);
    var msg = document.createElement('span');
    msg.id = 'ricoTest269Msg';
    msg.textContent = 'Experimental: iniciar la partida antes del salto.';
    widget.appendChild(label);
    widget.appendChild(select);
    widget.appendChild(btn);
    widget.appendChild(msg);
    footer.appendChild(widget);
  }

  window.RICO_TEST269_OILS_WARP = {
    version:'TEST269',
    isOils:isOils,
    requestLevel:function(n) {
      var el = document.getElementById('ricoTest269Level');
      if (!el) return false;
      el.value=String(n);
      doWarp();
      return true;
    }
  };
  console.log('[TEST269] Oil\'s Well level selector 1–8 ready; visual warp PASS pending.');
})();
