# Welten-Übergänge HIGH-END (fotorealistisch, 3D)

Zwei hyperrealistische Portal-Übergänge in echtem 3D (Three.js + WebGL),
gerendert mit HDR-Bloom und cinematischem Color-Grading.

| Datei | Übergang | Welt-Bezug am Ein-/Austritt |
|-------|----------|------------------------------|
| `transition_vorhang_to_ursprung.mp4` | Vorhang → Ursprung | Gold-Lichtschleier → Genesis-Kern + Akkretions-Ringe |
| `transition_ursprung_to_vorhang.mp4` | Ursprung → Vorhang | Genesis-Kern + Ringe → Gold-Aurora-Lichtschleier |

**Ersetzen** die einfacheren 2D-Versionen aus `out/weltentransitionen/` für
diese beiden Übergänge (identische Dateinamen & Specs → Drop-in).

## Technik

- **Echtes 3D**: Kamera-Flug durch ein Wurmloch (bewegte Group, deterministisch)
- **Tiefe**: Volumen-Nebel (Fog), perspektivisches Partikel-Warpfeld, Sternenfeld
- **HDR-Bloom** (`@react-three/postprocessing`) → echtes Leuchten von Kern/Ringen/Schleiern
- **Vorhang**: gewellte Aurora-Lichtschleier (per-Frame Vertex-Animation), Lichtstrahlen, Gold-Funken
- **Ursprung**: weißer Genesis-Kern, geneigte Akkretions-Ringe, einströmende Filamente, Volumen-Nebel, Sterne
- **Cinema-Grade** (FFmpeg): Kontrast/Sättigung, warme Kurven, Chromatic Aberration, Vignette, Film-Grain

## Specs (1:1 wie die Original-Übergänge)

720 × 1280 · 24 fps · 8.0 s · 192 Frames · h264 · yuv420p · ~2 Mbit/s

## Neu erzeugen

```bash
bash scripts/render-hq.sh   # rendert beide + graded automatisch
# oder einzeln:
npx remotion render WorldTransitionHQ out.mp4 \
  --props='{"from":"vorhang","to":"ursprung"}' --pixel-format=yuv420p --codec=h264
bash scripts/cinema-grade.sh out.mp4 final.mp4
```

Generator: `src/WorldTransitionHQ/index.tsx`
