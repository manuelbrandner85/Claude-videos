import React from 'react';
import {
	AbsoluteFill,
	Img,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	spring,
	interpolate,
	Easing,
} from 'remotion';

// ─────────────────────────────────────────────
// BRAND
// ─────────────────────────────────────────────
const C = {
	primary:    '#1EAAA6',
	primaryMid: '#147170',
	bg:         '#050b0b',
	bgDeep:     '#020607',
	white:      '#FFFFFF',
} as const;
const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ─────────────────────────────────────────────
// TIMELINE  —  70 s = 2100 frames @ 30 fps
// 30-frame crossfade between every scene
// ─────────────────────────────────────────────
const T = {
	opener:     {from: 0,    dur: 160},
	sceneA:     {from: 130,  dur: 250},
	sceneB:     {from: 350,  dur: 250},
	sceneC:     {from: 570,  dur: 250},
	network:    {from: 790,  dur: 340},
	features:   {from: 1100, dur: 420},
	appShowcase:{from: 1490, dur: 310},
	cta:        {from: 1770, dur: 330},
} as const;

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────
export function useFade(dur: number, noExit = false): number {
	const frame = useCurrentFrame();
	const enter = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp'});
	if (noExit) return enter;
	const exit = interpolate(frame, [dur - 22, dur], [1, 0], {
		extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
	});
	return Math.min(enter, exit);
}

export const Vignette: React.FC = () => (
	<div style={{
		position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
		background: 'radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.72) 100%)',
	}} />
);

export const TealGlow: React.FC<{x?: string; y?: string; a?: number}> = ({
	x = '50%', y = '46%', a = 0.18,
}) => (
	<div style={{
		position: 'absolute', inset: 0, pointerEvents: 'none',
		background: `radial-gradient(ellipse at ${x} ${y}, rgba(30,170,166,${a}) 0%, transparent 56%)`,
	}} />
);

export const MensaenaImg: React.FC<{size: number; glow?: number}> = ({size, glow = 0}) => (
	<div style={{
		width: size, height: size, flexShrink: 0,
		filter: glow > 0
			? `drop-shadow(0 0 ${Math.round(glow * 70)}px rgba(30,170,166,${(glow * 0.9).toFixed(2)}))`
			: undefined,
	}}>
		<Img src={staticFile('mensaena-logo.png')}
			style={{width: size, height: size, objectFit: 'contain', display: 'block'}} />
	</div>
);

export const LogoBadge: React.FC<{delay?: number}> = ({delay = 0}) => {
	const frame = useCurrentFrame();
	const op = interpolate(frame, [delay, delay + 22], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{
			position: 'absolute', top: 44, left: 56, zIndex: 20,
			display: 'flex', alignItems: 'center', gap: 14, opacity: op,
		}}>
			<MensaenaImg size={44} />
			<span style={{fontFamily: FONT, fontSize: 18, fontWeight: 700,
				color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.02em'}}>
				mensaena
			</span>
		</div>
	);
};

// ─────────────────────────────────────────────
// SHARED COMPONENT: HUMAN SILHOUETTE
// Stylised human figure rendered as SVG paths.
// pose: 'stand' | 'carry' | 'phone' | 'help'
// ─────────────────────────────────────────────
interface CharacterProps {
	x: number;          // centre x in scene coords
	y: number;          // bottom y in scene coords
	scale?: number;
	color?: string;
	glowColor?: string;
	pose?: 'stand' | 'carry' | 'phone' | 'help';
	flip?: boolean;     // mirror horizontally
	opacity?: number;
}

export const Character: React.FC<CharacterProps> = ({
	x, y, scale = 1, color = 'rgba(255,255,255,0.88)',
	glowColor = 'rgba(30,170,166,0.35)',
	pose = 'stand', flip = false, opacity = 1,
}) => {
	const W = 110 * scale;
	const H = 280 * scale;

	// Arm / leg path variants per pose
	const arms: Record<string, {l: string; r: string}> = {
		stand: {
			l: 'M 38 72 C 22 88 18 115 22 138',
			r: 'M 72 72 C 88 88 92 115 88 138',
		},
		carry: {
			l: 'M 38 72 C 14 88  8 118  6 148',
			r: 'M 72 72 C 86 88 90 115 86 138',
		},
		phone: {
			l: 'M 38 72 C 22 88 18 115 22 138',
			r: 'M 72 72 C 86 72 88  52 80  36',
		},
		help: {
			l: 'M 38 72 C 14 60  0  48  -8  44',
			r: 'M 72 72 C 88 88 92 115 88 138',
		},
	};
	const legs = {
		l: 'M 44 170 C 40 200 36 230 34 270',
		r: 'M 66 170 C 70 200 74 230 76 270',
	};

	// Shopping bags for 'carry'
	const bags = pose === 'carry' ? (
		<>
			<rect x="-18" y="138" width="24" height="30" rx="4"
				fill={color} opacity={0.7}/>
			<rect x="-14" y="138" width="16" height="4" rx="2"
				fill="none" stroke={color} strokeWidth="2"/>
		</>
	) : null;

	// Phone rect for 'phone'
	const phoneRect = pose === 'phone' ? (
		<rect x="62" y="22" width="18" height="30" rx="3"
			fill={C.primary} opacity={0.9}/>
	) : null;

	return (
		<g
			transform={`translate(${x - W / 2}, ${y - H}) scale(${scale}) ${flip ? `scale(-1,1) translate(-110,0)` : ''}`}
			opacity={opacity}
			style={{filter: `drop-shadow(0 0 18px ${glowColor})`}}
		>
			{/* Head */}
			<ellipse cx="55" cy="20" rx="20" ry="22" fill={color}/>
			{/* Neck */}
			<rect x="49" y="40" width="12" height="10" fill={color}/>
			{/* Body */}
			<path d="M 30 50 C 26 90 26 118 30 170 L 80 170 C 84 118 84 90 80 50 Z" fill={color}/>
			{/* Left arm */}
			<path d={arms[pose].l} stroke={color} strokeWidth="13"
				strokeLinecap="round" fill="none"/>
			{/* Right arm */}
			<path d={arms[pose].r} stroke={color} strokeWidth="13"
				strokeLinecap="round" fill="none"/>
			{/* Left leg */}
			<path d={legs.l} stroke={color} strokeWidth="15"
				strokeLinecap="round" fill="none"/>
			{/* Right leg */}
			<path d={legs.r} stroke={color} strokeWidth="15"
				strokeLinecap="round" fill="none"/>
			{bags}
			{phoneRect}
		</g>
	);
};

// ─────────────────────────────────────────────
// SHARED COMPONENT: PHONE MOCKUP
// Renders a smartphone frame with animated
// screen content (map | chat | notification).
// ─────────────────────────────────────────────
type ScreenType = 'map' | 'chat' | 'notification' | 'post';

const MapScreen: React.FC<{f: number}> = ({f}) => {
	// Animated dots on a dark map
	const dots = [
		{cx: 90, cy: 110, delay: 0},
		{cx: 140, cy: 160, delay: 8},
		{cx: 60,  cy: 200, delay: 16},
		{cx: 170, cy: 230, delay: 24},
		{cx: 110, cy: 270, delay: 32},
	];
	return (
		<>
			{/* Street grid */}
			{[100,160,220,280,340].map(y => (
				<line key={y} x1="10" y1={y} x2="210" y2={y}
					stroke="rgba(30,170,166,0.1)" strokeWidth="1"/>
			))}
			{[50,110,170].map(x => (
				<line key={x} x1={x} y1="80" x2={x} y2="410"
					stroke="rgba(30,170,166,0.1)" strokeWidth="1"/>
			))}
			{/* User dot — larger, pulsing */}
			<circle cx="110" cy="220" r="10" fill={C.primary} opacity="0.9"/>
			<circle cx="110" cy="220"
				r={10 + (Math.sin(f * 0.15) + 1) * 6}
				fill="none" stroke={C.primary} strokeWidth="1.5"
				opacity={0.4}/>
			{/* Neighbour dots */}
			{dots.map((d, i) => {
				const op = interpolate(f, [d.delay, d.delay + 20], [0, 1], {extrapolateRight: 'clamp'});
				return (
					<g key={i} opacity={op}>
						<circle cx={d.cx} cy={d.cy} r="7" fill="rgba(255,255,255,0.7)"/>
						<circle cx={d.cx} cy={d.cy}
							r={7 + (Math.sin(f * 0.1 + i) + 1) * 3}
							fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
					</g>
				);
			})}
		</>
	);
};

const ChatScreen: React.FC<{f: number}> = ({f}) => {
	const messages = [
		{text: 'Hallo! Ich kann helfen 👋', own: false, delay: 0},
		{text: 'Wirklich? Super! 🙌', own: true, delay: 20},
		{text: 'Ich bin in 10 Min da!', own: false, delay: 40},
		{text: '✓ Danke! 💚', own: true, delay: 60},
	];
	return (
		<>
			{messages.map((m, i) => {
				const op = interpolate(f, [m.delay, m.delay + 16], [0, 1], {extrapolateRight: 'clamp'});
				const tx = interpolate(f, [m.delay, m.delay + 16], [m.own ? 20 : -20, 0], {extrapolateRight: 'clamp'});
				const y = 90 + i * 72;
				return (
					<g key={i} opacity={op} transform={`translate(${tx}, 0)`}>
						<rect x={m.own ? 60 : 14} y={y} width={m.text.length * 6.2 + 16}
							height={36} rx="12"
							fill={m.own ? C.primary : 'rgba(255,255,255,0.1)'}/>
						<text x={m.own ? 68 : 22} y={y + 23}
							fontFamily={FONT} fontSize="11" fill="white">
							{m.text}
						</text>
					</g>
				);
			})}
		</>
	);
};

const NotificationScreen: React.FC<{f: number}> = ({f}) => {
	const cardY = interpolate(f, [0, 25], [-60, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const cardOp = interpolate(f, [0, 25], [0, 1], {extrapolateRight: 'clamp'});
	const checkScale = spring({fps: 30, frame: Math.max(0, f - 30), config: {damping: 14, stiffness: 220, mass: 0.6}});
	return (
		<>
			{/* Notification card */}
			<g transform={`translate(0, ${cardY})`} opacity={cardOp}>
				<rect x="12" y="100" width="196" height="70" rx="14"
					fill={C.primary} opacity="0.15"/>
				<rect x="12" y="100" width="196" height="70" rx="14"
					fill="none" stroke={C.primary} strokeWidth="1.5"/>
				<circle cx="38" cy="135" r="14" fill={C.primary} opacity="0.9"/>
				<text x="56" y="127" fontFamily={FONT} fontSize="10"
					fontWeight="700" fill="white">Hilfe gefunden!</text>
				<text x="56" y="143" fontFamily={FONT} fontSize="9"
					fill="rgba(255,255,255,0.6)">2 Nachbarn antworteten</text>
				<text x="56" y="158" fontFamily={FONT} fontSize="9"
					fill={C.primary}>Jetzt ansehen →</text>
			</g>
			{/* Big checkmark animation */}
			<g transform={`translate(110, 270) scale(${checkScale})`} opacity={Math.min(checkScale, 1)}>
				<circle cx="0" cy="0" r="36" fill="rgba(30,170,166,0.2)"
					stroke={C.primary} strokeWidth="2"/>
				<path d="M -16 0 L -4 14 L 18 -12" stroke={C.primary}
					strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
			</g>
		</>
	);
};

export const PhoneMockup: React.FC<{
	x: number; y: number; scale?: number;
	screen: ScreenType; opacity?: number; rotateY?: number;
}> = ({x, y, scale = 1, screen, opacity = 1, rotateY = 0}) => {
	const frame = useCurrentFrame();
	const PW = 220 * scale;
	const PH = 460 * scale;

	return (
		<div style={{
			position: 'absolute',
			left: x - PW / 2, top: y - PH / 2,
			width: PW, height: PH, opacity,
			transform: `perspective(1200px) rotateY(${rotateY}deg)`,
			transformOrigin: 'center center',
		}}>
			<svg width={PW} height={PH} viewBox="0 0 220 460">
				{/* Outer frame */}
				<rect x="1" y="1" width="218" height="458" rx="34"
					fill="#0d1218" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
				{/* Side highlight */}
				<rect x="2" y="2" width="216" height="456" rx="33"
					fill="none" stroke={C.primary} strokeWidth="0.8" opacity="0.4"/>
				{/* Screen area */}
				<rect x="8" y="18" width="204" height="424" rx="26" fill="#070f18"/>
				{/* Dynamic island */}
				<rect x="78" y="22" width="64" height="18" rx="9" fill="#0d1218"/>

				{/* Screen content */}
				{/* App header */}
				<rect x="8" y="18" width="204" height="52" rx="26" fill="#070f18"/>
				<rect x="8" y="44" width="204" height="26" fill="#070f18"/>
				<image href={staticFile('mensaena-logo.png')}
					x="18" y="26" width="24" height="24"/>
				<text x="50" y="43" fontFamily={FONT} fontSize="13"
					fontWeight="700" fill="white">mensaena</text>
				<rect x="8" y="66" width="204" height="1.5" fill="rgba(255,255,255,0.06)"/>

				{/* Dynamic screen content */}
				<clipPath id="screenClip">
					<rect x="8" y="67" width="204" height="368" rx="2"/>
				</clipPath>
				<g clipPath="url(#screenClip)">
					{screen === 'map'          && <MapScreen          f={frame} />}
					{screen === 'chat'         && <ChatScreen         f={frame} />}
					{screen === 'notification' && <NotificationScreen f={frame} />}
				</g>

				{/* Home indicator */}
				<rect x="85" y="446" width="50" height="4" rx="2"
					fill="rgba(255,255,255,0.2)"/>
			</svg>
		</div>
	);
};

// ─────────────────────────────────────────────
// PLACEHOLDER — replaced in later phases
// ─────────────────────────────────────────────
const Placeholder: React.FC<{label: string; dur: number}> = ({label, dur}) => {
	const op = useFade(dur);
	return (
		<AbsoluteFill style={{background: C.bg, opacity: op,
			display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: FONT, fontSize: 36, color: C.primary, fontWeight: 700}}>
				{label}
			</div>
		</AbsoluteFill>
	);
};

// ─────────────────────────────────────────────
// SCENE EXPORTS (filled phase by phase)
// ─────────────────────────────────────────────
// Deterministic city-light positions (no Math.random — stable across frames)
const CITY_LIGHTS = Array.from({length: 90}, (_, i) => {
	const a = (i * 1_234_567 + 98_765) % 100_000;
	const b = (i * 7_654_321 + 12_345) % 100_000;
	const c = (i * 3_456_789 + 54_321) % 100_000;
	return {
		x: (a / 100_000) * 1920,
		y: (b / 100_000) * 1080,
		r: 1 + (c / 100_000) * 2.8,
		bright: 0.35 + (c / 100_000) * 0.65,
	};
});

export const OpenerScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.opener.dur);

	// Cinematic slow zoom
	const zoom = interpolate(frame, [0, T.opener.dur], [1.0, 1.20], {
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.sin),
	});

	// Logo spring in at frame 52
	const logoSpring = spring({fps, frame: Math.max(0, frame - 52), config: {damping: 15, stiffness: 110, mass: 0.9}});
	const logoOp = interpolate(frame, [52, 74], [0, 1], {extrapolateRight: 'clamp'});

	// Particle burst expanding from logo centre
	const burstP = interpolate(frame, [52, 110], [0, 1], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	// Tagline fade-in
	const tagOp = interpolate(frame, [96, 122], [0, 1], {extrapolateRight: 'clamp'});

	// Subtle glow pulse
	const glowA = 0.20 + Math.sin(frame * 0.07) * 0.06;

	return (
		<AbsoluteFill style={{background: C.bgDeep, opacity: op}}>
			{/* ── City skyline dots with slow zoom ── */}
			<div style={{
				position: 'absolute', inset: 0, overflow: 'hidden',
				transform: `scale(${zoom})`, transformOrigin: 'center center',
			}}>
				<svg width="1920" height="1080" style={{position: 'absolute', top: 0, left: 0}}>
					{/* Faint connecting lines between nearby dots */}
					{CITY_LIGHTS.flatMap((a, i) =>
						CITY_LIGHTS.slice(i + 1, i + 5).map((b, j) => {
							const d = Math.hypot(a.x - b.x, a.y - b.y);
							if (d > 160) return null;
							return (
								<line key={`l${i}-${j}`}
									x1={a.x} y1={a.y} x2={b.x} y2={b.y}
									stroke={C.primary} strokeWidth="0.6"
									opacity={0.07 * (1 - d / 160)}
								/>
							);
						})
					)}
					{/* Twinkling dots */}
					{CITY_LIGHTS.map((d, i) => {
						const twinkle = 0.55 + Math.sin(frame * 0.08 + i * 1.4) * 0.38;
						return (
							<circle key={i} cx={d.x} cy={d.y} r={d.r}
								fill="white" opacity={d.bright * twinkle * 0.9}/>
						);
					})}
				</svg>
			</div>

			{/* ── Ambient teal glow ── */}
			<TealGlow a={glowA} />

			{/* ── Logo + particle burst ── */}
			<div style={{
				position: 'absolute', inset: 0,
				display: 'flex', alignItems: 'center', justifyContent: 'center',
			}}>
				{/* Particle ring expanding outward */}
				<svg width="500" height="500" style={{
					position: 'absolute', overflow: 'visible',
					opacity: burstP > 0 ? 1 : 0,
				}}>
					{Array.from({length: 20}, (_, i) => {
						const angle = (i / 20) * Math.PI * 2;
						const radius = 90 + burstP * 130;
						const px = 250 + Math.cos(angle) * radius;
						const py = 250 + Math.sin(angle) * radius;
						const pOp = burstP * (1 - burstP * 0.7);
						return (
							<circle key={i} cx={px} cy={py}
								r={1.5 + (i % 4) * 0.8}
								fill={C.primary} opacity={pOp * 0.85}/>
						);
					})}
					{/* Outer ring */}
					<circle cx="250" cy="250" r={60 + burstP * 160}
						fill="none" stroke={C.primary}
						strokeWidth="1" opacity={burstP * (1 - burstP * 0.9) * 0.6}/>
				</svg>

				{/* Logo + wordmark */}
				<div style={{
					display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
					transform: `scale(${logoSpring})`, opacity: logoOp,
				}}>
					<MensaenaImg size={150} glow={logoOp * 0.9} />
					<div style={{
						fontFamily: FONT, fontSize: 60, fontWeight: 800,
						color: C.white, letterSpacing: '-0.03em',
						textShadow: `0 0 80px rgba(30,170,166,${(logoOp * 0.6).toFixed(2)})`,
					}}>mensaena</div>
				</div>
			</div>

			{/* ── Tagline ── */}
			<div style={{
				position: 'absolute', bottom: 210, left: 0, right: 0,
				textAlign: 'center', opacity: tagOp,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 22, fontWeight: 300,
					color: 'rgba(255,255,255,0.52)',
					letterSpacing: '0.12em', textTransform: 'uppercase',
				}}>
					Zusammen stark. Miteinander nah.
				</div>
			</div>

			<Vignette />
		</AbsoluteFill>
	);
};
export const SceneA: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.sceneA.dur);

	// Street/pavement background gradient
	// Character enters from left, walks to centre
	const charX = interpolate(frame, [0, 80], [-100, 480], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const charOp = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});

	// Slight walking bob
	const bob = Math.sin(frame * 0.28) * 5;

	// Phone slides in from right at frame 70
	const phoneX = interpolate(frame, [70, 110], [1150, 900], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const phoneOp = interpolate(frame, [70, 100], [0, 1], {extrapolateRight: 'clamp'});

	// Helper character appears at frame 100 from right
	const helperX = interpolate(frame, [100, 155], [1050, 700], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const helperOp = interpolate(frame, [100, 130], [0, 1], {extrapolateRight: 'clamp'});

	// Text captions
	const cap1Op = interpolate(frame, [20, 45], [0, 1], {extrapolateRight: 'clamp'});
	const cap1Exit = interpolate(frame, [85, 105], [1, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
	const cap2Op = interpolate(frame, [115, 140], [0, 1], {extrapolateRight: 'clamp'});

	// Connection arc between characters (appears at frame 140)
	const arcOp = interpolate(frame, [140, 165], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: op}}>
			{/* Ambient gradient — warm street feel */}
			<div style={{
				position: 'absolute', inset: 0,
				background: 'linear-gradient(180deg, #050b0b 0%, #0a1a18 55%, #050b0b 100%)',
			}} />
			<TealGlow x="40%" y="60%" a={0.12} />

			{/* Ground line */}
			<div style={{
				position: 'absolute', bottom: 260, left: 0, right: 0, height: 1,
				background: 'linear-gradient(90deg, transparent, rgba(30,170,166,0.18), transparent)',
			}} />

			{/* Scene SVG layer */}
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{/* Connection arc between woman and helper */}
				{arcOp > 0 && (
					<path
						d={`M ${charX + 55} 750 Q ${(charX + 700) / 2} 560 ${helperX + 55} 750`}
						fill="none" stroke={C.primary} strokeWidth="2"
						strokeDasharray="8 6"
						opacity={arcOp * 0.7}
					/>
				)}

				{/* Older woman with shopping bags */}
				<Character
					x={charX} y={820 + bob}
					scale={1.05} pose="carry"
					color="rgba(255,255,255,0.85)"
					glowColor="rgba(30,170,166,0.25)"
					opacity={charOp}
				/>

				{/* Helper neighbour from right */}
				<Character
					x={helperX} y={820 + (Math.sin(frame * 0.28 + 1.2) * 4)}
					scale={0.95} pose="help"
					color="rgba(30,170,166,0.9)"
					glowColor="rgba(30,170,166,0.45)"
					flip
					opacity={helperOp}
				/>
			</svg>

			{/* Phone mockup — notification */}
			{phoneOp > 0 && (
				<PhoneMockup
					x={phoneX} y={480}
					scale={0.85}
					screen="notification"
					opacity={phoneOp}
					rotateY={-8}
				/>
			)}

			{/* Caption 1 */}
			<div style={{
				position: 'absolute', left: 100, bottom: 160,
				opacity: cap1Op * cap1Exit,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 42, fontWeight: 700,
					color: C.white, lineHeight: 1.2,
					textShadow: '0 2px 24px rgba(0,0,0,0.8)',
				}}>
					Helga, 73.
				</div>
				<div style={{
					fontFamily: FONT, fontSize: 26, fontWeight: 300,
					color: 'rgba(255,255,255,0.60)', marginTop: 8,
				}}>
					Trägt jeden Montag die Einkäufe alleine nach Hause.
				</div>
			</div>

			{/* Caption 2 — after helper arrives */}
			<div style={{
				position: 'absolute', left: 100, bottom: 160,
				opacity: cap2Op,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 32, fontWeight: 300,
					color: 'rgba(255,255,255,0.72)', lineHeight: 1.5,
				}}>
					Bis ihr Nachbar{' '}
					<span style={{color: C.primary, fontWeight: 700}}>mensaena</span>
					{' '}öffnete.
				</div>
			</div>

			<LogoBadge delay={10} />
			<Vignette />
		</AbsoluteFill>
	);
};
// Moving boxes (rectangles) scattered on floor
const BOXES = [
	{x: 290, y: 860, w: 70, h: 60, rx: 4},
	{x: 370, y: 872, w: 55, h: 50, rx: 4},
	{x: 240, y: 875, w: 60, h: 45, rx: 4},
	{x: 420, y: 865, w: 80, h: 55, rx: 4},
];

export const SceneB: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.sceneB.dur);

	// Man is already in scene, bending/struggling — slight sway
	const manBob = Math.sin(frame * 0.22) * 6;

	// Phone slides up from below at frame 40
	const phoneY = interpolate(frame, [40, 80], [700, 420], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const phoneOp = interpolate(frame, [40, 70], [0, 1], {extrapolateRight: 'clamp'});

	// Two neighbours arrive from right at frame 90
	const n1X = interpolate(frame, [90, 148], [1150, 780], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const n2X = interpolate(frame, [108, 165], [1250, 940], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const n1Op = interpolate(frame, [90, 120], [0, 1], {extrapolateRight: 'clamp'});
	const n2Op = interpolate(frame, [108, 138], [0, 1], {extrapolateRight: 'clamp'});

	// Man lifts box at frame 155 (hold pose = carry)
	const manPose = frame < 155 ? 'stand' : 'carry';

	// Captions
	const cap1Op = interpolate(frame, [10, 35], [0, 1], {extrapolateRight: 'clamp'});
	const cap1Exit = interpolate(frame, [80, 100], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cap2Op = interpolate(frame, [130, 155], [0, 1], {extrapolateRight: 'clamp'});

	// Sparkle dots around man when helpers arrive
	const sparkOp = interpolate(frame, [90, 130], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: op}}>
			<div style={{
				position: 'absolute', inset: 0,
				background: 'linear-gradient(180deg, #050b0b 0%, #081510 60%, #050b0b 100%)',
			}} />
			<TealGlow x="55%" y="55%" a={0.10} />

			{/* Ground line */}
			<div style={{
				position: 'absolute', bottom: 210, left: 0, right: 0, height: 1,
				background: 'linear-gradient(90deg, transparent, rgba(30,170,166,0.15), transparent)',
			}} />

			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{/* Moving boxes on floor */}
				{BOXES.map((b, i) => (
					<g key={i}>
						<rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx}
							fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"
							strokeWidth="1.5"/>
						{/* Box tape line */}
						<line x1={b.x} y1={b.y + b.h / 2} x2={b.x + b.w} y2={b.y + b.h / 2}
							stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
					</g>
				))}

				{/* Sparkle halo around the man when helpers come */}
				{sparkOp > 0 && Array.from({length: 8}, (_, i) => {
					const angle = (i / 8) * Math.PI * 2 + frame * 0.04;
					const r = 80 + Math.sin(frame * 0.1 + i) * 12;
					return (
						<circle key={i}
							cx={560 + Math.cos(angle) * r}
							cy={780 + Math.sin(angle) * r * 0.5}
							r={2 + (i % 3)}
							fill={C.primary} opacity={sparkOp * 0.55}/>
					);
				})}

				{/* Struggling man with boxes */}
				<Character
					x={560} y={880 + manBob}
					scale={1.08} pose={manPose as 'stand' | 'carry'}
					color="rgba(255,255,255,0.88)"
					glowColor="rgba(30,170,166,0.22)"
				/>

				{/* Neighbour 1 — teal, helpful */}
				<Character
					x={n1X} y={880 + (Math.sin(frame * 0.24 + 0.5) * 5)}
					scale={0.96} pose="help"
					color="rgba(30,170,166,0.88)"
					glowColor="rgba(30,170,166,0.5)"
					flip
					opacity={n1Op}
				/>

				{/* Neighbour 2 — slightly lighter */}
				<Character
					x={n2X} y={880 + (Math.sin(frame * 0.26 + 1.1) * 5)}
					scale={0.90} pose="stand"
					color="rgba(30,170,166,0.65)"
					glowColor="rgba(30,170,166,0.3)"
					opacity={n2Op}
				/>
			</svg>

			{/* Chat phone mockup */}
			{phoneOp > 0 && (
				<PhoneMockup
					x={980} y={phoneY}
					scale={0.80}
					screen="chat"
					opacity={phoneOp}
					rotateY={7}
				/>
			)}

			{/* Caption 1 */}
			<div style={{
				position: 'absolute', left: 100, bottom: 155, opacity: cap1Op * cap1Exit,
			}}>
				<div style={{fontFamily: FONT, fontSize: 42, fontWeight: 700, color: C.white, lineHeight: 1.2}}>
					Luca, 28. Neu in der Stadt.
				</div>
				<div style={{fontFamily: FONT, fontSize: 26, fontWeight: 300, color: 'rgba(255,255,255,0.58)', marginTop: 8}}>
					Alleine mit 30 Umzugskartons und keiner Ahnung.
				</div>
			</div>

			{/* Caption 2 */}
			<div style={{
				position: 'absolute', left: 100, bottom: 155, opacity: cap2Op,
			}}>
				<div style={{fontFamily: FONT, fontSize: 32, fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5}}>
					2 Nachrichten auf{' '}
					<span style={{color: C.primary, fontWeight: 700}}>mensaena</span>
					{' '}— und er ist nicht mehr allein.
				</div>
			</div>

			<LogoBadge delay={10} />
			<Vignette />
		</AbsoluteFill>
	);
};
export const SceneC: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.sceneC.dur);

	// SOS alert pulse — fast red glow that fades when helpers arrive
	const sosPhase = Math.min(frame, 90);
	const sosPulse = 0.5 + Math.sin(sosPhase * 0.35) * 0.45;
	const sosOp = interpolate(frame, [0, 20, 130, 160], [0, 1, 1, 0], {extrapolateRight: 'clamp'});

	// Familie: Mutter + Kind
	const motherBob = Math.sin(frame * 0.18) * 3;
	const childScale = 0.55;

	// Phone with map screen — appears at frame 30
	const phoneOp = interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp'});

	// Helpers arrive from both sides at frame 110
	const h1X = interpolate(frame, [110, 165], [-80, 220], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const h2X = interpolate(frame, [120, 175], [1250, 980], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const h3X = interpolate(frame, [130, 185], [1350, 1130], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const hOp = interpolate(frame, [110, 140], [0, 1], {extrapolateRight: 'clamp'});

	// Warmth wash — teal replaces red as helpers arrive
	const warmA = interpolate(frame, [100, 180], [0, 0.18], {extrapolateRight: 'clamp'});

	// Captions
	const cap1Op = interpolate(frame, [10, 35], [0, 1], {extrapolateRight: 'clamp'});
	const cap1Exit = interpolate(frame, [90, 115], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cap2Op = interpolate(frame, [150, 175], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: op}}>
			<div style={{
				position: 'absolute', inset: 0,
				background: 'linear-gradient(180deg, #060808 0%, #090f10 55%, #060808 100%)',
			}} />

			{/* SOS red ambient pulse */}
			{sosOp > 0.01 && (
				<div style={{
					position: 'absolute', inset: 0,
					background: `radial-gradient(ellipse at 50% 50%, rgba(200,40,40,${(sosPulse * 0.14 * sosOp).toFixed(3)}) 0%, transparent 55%)`,
					pointerEvents: 'none',
				}} />
			)}

			{/* Teal warmth wash when helpers arrive */}
			<TealGlow a={warmA} />

			{/* Ground */}
			<div style={{
				position: 'absolute', bottom: 225, left: 0, right: 0, height: 1,
				background: 'linear-gradient(90deg, transparent, rgba(30,170,166,0.15), transparent)',
			}} />

			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{/* SOS ring pulsing around family */}
				{sosOp > 0.01 && (
					<circle cx="600" cy="800"
						r={50 + sosPulse * 40}
						fill="none"
						stroke={`rgba(220,60,60,${(sosPulse * 0.25 * sosOp).toFixed(3)})`}
						strokeWidth="2"/>
				)}

				{/* Helpers arriving from sides */}
				<Character x={h1X} y={835} scale={0.92} pose="help"
					color="rgba(30,170,166,0.85)" glowColor="rgba(30,170,166,0.45)"
					opacity={hOp}/>
				<Character x={h2X} y={835} scale={0.90} pose="stand"
					color="rgba(30,170,166,0.75)" glowColor="rgba(30,170,166,0.35)"
					flip opacity={hOp}/>
				<Character x={h3X} y={840} scale={0.84} pose="phone"
					color="rgba(30,170,166,0.60)" glowColor="rgba(30,170,166,0.25)"
					opacity={hOp * 0.8}/>

				{/* Mother */}
				<Character x={620} y={840 + motherBob} scale={1.02} pose="phone"
					color="rgba(255,255,255,0.88)" glowColor="rgba(30,170,166,0.25)"
				/>

				{/* Child — smaller, beside mother */}
				<Character x={710} y={860 + motherBob * 0.6} scale={childScale} pose="stand"
					color="rgba(255,255,255,0.72)" glowColor="rgba(30,170,166,0.15)"
				/>
			</svg>

			{/* Map phone — showing nearby helpers */}
			{phoneOp > 0 && (
				<PhoneMockup
					x={1060} y={430}
					scale={0.82}
					screen="map"
					opacity={phoneOp}
					rotateY={-10}
				/>
			)}

			{/* Caption 1 */}
			<div style={{
				position: 'absolute', left: 100, bottom: 155, opacity: cap1Op * cap1Exit,
			}}>
				<div style={{fontFamily: FONT, fontSize: 42, fontWeight: 700, color: C.white, lineHeight: 1.2}}>
					Mia und ihre Tochter.
				</div>
				<div style={{fontFamily: FONT, fontSize: 26, fontWeight: 300, color: 'rgba(255,255,255,0.58)', marginTop: 8}}>
					Unerwartete Krise. Kein Auto. Niemand erreichbar.
				</div>
			</div>

			{/* Caption 2 */}
			<div style={{
				position: 'absolute', left: 100, bottom: 155, opacity: cap2Op,
			}}>
				<div style={{fontFamily: FONT, fontSize: 32, fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5}}>
					Ihre Nachbarschaft reagiert —{' '}
					<span style={{color: C.primary, fontWeight: 700}}>in Minuten</span>.
				</div>
			</div>

			<LogoBadge delay={10} />
			<Vignette />
		</AbsoluteFill>
	);
};
// Network nodes — deterministic positions spread across screen
const NET_NODES = Array.from({length: 28}, (_, i) => {
	const a = (i * 2_345_678 + 11_111) % 100_000;
	const b = (i * 8_765_432 + 22_222) % 100_000;
	const c = (i * 5_678_901 + 33_333) % 100_000;
	return {
		x: 200 + (a / 100_000) * 1520,
		y: 180 + (b / 100_000) * 720,
		r: 8 + (c / 100_000) * 10,
		delay: Math.floor((i / 28) * 180),   // staggered appearance
	};
});

// Edges between nodes that are close enough
const NET_EDGES = NET_NODES.flatMap((a, i) =>
	NET_NODES.slice(i + 1).map((b, j) => {
		const d = Math.hypot(a.x - b.x, a.y - b.y);
		return d < 340 ? {a, b, d, delay: Math.max(a.delay, b.delay) + 15} : null;
	}).filter(Boolean)
) as {a: typeof NET_NODES[0]; b: typeof NET_NODES[0]; d: number; delay: number}[];

export const NetworkScene: React.FC = () => {
	const frame = useCurrentFrame();
	const op = useFade(T.network.dur);

	// Overall scale pulse (network "breathing")
	const breathe = 1 + Math.sin(frame * 0.05) * 0.012;

	// Counter animate — numbers counting up
	const countEnd = 12_400;
	const countFrame = Math.min(frame, 260);
	const count = Math.round(interpolate(countFrame, [0, 260], [0, countEnd], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	}));

	// Caption timings
	const headOp = interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp'});
	const statOp = interpolate(frame, [100, 130], [0, 1], {extrapolateRight: 'clamp'});
	const cta1Op = interpolate(frame, [200, 230], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bgDeep, opacity: op}}>
			{/* Deep space gradient */}
			<div style={{
				position: 'absolute', inset: 0,
				background: 'radial-gradient(ellipse at 50% 50%, #071210 0%, #020607 70%)',
			}} />

			{/* Network graph */}
			<div style={{
				position: 'absolute', inset: 0,
				transform: `scale(${breathe})`, transformOrigin: 'center center',
			}}>
				<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
					{/* Edges */}
					{NET_EDGES.map((e, i) => {
						const edgeOp = interpolate(frame, [e.delay, e.delay + 22], [0, 1], {extrapolateRight: 'clamp'});
						if (edgeOp <= 0) return null;
						return (
							<line key={i}
								x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
								stroke={C.primary}
								strokeWidth={0.8}
								opacity={edgeOp * (0.18 + (1 - e.d / 340) * 0.25)}
							/>
						);
					})}

					{/* Nodes */}
					{NET_NODES.map((n, i) => {
						const nOp = interpolate(frame, [n.delay, n.delay + 18], [0, 1], {extrapolateRight: 'clamp'});
						if (nOp <= 0) return null;
						const pulse = 1 + Math.sin(frame * 0.07 + i * 0.9) * 0.15;
						return (
							<g key={i} opacity={nOp}>
								{/* Outer glow ring */}
								<circle cx={n.x} cy={n.y} r={n.r * pulse * 1.8}
									fill="none" stroke={C.primary}
									strokeWidth="1" opacity={0.25}/>
								{/* Core dot */}
								<circle cx={n.x} cy={n.y} r={n.r * pulse}
									fill={C.primary} opacity={0.85}/>
								{/* Bright centre */}
								<circle cx={n.x} cy={n.y} r={n.r * 0.45}
									fill="white" opacity={0.7}/>
							</g>
						);
					})}

					{/* Central hero node — pulsing large */}
					<circle cx="960" cy="540" r={28 + Math.sin(frame * 0.08) * 6}
						fill="none" stroke={C.primary} strokeWidth="2" opacity="0.4"/>
					<circle cx="960" cy="540" r={18}
						fill={C.primary} opacity="0.95"/>
					<circle cx="960" cy="540" r={8}
						fill="white" opacity="0.9"/>
				</svg>
			</div>

			{/* Teal ambient glow */}
			<TealGlow a={0.16} />

			{/* Headline */}
			<div style={{
				position: 'absolute', top: 120, left: 0, right: 0,
				textAlign: 'center', opacity: headOp,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 52, fontWeight: 800,
					color: C.white, letterSpacing: '-0.025em',
					textShadow: '0 2px 40px rgba(0,0,0,0.9)',
				}}>
					Deine Nachbarschaft. Vernetzt.
				</div>
			</div>

			{/* Animated stat */}
			<div style={{
				position: 'absolute', bottom: 240, left: 0, right: 0,
				textAlign: 'center', opacity: statOp,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 88, fontWeight: 900,
					color: C.primary, letterSpacing: '-0.04em',
					textShadow: `0 0 80px rgba(30,170,166,0.45)`,
				}}>
					{count.toLocaleString('de-DE')}
				</div>
				<div style={{
					fontFamily: FONT, fontSize: 22, fontWeight: 300,
					color: 'rgba(255,255,255,0.55)', marginTop: 8, letterSpacing: '0.06em',
					textTransform: 'uppercase',
				}}>
					Nachbarn helfen einander täglich
				</div>
			</div>

			{/* Subtext */}
			<div style={{
				position: 'absolute', bottom: 145, left: 0, right: 0,
				textAlign: 'center', opacity: cta1Op,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 20, fontWeight: 300,
					color: 'rgba(255,255,255,0.40)', letterSpacing: '0.04em',
				}}>
					In 200+ deutschen Städten und Gemeinden
				</div>
			</div>

			<Vignette />
		</AbsoluteFill>
	);
};
const FEATURES = [
	{icon: '📍', title: 'Nachbarschafts-Karte', sub: 'Finde Nachbarn in deiner Nähe', delay: 20},
	{icon: '💬', title: 'Direkt-Chat', sub: 'Unkompliziert Hilfe anfragen', delay: 80},
	{icon: '🔔', title: 'Sofort-Benachrichtigungen', sub: 'Nie mehr eine Anfrage verpassen', delay: 140},
	{icon: '🤝', title: 'Hilfe-Netzwerk', sub: 'Gegenseitige Unterstützung im Alltag', delay: 200},
	{icon: '🛡️', title: 'Sicher & Geprüft', sub: 'Verifizierte Community-Mitglieder', delay: 260},
];

export const FeaturesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.features.dur);

	// Left-side character — phone pose, occasional bob
	const charBob = Math.sin(frame * 0.14) * 4;
	const charOp = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
	const charX = interpolate(frame, [0, 40], [300, 440], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	// Divider line draws in
	const dividerH = interpolate(frame, [10, 55], [0, 680], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	// Scene heading
	const headOp = interpolate(frame, [15, 40], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: op}}>
			<div style={{
				position: 'absolute', inset: 0,
				background: 'linear-gradient(135deg, #050b0b 0%, #071210 50%, #050b0b 100%)',
			}} />
			<TealGlow x="28%" y="52%" a={0.13} />

			{/* ── Left: Character + ambient glow ── */}
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{/* Ambient circle behind character */}
				<circle cx={charX} cy="570" r={200}
					fill="none" stroke={C.primary}
					strokeWidth="1" opacity="0.10"/>
				<circle cx={charX} cy="570" r={130}
					fill={`rgba(30,170,166,0.05)`}/>

				<Character
					x={charX} y={870 + charBob} scale={1.15} pose="phone"
					color="rgba(255,255,255,0.88)"
					glowColor="rgba(30,170,166,0.35)"
					opacity={charOp}
				/>
			</svg>

			{/* Vertical divider */}
			<div style={{
				position: 'absolute', left: 750, top: 200,
				width: 1.5, height: dividerH,
				background: `linear-gradient(180deg, transparent, ${C.primary}, transparent)`,
				opacity: 0.35,
			}} />

			{/* ── Right: Feature cards ── */}
			<div style={{
				position: 'absolute', left: 800, top: 130, right: 80,
			}}>
				{/* Heading */}
				<div style={{
					fontFamily: FONT, fontSize: 42, fontWeight: 800,
					color: C.white, marginBottom: 36, opacity: headOp,
					letterSpacing: '-0.02em',
				}}>
					Alles, was du brauchst.
				</div>

				{/* Feature cards */}
				{FEATURES.map((f, i) => {
					const cardOp = interpolate(frame, [f.delay, f.delay + 28], [0, 1], {extrapolateRight: 'clamp'});
					const cardX = interpolate(frame, [f.delay, f.delay + 28], [40, 0], {
						extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
					});
					return (
						<div key={i} style={{
							display: 'flex', alignItems: 'center', gap: 24,
							marginBottom: 28, opacity: cardOp,
							transform: `translateX(${cardX}px)`,
						}}>
							{/* Icon bubble */}
							<div style={{
								width: 60, height: 60, flexShrink: 0,
								borderRadius: 16,
								background: `rgba(30,170,166,0.12)`,
								border: `1.5px solid rgba(30,170,166,0.35)`,
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								fontSize: 26,
							}}>
								{f.icon}
							</div>
							<div>
								<div style={{
									fontFamily: FONT, fontSize: 22, fontWeight: 700,
									color: C.white, lineHeight: 1.2,
								}}>
									{f.title}
								</div>
								<div style={{
									fontFamily: FONT, fontSize: 16, fontWeight: 300,
									color: 'rgba(255,255,255,0.52)', marginTop: 4,
								}}>
									{f.sub}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<LogoBadge delay={10} />
			<Vignette />
		</AbsoluteFill>
	);
};
export const AppShowcaseScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.appShowcase.dur);

	// Phone springs in from below
	const phoneSpring = spring({fps, frame, config: {damping: 16, stiffness: 100, mass: 1.1}});
	const phoneY = interpolate(phoneSpring, [0, 1], [900, 540]);

	// Screen transitions at fixed intervals
	// 0–80: map, 80–160: chat, 160–280: notification, 280–310: fade out
	const screenIndex = frame < 85 ? 0 : frame < 175 ? 1 : 2;
	const screens: ScreenType[] = ['map', 'chat', 'notification'];

	// Slight tilt rocking animation
	const tilt = Math.sin(frame * 0.06) * 2.5;

	// Screen swap flash
	const swapFlash = (frame >= 82 && frame <= 90) || (frame >= 172 && frame <= 180);
	const phoneOp = swapFlash ? 0.7 : 1;

	// Floating labels next to phone
	type LabelDef = {text: string; y: number; appear: number};
	const labels: LabelDef[] = [
		{text: 'Karte der Nachbarschaft',    y: 330, appear: 20},
		{text: 'Direkter Chat',              y: 430, appear: 95},
		{text: 'Sofort-Benachrichtigung',    y: 530, appear: 185},
	];
	const activeLabelIdx = screenIndex;

	// Headline
	const headOp = interpolate(frame, [10, 35], [0, 1], {extrapolateRight: 'clamp'});

	// CTA pill at end
	const pillOp = interpolate(frame, [240, 270], [0, 1], {extrapolateRight: 'clamp'});
	const pillScale = spring({fps, frame: Math.max(0, frame - 240), config: {damping: 14, stiffness: 200, mass: 0.7}});

	return (
		<AbsoluteFill style={{background: C.bgDeep, opacity: op}}>
			<div style={{
				position: 'absolute', inset: 0,
				background: 'radial-gradient(ellipse at 50% 55%, #081612 0%, #020607 65%)',
			}} />
			<TealGlow a={0.15} />

			{/* Headline */}
			<div style={{
				position: 'absolute', top: 100, left: 0, right: 0,
				textAlign: 'center', opacity: headOp,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 48, fontWeight: 800,
					color: C.white, letterSpacing: '-0.025em',
				}}>
					Die App für echte Nachbarschaft.
				</div>
			</div>

			{/* Floating label pills (left of phone) */}
			{labels.map((l, i) => {
				const isActive = i === activeLabelIdx;
				const labelOp = interpolate(frame, [l.appear, l.appear + 20], [0, 1], {extrapolateRight: 'clamp'});
				return (
					<div key={i} style={{
						position: 'absolute', left: 340, top: l.y,
						opacity: labelOp * (isActive ? 1 : 0.30),
						transform: `translateX(${isActive ? 0 : -12}px)`,
						transition: 'none',
					}}>
						<div style={{
							display: 'inline-flex', alignItems: 'center', gap: 10,
							background: isActive ? `rgba(30,170,166,0.15)` : 'rgba(255,255,255,0.05)',
							border: `1.5px solid ${isActive ? C.primary : 'rgba(255,255,255,0.08)'}`,
							borderRadius: 999, padding: '10px 22px',
							fontFamily: FONT, fontSize: 18, fontWeight: isActive ? 700 : 400,
							color: isActive ? C.primary : 'rgba(255,255,255,0.45)',
						}}>
							<div style={{
								width: 8, height: 8, borderRadius: '50%',
								background: isActive ? C.primary : 'rgba(255,255,255,0.25)',
							}} />
							{l.text}
						</div>
					</div>
				);
			})}

			{/* Centred phone */}
			<PhoneMockup
				x={960} y={phoneY}
				scale={1.25}
				screen={screens[screenIndex]}
				opacity={phoneOp}
				rotateY={tilt}
			/>

			{/* CTA pill */}
			{pillOp > 0 && (
				<div style={{
					position: 'absolute', bottom: 110, left: 0, right: 0,
					display: 'flex', justifyContent: 'center',
					opacity: pillOp, transform: `scale(${pillScale})`,
				}}>
					<div style={{
						fontFamily: FONT, fontSize: 22, fontWeight: 700,
						color: C.white, letterSpacing: '0.04em',
						background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid})`,
						borderRadius: 999, padding: '16px 48px',
						boxShadow: `0 0 40px rgba(30,170,166,0.40)`,
					}}>
						Kostenlos herunterladen
					</div>
				</div>
			)}

			<Vignette />
		</AbsoluteFill>
	);
};
// Particles that fly toward the logo centre
const CTA_PARTICLES = Array.from({length: 36}, (_, i) => {
	const a = (i * 4_321_987 + 55_555) % 100_000;
	const b = (i * 9_876_543 + 44_444) % 100_000;
	const angle = (i / 36) * Math.PI * 2;
	const startR = 400 + (a / 100_000) * 400;
	return {
		startX: 960 + Math.cos(angle) * startR,
		startY: 420 + Math.sin(angle) * startR * 0.55,
		delay: Math.floor((b / 100_000) * 60),
	};
});

export const CTAScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const op = useFade(T.cta.dur, true);  // no exit fade — this is the last scene

	// Particle convergence toward centre (0–80)
	const convergence = interpolate(frame, [0, 80], [0, 1], {
		extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin),
	});

	// Logo springs in at frame 70
	const logoSpring = spring({fps, frame: Math.max(0, frame - 70), config: {damping: 14, stiffness: 100, mass: 1.0}});
	const logoOp = interpolate(frame, [70, 95], [0, 1], {extrapolateRight: 'clamp'});

	// Wordmark
	const wordOp = interpolate(frame, [88, 115], [0, 1], {extrapolateRight: 'clamp'});

	// Tagline
	const tagOp = interpolate(frame, [120, 150], [0, 1], {extrapolateRight: 'clamp'});

	// URL + button
	const urlOp = interpolate(frame, [160, 190], [0, 1], {extrapolateRight: 'clamp'});
	const btnScale = spring({fps, frame: Math.max(0, frame - 160), config: {damping: 13, stiffness: 180, mass: 0.8}});

	// Continuous slow rotation of outer ring
	const ringAngle = frame * 0.4;

	// Glow pulse
	const glowA = 0.25 + Math.sin(frame * 0.06) * 0.10;

	return (
		<AbsoluteFill style={{background: C.bgDeep, opacity: op}}>
			{/* Deep space */}
			<div style={{
				position: 'absolute', inset: 0,
				background: 'radial-gradient(ellipse at 50% 42%, #091514 0%, #020607 65%)',
			}} />

			{/* Particle system */}
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{CTA_PARTICLES.map((p, i) => {
					const pProgress = interpolate(
						frame, [p.delay, p.delay + 70], [0, 1],
						{extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}
					);
					const px = p.startX + (960 - p.startX) * pProgress;
					const py = p.startY + (420 - p.startY) * pProgress;
					const pOp = pProgress < 0.85 ? pProgress * 0.8 : (1 - pProgress) * 5.3 * 0.8;
					return (
						<circle key={i} cx={px} cy={py}
							r={2 + (i % 4) * 0.7}
							fill={C.primary} opacity={Math.max(0, pOp)}/>
					);
				})}

				{/* Rotating outer ring with dashes */}
				{logoOp > 0 && (
					<g transform={`translate(960, 420) rotate(${ringAngle})`}>
						<circle cx="0" cy="0" r="150"
							fill="none" stroke={C.primary}
							strokeWidth="1" strokeDasharray="6 10"
							opacity={logoOp * 0.3}/>
					</g>
				)}
			</svg>

			{/* Ambient glow */}
			<TealGlow y="42%" a={glowA} />

			{/* Logo + wordmark */}
			<div style={{
				position: 'absolute', inset: 0,
				display: 'flex', flexDirection: 'column',
				alignItems: 'center', justifyContent: 'center',
				gap: 0,
				transform: 'translateY(-60px)',
			}}>
				<div style={{
					display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
					transform: `scale(${logoSpring})`, opacity: logoOp,
				}}>
					<MensaenaImg size={160} glow={logoOp} />
					<div style={{
						fontFamily: FONT, fontSize: 64, fontWeight: 900,
						color: C.white, letterSpacing: '-0.035em',
						opacity: wordOp,
						textShadow: `0 0 100px rgba(30,170,166,${(logoOp * 0.5).toFixed(2)})`,
					}}>mensaena</div>
				</div>
			</div>

			{/* Tagline */}
			<div style={{
				position: 'absolute', top: 620, left: 0, right: 0,
				textAlign: 'center', opacity: tagOp,
			}}>
				<div style={{
					fontFamily: FONT, fontSize: 28, fontWeight: 300,
					color: 'rgba(255,255,255,0.62)',
					letterSpacing: '0.06em',
				}}>
					Zusammen stark. Miteinander nah.
				</div>
			</div>

			{/* URL + CTA button */}
			<div style={{
				position: 'absolute', bottom: 130, left: 0, right: 0,
				display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
				opacity: urlOp,
			}}>
				{/* Register button */}
				<div style={{
					fontFamily: FONT, fontSize: 24, fontWeight: 700,
					color: C.white, letterSpacing: '0.02em',
					background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid})`,
					borderRadius: 999, padding: '18px 60px',
					transform: `scale(${btnScale})`,
					boxShadow: `0 0 60px rgba(30,170,166,0.45), 0 4px 30px rgba(0,0,0,0.6)`,
				}}>
					Jetzt kostenlos registrieren
				</div>

				{/* URL */}
				<div style={{
					fontFamily: FONT, fontSize: 19, fontWeight: 400,
					color: 'rgba(255,255,255,0.40)',
					letterSpacing: '0.04em',
				}}>
					mensaena.de
				</div>
			</div>

			<Vignette />
		</AbsoluteFill>
	);
};

// ─────────────────────────────────────────────
// ROOT — 2100 frames / 30 fps / 70 s
// ─────────────────────────────────────────────
export const MensaenaAd: React.FC = () => (
	<AbsoluteFill style={{background: C.bgDeep}}>
		<Sequence from={T.opener.from}      durationInFrames={T.opener.dur}>      <OpenerScene      /></Sequence>
		<Sequence from={T.sceneA.from}      durationInFrames={T.sceneA.dur}>      <SceneA           /></Sequence>
		<Sequence from={T.sceneB.from}      durationInFrames={T.sceneB.dur}>      <SceneB           /></Sequence>
		<Sequence from={T.sceneC.from}      durationInFrames={T.sceneC.dur}>      <SceneC           /></Sequence>
		<Sequence from={T.network.from}     durationInFrames={T.network.dur}>     <NetworkScene     /></Sequence>
		<Sequence from={T.features.from}    durationInFrames={T.features.dur}>    <FeaturesScene    /></Sequence>
		<Sequence from={T.appShowcase.from} durationInFrames={T.appShowcase.dur}> <AppShowcaseScene /></Sequence>
		<Sequence from={T.cta.from}         durationInFrames={T.cta.dur}>         <CTAScene         /></Sequence>
	</AbsoluteFill>
);
