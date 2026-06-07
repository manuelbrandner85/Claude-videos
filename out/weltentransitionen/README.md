# Welten-Übergangsvideos (Ring-Reihenfolge)

6 neue Portal-Übergänge für die **Weltenbibliothek-App**, generiert im exakten Stil
der bestehenden Videos `transition_materie_to_energie.mp4` / `transition_energie_to_materie.mp4`.

## Welten-Ring

```
Materie ──▶ Energie ──▶ Vorhang ──▶ Ursprung ──▶ (zurück zu) Materie
   ◀────────── ◀────────── ◀────────── ◀──────────
```

Bestehend: `Materie ↔ Energie` (2 Videos)
**Neu generiert (diese 6):**

| Datei | Übergang | Farben |
|-------|----------|--------|
| `transition_energie_to_vorhang.mp4`  | Energie → Vorhang  | Lila → Gold |
| `transition_vorhang_to_energie.mp4`  | Vorhang → Energie  | Gold → Lila |
| `transition_vorhang_to_ursprung.mp4` | Vorhang → Ursprung | Gold → Cyan |
| `transition_ursprung_to_vorhang.mp4` | Ursprung → Vorhang | Cyan → Gold |
| `transition_ursprung_to_materie.mp4` | Ursprung → Materie | Cyan → Blau |
| `transition_materie_to_ursprung.mp4` | Materie → Ursprung | Blau → Cyan |

## Technische Specs (1:1 wie die Originale)

- **720 × 1280** (9:16 Portrait)
- **24 fps**, **8.0 s**, **192 Frames**
- **h264**, **yuv420p** (limited range), ~2 Mbit/s
- `+faststart` für mobiles Streaming

## Welten-Farben (1:1 aus `lib/animations/world_transition_video.dart`)

| Welt | primary | secondary | deep | glow |
|------|---------|-----------|------|------|
| Materie  | `#3B82F6` | `#7DA7FF` | `#040D1F` | `#0D47A1` |
| Energie  | `#A855F7` | `#C79AFF` | `#0C0318` | `#4A148C` |
| Vorhang  | `#C9A84C` | `#E0C872` | `#0D0B00` | `#8B7532` |
| Ursprung | `#00D4AA` | `#40E8C0` | `#050510` | `#008866` |

## Visuelle Sprache (wie die Originale)

Jeder Übergang folgt dem Muster: **Quell-Welt-Signatur → Vortex-Spirale → Flash/Partikel-Explosion → Ziel-Welt-Signatur**

Welt-Signaturen:
- **Materie** – Schaltkreis-Knoten + Kristall-Scherben (blau, geometrisch)
- **Energie** – fließende Energiewellen + Partikel (lila, organisch)
- **Vorhang** – wehende Gold-Lichtvorhänge + Funken (gold)
- **Ursprung** – konzentrische Genesis-Ringe + Kern + Infinity-Flow (cyan)

## Installation in die Weltenbibliothek-App

1. Die 6 `.mp4` nach `assets/videos/` kopieren.
2. Den Patch anwenden (fügt pubspec-Einträge + gerichtete Video-Logik + Quell-Welt-Übergabe hinzu):
   ```bash
   git apply weltentransitionen_integration.patch
   flutter pub get
   ```
   Der Patch erweitert:
   - `pubspec.yaml` – die 6 neuen Assets
   - `lib/animations/world_transition_video.dart` – `sourceWorld`-Parameter + gerichtete Asset-Auswahl
   - `lib/widgets/world_switcher_pill.dart` – übergibt `sourceWorld: currentWorld`

Nicht-Ring-Paare (z.B. Materie↔Vorhang, Energie↔Ursprung) nutzen weiterhin die
vorhandene programmatische Animation als Fallback.

## Neu erzeugen / anpassen

Generator: `src/WorldTransition/index.tsx` im Claude-videos-Repo (Remotion).
```bash
npx remotion render WorldTransition out.mp4 --props='{"from":"vorhang","to":"ursprung"}' \
  --pixel-format=yuv420p --codec=h264
```
