# Nunito Sans for Mira

Prepared in RN-00 on 2026-10-21 from the approved Lab source `ui-lab/design/step-04/assets/fonts/nunitosans-variable.ttf`. License: [NunitoSans-OFL.txt](NunitoSans-OFL.txt). Full source/output hashes and internal name records are in [the handoff manifest](../../../docs/ui-native-handoff/assets.json).

| File / planned runtime alias | Weight | Internal PostScript name |
| --- | --- | --- |
| `NunitoSans-Regular` | 400 | `NunitoSans-Normal` |
| `NunitoSans-Medium` | 500 | `NunitoSans-NormalMedium` |
| `NunitoSans-SemiBold` | 600 | `NunitoSans-NormalSemiBold` |
| `NunitoSans-Bold` | 700 | `NunitoSans-NormalBold` |

The alias column is the explicit font-loading key used by RN-01 in the root layout. It differs from the embedded PostScript name. `src/components/ui/typography.ts` exposes the matching text roles; shared controls and screens adopt them in subsequent batches.

Static instances were produced with fontTools 4.61.1, retaining source timestamps and updating the name table. All axes are pinned: `wght` to the listed weight, `wdth=100`, `opsz=12`, `YTLC=500`. Each file was reopened to confirm its weight and metadata; no variable font tables remain. Glyphs were not subset.

To reproduce a weight from the repository root (replace weight/output for the other rows):

```powershell
uv run --no-project --with fonttools==4.61.1 python -m fontTools.varLib.instancer ui-lab/design/step-04/assets/fonts/nunitosans-variable.ttf wght=400 wdth=100 opsz=12 YTLC=500 --update-name-table --no-recalc-timestamp -o mobile/assets/fonts/NunitoSans-Regular.ttf
```

fontTools was used through an isolated uv environment; it is not an application dependency. RN-01 configures native font loading. Rendered text review remains pending during the screen transfers.
