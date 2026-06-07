#!/usr/bin/env bash
set -euo pipefail
cd /home/user/Claude-videos
mkdir -p out/hq
GRADE=scripts/cinema-grade.sh

render_one () {
  local FROM="$1" TO="$2"
  local RAW="out/hq/_raw_${FROM}_to_${TO}.mp4"
  local FINAL="out/hq/transition_${FROM}_to_${TO}.mp4"
  echo ">>> RENDER ${FROM} -> ${TO} (1.5x supersample)"
  npx remotion render WorldTransitionHQ "$RAW" \
    --props="{\"from\":\"${FROM}\",\"to\":\"${TO}\"}" \
    --scale=1.5 --pixel-format=yuv420p --codec=h264
  echo ">>> GRADE ${FROM} -> ${TO}"
  bash "$GRADE" "$RAW" "$FINAL"
  rm -f "$RAW"
  echo "DONE ${FINAL}"
}

render_one vorhang ursprung
render_one ursprung vorhang
echo "ALL HQ RENDERS COMPLETE"
