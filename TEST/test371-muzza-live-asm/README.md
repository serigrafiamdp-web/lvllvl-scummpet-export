# TEST371 — Muzza’s Export Tass 64, real ASM capture
Confirmed browser TEST370: menu and dialog worked; 9 missing engine ASM files were correctly rejected.
TEST371 uses Export C64 (NEW) dialog settings but does NOT request its broken legacy source modules.
It invokes the LIVE RICO ToPRGAdv.createPRG for the same project, capturing the actual g_app.assembler.assemble calls and result bytes.
It requires an exact byte match of the fully assembled PRG to the returned/exported PRG. If a route postpatches code or bypasses assembler, it reports a precise diagnostic.
The matched source becomes main.asm. ACME byte/word/source/binary syntax is converted to 64tass, large numeric byte arrays become data/*.bin; reference.prg is included.
Bundle contains build.sh, build.bat, manifest.json, README.md, and source/assets actually generated.
Existing Export C64 NEW buttons and other PRG exports are untouched. A failed conversion does NOT silently export a static image.
Need actual 64tass compilation, binary equality and VICE tests to promote to full PASS.
User acceptance TEST371 pending. UI remains at Interface > Muzza`s Export Tass 64.
