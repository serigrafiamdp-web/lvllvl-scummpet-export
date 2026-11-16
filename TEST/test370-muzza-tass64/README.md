# TEST370 - Muzza 64tass export menu
Status: UI + source translator; actual assembly with 64tass and VICE not yet confirmed.
Adds the exact requested Muzza`s Export Tass 64 entry below Interface -> Export C64 (new).
Opens the original C64 source export dialog and adds a Download 64tass ZIP action.
Converts ACME !source / !binary / !byte / !word to 64tass .include / .binary / .byte / .word.
Splits numeric data arrays into real .bin files and retains assembly labels.
Retains the original source, PRG buttons and all RICO exporters untouched.
Strictly checks 404/HTML instead of ASM, missing references and unsupported directives.
User-provided source(1).zip has NINE 9,379-byte copies of GitHub Pages 404 HTML in asm/*.asm.
Therefore this route correctly stops with precise missing-module diagnostics rather than false source.zip.
Current legacy C64 (new) engine does not support all advanced RICO export modes. A future stage must use the exact live PRG assembler source and check equivalence in real 64tass and VICE.
Acceptance: verify menu and dialog appear in root, and missing-module warning is shown; user PASS pending.
