# TEST372 — Restore native EBCM PRG export

User comparison \`LILCHEB.zip\`:
- Both James and RICO JSON contain the same 26 frames and the same per-cell backgrounds \`-1, 9, 11, 12, 15\` (four actual C64 colors). Both layers have \`screenMode: textmode\`, so original PRG's 'Extended' export selection is independent of editor layer mode.
- James original PRG: 44,122 bytes, PRG load $0801, **$0811=$01** (Extended Background Color Mode).
- RICO PRG: 47,119 bytes, PRG load $0801, **$0811=$00** (standard text).

**Exact cause:** the RICO TEST104 wrapper and its nested TEST264 wrapper unconditionally set \`safeArgs.mode='standard'\` for non-multicolor modes. Both force unrelated args; their bank switch hook replaces the player's STA $D024, which is EBCM's 4th background color. The native James exporter *already has* real Extended remapping and four background colors.

**Minimal correction:** On BOTH wrappers, before mutating any argument or intercepting downloads, check \`args.mode === 'extended'\` and immediately delegate with unchanged original arguments to the previous exporter. In non-extended mode, behavior remains byte-for-byte identical in the scripts. This is **not** a PRG byte patch, because charset and frame/color tables also differ.

Original JS modules remain in their original repository locations. The live index only swaps those two script references for the TEST372 guarded copies. No change to editor data, palette changes, Dock, TASS, other PRG exporters, or main.js.

**Verification required by user:** Load \`LIL CHEB RICO (1).json\`, open original C64 PRG exporter, select **Extended Color** (the native dialog should auto-select if background colors are detected), export and test in VICE. Compare new PRG $0811 and all 26 frames and colors against James. Check standard and multicolor dual-bank exports still work. No user PASS or VICE PASS yet.

**Scope:** This restores the EBCM-only path. EBCM combined with an actual BANK 2 switch requires a separate $D024-safe switch scheduler and is not claimed as implemented.