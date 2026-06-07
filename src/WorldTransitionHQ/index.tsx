import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {EffectComposer, Bloom} from '@react-three/postprocessing';
import * as THREE from 'three';
import {PAL, WorldId} from '../WorldTransition3D';

// ════════════════════════════════════════════════════════════════════
// WELTEN-ÜBERGANG  HIGH-END  —  fotorealistischer Cinema-Look
// Nur:  Vorhang ↔ Ursprung
//
//   VORHANG  – fließende Aurora-Lichtschleier (Gold), Lichtstrahlen, Funken
//   URSPRUNG – kosmischer Genesis-Kern, Akkretions-Ringe, Volumen-Nebel, Sterne
//
// In-Engine: echtes Bloom (HDR-Glow).  Post (FFmpeg): Grade, Vignette,
// Chromatic Aberration, Film-Grain, Supersampling-Downscale.
// ════════════════════════════════════════════════════════════════════

const prng = (seed: number) => {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
};
const lerpColor = (a: string, b: string, t: number) =>
	new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(t, 0, 1));

// ── Texturen ──
const makeDotTexture = (soft = false) => {
	const c = document.createElement('canvas');
	c.width = 128; c.height = 128;
	const ctx = c.getContext('2d')!;
	const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
	g.addColorStop(0, 'rgba(255,255,255,1)');
	g.addColorStop(soft ? 0.5 : 0.25, soft ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.6)');
	g.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 128, 128);
	return new THREE.CanvasTexture(c);
};
const makeRibbonTexture = (mid: string, hot: string) => {
	const c = document.createElement('canvas');
	c.width = 32; c.height = 256;
	const ctx = c.getContext('2d')!;
	const g = ctx.createLinearGradient(0, 0, 0, 256);
	g.addColorStop(0, 'rgba(0,0,0,0)');
	g.addColorStop(0.30, mid);
	g.addColorStop(0.5, hot);
	g.addColorStop(0.70, mid);
	g.addColorStop(1, 'rgba(0,0,0,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 32, 256);
	// horizontal soft falloff
	const h = ctx.createLinearGradient(0, 0, 32, 0);
	h.addColorStop(0, 'rgba(0,0,0,0.6)');
	h.addColorStop(0.5, 'rgba(0,0,0,0)');
	h.addColorStop(1, 'rgba(0,0,0,0.6)');
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = h;
	ctx.fillRect(0, 0, 32, 256);
	return new THREE.CanvasTexture(c);
};

// ════════════════════════════════════════════════════════════════════
// AURORA-RIBBON  (fließender Lichtvorhang mit echten Falten)
// ════════════════════════════════════════════════════════════════════
const AuroraRibbon: React.FC<{
	frame: number; opacity: number; tex: THREE.Texture; color: string;
	baseX: number; baseZ: number; height: number; width: number;
	ampX: number; ampZ: number; speed: number; phase: number;
}> = ({frame, opacity, tex, color, baseX, baseZ, height, width, ampX, ampZ, speed, phase}) => {
	const N = 30;
	const {positions, uvs, indices} = useMemo(() => {
		const pos = new Float32Array((N + 1) * 2 * 3);
		const uv = new Float32Array((N + 1) * 2 * 2);
		const idx: number[] = [];
		const t = frame * 0.02 * speed + phase;
		for (let j = 0; j <= N; j++) {
			const v = j / N;
			const y = (v - 0.5) * height;
			const cx = baseX + Math.sin(v * 3.2 + t) * ampX + Math.sin(v * 7 + t * 0.6) * ampX * 0.35;
			const cz = baseZ + Math.cos(v * 2.6 + t * 0.8) * ampZ + Math.sin(v * 5 + t) * ampZ * 0.4;
			const k = j * 2;
			pos[k * 3] = cx - width / 2;     pos[k * 3 + 1] = y; pos[k * 3 + 2] = cz;
			pos[(k + 1) * 3] = cx + width / 2; pos[(k + 1) * 3 + 1] = y; pos[(k + 1) * 3 + 2] = cz;
			uv[k * 2] = 0; uv[k * 2 + 1] = v;
			uv[(k + 1) * 2] = 1; uv[(k + 1) * 2 + 1] = v;
			if (j < N) {
				const a = k, b = k + 1, cc = k + 2, d = k + 3;
				idx.push(a, b, cc, b, d, cc);
			}
		}
		return {positions: pos, uvs: uv, indices: new Uint16Array(idx)};
	}, [frame, baseX, baseZ, height, width, ampX, ampZ, speed, phase]);

	return (
		<mesh key={frame}>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[positions, 3]} />
				<bufferAttribute attach="attributes-uv" args={[uvs, 2]} />
				<bufferAttribute attach="index" args={[indices, 1]} />
			</bufferGeometry>
			<meshBasicMaterial map={tex} color={color} transparent opacity={opacity}
				side={THREE.DoubleSide} blending={THREE.AdditiveBlending}
				depthWrite={false} toneMapped={false} />
		</mesh>
	);
};

// ════════════════════════════════════════════════════════════════════
// VORHANG HQ
// ════════════════════════════════════════════════════════════════════
const VorhangHQ: React.FC<{frame: number; opacity: number; centerZ: number; dot: THREE.Texture; soft: THREE.Texture}> =
({frame, opacity, centerZ, dot, soft}) => {
	const pal = PAL.vorhang;
	const ribTex = useMemo(() => makeRibbonTexture(pal.primary, pal.secondary), [pal.primary, pal.secondary]);
	const ribbons = useMemo(() => {
		const rnd = prng(91);
		return Array.from({length: 8}, () => ({
			baseX: (rnd() - 0.5) * 30,
			baseZ: centerZ + (rnd() - 0.5) * 30,
			height: 56 + rnd() * 20,
			width: 4 + rnd() * 4,
			ampX: 3 + rnd() * 4,
			ampZ: 4 + rnd() * 5,
			speed: 0.6 + rnd() * 0.7,
			phase: rnd() * 10,
			op: 0.18 + rnd() * 0.16,
		}));
	}, [centerZ]);
	const embers = useMemo(() => {
		const rnd = prng(92);
		const arr = new Float32Array(260 * 3);
		for (let i = 0; i < 260; i++) {
			arr[i * 3] = (rnd() - 0.5) * 50;
			arr[i * 3 + 1] = (rnd() - 0.5) * 56;
			arr[i * 3 + 2] = centerZ + (rnd() - 0.5) * 45;
		}
		return arr;
	}, [centerZ]);
	return (
		<group>
			{/* warmer Hintergrund-Schleier */}
			<mesh position={[0, 0, centerZ - 24]}>
				<planeGeometry args={[160, 160]} />
				<meshBasicMaterial map={soft} color={pal.glow} transparent opacity={opacity * 0.14}
					blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
			</mesh>
			{/* Lichtstrahlen von oben */}
			{[-16, -6, 5, 15].map((x, i) => (
				<mesh key={i} position={[x, 18, centerZ - 8]} rotation={[0, 0, (x > 0 ? -1 : 1) * 0.18]}>
					<planeGeometry args={[6, 70]} />
					<meshBasicMaterial map={ribTex} color={pal.primary} transparent opacity={opacity * 0.10}
						blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
				</mesh>
			))}
			{/* Aurora-Schleier */}
			{ribbons.map((r, i) => (
				<AuroraRibbon key={i} frame={frame} opacity={opacity * r.op} tex={ribTex} color={pal.primary}
					baseX={r.baseX} baseZ={r.baseZ} height={r.height} width={r.width}
					ampX={r.ampX} ampZ={r.ampZ} speed={r.speed} phase={r.phase} />
			))}
			{/* Gold-Funken */}
			<points>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[embers, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.6} map={dot} color={lerpColor(pal.secondary, '#fff', 0.3).getStyle()}
					transparent opacity={opacity * 0.85} blending={THREE.AdditiveBlending}
					depthWrite={false} sizeAttenuation toneMapped={false} />
			</points>
		</group>
	);
};

// ════════════════════════════════════════════════════════════════════
// URSPRUNG HQ
// ════════════════════════════════════════════════════════════════════
const UrsprungHQ: React.FC<{frame: number; opacity: number; centerZ: number; dot: THREE.Texture; soft: THREE.Texture}> =
({frame, opacity, centerZ, dot, soft}) => {
	const pal = PAL.ursprung;
	// Volumen-Nebel: viele weiche additive Sprites
	const nebula = useMemo(() => {
		const rnd = prng(81);
		return Array.from({length: 46}, () => ({
			pos: [(rnd() - 0.5) * 48, (rnd() - 0.5) * 44, centerZ + (rnd() - 0.5) * 50] as [number, number, number],
			s: 8 + rnd() * 22,
			rot: rnd() * Math.PI,
			op: 0.05 + rnd() * 0.10,
			tint: rnd(),
		}));
	}, [centerZ]);
	const stars = useMemo(() => {
		const rnd = prng(82);
		const arr = new Float32Array(900 * 3);
		for (let i = 0; i < 900; i++) {
			arr[i * 3] = (rnd() - 0.5) * 140;
			arr[i * 3 + 1] = (rnd() - 0.5) * 140;
			arr[i * 3 + 2] = centerZ + (rnd() - 0.5) * 120;
		}
		return arr;
	}, [centerZ]);
	const filaments = useMemo(() => {
		const rnd = prng(83);
		return Array.from({length: 700}, () => {
			const a = rnd() * Math.PI * 2;
			const r = 4 + rnd() * 24;
			return {a, r, y: (rnd() - 0.5) * 6, ph: rnd() * 10};
		});
	}, []);
	const filPos = useMemo(() => {
		const arr = new Float32Array(filaments.length * 3);
		filaments.forEach((f, i) => {
			const spin = f.a + frame * 0.012 + (1 / (f.r * 0.1));
			arr[i * 3] = Math.cos(spin) * f.r;
			arr[i * 3 + 1] = f.y + Math.sin(frame * 0.03 + f.ph) * 1.2;
			arr[i * 3 + 2] = centerZ + Math.sin(spin) * f.r;
		});
		return arr;
	}, [filaments, frame, centerZ]);
	const corePulse = 1 + Math.sin(frame * 0.06) * 0.10;
	return (
		<group>
			{/* Sterne */}
			<points key="stars">
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[stars, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.35} map={dot} color={'#cfe'} transparent opacity={opacity * 0.7}
					blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} />
			</points>
			{/* Volumen-Nebel */}
			{nebula.map((n, i) => (
				<mesh key={i} position={n.pos} rotation={[0, 0, n.rot + frame * 0.002]}>
					<planeGeometry args={[n.s, n.s]} />
					<meshBasicMaterial map={soft}
						color={lerpColor(pal.primary, pal.secondary, n.tint).getStyle()}
						transparent opacity={opacity * n.op} blending={THREE.AdditiveBlending}
						depthWrite={false} toneMapped={false} />
				</mesh>
			))}
			{/* Akkretions-Filamente (in den Kern strömend) */}
			<points key={`fil${frame}`}>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[filPos, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.5} map={dot} color={pal.secondary} transparent opacity={opacity * 0.9}
					blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} />
			</points>
			{/* Akkretions-Ringe (geneigt) */}
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[0, 0, centerZ]}
					rotation={[Math.PI / 2 - 0.35 + i * 0.12, frame * 0.01 * (i + 1), i * 0.7]}>
					<torusGeometry args={[7 + i * 3.2, 0.10 + i * 0.04, 16, 140]} />
					<meshBasicMaterial color={i % 2 ? pal.secondary : lerpColor(pal.secondary, '#fff', 0.3).getStyle()}
						transparent opacity={opacity} blending={THREE.AdditiveBlending}
						depthWrite={false} toneMapped={false} />
				</mesh>
			))}
			{/* Genesis-Kern Halo */}
			<mesh position={[0, 0, centerZ]} scale={5.5 * corePulse}>
				<sphereGeometry args={[1, 32, 32]} />
				<meshBasicMaterial map={soft} color={pal.secondary} transparent opacity={opacity * 0.5}
					blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
			</mesh>
			{/* Genesis-Kern */}
			<mesh position={[0, 0, centerZ]} scale={1.5 * corePulse}>
				<sphereGeometry args={[1, 48, 48]} />
				<meshBasicMaterial color={'#ffffff'} toneMapped={false} transparent opacity={opacity} />
			</mesh>
			<mesh position={[0, 0, centerZ]} scale={2.1 * corePulse}>
				<sphereGeometry args={[1, 48, 48]} />
				<meshBasicMaterial color={lerpColor(pal.secondary, '#fff', 0.5).getStyle()} toneMapped={false}
					transparent opacity={opacity * 0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
			</mesh>
		</group>
	);
};

const EnvHQ: React.FC<{world: WorldId; frame: number; opacity: number; centerZ: number; dot: THREE.Texture; soft: THREE.Texture}> =
({world, frame, opacity, centerZ, dot, soft}) => {
	if (opacity <= 0.001) return null;
	if (world === 'vorhang') return <VorhangHQ frame={frame} opacity={opacity} centerZ={centerZ} dot={dot} soft={soft} />;
	return <UrsprungHQ frame={frame} opacity={opacity} centerZ={centerZ} dot={dot} soft={soft} />;
};

// ════════════════════════════════════════════════════════════════════
// WURMLOCH + WARP
// ════════════════════════════════════════════════════════════════════
const WarpFieldHQ: React.FC<{opacity: number; color: THREE.Color; dot: THREE.Texture}> = ({opacity, color, dot}) => {
	const positions = useMemo(() => {
		const rnd = prng(31);
		const N = 1800;
		const arr = new Float32Array(N * 3);
		for (let i = 0; i < N; i++) {
			const r = 1.5 + rnd() * 14;
			const a = rnd() * Math.PI * 2;
			arr[i * 3] = Math.cos(a) * r;
			arr[i * 3 + 1] = Math.sin(a) * r;
			arr[i * 3 + 2] = -8 - rnd() * 185;
		}
		return arr;
	}, []);
	return (
		<points>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[positions, 3]} />
			</bufferGeometry>
			<pointsMaterial size={1.0} map={dot} color={color} transparent opacity={opacity}
				blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} />
		</points>
	);
};

const TunnelHQ: React.FC<{frame: number; opacity: number; color: THREE.Color; tex: THREE.Texture}> =
({frame, opacity, color, tex}) => {
	tex.offset.y = (frame * 0.05) % 1;
	tex.repeat.set(3, 6);
	return (
		<mesh position={[0, 0, -97]} rotation={[Math.PI / 2, 0, frame * 0.012]}>
			<cylinderGeometry args={[15, 15, 185, 64, 1, true]} />
			<meshBasicMaterial map={tex} color={color} side={THREE.BackSide} transparent opacity={opacity}
				blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
		</mesh>
	);
};

const makeStreakTexture = (color: string) => {
	const c = document.createElement('canvas');
	c.width = 256; c.height = 256;
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 256);
	const rnd = prng(7);
	for (let i = 0; i < 110; i++) {
		const x = rnd() * 256, w = 1 + rnd() * 2.5, h = 40 + rnd() * 180, y = rnd() * 256;
		const g = ctx.createLinearGradient(0, y, 0, y + h);
		g.addColorStop(0, 'rgba(255,255,255,0)');
		g.addColorStop(0.5, color);
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.globalAlpha = 0.15 + rnd() * 0.6; ctx.fillStyle = g;
		ctx.fillRect(x, y, w, h);
	}
	ctx.globalAlpha = 1;
	const tex = new THREE.CanvasTexture(c);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	return tex;
};

// ════════════════════════════════════════════════════════════════════
// SZENE
// ════════════════════════════════════════════════════════════════════
const SceneHQ: React.FC<{from: WorldId; to: WorldId; frame: number; dur: number}> = ({from, to, frame, dur}) => {
	const p = frame / (dur - 1);
	const fromPal = PAL[from];
	const toPal = PAL[to];
	const dot = useMemo(() => makeDotTexture(false), []);
	const soft = useMemo(() => makeDotTexture(true), []);
	const tunnelTex = useMemo(() => makeStreakTexture('#ffffff'), []);

	const gz = interpolate(p, [0, 0.20, 0.40, 0.60, 0.72, 1.0], [0, 8, 45, 150, 185, 200], {extrapolateRight: 'clamp'});
	const roll = interpolate(p, [0.2, 0.55, 0.8], [0, 1.8, 2.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	const sourceOp = interpolate(p, [0.30, 0.48], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const targetOp = interpolate(p, [0.58, 0.78], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const tunnelOp = Math.min(
		interpolate(p, [0.14, 0.32], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(p, [0.62, 0.74], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);
	const warpOp = Math.min(
		interpolate(p, [0.18, 0.34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(p, [0.64, 0.74], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);

	const blend = interpolate(p, [0.3, 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const tunnelColor = lerpColor(fromPal.primary, toPal.primary, blend);
	const warpColor = lerpColor(fromPal.secondary, toPal.secondary, blend);
	const fogColor = lerpColor(fromPal.deep, toPal.deep, interpolate(p, [0.4, 0.65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

	return (
		<>
			<color attach="background" args={[fogColor]} />
			<fogExp2 attach="fog" args={[fogColor, 0.0050]} />
			<ambientLight intensity={0.3} />
			<group position-z={gz} rotation-z={roll}>
				<EnvHQ world={from} frame={frame} opacity={sourceOp} centerZ={0} dot={dot} soft={soft} />
				<TunnelHQ frame={frame} opacity={tunnelOp} color={tunnelColor} tex={tunnelTex} />
				<WarpFieldHQ opacity={warpOp} color={warpColor} dot={dot} />
				<EnvHQ world={to} frame={frame} opacity={targetOp} centerZ={-212} dot={dot} soft={soft} />
			</group>
		</>
	);
};

export interface WorldTransitionHQProps {
	from: WorldId;
	to: WorldId;
}

export const WorldTransitionHQ: React.FC<WorldTransitionHQProps> = ({from = 'vorhang', to = 'ursprung'}) => {
	const frame = useCurrentFrame();
	const {width, height, durationInFrames} = useVideoConfig();
	const p = frame / (durationInFrames - 1);
	const toPal = PAL[to];
	const flash = Math.min(
		interpolate(p, [0.58, 0.66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(p, [0.66, 0.80], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<ThreeCanvas width={width} height={height}
				camera={{position: [0, 0, 8], fov: 60, near: 0.1, far: 420}}
				gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping}}>
				<SceneHQ from={from} to={to} frame={frame} dur={durationInFrames} />
				<EffectComposer>
					<Bloom intensity={1.35} luminanceThreshold={0.28} luminanceSmoothing={0.5} mipmapBlur radius={0.85} levels={8} />
				</EffectComposer>
			</ThreeCanvas>
			{flash > 0.001 && (
				<AbsoluteFill style={{
					background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${flash * 0.92}) 0%, ${toPal.primary}${Math.round(flash * 150).toString(16).padStart(2, '0')} 38%, transparent 72%)`,
					pointerEvents: 'none',
				}} />
			)}
		</AbsoluteFill>
	);
};
