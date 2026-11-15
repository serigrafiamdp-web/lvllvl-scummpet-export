# LVLLVL RICO — manifiesto de carga de la página principal

Última auditoría: **15/11/2026** · rama `gh-pages`. Fuente: `index.html` de la versión TEST362 PASS, anterior a la limpieza histórica.

Este es el **orden real de carga**, no un inventario de todas las pruebas existentes. Cambiar el orden de los módulos puede modificar los wrappers de `ToPRGAdv.prototype.createPRG`, el compositor, las condiciones de selección de ruta y el comportamiento de Group Animate.

- Scripts declarados: **128**.
- Scripts locales: **123**.
- Scripts de proveedores externos: **4**.
- Archivo de seguridad anterior a la limpieza: [`archive/tests-pre-audit-2026-11-14-test362-pass`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass).

## Scripts en orden (tal cual `index.html`)

1. `https://www.gstatic.com/firebasejs/7.6.0/firebase-app.js`
2. `https://www.gstatic.com/firebasejs/7.6.0/firebase-auth.js`
3. `https://www.gstatic.com/firebasejs/7.6.0/firebase-firestore.js`
4. `https://apis.google.com/js/api.js`
5. `js/libs.js?v=0.495`
6. `js/html/htmlcache.js?v=0.495`
7. `js/main.js?v=0.495`
8. `js/SCUMM_ECM_LIVE_REPACK_TEST01.js?v=test164-ecm-no-label`
9. `js/SCUMM_ECM_GLYPH_PICKER_TEST04.js?v=test04`
10. `js/SCUMM_ECM_GLYPH_RESELECT_TEST05.js?v=test05`
11. `js/SCUMM_ECM_NATIVE_PALETTE_UI_TEST06.js?v=test06`
12. `js/RICO_CHOOSE_TILESET_FIX_TEST07.js?v=test07`
13. `js/RICO_REMIX_TILESET_TEST14.js?v=test14`
14. `js/RICO_REMIX_TILESET_TEST24.js?v=test24`
15. `js/RICO_REMIX_DOUBLE_HEIGHT_TEST30.js?v=test30`
16. `js/RICO_REMIX_16X16_TEST31.js?v=test31`
17. `js/RICO_LOCAL_TILESET_LIBRARY_TEST32.js?v=test32`
18. `js/RICO_FRAME_CHARSET_BANK_TEST15.js?v=test15`
19. `js/RICO_SIDE_TILE_BANKS_TEST17.js?v=test17`
20. `js/RICO_C64_DEFAULT_SHIFTED_BANK2_TEST18.js?v=test18`
21. `js/RICO_ACTIVE_FRAME_BANK_RENDER_TEST19.js?v=test172-dual-native-switch`
22. `js/RICO_DUAL_BANK_ANIMATION_TEST25.js?v=test172-dual-native-switch`
23. `js/RICO_BANK2_TILE_EDITOR_TEST26.js?v=test26`
24. `js/RICO_BANK2_TILE_EDITOR_RENDER_TEST27.js?v=test27`
25. `js/RICO_MULTI_CHAR_CLIPBOARD_TEST174.js?v=test174`
26. `js/RICO_EDIT_GROUP_CHARS_TEST28.js?v=test28`
27. `js/RICO_SIDE_BANK_LAYOUT_TEST21.js?v=test21`
28. `TEST/test264-native-multicolor-export/js/RICO_PRG_DUAL_BANK_TEST264.js?v=test264-native-mode2-v1`
29. `js/RICO_PRG_DUAL_BANK_TEST104_ANIM_MEM_SWAP.js?v=test105`
30. `js/RICO_ANIMATED_PALETTE_PREVIEW_TEST33.js?v=test33`
31. `TEST/test242-ondas-pingpong/js/RICO_GROUP_ANIMATE_TEST34.js?v=test360-group-animate-english`
32. `js/RICO_AUTO_FIT_ART_TEST177.js?v=test177`
33. `js/RICO_WINDOW_DIMENSION_SCROLL_AREA_TEST75.js?v=test177`
34. `js/RICO_MAP_SCROLL_PREVIEW_SCROLL_AREA_TEST79.js?v=test197-border-mask-mono-fast`
35. `js/RICO_DIMENSIONS_FOUR_SIDES_TEST79.js?v=test79`
36. `js/RICO_UI_LAYOUT_TEST80.js?v=test149-east-drag`
37. `js/RICO_VIEWPORT_BLACK_GAP_TEST81.js?v=test81`
38. `js/RICO_LARGE_MAP_VIEWPORT_SOURCE_TEST83.js?v=test204-diag-preview-clean-grid`
39. `js/RICO_LARGE_MAP_DEFAULT_WINDOW_TEST84.js?v=test84`
40. `js/RICO_WINDOW_VIEWPORT_GUIDE_TEST169.js?v=test170`
41. `js/RICO_MAP_PREVIEW_BORDER_MASK_TEST178.js?v=test204-diag-preview-clean-grid`
42. `js/RICO_TILE_PALETTE_EDIT_REFRESH_TEST38.js?v=test38`
43. `js/RICO_PRG_MAP_SCROLL_VERTICAL_CLEAN_TEST50.js?v=test50`
44. `js/RICO_PRG_MAP_SCROLL_38X24_TEST51.js?v=test51`
45. `js/RICO_PRG_MAP_SCROLL_FRAME_DURATION_512_TEST53.js?v=test53`
46. `js/RICO_PRG_MAP_SCROLL_PINGPONG_TEST54.js?v=test54`
47. `js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js?v=test176-map-irq-priority`
48. `js/RICO_NATIVE_EXPORT_CAPTURE_TEST168.js?v=test168`
49. `js/RICO_PRG_LARGE_MAP_PHASEFIX_TEST82.js?v=test82`
50. `js/RICO_PRG_LARGE_MAP_COLOR_PHASE_TEST84.js?v=test84`
51. `js/RICO_PRG_LARGE_MAP_SPARSE_COLOR_TEST86.js?v=test86`
52. `js/RICO_PRG_LARGE_MAP_TIMING_TEST88.js?v=test88`
53. `js/RICO_PRG_LARGE_MAP_MAXSPEED_TEST89.js?v=test89`
54. `TEST/test242-ondas-pingpong/js/RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js?v=test242-ondas-atomic-v1`
55. `js/RICO_PRG_VERTICAL_COLOR_RLE_TEST221.js?v=test221-vertical-color-rle`
56. `js/RICO_PRG_VERTICAL_STALL_RECOVERY_TEST222.js?v=test222-color-stall`
57. `js/RICO_PRG_VERTICAL_FAST_ROW_ADDRESS_TEST222B.js?v=test222-row-constant-time`
58. `js/RICO_PRG_VERTICAL_STALL_COUNTERS_TEST223.js?v=test223-diagnostic`
59. `js/RICO_PRG_VERTICAL_GLYPH_DELTA_TEST224.js?v=test224-sparse-character-delta`
60. `js/RICO_PRG_VERTICAL_ATOMIC_PHASE_TEST225.js?v=test225-vertical-atomic-pixel-steps`
61. `js/RICO_PRG_VERTICAL_DIRECT_COLOR_8PX_TEST226.js?v=test227-fixed-absolute-jump`
62. `js/RICO_PRG_VERTICAL_DIRECT_COLOR_FINE_TEST232.js?v=test232-fine-direct-color`
63. `TEST/test327-horizontal-animated-map/js/RICO_PRG_HORIZ_WIDE_TEST327.js?v=test329-root-from-pass328`
64. `TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js?v=test362-charset-bank1-init-fix`
65. `js/RICO_PRG_HORIZ_MULTIFRAME_TEST205.js?v=test205-horizontal-multiframe`
66. `TEST/test326-horizontal-map-limits/js/RICO_PRG_HORIZ_COMPACT_TEST326.js?v=test329-root-from-pass328`
67. `TEST/test327-horizontal-animated-map/js/RICO_HORIZ_CHAR_SCHEDULER_TEST327.js?v=test329-root-from-pass328`
68. `TEST/test243-ondas-fast-pingpong/js/RICO_GROUP_FAST8_TEST243.js?v=test243-fast8-v1`
69. `TEST/test244-ondas-pingpong-fast/js/RICO_GROUP_SPEED_TEST244.js?v=test244-unrolled-v2`
70. `TEST/test245-demoscene-speedcode/js/RICO_GROUP_DEMOSCENE_SPEEDCODE_TEST245.js?v=test245-demoscene-v1`
71. `TEST/test246-charset-remap/js/RICO_GROUP_SCREEN_REMAP_TEST246.js?v=test246-remap-v1`
72. `TEST/test247-group-scroll-fast/js/RICO_GROUP_SCROLL_REMAP_TEST247.js?v=test247-group-fast-v2`
73. `TEST/test247-group-scroll-fast/js/RICO_GROUP_STANDALONE_TEST247.js?v=test247-group-fast-v2`
74. `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js?v=test229-sid-up-to-8kb-core-relocate`
75. `js/RICO_TEST147_PREVIEW_BATCH.js?v=test147`
76. `js/RICO_PALETTE_ANIM_UNMUTE_TEST139.js?v=test144-index-16ms`
77. `js/RICO_SPLITTER_UNLOCK_TEST148.js?v=test149-east-drag`
78. `TEST/test256-ui-multicolor-compact/js/RICO_UI_MULTICOLOR_COMPACT_TEST256.js?v=test256-layout-a1`
79. `TEST/test257-screen-mode-index-sync/js/RICO_INDEX_SCREEN_MODE_TEST257.js?v=test257-index-sync-a1`
80. `TEST/test258-screen-mode-force/js/RICO_SCREEN_MODE_UNBLOCK_TEST258.js?v=test258-native-direct-v1`
81. `TEST/test274-index-multicolor-only/js/RICO_SIDE_INDEX_MULTICOLOR_ONLY_TEST274.js?v=test274-all-mc-side-index-v1`
82. `TEST/test260-multicolor-paint/js/RICO_MULTICOLOR_BRUSH_TEST260.js?v=test260-color-ram-bit3-v1`
83. `TEST/test261-multicolor-replace/js/RICO_REPLACE_MULTICOLOR_TEST261.js?v=test261-mc-scope-swap-v1`
84. `TEST/test264-native-multicolor-export/js/RICO_MULTICOLOR_EXPORT_TEST264.js?v=test264-capture-mode-byte-v1`
85. `TEST/test267-c64-big-screen/js/RICO_C64_BIG_SCREEN_TEST267.js?v=test267-scale-after-dom-v2`
86. `TEST/test268-c64-compact-controls/js/RICO_C64_COMPACT_CONTROLS_TEST268.js?v=test268-controls-below-v1`
87. `TEST/test269-oils-level-warp/js/RICO_OILS_LEVEL_WARP_TEST269.js?v=test269-stage-request-v1`
88. `TEST/test271-oils-stable-charset/js/RICO_C64_IMPORT_FRAMES_TEST271.js?v=test271-stable-73glyphs-v1`
89. `TEST/test272-index-render-refresh/js/RICO_C64_INDEX_REFRESH_TEST272.js?v=test272-cache-refresh-v1`
90. `TEST/test273-auto-custom-after-c64-import/js/RICO_C64_IMPORT_AUTO_CUSTOM_TEST273.js?v=test273-auto-custom-v1`
91. `TEST/test275-index-follows-screen-mode/js/RICO_SIDE_INDEX_MODE_SYNC_TEST275.js?v=test275-standard-mc-sync-v1`
92. `TEST/test279-bitmap-multicolor/js/RICO_BITMAP_MULTICOLOR_TEST279.js?v=test279-native-screen-bitmap-v2`
93. `js/storageManager.js?v=0.495`
94. `js/githubClient.js?v=0.495`
95. `js/acmeAssembler.js?v=0.495`
96. `js/ca65Assembler.js?v=0.495`
97. `c64/c64/c64.js?v=0.495`
98. `js/c64/c64.js?v=0.495`
99. `TEST/test280-bitmap-mc-paint/js/RICO_BITMAP_MC_PAINT_TEST280.js?v=test280-canvas-ink-v1`
100. `TEST/test281-bitmap-mc-ink-brush/js/RICO_BITMAP_MC_INK_BRUSH_TEST281.js?v=test281-slot-ink-v1`
101. `TEST/test282-bitmap-mc-static-prg/js/RICO_BITMAP_MC_STATIC_PRG_TEST282.js?v=test282-bitmap-static-v1`
102. `TEST/test283-bitmap-mc-sparse-frames/js/RICO_BITMAP_MC_SPARSE_FRAMES_TEST283.js?v=test283-sparseframes-v1`
103. `TEST/test285-bitmap-mc-upper-ram/js/RICO_BITMAP_MC_UPPER_RAM_TEST285.js?v=test285-upper-ram-v1`
104. `TEST/test286-bitmap-mc-procedural/js/RICO_BITMAP_MC_PROCEDURAL_TEST286.js?v=test286-procedural-v1`
105. `TEST/test287-ricos-decolorize/js/RICO_DECOLORIZE_TEST287.js?v=test287-decolorize-edit-brush-v1`
106. `TEST/test288-bitmap-native-stamp-colors/js/RICO_BITMAP_STAMP_SOURCE_COLORS_TEST288.js?v=test288-native-color-transfer-v1`
107. `TEST/test289-bitmap-live-recolor-preview/js/RICO_BITMAP_LIVE_RECOLOR_TEST289.js?v=test289-live-preview-v1`
108. `TEST/test290-bitmap-mc-group-lut/js/RICO_BITMAP_MC_GROUP_LUT_TEST290.js?v=test290-demoscene-lut-v1`
109. `TEST/test291-bitmap-mc-max256-direct/js/RICO_BITMAP_MC_MAX256_DIRECT_TEST291.js?v=test291-direct-8mcpx-v1`
110. `TEST/test292-bitmap-mc-double-buffer/js/RICO_BITMAP_MC_DOUBLE_BUFFER_TEST292.js?v=test292-double-buffer-v1`
111. `TEST/test293-bitmap-grouped-blitter/js/RICO_BITMAP_MC_GROUPED_TEST293.js?v=test293-grouped-v1`
112. `TEST/test294-bitmap-speedcode-fanout/js/RICO_BITMAP_MC_SPEEDCODE_TEST294.js?v=test294-speedcode-v1`
113. `TEST/test295-bitmap-delta-speedcode/js/RICO_BITMAP_MC_DELTA_TEST295.js?v=test295-delta-v1`
114. `TEST/test296-bitmap-delta-cold-skip/js/RICO_BITMAP_MC_COLD_SKIP_TEST296.js?v=test296-coldskip-v1`
115. `TEST/test297-bitmap-distributed-speedcode/js/RICO_BITMAP_MC_DISTRIBUTED_TEST297.js?v=test297-distribution-v1`
116. `TEST/test328-ecm-preserve-4-backgrounds/js/RICO_ECM_EXPORT_REPACK_TEST328.js?v=test329-root-from-pass328`
117. `TEST/test339-side-preview/js/RICO_SIDE_INDEX_EDIT_TEST339.js?v=test339-a1`
118. `TEST/test350-ecm-safe-router/js/RICO_ECM_SAFE_ROUTER_TEST350.js?v=TEST350-A2-DELEGATE-ALL-STATIC`
119. `TEST/test351-ecm-frames-sid/js/RICO_ECM_FRAMES_SID_TEST351.js?v=351-a3-2048-charset-check`
120. `TEST/test352-standard-frames-sid/js/RICO_STANDARD_FRAMES_SID_TEST352.js?v=352-a1-256chars-psid`
121. `TEST/test353-index-live-refresh/js/RICO_SIDE_INDEX_LIVE_REFRESH_TEST353.js?v=353-a1-edit-paths`
122. `TEST/test354-calaca-diagonal-frames/js/RICO_DIAGONAL_MULTIFRAME_TEST354.js?v=354-a3-route-diagnostics`
123. `TEST/test355-export-combinations/js/RICO_GROUP_MULTIFRAME_TEST355.js?v=355-group-mf-a3-asm`
124. `TEST/test356-c64-palette-index/js/RICO_C64_PALETTE_INDEX_TEST356.js?v=356-c64-idx-preserve-a1`
125. `TEST/test358-native-right-dock/js/RICO_NATIVE_DOCK_TEST358_C17.js?v=358-c17-zero-height-host-fix`
126. `TEST/test359-full-height-right-sidebar/js/RICO_FULL_HEIGHT_RIGHT_SIDEBAR_TEST359.js?v=359-full-height-right-ui-a1`
127. `TEST/test363-diagonal-multiframe-unlocked/js/RICO_DIAGONAL_MULTIFRAME_TEST363.js?v=363-test342-pass-recovered-a1`
128. `TEST/test361-diagonal-charset/js/RICO_DIAGONAL_CHARSET_AUDIT_TEST361.js?v=361-passive-charset-prg-audit`

## Política de cambios

1. Consultar el fichero completo, sus hooks globales y los módulos anteriores y posteriores.
2. **No borrar** un JS referenciado desde `index.html` durante la limpieza de TEST.
3. Si un experimento antiguo deja de ejecutarse, conservar su historia en la rama archivada, documentar la razón y confirmar que la portada sigue igual.
4. Un PASS de VICE no equivale a certificación de todas las combinaciones; guardar el caso exacto y el commit.
