/* RICO UI TEST256 — Compact tool sidebar without losing Background/Border.
 * Derived from MASTER GRUPALES TEST247 (2026-10-23).
 * Pure CSS, desktop-only. No changes to editor state, palettes, event handlers,
 * animation routines, PRG or source assets. Works in text and C64 Multicolor.
 *
 * Key fix: TEST80 Quick Palette lives at bottom:absolute of #toolsPanel,
 * potentially covering Frame colors when Multicolor inserts its extra block.
 * Put the same palette after Frame in normal flow; scroll the sidebar if tiny.
 */
(function(){
  'use strict';
  var ID='ricoUiMulticolorCompact256';
  if(typeof document==='undefined'||document.getElementById(ID))return;
  var style=document.createElement('style');
  style.id=ID;
  style.textContent=`
/* Keep all selectors reachable rather than hiding/cropping the bottom */
body:not(.mobileMode) #toolsPanel {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-width: thin;
  scrollbar-color: #555 #191919;
  box-sizing: border-box;
}
/* Icons: two-columns remain; slightly shorter buttons and less empty space */
body:not(.mobileMode) #toolsPanel #toolIconHolder {
  padding: 4px 7px 2px !important;
}
body:not(.mobileMode) #toolsPanel #toolIconHolder .drawTool {
  width: 20px !important;
  height: 19px !important;
  padding: 1px 3px !important;
  margin: 1px !important;
  vertical-align: top;
  box-sizing: content-box;
}
body:not(.mobileMode) #toolsPanel #toolIconHolder .drawTool img {
  width: 19px !important;
  height: 19px !important;
  object-fit: contain;
}
body:not(.mobileMode) #toolsPanel #currentTool {
  margin-top: 1px !important;
  line-height: 12px !important;
  min-height: 12px;
}
/* Tight headings, not the editor's global h3 rules */
body:not(.mobileMode) #toolsPanel #drawTools-cellColor h3,
body:not(.mobileMode) #toolsPanel #drawTools-c64multicolor h3,
body:not(.mobileMode) #toolsPanel #drawTools-frameColors h3 {
  margin: 2px 0 4px !important;
  padding: 0 0 2px !important;
  height: 14px !important;
  line-height: 12px !important;
  border-bottom-color: #555;
}
/* Cell colors retain separate click targets */
body:not(.mobileMode) #toolsPanel #drawTools-cellColor {
  height: 53px !important;
  padding-left: 7px !important;
}
body:not(.mobileMode) #toolsPanel #cellForegroundColor {
  top: 19px !important;
  left: 8px !important;
  width: 24px !important;
  height: 24px !important;
}
body:not(.mobileMode) #toolsPanel #cellBackgroundColor {
  top: 27px !important;
  left: 25px !important;
  width: 23px !important;
  height: 23px !important;
}
body:not(.mobileMode) #toolsPanel #switchColors {
  max-width: 17px !important;
  max-height: 17px !important;
}
/* Multicolor adds controls but no oversized vertical spacing */
body:not(.mobileMode) #toolsPanel #drawTools-c64multicolor {
  padding: 0 7px 1px !important;
  line-height: 19px;
}
body:not(.mobileMode) #toolsPanel #drawTools-c64multicolor #c64Multi1Color,
body:not(.mobileMode) #toolsPanel #drawTools-c64multicolor #c64Multi2Color {
  width: 21px !important;
  height: 21px !important;
  margin-right: 3px !important;
  vertical-align: middle;
}
/* Frame Border and Background must stay directly above the 16-color grid */
body:not(.mobileMode) #toolsPanel #drawTools-frameColors {
  height: 54px !important;
  padding-left: 7px !important;
  flex-shrink: 0;
}
body:not(.mobileMode) #toolsPanel #drawTools-frameColors #borderColor {
  top: 19px !important;
  left: 8px !important;
  width: 50px !important;
  height: 32px !important;
}
body:not(.mobileMode) #toolsPanel #drawTools-frameColors #backgroundColor {
  top: 26px !important;
  left: 18px !important;
  width: 30px !important;
  height: 19px !important;
}
/* TEST80 creates this after all other children.
 * Put it back into document flow so it CANNOT cover Frame controls. */
body:not(.mobileMode) #toolsPanel #ricoQuickPalette80 {
  position: relative !important;
  left: auto !important;
  right: auto !important;
  top: auto !important;
  bottom: auto !important;
  margin: 2px 6px 8px !important;
  padding: 4px 5px !important;
  width: auto !important;
  z-index: 1 !important;
}
body:not(.mobileMode) #toolsPanel #ricoQuickPalette80 > div {
  gap: 2px !important;
}
body:not(.mobileMode) #toolsPanel #ricoQuickPalette80 .rico80swatch {
  height: 23px !important;
  min-height: 23px !important;
}
/* Narrow-height screens get 8x21px swatch grid but retain scrolling. */
@media (max-height: 760px) {
  body:not(.mobileMode) #toolsPanel #ricoQuickPalette80 .rico80swatch {
    height: 21px !important;
    min-height: 21px !important;
  }
}
`;
  (document.head||document.documentElement).appendChild(style);
  console.log('[RICO TEST256] Compact sidebar: tools + cell/multi/frame + quick palette in normal flow');
})();