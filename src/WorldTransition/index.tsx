import React from 'react';
import {
	AbsoluteFill,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from 'remotion';

// ════════════════════════════════════════════════════════════════════
// WELTEN-ÜBERGANG  —  Portal-Transition im Stil der bestehenden Videos
//
// Bestehende Assets (exakt vermessen):
//   720 × 1280 · 24 fps · 8.0 s · 192 Frames · h264 · yuv420p
//
// Visuelle Sprache (aus transition_materie_to_energie / _energie_to_materie):
//   Quell-Welt-Signatur → Vortex-Spirale → Flash/Partikel-Explosion → Ziel-Welt-Signatur
//
// Welt-Farben (1:1 aus lib/animations/world_transition_video.dart):
//   MATERIE  primary #3B82F6  secondary #7DA7FF  deep #040D1F  glow #0D47A1
//   ENERGIE  primary #A855F7  secondary #C79AFF  deep #0C0318  glow #4A148C
//   VORHANG  primary #C9A84C  secondary #E0C872  deep #0D0B00  glow #8B7532
//   URSPRUNG primary #00D4AA  secondary #40E8C0  deep #050510  glow #008866
// ════════════════════════════════════════════════════════════════════

export type WorldId = 'materie' | 'energie' | 'vorhang' | 'ursprung';

interface Palette {
	primary: string;
	secondary: string;
	deep: string;
	glow: string;
	rgb: [number, number, number];        // primary as rgb
	rgbSec: [number, number, number];     // secondary as rgb
}

export const PALETTES: Record<WorldId, Palette> = {
	materie:  {primary: '#3B82F6', secondary: '#7DA7FF', deep: '#040D1F', glow: '#0D47A1', rgb: [59, 130, 246],  rgbSec: [125, 167, 255]},
	energie:  {primary: '#A855F7', secondary: '#C79AFF', deep: '#0C0318', glow: '#4A148C', rgb: [168, 85, 247],  rgbSec: [199, 154, 255]},
	vorhang:  {primary: '#C9A84C', secondary: '#E0C872', deep: '#0D0B00', glow: '#8B7532', rgb: [201, 168, 76],  rgbSec: [224, 200, 114]},
	ursprung: {primary: '#00D4AA', secondary: '#40E8C0', deep: '#050510', glow: '#008866', rgb: [0, 212, 170],   rgbSec: [64, 232, 192]},
};

const W = 720;
const H = 1280;
const CX = W / 2;
const CY = H / 2;

// ── Helpers ──────────────────────────────────────────────────────────
const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hexLerp = (h1: [number, number, number], h2: [number, number, number], t: number): [number, number, number] =>
	[Math.round(lerp(h1[0], h2[0], t)), Math.round(lerp(h1[1], h2[1], t)), Math.round(lerp(h1[2], h2[2], t))];

const smooth = (edge0: number, edge1: number, x: number) => {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
};

// Deterministic pseudo-random generator (stable across frames)
const prng = (seed: number) => {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
};

// ════════════════════════════════════════════════════════════════════
// WELT-SIGNATUR-VISUALS  (jede Welt hat ihr eigenes Erscheinungsbild)
// ════════════════════════════════════════════════════════════════════

// ── MATERIE: Schaltkreis-Kristall (blau, geometrisch, scharf) ──
const MaterieSignature: React.FC<{f: number; pal: Palette}> = ({f, pal}) => {
	const rnd = prng(101);
	const nodes = Array.from({length: 26}, () => ({
		x: rnd() * W, y: rnd() * H, r: 2 + rnd() * 3, ph: rnd() * Math.PI * 2,
	}));
	// connect each node to its 2 nearest neighbours
	const edges: {a: typeof nodes[0]; b: typeof nodes[0]}[] = [];
	nodes.forEach((n, i) => {
		const others = nodes
			.map((m, j) => ({m, j, d: Math.hypot(n.x - m.x, n.y - m.y)}))
			.filter((o) => o.j !== i)
			.sort((a, b) => a.d - b.d)
			.slice(0, 2);
		others.forEach((o) => edges.push({a: n, b: o.m}));
	});
	// crystal shards from bottom
	const shards = Array.from({length: 9}, (_, i) => {
		const bx = (i + 0.5) * (W / 9) + (rnd() - 0.5) * 40;
		const bh = 180 + rnd() * 320;
		const bw = 40 + rnd() * 50;
		return {bx, bh, bw};
	});
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="matShard" x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stopColor={rgba(pal.rgb, 0.45)} />
					<stop offset="100%" stopColor={rgba(pal.rgbSec, 0.0)} />
				</linearGradient>
			</defs>
			{/* circuit edges */}
			{edges.map((e, i) => (
				<line key={i} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
					stroke={rgba(pal.rgb, 0.18)} strokeWidth={1} />
			))}
			{/* data pulses travelling along edges */}
			{edges.map((e, i) => {
				if (i % 3 !== 0) return null;
				const t = ((f * 0.012 + i * 0.13) % 1);
				const px = lerp(e.a.x, e.b.x, t);
				const py = lerp(e.a.y, e.b.y, t);
				return <circle key={`p${i}`} cx={px} cy={py} r={2} fill={rgba(pal.rgbSec, 0.9)} />;
			})}
			{/* crystal shards */}
			{shards.map((s, i) => (
				<polygon key={i}
					points={`${s.bx},${H} ${s.bx - s.bw / 2},${H - s.bh * 0.55} ${s.bx},${H - s.bh} ${s.bx + s.bw / 2},${H - s.bh * 0.55}`}
					fill="url(#matShard)" stroke={rgba(pal.rgbSec, 0.5)} strokeWidth={1.2} />
			))}
			{/* nodes */}
			{nodes.map((n, i) => {
				const pulse = 0.5 + Math.sin(f * 0.08 + n.ph) * 0.5;
				return (
					<g key={i}>
						<circle cx={n.x} cy={n.y} r={n.r * (1.5 + pulse)} fill={rgba(pal.rgb, 0.12)} />
						<circle cx={n.x} cy={n.y} r={n.r} fill={rgba(pal.rgbSec, 0.7 + pulse * 0.3)} />
					</g>
				);
			})}
		</svg>
	);
};

// ── ENERGIE: fließende Energiewellen (lila, weich, organisch) ──
const EnergieSignature: React.FC<{f: number; pal: Palette}> = ({f, pal}) => {
	const rnd = prng(202);
	const waveBands = Array.from({length: 6}, (_, i) => ({
		baseY: H * (0.42 + i * 0.11),
		amp: 40 + i * 14,
		speed: 0.6 + i * 0.18,
		phase: i * 1.3,
		op: 0.10 + i * 0.05,
	}));
	const buildWave = (b: typeof waveBands[0]) => {
		let d = `M 0 ${H} L 0 ${b.baseY} `;
		for (let x = 0; x <= W; x += 24) {
			const y = b.baseY + Math.sin(x * 0.012 + f * 0.03 * b.speed + b.phase) * b.amp
				+ Math.sin(x * 0.03 - f * 0.02) * (b.amp * 0.3);
			d += `L ${x} ${y} `;
		}
		d += `L ${W} ${H} Z`;
		return d;
	};
	const particles = Array.from({length: 40}, () => ({
		x: rnd() * W, y: rnd() * H, r: 1 + rnd() * 2.5, sp: 0.3 + rnd() * 0.8, ph: rnd() * 100,
	}));
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				{waveBands.map((b, i) => (
					<linearGradient key={i} id={`enWave${i}`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={rgba(pal.rgb, b.op * 2.2)} />
						<stop offset="100%" stopColor={rgba(pal.rgb, 0)} />
					</linearGradient>
				))}
			</defs>
			{waveBands.map((b, i) => (
				<path key={i} d={buildWave(b)} fill={`url(#enWave${i})`} />
			))}
			{/* rising glow particles */}
			{particles.map((p, i) => {
				const y = (p.y - f * p.sp * 2) % H;
				const yy = y < 0 ? y + H : y;
				const tw = 0.4 + Math.sin(f * 0.05 + p.ph) * 0.4;
				return <circle key={i} cx={p.x} cy={yy} r={p.r} fill={rgba(pal.rgbSec, tw)} />;
			})}
		</svg>
	);
};

// ── VORHANG: Lichtvorhang (gold, vertikale wehende Schleier) ──
const VorhangSignature: React.FC<{f: number; pal: Palette}> = ({f, pal}) => {
	const rnd = prng(303);
	const drapes = Array.from({length: 11}, (_, i) => ({
		baseX: (i + 0.5) * (W / 11),
		width: W / 11 * 1.25,
		sway: 24 + rnd() * 22,
		speed: 0.4 + rnd() * 0.5,
		phase: i * 0.7,
		op: 0.12 + rnd() * 0.12,
	}));
	const buildDrape = (d: typeof drapes[0]) => {
		const off = (y: number) => Math.sin(y * 0.006 + f * 0.025 * d.speed + d.phase) * d.sway;
		let path = `M ${d.baseX + off(0) - d.width / 2} 0 `;
		for (let y = 0; y <= H; y += 40) path += `L ${d.baseX + off(y) - d.width / 2} ${y} `;
		path += `L ${d.baseX + off(H) + d.width / 2} ${H} `;
		for (let y = H; y >= 0; y -= 40) path += `L ${d.baseX + off(y) + d.width / 2} ${y} `;
		path += 'Z';
		return path;
	};
	const dust = Array.from({length: 36}, () => ({
		x: rnd() * W, y: rnd() * H, r: 0.8 + rnd() * 2, sp: 0.2 + rnd() * 0.6, ph: rnd() * 100,
	}));
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="vhDrape" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={rgba(pal.rgb, 0.0)} />
					<stop offset="35%" stopColor={rgba(pal.rgb, 0.5)} />
					<stop offset="65%" stopColor={rgba(pal.rgbSec, 0.55)} />
					<stop offset="100%" stopColor={rgba(pal.rgb, 0.0)} />
				</linearGradient>
			</defs>
			{drapes.map((d, i) => (
				<path key={i} d={buildDrape(d)} fill="url(#vhDrape)" opacity={d.op} />
			))}
			{/* vertical shimmer highlights running down each drape */}
			{drapes.map((d, i) => {
				const sy = ((f * 6 + i * 120) % (H + 200)) - 100;
				const off = Math.sin(sy * 0.006 + f * 0.025 * d.speed + d.phase) * d.sway;
				return (
					<circle key={`s${i}`} cx={d.baseX + off} cy={sy} r={6}
						fill={rgba(pal.rgbSec, 0.5)}
						style={{filter: 'blur(4px)'}} />
				);
			})}
			{/* gold dust */}
			{dust.map((p, i) => {
				const y = (p.y + f * p.sp * 2) % H;
				const tw = 0.3 + Math.sin(f * 0.06 + p.ph) * 0.35;
				return <circle key={i} cx={p.x} cy={y} r={p.r} fill={rgba(pal.rgbSec, tw)} />;
			})}
		</svg>
	);
};

// ── URSPRUNG: Genesis-Ursprung (cyan, konzentrische Ringe + Kern) ──
const UrsprungSignature: React.FC<{f: number; pal: Palette}> = ({f, pal}) => {
	const rnd = prng(404);
	const rings = Array.from({length: 7}, (_, i) => i);
	const dust = Array.from({length: 50}, () => ({
		x: rnd() * W, y: rnd() * H, r: 0.8 + rnd() * 2.2, ph: rnd() * 100, sp: 0.2 + rnd() * 0.5,
	}));
	// lemniscate (infinity) orbiting particle
	const lemT = f * 0.04;
	const lemScale = 150;
	const lemX = CX + (lemScale * Math.cos(lemT)) / (1 + Math.sin(lemT) ** 2);
	const lemY = CY + (lemScale * Math.sin(lemT) * Math.cos(lemT)) / (1 + Math.sin(lemT) ** 2);
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<radialGradient id="urCore" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={rgba([255, 255, 255], 0.9)} />
					<stop offset="35%" stopColor={rgba(pal.rgbSec, 0.7)} />
					<stop offset="100%" stopColor={rgba(pal.rgb, 0)} />
				</radialGradient>
			</defs>
			{/* expanding origin rings */}
			{rings.map((i) => {
				const t = ((f * 0.01 + i / rings.length) % 1);
				const r = t * 620;
				const op = (1 - t) * 0.35;
				return (
					<circle key={i} cx={CX} cy={CY} r={r}
						fill="none" stroke={rgba(pal.rgb, op)} strokeWidth={2} />
				);
			})}
			{/* nebula dust */}
			{dust.map((p, i) => {
				const tw = 0.25 + Math.sin(f * 0.05 + p.ph) * 0.3;
				const drift = Math.sin(f * 0.01 + p.ph) * 10;
				return <circle key={i} cx={p.x + drift} cy={p.y} r={p.r} fill={rgba(pal.rgbSec, tw)} />;
			})}
			{/* infinity orbiting particle + trail */}
			<circle cx={lemX} cy={lemY} r={5} fill={rgba(pal.rgbSec, 0.95)} style={{filter: 'blur(1px)'}} />
			{/* genesis core */}
			<circle cx={CX} cy={CY} r={70 + Math.sin(f * 0.07) * 12} fill="url(#urCore)" />
		</svg>
	);
};

const Signature: React.FC<{world: WorldId; f: number}> = ({world, f}) => {
	const pal = PALETTES[world];
	switch (world) {
		case 'materie':  return <MaterieSignature f={f} pal={pal} />;
		case 'energie':  return <EnergieSignature f={f} pal={pal} />;
		case 'vorhang':  return <VorhangSignature f={f} pal={pal} />;
		case 'ursprung': return <UrsprungSignature f={f} pal={pal} />;
	}
};

// ════════════════════════════════════════════════════════════════════
// VORTEX  —  rotierende Spiralarme + heller Kern (Portal-Wirbel)
// ════════════════════════════════════════════════════════════════════
const Vortex: React.FC<{f: number; intensity: number; col: [number, number, number]; colSec: [number, number, number]}> =
({f, intensity, col, colSec}) => {
	if (intensity <= 0.001) return null;
	const arms = 4;
	const rot = f * 0.06;
	const spirals: string[] = [];
	for (let a = 0; a < arms; a++) {
		const a0 = rot + (a * Math.PI * 2) / arms;
		let d = '';
		for (let t = 0; t <= Math.PI * 3; t += 0.12) {
			const r = (12 + t * 42) * intensity;
			const x = CX + Math.cos(a0 + t) * r;
			const y = CY + Math.sin(a0 + t) * r;
			d += t === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
		}
		spirals.push(d);
	}
	const coreR = (40 + 120 * intensity) ;
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<radialGradient id="vxCore" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={rgba([255, 255, 255], 0.95 * intensity)} />
					<stop offset="40%" stopColor={rgba(colSec, 0.6 * intensity)} />
					<stop offset="100%" stopColor={rgba(col, 0)} />
				</radialGradient>
				<filter id="vxGlow" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="3" result="b" />
					<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
				</filter>
			</defs>
			<g filter="url(#vxGlow)">
				{spirals.map((d, i) => (
					<path key={i} d={d} fill="none"
						stroke={rgba(i % 2 ? colSec : col, 0.7 * intensity)}
						strokeWidth={5} strokeLinecap="round" />
				))}
			</g>
			<circle cx={CX} cy={CY} r={coreR} fill="url(#vxCore)" />
		</svg>
	);
};

// Spiralende Partikel — fliegen rein, dann raus (Explosion)
const ParticleRing: React.FC<{f: number; p: number; col: [number, number, number]; colSec: [number, number, number]}> =
({f, p, col, colSec}) => {
	// active 0.18 .. 0.85
	const fade = Math.min(smooth(0.15, 0.30, p), 1 - smooth(0.72, 0.88, p));
	if (fade <= 0.001) return null;
	const rnd = prng(777);
	const count = 95;
	// inward until 0.6, outward after (explosion)
	const phase = p < 0.6 ? smooth(0.18, 0.6, p) : 1 - smooth(0.6, 0.86, p);
	const explode = smooth(0.58, 0.85, p);
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			{Array.from({length: count}, (_, i) => {
				const baseAngle = rnd() * Math.PI * 2;
				const baseR = 80 + rnd() * 360;
				const speed = 0.5 + rnd() * 2;
				const sz = 1.2 + rnd() * 3;
				const angle = baseAngle + f * 0.02 * speed;
				// inward (phase shrinks radius) then explode outward
				const r = baseR * (1 - phase * 0.85) + explode * baseR * 1.8;
				const x = CX + Math.cos(angle) * r;
				const y = CY + Math.sin(angle) * r;
				const c = i % 3 === 0 ? colSec : col;
				return <circle key={i} cx={x} cy={y} r={sz + explode * 1.5} fill={rgba(c, fade * (0.4 + rnd() * 0.6))} />;
			})}
		</svg>
	);
};

// ════════════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE
// ════════════════════════════════════════════════════════════════════
export interface WorldTransitionProps {
	from: WorldId;
	to: WorldId;
}

export const WorldTransition: React.FC<WorldTransitionProps> = ({from = 'materie', to = 'ursprung'}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const p = frame / (durationInFrames - 1);   // 0 .. 1

	const fromPal = PALETTES[from];
	const toPal = PALETTES[to];

	// ── Envelopes ──
	const sourceVis = 1 - smooth(0.30, 0.55, p);
	const targetVis = smooth(0.55, 0.80, p);
	const vortexUp = smooth(0.15, 0.45, p);
	const vortexDown = 1 - smooth(0.60, 0.82, p);
	const vortex = Math.min(vortexUp, vortexDown);
	const flash = Math.min(smooth(0.50, 0.60, p), 1 - smooth(0.60, 0.74, p));

	// ── Camera (Zoom + leichte Rotation) ──
	const sourceZoom = 1 + 0.8 * smooth(0.10, 0.60, p);
	const sourceRot = 22 * smooth(0.10, 0.60, p);
	const targetZoom = 1.4 - 0.4 * smooth(0.56, 0.96, p);
	const targetRot = -16 * (1 - smooth(0.56, 0.96, p));

	// ── Vortex blended colour (source → target) ──
	const vortexCol = hexLerp(fromPal.rgb, toPal.rgb, smooth(0.3, 0.7, p));
	const vortexColSec = hexLerp(fromPal.rgbSec, toPal.rgbSec, smooth(0.3, 0.7, p));

	// ── Background deep colour blend ──
	const bgRgb = hexLerp(
		[parseInt(fromPal.deep.slice(1, 3), 16), parseInt(fromPal.deep.slice(3, 5), 16), parseInt(fromPal.deep.slice(5, 7), 16)],
		[parseInt(toPal.deep.slice(1, 3), 16), parseInt(toPal.deep.slice(3, 5), 16), parseInt(toPal.deep.slice(5, 7), 16)],
		smooth(0.40, 0.65, p),
	);

	return (
		<AbsoluteFill style={{background: `rgb(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]})`, overflow: 'hidden'}}>
			{/* Source world */}
			<div style={{
				position: 'absolute', inset: 0, opacity: sourceVis,
				transform: `scale(${sourceZoom}) rotate(${sourceRot}deg)`,
				transformOrigin: 'center center',
			}}>
				<Signature world={from} f={frame} />
			</div>

			{/* Target world */}
			<div style={{
				position: 'absolute', inset: 0, opacity: targetVis,
				transform: `scale(${targetZoom}) rotate(${targetRot}deg)`,
				transformOrigin: 'center center',
			}}>
				<Signature world={to} f={frame} />
			</div>

			{/* Ambient radial glow blending source→target primary */}
			<AbsoluteFill style={{
				background: `radial-gradient(ellipse at 50% 50%, ${rgba(vortexCol, 0.20 + vortex * 0.18)} 0%, transparent 60%)`,
				pointerEvents: 'none',
			}} />

			{/* Vortex spiral */}
			<Vortex f={frame} intensity={vortex} col={vortexCol} colSec={vortexColSec} />

			{/* Particle ring / explosion */}
			<ParticleRing f={frame} p={p} col={vortexCol} colSec={vortexColSec} />

			{/* Flash burst */}
			{flash > 0.001 && (
				<AbsoluteFill style={{
					background: `radial-gradient(circle at 50% 50%, ${rgba([255, 255, 255], flash * 0.85)} 0%, ${rgba(toPal.rgb, flash * 0.7)} 25%, transparent 65%)`,
					pointerEvents: 'none',
				}} />
			)}

			{/* Cinematic vignette */}
			<AbsoluteFill style={{
				background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
				pointerEvents: 'none',
			}} />
		</AbsoluteFill>
	);
};
