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

// ── Brand colours (from mensaena.de Tailwind config)
const C = {
	primary:    '#1EAAA6',
	primaryMid: '#147170',
	bg:         '#060e0e',
	bgDeep:     '#030808',
	white:      '#FFFFFF',
} as const;

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ── Scene timeline — total 900 frames = 30 s @ 30 fps
// 30-frame crossfade between every pair of adjacent scenes
const T = {
	opener:   {from: 0,   dur: 150},   // 0–5 s
	hook:     {from: 120, dur: 165},   // 4–9.5 s
	solution: {from: 255, dur: 145},   // 8.5–13.3 s
	features: {from: 370, dur: 300},   // 12.3–22.3 s
	stats:    {from: 640, dur: 150},   // 21.3–26.3 s
	cta:      {from: 760, dur: 140},   // 25.3–30 s  (no exit fade — ends clean)
} as const;

// ── Crossfade — fades in over first 20 frames, out over last 20
function useFade(dur: number, noExit = false): number {
	const frame = useCurrentFrame();
	const enter = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
	if (noExit) return enter;
	const exit = interpolate(frame, [dur - 20, dur], [1, 0], {
		extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
	});
	return Math.min(enter, exit);
}

// ── Real Mensaena logo from public/mensaena-logo.png
const MensaenaImg: React.FC<{size: number; glow?: number}> = ({size, glow = 0}) => (
	<div style={{
		width: size, height: size, flexShrink: 0,
		filter: glow > 0 ? `drop-shadow(0 0 ${Math.round(glow * 70)}px rgba(30,170,166,${(glow * 0.85).toFixed(2)}))` : undefined,
	}}>
		<Img
			src={staticFile('mensaena-logo.png')}
			style={{width: size, height: size, objectFit: 'contain', display: 'block'}}
		/>
	</div>
);

// ── Persistent logo watermark in top-left corner (scenes 2–6)
const LogoBadge: React.FC<{delay?: number}> = ({delay = 0}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [delay, delay + 22], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{
			position: 'absolute', top: 44, left: 60, zIndex: 20,
			display: 'flex', alignItems: 'center', gap: 14, opacity,
		}}>
			<MensaenaImg size={46} />
			<span style={{
				fontFamily: FONT, fontSize: 19, fontWeight: 700,
				color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.02em',
			}}>
				mensaena
			</span>
		</div>
	);
};

// ── Cinematic vignette (darkens edges, boosts perceived depth)
const Vignette: React.FC = () => (
	<div style={{
		position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
		background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.6) 100%)',
	}} />
);

// ── Ambient teal glow
const TealGlow: React.FC<{x?: string; y?: string; a?: number}> = ({x = '50%', y = '46%', a = 0.22}) => (
	<div style={{
		position: 'absolute', inset: 0, pointerEvents: 'none',
		background: `radial-gradient(ellipse at ${x} ${y}, rgba(30,170,166,${a}) 0%, transparent 58%)`,
	}} />
);

// ── Staggered word-by-word reveal (spring + opacity per word)
const WordReveal: React.FC<{
	text: string;
	startFrame: number;
	stagger?: number;
	style?: React.CSSProperties;
}> = ({text, startFrame, stagger = 7, style = {}}) => {
	const frame  = useCurrentFrame();
	const {fps}  = useVideoConfig();
	const words  = text.split(' ');
	return (
		<span style={{display: 'inline', ...style}}>
			{words.map((word, i) => {
				const d  = startFrame + i * stagger;
				const y  = spring({fps, frame, from: 38, to: 0, config: {damping: 28, stiffness: 170}, delay: d});
				const op = interpolate(frame, [d, d + 14], [0, 1], {extrapolateRight: 'clamp'});
				return (
					<span key={i} style={{
						display: 'inline-block',
						transform: `translateY(${y}px)`,
						opacity: op,
						marginRight: i < words.length - 1 ? '0.28em' : 0,
					}}>
						{word}
					</span>
				);
			})}
		</span>
	);
};

// ══════════════════════════════════════════════════
// SCENE 1 — BRAND OPENER  dur=150  (5 s)
// Logo emerges from darkness with pulsing glow
// ══════════════════════════════════════════════════
export const OpenerScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.opener.dur);

	// Logo springs in from small scale with glow that peaks then settles
	const logoScale   = spring({fps, frame, from: 0.55, to: 1, config: {damping: 20, stiffness: 75, mass: 1.6}, delay: 8});
	const logoOpacity = interpolate(frame, [8, 38], [0, 1], {extrapolateRight: 'clamp'});
	const glowStrength = interpolate(frame, [20, 62, 120], [0, 1, 0.38], {
		extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin),
	});

	// Divider line draws in
	const lineW = interpolate(frame, [52, 98], [0, 400], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	// Wordmark springs up
	const nameY       = spring({fps, frame, from: 32, to: 0, config: {damping: 24, stiffness: 130}, delay: 58});
	const nameOpacity = interpolate(frame, [58, 80], [0, 1], {extrapolateRight: 'clamp'});

	// Tagline fades
	const tagOpacity = interpolate(frame, [88, 112], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 42%, #0d2222 0%, ${C.bgDeep} 68%)`,
			opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			flexDirection: 'column', gap: 28,
		}}>
			<Vignette />

			{/* Logo with animated glow */}
			<div style={{transform: `scale(${logoScale})`, opacity: logoOpacity}}>
				<MensaenaImg size={200} glow={glowStrength} />
			</div>

			{/* Animated centre divider */}
			<div style={{
				width: lineW, height: 2, borderRadius: 1,
				background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`,
			}} />

			{/* Wordmark */}
			<div style={{transform: `translateY(${nameY}px)`, opacity: nameOpacity}}>
				<div style={{
					fontFamily: FONT, fontSize: 90, fontWeight: 800,
					color: C.white, letterSpacing: '-0.046em', lineHeight: 1, textAlign: 'center',
				}}>
					mensaena
				</div>
			</div>

			{/* Tagline */}
			<div style={{opacity: tagOpacity, textAlign: 'center'}}>
				<div style={{
					fontFamily: FONT, fontSize: 17, fontWeight: 600,
					color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase',
				}}>
					Die Gemeinwohl-Plattform
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════
// SCENE 2 — HOOK  dur=165  (5.5 s)
// Rhetorical questions build tension word by word
// ══════════════════════════════════════════════════
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = useFade(T.hook.dur);

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
			padding: '0 120px',
		}}>
			{/* Subtle teal grid */}
			<div style={{
				position: 'absolute', inset: 0,
				backgroundImage: `
					linear-gradient(rgba(30,170,166,0.033) 1px, transparent 1px),
					linear-gradient(90deg, rgba(30,170,166,0.033) 1px, transparent 1px)`,
				backgroundSize: '88px 88px',
			}} />
			<Vignette />
			<LogoBadge delay={8} />

			<div style={{zIndex: 10, maxWidth: 1100}}>
				{/* Q1 — dimmed */}
				<div style={{fontFamily: FONT, fontSize: 63, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.24, color: 'rgba(255,255,255,0.2)'}}>
					<WordReveal text="Wer hilft mir beim Umzug?" startFrame={24} stagger={6} />
				</div>
				{/* Q2 — dimmed */}
				<div style={{fontFamily: FONT, fontSize: 63, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.24, marginTop: 4, color: 'rgba(255,255,255,0.2)'}}>
					<WordReveal text="Wer braucht Unterstützung?" startFrame={62} stagger={6} />
				</div>
				{/* Q3 — teal, bold emphasis */}
				<div style={{fontFamily: FONT, fontSize: 68, fontWeight: 800, letterSpacing: '-0.033em', lineHeight: 1.24, marginTop: 4, color: C.primary}}>
					<WordReveal text="Wer kennt deine Nachbarn?" startFrame={100} stagger={6} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════
// SCENE 3 — SOLUTION  dur=145  (4.8 s)
// Teal flash → massive headline springs in
// ══════════════════════════════════════════════════
export const SolutionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = useFade(T.solution.dur);

	// Teal flash covers scene on entry
	const flash = interpolate(frame, [0, 5, 20], [0.92, 0.55, 0], {extrapolateRight: 'clamp'});

	const subOpacity = interpolate(frame, [60, 82], [0, 1], {extrapolateRight: 'clamp'});
	const lineW      = interpolate(frame, [58, 104], [0, 540], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 48%, #0e2424 0%, ${C.bgDeep} 68%)`,
			opacity, display: 'flex', alignItems: 'center', justifyContent: 'center',
		}}>
			{/* Flash overlay — above everything */}
			<div style={{position: 'absolute', inset: 0, background: C.primary, opacity: flash, zIndex: 30}} />
			<TealGlow />
			<Vignette />
			<LogoBadge delay={22} />

			<div style={{zIndex: 10, textAlign: 'center', padding: '0 80px'}}>
				{/* "Nachbarschaft," */}
				<div style={{
					fontFamily: FONT, fontSize: 104, fontWeight: 800,
					color: C.white, letterSpacing: '-0.046em', lineHeight: 1,
					overflow: 'hidden',
				}}>
					<WordReveal text="Nachbarschaft," startFrame={16} stagger={9} />
				</div>
				{/* "neu gedacht." */}
				<div style={{
					fontFamily: FONT, fontSize: 104, fontWeight: 800,
					color: C.primary, letterSpacing: '-0.046em', lineHeight: 1.06, marginTop: 4,
					overflow: 'hidden',
				}}>
					<WordReveal text="neu gedacht." startFrame={30} stagger={9} />
				</div>

				{/* Animated rule + sub-headline */}
				<div style={{opacity: subOpacity, marginTop: 38}}>
					<div style={{
						width: lineW, height: 3, margin: '0 auto 24px', borderRadius: 2,
						background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, transparent)`,
					}} />
					<div style={{
						fontFamily: FONT, fontSize: 22, fontWeight: 400,
						color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em',
					}}>
						Hilfe anbieten. Hilfe finden. Menschen kennenlernen.
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════
// SCENE 4 — FEATURES  dur=300  (10 s)
// Three feature cards rise in with stagger
// ══════════════════════════════════════════════════
const PIN_ICON = (
	<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
		<circle cx="12" cy="9" r="2.5" />
	</svg>
);
const HEART_ICON = (
	<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
	</svg>
);
const SHIELD_ICON = (
	<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
		<polyline points="9 12 11 14 15 10" />
	</svg>
);

const featureData = [
	{num: '01', icon: PIN_ICON,    title: 'Hyperlokal',     body: 'Finde Hilfe direkt in deiner Straße — mit interaktiver Karte und präzisem Geo-Filter.'},
	{num: '02', icon: HEART_ICON,  title: 'Gemeinnützig',   body: 'Kostenlos, werbefrei, DSGVO-konform. Kein Profit — nur Gemeinschaft.'},
	{num: '03', icon: SHIELD_ICON, title: 'Krisenhilfe',    body: 'Sofortige Nachbarschaftshilfe bei Hochwasser, Stromausfall und Notlagen.'},
];

const FeatureCard: React.FC<{data: (typeof featureData)[number]; delay: number}> = ({data, delay}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const cardY       = spring({fps, frame, from: 110, to: 0, config: {damping: 25, stiffness: 112}, delay});
	const cardOpacity = interpolate(frame, [delay, delay + 32], [0, 1], {extrapolateRight: 'clamp'});
	const iconOpacity = interpolate(frame, [delay + 22, delay + 44], [0, 1], {extrapolateRight: 'clamp'});
	const bodyOpacity = interpolate(frame, [delay + 30, delay + 52], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<div style={{
			transform: `translateY(${cardY}px)`, opacity: cardOpacity,
			flex: 1, display: 'flex', flexDirection: 'column',
			borderTop: `2px solid ${C.primary}`, paddingTop: 30,
		}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20}}>
				<span style={{fontFamily: FONT, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.14em'}}>
					{data.num}
				</span>
				<div style={{color: C.primary, opacity: iconOpacity}}>{data.icon}</div>
			</div>
			<div style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: C.white, letterSpacing: '-0.026em', lineHeight: 1.1, marginBottom: 14}}>
				{data.title}
			</div>
			<div style={{fontFamily: FONT, fontSize: 17, lineHeight: 1.72, color: 'rgba(255,255,255,0.42)', opacity: bodyOpacity}}>
				{data.body}
			</div>
		</div>
	);
};

export const FeaturesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.features.dur);

	const labelY       = spring({fps, frame, from: 28, to: 0, config: {damping: 24, stiffness: 130}, delay: 22});
	const labelOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 80px',
		}}>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 22% 68%, rgba(30,170,166,0.08) 0%, transparent 44%), radial-gradient(ellipse at 78% 32%, rgba(20,113,112,0.07) 0%, transparent 44%)`}} />
			<Vignette />
			<LogoBadge delay={22} />

			<div style={{
				transform: `translateY(${labelY}px)`, opacity: labelOpacity,
				fontFamily: FONT, fontSize: 14, fontWeight: 700,
				color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 52,
			}}>
				Was Mensaena auszeichnet
			</div>

			<div style={{display: 'flex', gap: 52, width: '100%', zIndex: 10}}>
				{featureData.map((data, i) => (
					<FeatureCard key={i} data={data} delay={36 + i * 42} />
				))}
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════
// SCENE 5 — STATS  dur=150  (5 s)
// Cinematic count-up counters
// ══════════════════════════════════════════════════
const StatItem: React.FC<{target: number; suffix?: string; label: string; delay: number}> = ({
	target, suffix = '', label, delay,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const itemY       = spring({fps, frame, from: 36, to: 0, config: {damping: 24, stiffness: 125}, delay});
	const itemOpacity = interpolate(frame, [delay, delay + 24], [0, 1], {extrapolateRight: 'clamp'});
	const progress    = interpolate(frame, [delay + 5, delay + 72], [0, 1], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const count = Math.round(target * progress);

	return (
		<div style={{opacity: itemOpacity, transform: `translateY(${itemY}px)`, textAlign: 'center', flex: 1}}>
			<div style={{fontFamily: FONT, fontSize: 90, fontWeight: 800, color: C.primary, letterSpacing: '-0.048em', lineHeight: 1}}>
				{count.toLocaleString('de-DE')}{suffix}
			</div>
			<div style={{width: 44, height: 2, background: C.primary, opacity: 0.5, borderRadius: 1, margin: '12px auto 14px'}} />
			<div style={{fontFamily: FONT, fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.01em'}}>
				{label}
			</div>
		</div>
	);
};

export const StatsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.stats.dur);

	const titleY       = spring({fps, frame, from: 30, to: 0, config: {damping: 24, stiffness: 125}, delay: 22});
	const titleOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 50%, #0c1e1e 0%, ${C.bgDeep} 68%)`,
			opacity, display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 80px', gap: 64,
		}}>
			<TealGlow a={0.14} />
			<Vignette />
			<LogoBadge delay={22} />

			<div style={{transform: `translateY(${titleY}px)`, opacity: titleOpacity, zIndex: 10}}>
				<div style={{fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase', textAlign: 'center'}}>
					Die Gemeinschaft in Zahlen
				</div>
			</div>

			<div style={{display: 'flex', width: '100%', alignItems: 'center', zIndex: 10}}>
				<StatItem target={1200} suffix="+"  label="Aktive Nachbarn"  delay={36} />
				<div style={{width: 1, alignSelf: 'stretch', background: 'rgba(30,170,166,0.16)', margin: '0 40px', flexShrink: 0}} />
				<StatItem target={3400} suffix="+"  label="Hilfsangebote"    delay={60} />
				<div style={{width: 1, alignSelf: 'stretch', background: 'rgba(30,170,166,0.16)', margin: '0 40px', flexShrink: 0}} />
				<StatItem target={24}               label="Nachbarschaften"  delay={84} />
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════
// SCENE 6 — CTA  dur=140  (4.7 s)
// Logo + headline + button + domain — video ends clean (no exit fade)
// ══════════════════════════════════════════════════
export const CTAScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.cta.dur, true); // no exit fade — stays on screen

	// Logo springs in with glow
	const logoScale   = spring({fps, frame, from: 0.5, to: 1, config: {damping: 20, stiffness: 88, mass: 1.3}, delay: 10});
	const logoOpacity = interpolate(frame, [10, 34], [0, 1], {extrapolateRight: 'clamp'});
	const glowPulse   = interpolate(frame, [30, 90, 140], [0, 1, 0.6], {easing: Easing.inOut(Easing.sin)});

	// Headline lines
	const h1Y       = spring({fps, frame, from: 44, to: 0, config: {damping: 22, stiffness: 118}, delay: 30});
	const h1Opacity = interpolate(frame, [30, 52], [0, 1], {extrapolateRight: 'clamp'});
	const h2Y       = spring({fps, frame, from: 44, to: 0, config: {damping: 22, stiffness: 118}, delay: 44});
	const h2Opacity = interpolate(frame, [44, 66], [0, 1], {extrapolateRight: 'clamp'});

	const subOpacity = interpolate(frame, [68, 88], [0, 1], {extrapolateRight: 'clamp'});

	// CTA button bounces in
	const btnScale   = spring({fps, frame, from: 0.82, to: 1, config: {damping: 13, stiffness: 230, mass: 0.6}, delay: 92});
	const btnOpacity = interpolate(frame, [92, 112], [0, 1], {extrapolateRight: 'clamp'});

	const urlOpacity = interpolate(frame, [108, 128], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 46%, #0e2424 0%, ${C.bgDeep} 65%)`,
			opacity, display: 'flex', alignItems: 'center', justifyContent: 'center',
		}}>
			<div style={{
				position: 'absolute', inset: 0,
				background: `radial-gradient(ellipse at 50% 50%, rgba(30,170,166,${(0.06 + glowPulse * 0.12).toFixed(2)}) 0%, transparent 55%)`,
			}} />
			<Vignette />

			<div style={{
				zIndex: 10, textAlign: 'center', padding: '0 80px',
				display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
			}}>
				{/* Logo — large, glowing */}
				<div style={{transform: `scale(${logoScale})`, opacity: logoOpacity}}>
					<MensaenaImg size={132} glow={glowPulse} />
				</div>

				{/* Headline */}
				<div>
					<div style={{transform: `translateY(${h1Y}px)`, opacity: h1Opacity, fontFamily: FONT, fontSize: 76, fontWeight: 800, color: C.white, letterSpacing: '-0.042em', lineHeight: 1.06}}>
						Deine Nachbarschaft
					</div>
					<div style={{transform: `translateY(${h2Y}px)`, opacity: h2Opacity, fontFamily: FONT, fontSize: 76, fontWeight: 800, color: C.primary, letterSpacing: '-0.042em', lineHeight: 1.06}}>
						wartet auf dich.
					</div>
				</div>

				{/* Sub */}
				<div style={{opacity: subOpacity, fontFamily: FONT, fontSize: 20, color: 'rgba(255,255,255,0.36)', letterSpacing: '-0.01em'}}>
					Kostenlos · Werbefrei · Gemeinnützig
				</div>

				{/* CTA button with glow */}
				<div style={{
					transform: `scale(${btnScale})`, opacity: btnOpacity,
					background: C.primary, color: C.white,
					fontFamily: FONT, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em',
					padding: '20px 54px', borderRadius: 100,
					boxShadow: `0 0 50px rgba(30,170,166,${(glowPulse * 0.45).toFixed(2)})`,
				}}>
					Jetzt kostenlos starten →
				</div>

				{/* Domain */}
				<div style={{opacity: urlOpacity, fontFamily: FONT, fontSize: 26, color: C.primary, fontWeight: 600, letterSpacing: '0.01em'}}>
					mensaena.de
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════
// ROOT COMPOSITION — 900 frames / 30 fps / 30 s
// ══════════════════════════════════════════════════
export const MensaenaAd: React.FC = () => (
	<AbsoluteFill style={{background: C.bgDeep}}>
		<Sequence from={T.opener.from}   durationInFrames={T.opener.dur}>   <OpenerScene   /></Sequence>
		<Sequence from={T.hook.from}     durationInFrames={T.hook.dur}>     <HookScene     /></Sequence>
		<Sequence from={T.solution.from} durationInFrames={T.solution.dur}> <SolutionScene /></Sequence>
		<Sequence from={T.features.from} durationInFrames={T.features.dur}> <FeaturesScene /></Sequence>
		<Sequence from={T.stats.from}    durationInFrames={T.stats.dur}>    <StatsScene    /></Sequence>
		<Sequence from={T.cta.from}      durationInFrames={T.cta.dur}>      <CTAScene      /></Sequence>
	</AbsoluteFill>
);
