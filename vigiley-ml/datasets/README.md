# NTHU-DDD Feature Store — Dataset Card

## Source dataset

**NTHU Driver Drowsiness Detection (NTHU-DDD) video dataset**, NTHU Computer
Vision Lab. 36 subjects of different ethnicities, with/without
glasses/sunglasses, day + night (IR) illumination, simulated driving with
steering wheel and pedals. Scenarios per subject: normal driving, yawning,
slow blink rate, falling asleep, laughing/talking. Total ≈ 9.5 hours.
Train split: 18 subjects × 5 scenarios; eval/test: 90 videos from the other
18 subjects with mixed drowsy/non-drowsy status.

**Mandatory citation** (required by the dataset license for any paper,
publication, or report using this data):

> Ching-Hua Weng, Ying-Hsiu Lai, Shang-Hong Lai, "Driver Drowsiness
> Detection via a Hierarchical Temporal Deep Belief Network," Proc. Asian
> Conference on Computer Vision (ACCV) Workshop on Driver Drowsiness
> Detection from Video, Taipei, Taiwan, Nov. 2016.

Dataset page: `http://cv.cs.nthu.edu.tw/php/callforpaper/datasets/DDD/`

## License & ethics terms (from the NTHU-DDD license agreement)

- Non-commercial research and educational purposes only.
- No redistribution to second parties.
- Face images from the videos **cannot** be used for any other purpose;
  only subjects **010 and 021** may appear in academic publications.
- Our paper follows this: no raw face images are published; only aggregate
  metrics and (optionally) subjects 010/021 frames.

## What is stored here

`features.npz` — MediaPipe FaceLandmarker features extracted per frame:

| key       | shape        | content                                    |
|-----------|--------------|--------------------------------------------|
| `X_train` | (14231, 4)   | `[EAR, MAR, head_pitch, head_yaw]`         |
| `X_test`  | (3558, 4)    | same layout                                |
| `y_train` | (14231,)     | 0 = normal, 1 = drowsy                     |
| `y_test`  | (3558,)      | same                                       |

Provenance hash is recorded in `evaluation_results.json` (`provenance.sha256`).

## Known limitations (stated, not hidden)

1. **No subject IDs** in the current `.npz`: the train/test split is
   frame-stratified, so subject overlap between splits is possible.
   Subject-disjoint evaluation requires regenerating features with
   `build_features.py` (subject-id aware) from the raw videos.
2. **Column semantics are inherited, not re-validated**: column 2 spans
   ±180 and averages ≈129, which does not match a degree pitch
   interpretation; treat pitch/yaw columns with caution until the rebuild
   re-validates them against raw video.
3. **MAR is weakly discriminative** on this data (talking/laughing frames
   sit in the negative class): mean MAR ≈ 0.46 in both classes. Yawning
   validation belongs on YawDD-style talking-vs-yawning splits
   (Abtahi et al., MMSys 2014).

## Regenerating features (reproducibility)

1. Obtain NTHU-DDD raw videos under the license above (request access from
   NTHU CV Lab; ~800 MB+).
2. Run `python build_features.py --videos <dir> --out datasets/features.npz`
   (writes subject-disjoint stratified splits + subject id arrays).
3. Run `python train.py` to reproduce `evaluation_results.json` and
   `confidence_weights.json`.
