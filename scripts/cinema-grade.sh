#!/usr/bin/env bash
# Cinema-Grade + Supersampling-Downscale für die HQ-Welten-Übergänge.
# Nutzung: cinema-grade.sh <input_supersampled.mp4> <output_720x1280.mp4>
# Erwartet Input in 2x (1440x2560), liefert 720x1280 yuv420p ~2 Mbit/s.
set -euo pipefail
IN="$1"; OUT="$2"

ffmpeg -y -i "$IN" -vf "
  scale=720:1280:flags=lanczos,
  format=gbrp,
  eq=contrast=1.08:saturation=1.18:gamma=0.98,
  curves=r='0/0 0.5/0.52 1/1':b='0/0.02 0.5/0.48 1/0.98',
  rgbashift=rh=2:bv=-2,
  vignette=PI/4.2,
  noise=alls=6:allf=t+u,
  format=yuv420p
" -color_range tv -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -b:v 2100k -maxrate 2700k -bufsize 4M -movflags +faststart -an "$OUT"

echo "graded -> $OUT"
