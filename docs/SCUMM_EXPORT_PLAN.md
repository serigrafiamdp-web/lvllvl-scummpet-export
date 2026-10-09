# SCUMM PET C64 Export Integration Plan

## Principle

Do not redesign LVLLVL.

The exporter should consume the animation already open in LVLLVL and reproduce the behavior of the validated SCUMM PET C64 web normalizer.

## Reference implementation

Current external reference:
- LVLLVL / SCUMM Web Tool V0.40
- Engine profile: ANIMATION_16F_V2E

The integrated exporter must be validated against the external tool before becoming authoritative.

## Validation model

```text
same LVLLVL source
       |
       +--> Web Tool V0.40 ------> Output A
       |
       +--> Integrated Exporter -> Output B

                 Output A == Output B
                 byte-for-byte where applicable
```

## Initial exporter scope

1. Read current animation/project data from LVLLVL.
2. Build normalized charset.
3. Build Frame 1 FULL representation.
4. Build later Frames using the engine-supported FULL / DELTA / RLE choices.
5. Apply SCUMM PET C64 color policy.
6. Validate reconstructed Frames byte-for-byte.
7. Generate:
   - charset.bin
   - framepack.bin
   - resource.json
   - report.json
   - FORMAT.txt
8. Report memory usage against the current engine contract.

## Engine contract

Do not hard-code a new bank contract until the BANK16 work in SCUMM-PET-C64 is finished and promoted to MASTER.

Current work is intentionally isolated from engine development.

## Future

After the exporter matches V0.40:
- add direct Export -> SCUMM PET C64 menu entry;
- show framepack / charset memory usage before export;
- support future engine profiles;
- support future frame-count expansion beyond the current 16-frame profile.
