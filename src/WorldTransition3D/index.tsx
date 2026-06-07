import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

// ════════════════════════════════════════════════════════════════════
// WELTEN-ÜBERGANG 3D  —  hyperrealistischer cinematic Portal-Flug
//
// Kamera fliegt durch ein 3D-Wurmloch von der Quell-Welt in die Ziel-Welt.
// Beide Welten sind erkennbare 3D-Umgebungen (Tiefe, Volumen-Nebel, Bloom-Halos).
//
//   MATERIE  – schwebende Kristall-Polyeder + Gitter-Boden (blau, fest)
//   ENERGIE  – Plasma-Flächen + glühende Energie-Kugeln (lila, fließend)
//   VORHANG  – wehende Gold-Lichtvorhänge + Lichtstrahlen (gold, Schleier)
//   URSPRUNG – Genesis-Kern + umkreisende Ringe + Nebel (cyan, Ursprung)
//
// Specs: 720×1280 · 24 fps · 8 s · 192 Frames (wie die Originale)
// ════════════════════════════════════════════════════════════════════

export type WorldId = 'materie' | 'energie' | 'vorhang' | 'ursprung';

interface Pal {
	primary: string;
	secondary: string;
	deep: string;
	glow: string;
}

export const PAL: Record<WorldId, Pal> = {
	materie:  {primary: '#3B82F6', secondary: '#7DA7FF', deep: '#040D1F', glow: '#0D47A1'},
	energie:  {primary: '#A855F7', secondary: '#C79AFF', deep: '#0C0318', glow: '#4A148C'},
	vorhang:  {primary: '#C9A84C', secondary: '#E0C872', deep: '#0D0B00', glow: '#8B7532'},
	ursprung: {primary: '#00D4AA', secondary: '#40E8C0', deep: '#050510', glow: '#008866'},
};

// ── deterministic prng ──
const prng = (seed: number) => {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
};

const lerpColor = (a: string, b: string, t: number) =>
	new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(t, 0, 1));

// ════════════════════════════════════════════════════════════════════
// PROZEDURALE TEXTUREN (Canvas)
// ════════════════════════════════════════════════════════════════════
const makeStreakTexture = (color: string) => {
	const c = document.createElement('canvas');
	c.width = 256; c.height = 256;
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, 256, 256);
	const rnd = prng(7);
	for (let i = 0; i < 90; i++) {
		const x = rnd() * 256;
		const w = 1 + rnd() * 2.5;
		const h = 40 + rnd() * 180;
		const y = rnd() * 256;
		const a = 0.15 + rnd() * 0.6;
		const g = ctx.createLinearGradient(0, y, 0, y + h);
		g.addColorStop(0, `rgba(255,255,255,0)`);
		g.addColorStop(0.5, color);
		g.addColorStop(1, `rgba(255,255,255,0)`);
		ctx.globalAlpha = a;
		ctx.fillStyle = g;
		ctx.fillRect(x, y, w, h);
	}
	ctx.globalAlpha = 1;
	const tex = new THREE.CanvasTexture(c);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	return tex;
};

const makeGridTexture = (color: string) => {
	const c = document.createElement('canvas');
	c.width = 512; c.height = 512;
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, 512, 512);
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.globalAlpha = 0.8;
	for (let i = 0; i <= 512; i += 32) {
		ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
	}
	const tex = new THREE.CanvasTexture(c);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(8, 18);
	return tex;
};

const makeGradientTexture = (top: string, mid: string) => {
	const c = document.createElement('canvas');
	c.width = 64; c.height = 256;
	const ctx = c.getContext('2d')!;
	const g = ctx.createLinearGradient(0, 0, 0, 256);
	g.addColorStop(0, 'rgba(0,0,0,0)');
	g.addColorStop(0.35, top);
	g.addColorStop(0.6, mid);
	g.addColorStop(1, 'rgba(0,0,0,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 64, 256);
	return new THREE.CanvasTexture(c);
};

const makeDotTexture = () => {
	const c = document.createElement('canvas');
	c.width = 64; c.height = 64;
	const ctx = c.getContext('2d')!;
	const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	g.addColorStop(0, 'rgba(255,255,255,1)');
	g.addColorStop(0.3, 'rgba(255,255,255,0.7)');
	g.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 64, 64);
	return new THREE.CanvasTexture(c);
};

// ════════════════════════════════════════════════════════════════════
// WURMLOCH-TUNNEL
// ════════════════════════════════════════════════════════════════════
const Tunnel: React.FC<{frame: number; opacity: number; color: THREE.Color; tex: THREE.Texture}> =
({frame, opacity, color, tex}) => {
	tex.offset.y = (frame * 0.04) % 1;
	tex.repeat.set(3, 6);
	return (
		<mesh position={[0, 0, -97]} rotation={[Math.PI / 2, 0, frame * 0.01]}>
			<cylinderGeometry args={[16, 16, 185, 64, 1, true]} />
			<meshBasicMaterial
				map={tex} color={color} side={THREE.BackSide}
				transparent opacity={opacity} blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
};

// ════════════════════════════════════════════════════════════════════
// WARP-PARTIKELFELD (Tiefe — Kamera fliegt hindurch)
// ════════════════════════════════════════════════════════════════════
const WarpField: React.FC<{opacity: number; color: THREE.Color; dot: THREE.Texture}> =
({opacity, color, dot}) => {
	const positions = useMemo(() => {
		const rnd = prng(31);
		const N = 1400;
		const arr = new Float32Array(N * 3);
		for (let i = 0; i < N; i++) {
			const r = 2 + rnd() * 13;
			const a = rnd() * Math.PI * 2;
			arr[i * 3] = Math.cos(a) * r;
			arr[i * 3 + 1] = Math.sin(a) * r;
			arr[i * 3 + 2] = -10 - rnd() * 180;
		}
		return arr;
	}, []);
	return (
		<points>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[positions, 3]} />
			</bufferGeometry>
			<pointsMaterial
				size={0.9} map={dot} color={color} transparent opacity={opacity}
				blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation
			/>
		</points>
	);
};

// ════════════════════════════════════════════════════════════════════
// WELT-UMGEBUNGEN
// ════════════════════════════════════════════════════════════════════

// ── MATERIE: Kristall-Polyeder + Gitter-Boden ──
const MaterieEnv: React.FC<{frame: number; opacity: number; pal: Pal; centerZ: number}> =
({frame, opacity, pal, centerZ}) => {
	const grid = useMemo(() => makeGridTexture(pal.primary), [pal.primary]);
	const crystals = useMemo(() => {
		const rnd = prng(11);
		return Array.from({length: 16}, () => ({
			pos: [(rnd() - 0.5) * 22, (rnd() - 0.5) * 16, centerZ + (rnd() - 0.5) * 26] as [number, number, number],
			s: 0.8 + rnd() * 2.4,
			rs: 0.005 + rnd() * 0.02,
			ax: [rnd(), rnd(), rnd()] as [number, number, number],
		}));
	}, [centerZ]);
	return (
		<group>
			<pointLight position={[0, 6, centerZ + 16]} intensity={320} color={pal.secondary} distance={90} />
			<pointLight position={[-12, -2, centerZ + 6]} intensity={180} color={pal.primary} distance={80} />
			<pointLight position={[10, 8, centerZ + 2]} intensity={150} color={'#ffffff'} distance={70} />
			{/* Gitter-Boden */}
			<mesh position={[0, -8, centerZ - 4]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[120, 260]} />
				<meshBasicMaterial map={grid} color={pal.primary} transparent opacity={opacity * 0.6}
					blending={THREE.AdditiveBlending} depthWrite={false} />
			</mesh>
			{/* Kristalle */}
			{crystals.map((c, i) => (
				<mesh key={i} position={c.pos}
					rotation={[frame * c.rs * c.ax[0], frame * c.rs * c.ax[1], frame * c.rs * c.ax[2]]}>
					<icosahedronGeometry args={[c.s, 0]} />
					<meshStandardMaterial
						color={pal.secondary} emissive={pal.glow} emissiveIntensity={0.9}
						metalness={0.6} roughness={0.28} flatShading
						transparent opacity={opacity} />
				</mesh>
			))}
		</group>
	);
};

// ── ENERGIE: Plasma-Flächen + glühende Kugeln ──
const EnergieEnv: React.FC<{frame: number; opacity: number; pal: Pal; centerZ: number; dot: THREE.Texture}> =
({frame, opacity, pal, centerZ, dot}) => {
	const streak = useMemo(() => makeStreakTexture(pal.primary), [pal.primary]);
	const orbs = useMemo(() => {
		const rnd = prng(22);
		return Array.from({length: 14}, () => ({
			pos: [(rnd() - 0.5) * 24, (rnd() - 0.5) * 18, centerZ + (rnd() - 0.5) * 28] as [number, number, number],
			s: 0.5 + rnd() * 1.6, ph: rnd() * 10,
		}));
	}, [centerZ]);
	const dust = useMemo(() => {
		const rnd = prng(222);
		const arr = new Float32Array(500 * 3);
		for (let i = 0; i < 500; i++) {
			arr[i * 3] = (rnd() - 0.5) * 50;
			arr[i * 3 + 1] = (rnd() - 0.5) * 40;
			arr[i * 3 + 2] = centerZ + (rnd() - 0.5) * 50;
		}
		return arr;
	}, [centerZ]);
	return (
		<group>
			{/* Plasma-Wellenflächen */}
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[0, -3 + i * 3, centerZ - 6 - i * 4]}
					rotation={[-Math.PI / 2.4, 0, frame * 0.004 * (i + 1) + i]}
					scale={1 + Math.sin(frame * 0.03 + i) * 0.08}>
					<planeGeometry args={[70, 70]} />
					<meshBasicMaterial map={streak} color={pal.primary} transparent
						opacity={opacity * (0.22 - i * 0.04)} blending={THREE.AdditiveBlending} depthWrite={false} />
				</mesh>
			))}
			{/* Energie-Kugeln */}
			{orbs.map((o, i) => {
				const pulse = 1 + Math.sin(frame * 0.08 + o.ph) * 0.25;
				return (
					<mesh key={i} position={o.pos} scale={o.s * pulse}>
						<sphereGeometry args={[1, 20, 20]} />
						<meshBasicMaterial color={lerpColor(pal.secondary, '#ffffff', 0.3)} transparent
							opacity={opacity * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
					</mesh>
				);
			})}
			{/* Plasma-Staub */}
			<points>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[dust, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.6} map={dot} color={pal.secondary} transparent opacity={opacity * 0.8}
					blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
			</points>
		</group>
	);
};

// ── VORHANG: wehende Gold-Lichtvorhänge + Lichtstrahlen ──
const VorhangEnv: React.FC<{frame: number; opacity: number; pal: Pal; centerZ: number; dot: THREE.Texture}> =
({frame, opacity, pal, centerZ, dot}) => {
	const grad = useMemo(() => makeGradientTexture(pal.primary, pal.secondary), [pal.primary, pal.secondary]);
	// Eng gepackte Lichtvorhänge in mehreren Tiefen-Ebenen (Hochformat-tauglich)
	const drapes = useMemo(() => {
		const rnd = prng(33);
		return Array.from({length: 22}, () => ({
			x: (rnd() - 0.5) * 20,
			z: centerZ + (rnd() - 0.5) * 34,
			sway: 0.5 + rnd() * 0.9,
			ph: rnd() * 10,
			h: 46 + rnd() * 16,
			w: 2.2 + rnd() * 1.6,
			op: 0.3 + rnd() * 0.28,
		}));
	}, [centerZ]);
	const dust = useMemo(() => {
		const rnd = prng(333);
		const arr = new Float32Array(520 * 3);
		for (let i = 0; i < 520; i++) {
			arr[i * 3] = (rnd() - 0.5) * 45;
			arr[i * 3 + 1] = (rnd() - 0.5) * 50;
			arr[i * 3 + 2] = centerZ + (rnd() - 0.5) * 45;
		}
		return arr;
	}, [centerZ]);
	return (
		<group>
			<pointLight position={[0, 0, centerZ + 18]} intensity={160} color={pal.secondary} distance={100} />
			{/* Hintergrund-Goldschleier */}
			<mesh position={[0, 0, centerZ - 18]}>
				<planeGeometry args={[120, 120]} />
				<meshBasicMaterial color={pal.glow} transparent opacity={opacity * 0.12}
					blending={THREE.AdditiveBlending} depthWrite={false} />
			</mesh>
			{/* Lichtvorhänge */}
			{drapes.map((d, i) => (
				<mesh key={i}
					position={[d.x + Math.sin(frame * 0.02 * d.sway + d.ph) * 1.8, Math.sin(frame * 0.01 + d.ph) * 1.5, d.z]}
					rotation={[0, 0, Math.sin(frame * 0.015 * d.sway + d.ph) * 0.14]}>
					<planeGeometry args={[d.w, d.h]} />
					<meshBasicMaterial map={grad} color={pal.secondary} transparent
						opacity={opacity * d.op} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
				</mesh>
			))}
			{/* Gold-Staub */}
			<points>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[dust, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.8} map={dot} color={pal.secondary} transparent opacity={opacity * 0.9}
					blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
			</points>
		</group>
	);
};

// ── URSPRUNG: Genesis-Kern + umkreisende Ringe + Nebel ──
const UrsprungEnv: React.FC<{frame: number; opacity: number; pal: Pal; centerZ: number; dot: THREE.Texture}> =
({frame, opacity, pal, centerZ, dot}) => {
	const nebula = useMemo(() => {
		const rnd = prng(44);
		const arr = new Float32Array(700 * 3);
		for (let i = 0; i < 700; i++) {
			const r = 4 + rnd() * 26;
			const a = rnd() * Math.PI * 2;
			const b = (rnd() - 0.5) * Math.PI;
			arr[i * 3] = Math.cos(a) * Math.cos(b) * r;
			arr[i * 3 + 1] = Math.sin(b) * r * 0.7;
			arr[i * 3 + 2] = centerZ + Math.sin(a) * Math.cos(b) * r;
		}
		return arr;
	}, [centerZ]);
	const corePulse = 1 + Math.sin(frame * 0.06) * 0.12;
	return (
		<group>
			<pointLight position={[0, 0, centerZ]} intensity={200} color={pal.secondary} distance={120} />
			{/* Genesis-Kern */}
			<mesh position={[0, 0, centerZ]} scale={1.5 * corePulse}>
				<sphereGeometry args={[1, 32, 32]} />
				<meshBasicMaterial color={'#ffffff'} transparent opacity={opacity}
					blending={THREE.AdditiveBlending} depthWrite={false} />
			</mesh>
			<mesh position={[0, 0, centerZ]} scale={3.2 * corePulse}>
				<sphereGeometry args={[1, 32, 32]} />
				<meshBasicMaterial color={pal.secondary} transparent opacity={opacity * 0.35}
					blending={THREE.AdditiveBlending} depthWrite={false} />
			</mesh>
			{/* Umkreisende Ringe */}
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[0, 0, centerZ]}
					rotation={[Math.PI / 3 * i + frame * 0.01, frame * 0.012 * (i + 1), i]}>
					<torusGeometry args={[6 + i * 2.4, 0.18, 16, 100]} />
					<meshBasicMaterial color={i % 2 ? pal.secondary : pal.primary} transparent
						opacity={opacity * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
				</mesh>
			))}
			{/* Nebel */}
			<points>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[nebula, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.7} map={dot} color={pal.primary} transparent opacity={opacity * 0.85}
					blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
			</points>
		</group>
	);
};

const WorldEnv: React.FC<{world: WorldId; frame: number; opacity: number; centerZ: number; dot: THREE.Texture}> =
({world, frame, opacity, centerZ, dot}) => {
	if (opacity <= 0.001) return null;
	const pal = PAL[world];
	switch (world) {
		case 'materie':  return <MaterieEnv frame={frame} opacity={opacity} pal={pal} centerZ={centerZ} />;
		case 'energie':  return <EnergieEnv frame={frame} opacity={opacity} pal={pal} centerZ={centerZ} dot={dot} />;
		case 'vorhang':  return <VorhangEnv frame={frame} opacity={opacity} pal={pal} centerZ={centerZ} dot={dot} />;
		case 'ursprung': return <UrsprungEnv frame={frame} opacity={opacity} pal={pal} centerZ={centerZ} dot={dot} />;
	}
};

// ════════════════════════════════════════════════════════════════════
// SZENE  (im Group; Group bewegt sich → Kamera-Flug-Effekt)
// ════════════════════════════════════════════════════════════════════
const Scene: React.FC<{from: WorldId; to: WorldId; frame: number; dur: number}> =
({from, to, frame, dur}) => {
	const p = frame / (dur - 1);
	const fromPal = PAL[from];
	const toPal = PAL[to];

	const dot = useMemo(() => makeDotTexture(), []);
	const tunnelTex = useMemo(() => makeStreakTexture('#ffffff'), []);

	// Group-Z bewegt die Welt zur Kamera (Kamera fix bei z=8)
	const gz = interpolate(p, [0, 0.20, 0.40, 0.60, 0.72, 1.0], [0, 8, 45, 150, 185, 200],
		{extrapolateRight: 'clamp'});
	const roll = interpolate(p, [0.2, 0.55, 0.8], [0, 2.0, 2.8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	// Sichtbarkeiten
	const sourceOp = interpolate(p, [0.30, 0.48], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const targetOp = interpolate(p, [0.58, 0.76], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const tunnelOp = Math.min(
		interpolate(p, [0.14, 0.32], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(p, [0.62, 0.74], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);
	const warpOp = Math.min(
		interpolate(p, [0.18, 0.34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(p, [0.64, 0.74], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);

	// Farbmischung & Nebel
	const blend = interpolate(p, [0.3, 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const tunnelColor = lerpColor(fromPal.primary, toPal.primary, blend);
	const warpColor = lerpColor(fromPal.secondary, toPal.secondary, blend);
	const fogColor = lerpColor(fromPal.deep, toPal.deep, interpolate(p, [0.4, 0.65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

	return (
		<>
			<color attach="background" args={[fogColor]} />
			<fogExp2 attach="fog" args={[fogColor, 0.0052]} />
			<ambientLight intensity={0.35} />

			<group position-z={gz} rotation-z={roll}>
				{/* Quell-Welt bei z≈0 */}
				<WorldEnv world={from} frame={frame} opacity={sourceOp} centerZ={0} dot={dot} />
				{/* Wurmloch */}
				<Tunnel frame={frame} opacity={tunnelOp} color={tunnelColor} tex={tunnelTex} />
				<WarpField opacity={warpOp} color={warpColor} dot={dot} />
				{/* Ziel-Welt bei z≈-212 */}
				<WorldEnv world={to} frame={frame} opacity={targetOp} centerZ={-212} dot={dot} />
			</group>
		</>
	);
};

// ════════════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE
// ════════════════════════════════════════════════════════════════════
export interface WorldTransition3DProps {
	from: WorldId;
	to: WorldId;
}

export const WorldTransition3D: React.FC<WorldTransition3DProps> = ({from = 'materie', to = 'ursprung'}) => {
	const frame = useCurrentFrame();
	const {width, height, durationInFrames} = useVideoConfig();
	const p = frame / (durationInFrames - 1);
	const toPal = PAL[to];

	// Portal-Austritts-Flash (HTML-Overlay über Canvas)
	const flash = Math.min(
		interpolate(p, [0.58, 0.66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(p, [0.66, 0.78], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<ThreeCanvas width={width} height={height} camera={{position: [0, 0, 8], fov: 60, near: 0.1, far: 400}}
				gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping}}>
				<Scene from={from} to={to} frame={frame} dur={durationInFrames} />
			</ThreeCanvas>

			{/* Portal-Flash */}
			{flash > 0.001 && (
				<AbsoluteFill style={{
					background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${flash * 0.9}) 0%, ${toPal.primary}${Math.round(flash * 160).toString(16).padStart(2, '0')} 35%, transparent 70%)`,
					pointerEvents: 'none',
				}} />
			)}

			{/* Cinematic Vignette */}
			<AbsoluteFill style={{
				background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
				pointerEvents: 'none',
			}} />
		</AbsoluteFill>
	);
};
