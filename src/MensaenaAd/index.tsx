import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	spring,
	interpolate,
	Easing,
} from 'remotion';

// ── Brand colours (mensaena.de Tailwind config)
const C = {
	primary: '#1EAAA6',
	primaryMid: '#147170',
	bg: '#0a1420',
	white: '#FFFFFF',
} as const;

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ── Timeline (30 s = 900 frames @ 30 fps)
// Each pair overlaps by 30 frames for crossfade.
//  Intro:    0  – 150   (duration 150)
//  Problem: 120 – 280   (duration 160)
//  Solution:250 – 380   (duration 130)
//  Features:350 – 610   (duration 260)
//  Stats:   580 – 710   (duration 130)
//  CTA:     680 – 900   (duration 220)
const SCENES = {
	intro:    {from: 0,   dur: 150},
	problem:  {from: 120, dur: 160},
	solution: {from: 250, dur: 130},
	features: {from: 350, dur: 260},
	stats:    {from: 580, dur: 130},
	cta:      {from: 680, dur: 220},
} as const;

// ── Mensaena leaf logo (reconstructed from public/favicon.svg, brand teal)
const Logo: React.FC<{size?: number}> = ({size = 80}) => (
	<svg width={size} height={size} viewBox="0 0 32 32" fill="none">
		<rect width="32" height="32" rx="8" fill={C.primary} />
		<path
			d="M16 6C16 6 10 10 10 18C10 22.4 12.8 26 16 26C19.2 26 22 22.4 22 18C22 10 16 6 16 6Z"
			fill="white"
		/>
		<path d="M8 24C8 24 10 20 14 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);

// ── Teal glow backdrop (reused across scenes)
const TealGlow: React.FC<{x?: string; y?: string; strength?: number}> = ({
	x = '50%', y = '45%', strength = 0.22,
}) => (
	<div
		style={{
			position: 'absolute', inset: 0, pointerEvents: 'none',
			background: `radial-gradient(ellipse at ${x} ${y}, rgba(30,170,166,${strength}) 0%, transparent 60%)`,
		}}
	/>
);

// ── Scene crossfade wrapper — fades in over first 20 frames, out over last 20
function useFade(totalDuration: number): number {
	const frame = useCurrentFrame();
	const enter = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
	const exit  = interpolate(frame, [totalDuration - 20, totalDuration], [1, 0], {
		extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
	});
	return Math.min(enter, exit);
}

// ════════════════════════════════════════════
// SCENE 1 — INTRO  (dur=150, 5 s)
// ════════════════════════════════════════════
export const IntroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(SCENES.intro.dur);

	const logoScale   = spring({fps, frame, config: {damping: 18, stiffness: 90, mass: 1.2}, delay: 10});
	const logoOpacity = interpolate(frame, [10, 32], [0, 1], {extrapolateRight: 'clamp'});

	const nameY       = spring({fps, frame, from: 55, to: 0, config: {damping: 22, stiffness: 120}, delay: 30});
	const nameOpacity = interpolate(frame, [30, 55], [0, 1], {extrapolateRight: 'clamp'});

	const tagOpacity  = interpolate(frame, [62, 84], [0, 1], {extrapolateRight: 'clamp'});
	const lineW       = interpolate(frame, [68, 105], [0, 340], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			flexDirection: 'column', gap: 28,
		}}>
			<TealGlow />
			<div style={{transform: `scale(${logoScale})`, opacity: logoOpacity}}>
				<Logo size={120} />
			</div>
			<div style={{
				transform: `translateY(${nameY}px)`, opacity: nameOpacity,
				fontFamily: FONT, fontSize: 80, fontWeight: 800,
				color: C.white, letterSpacing: '-0.04em', lineHeight: 1,
			}}>
				mensaena
			</div>
			<div style={{opacity: tagOpacity, textAlign: 'center'}}>
				<div style={{
					width: lineW, height: 2, background: C.primary,
					margin: '0 auto 18px', borderRadius: 1,
				}} />
				<div style={{
					fontFamily: FONT, fontSize: 18, fontWeight: 500,
					color: C.primary, letterSpacing: '0.18em', textTransform: 'uppercase',
				}}>
					Die Gemeinwohl-Plattform
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ════════════════════════════════════════════
// SCENE 2 — PROBLEM  (dur=160, 5.3 s)
// ════════════════════════════════════════════
const questions = [
	{text: 'Wer hilft mir beim Umzug?',   dim: true},
	{text: 'Wer braucht Unterstützung?',   dim: true},
	{text: 'Wer kennt meine Nachbarn?',    dim: false},
];

export const ProblemScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = useFade(SCENES.problem.dur);

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			flexDirection: 'column', padding: '0 120px',
		}}>
			{/* Subtle grid */}
			<div style={{
				position: 'absolute', inset: 0,
				backgroundImage: `linear-gradient(rgba(30,170,166,0.04) 1px, transparent 1px),
				                  linear-gradient(90deg, rgba(30,170,166,0.04) 1px, transparent 1px)`,
				backgroundSize: '80px 80px',
			}} />
			<div style={{zIndex: 1}}>
				{questions.map(({text, dim}, i) => {
					// Stagger entry: first question starts after scene fade-in (frame ≥ 22)
					const delay = 22 + i * 36;
					const qOpacity = interpolate(frame, [delay, delay + 28], [0, 1], {extrapolateRight: 'clamp'});
					const qX = interpolate(frame, [delay, delay + 28], [-80, 0], {
						extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
					});
					return (
						<div key={i} style={{
							opacity: qOpacity, transform: `translateX(${qX}px)`,
							fontFamily: FONT, fontSize: 58, fontWeight: 700,
							letterSpacing: '-0.03em', lineHeight: 1.28,
							color: dim ? 'rgba(255,255,255,0.28)' : C.primary,
							marginBottom: i < questions.length - 1 ? 4 : 0,
						}}>
							{text}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// ════════════════════════════════════════════
// SCENE 3 — SOLUTION  (dur=130, 4.3 s)
// ════════════════════════════════════════════
export const SolutionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(SCENES.solution.dur);

	// Teal flash on cut
	const flash = interpolate(frame, [0, 5, 18], [1, 0.7, 0], {extrapolateRight: 'clamp'});

	const line1Y       = spring({fps, frame, from: 65, to: 0, config: {damping: 20, stiffness: 110}, delay: 14});
	const line2Y       = spring({fps, frame, from: 65, to: 0, config: {damping: 20, stiffness: 110}, delay: 28});
	const linesOpacity = interpolate(frame, [14, 38], [0, 1], {extrapolateRight: 'clamp'});

	const subOpacity = interpolate(frame, [55, 78], [0, 1], {extrapolateRight: 'clamp'});
	const lineW      = interpolate(frame, [52, 95], [0, 500], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
		}}>
			<div style={{position: 'absolute', inset: 0, background: C.primary, opacity: flash, zIndex: 10}} />
			<TealGlow />
			<div style={{zIndex: 1, textAlign: 'center', padding: '0 80px'}}>
				<div style={{
					transform: `translateY(${line1Y}px)`, opacity: linesOpacity,
					fontFamily: FONT, fontSize: 96, fontWeight: 800,
					color: C.white, letterSpacing: '-0.04em', lineHeight: 1,
				}}>
					Nachbarschaft,
				</div>
				<div style={{
					transform: `translateY(${line2Y}px)`, opacity: linesOpacity,
					fontFamily: FONT, fontSize: 96, fontWeight: 800,
					color: C.primary, letterSpacing: '-0.04em', lineHeight: 1.06, marginTop: 4,
				}}>
					neu gedacht.
				</div>
				<div style={{opacity: subOpacity, marginTop: 36}}>
					<div style={{
						width: lineW, height: 3, margin: '0 auto 22px', borderRadius: 2,
						background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid})`,
					}} />
					<div style={{
						fontFamily: FONT, fontSize: 22,
						color: 'rgba(255,255,255,0.52)', fontWeight: 400, letterSpacing: '-0.01em',
					}}>
						Hilfe anbieten. Hilfe finden. Menschen kennenlernen.
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ════════════════════════════════════════════
// SCENE 4 — FEATURES  (dur=260, 8.7 s)
// ════════════════════════════════════════════
const featureData = [
	{
		num: '01',
		icon: (
			<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
				<circle cx="12" cy="9" r="2.5" />
			</svg>
		),
		title: 'Hyperlokal',
		body: 'Finde Hilfe direkt in deiner Straße — mit interaktiver Karte und Geo-Filter.',
	},
	{
		num: '02',
		icon: (
			<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
			</svg>
		),
		title: 'Gemeinnützig',
		body: 'Kostenlos, werbefrei, DSGVO-konform. Kein Profit — nur Gemeinschaft.',
	},
	{
		num: '03',
		icon: (
			<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			</svg>
		),
		title: 'Krisenhilfe',
		body: 'Schnelle Nachbarschaftshilfe bei Hochwasser, Stromausfall & Notlagen.',
	},
];

const FeatureCard: React.FC<{data: (typeof featureData)[number]; delay: number}> = ({data, delay}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const cardY       = spring({fps, frame, from: 85, to: 0, config: {damping: 22, stiffness: 115}, delay});
	const cardOpacity = interpolate(frame, [delay, delay + 30], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<div style={{
			transform: `translateY(${cardY}px)`, opacity: cardOpacity,
			background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(30,170,166,0.22)',
			borderRadius: 20, padding: '40px 34px', flex: 1,
			display: 'flex', flexDirection: 'column', gap: 14,
		}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<span style={{
					fontFamily: FONT, fontSize: 12, fontWeight: 600,
					color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em',
				}}>
					{data.num}
				</span>
				{data.icon}
			</div>
			<div style={{
				fontFamily: FONT, fontSize: 28, fontWeight: 700,
				color: C.white, letterSpacing: '-0.025em', lineHeight: 1.15,
			}}>
				{data.title}
			</div>
			<div style={{
				fontFamily: FONT, fontSize: 17, lineHeight: 1.65,
				color: 'rgba(255,255,255,0.48)',
			}}>
				{data.body}
			</div>
		</div>
	);
};

export const FeaturesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(SCENES.features.dur);

	const labelY       = spring({fps, frame, from: 28, to: 0, config: {damping: 22, stiffness: 130}, delay: 22});
	const labelOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 80px',
		}}>
			<TealGlow x="28%" y="60%" strength={0.12} />
			<TealGlow x="72%" y="40%" strength={0.1} />
			<div style={{
				transform: `translateY(${labelY}px)`, opacity: labelOpacity,
				fontFamily: FONT, fontSize: 14, fontWeight: 600,
				color: C.primary, letterSpacing: '0.18em', textTransform: 'uppercase',
				marginBottom: 48,
			}}>
				Was Mensaena auszeichnet
			</div>
			<div style={{display: 'flex', gap: 22, width: '100%', zIndex: 1}}>
				{featureData.map((data, i) => (
					<FeatureCard key={i} data={data} delay={34 + i * 38} />
				))}
			</div>
		</AbsoluteFill>
	);
};

// ════════════════════════════════════════════
// SCENE 5 — STATS  (dur=130, 4.3 s)
// ════════════════════════════════════════════
const StatItem: React.FC<{target: number; label: string; suffix?: string; delay: number}> = ({
	target, label, suffix = '', delay,
}) => {
	const frame = useCurrentFrame();
	const itemOpacity = interpolate(frame, [delay, delay + 22], [0, 1], {extrapolateRight: 'clamp'});
	const progress    = interpolate(frame, [delay, delay + 65], [0, 1], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const count = Math.round(target * progress);

	return (
		<div style={{opacity: itemOpacity, textAlign: 'center', flex: 1}}>
			<div style={{
				fontFamily: FONT, fontSize: 78, fontWeight: 800,
				color: C.primary, letterSpacing: '-0.04em', lineHeight: 1,
			}}>
				{count.toLocaleString('de-DE')}{suffix}
			</div>
			<div style={{
				fontFamily: FONT, fontSize: 18, fontWeight: 500,
				color: 'rgba(255,255,255,0.45)', marginTop: 10, letterSpacing: '-0.01em',
			}}>
				{label}
			</div>
		</div>
	);
};

export const StatsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(SCENES.stats.dur);

	const titleY       = spring({fps, frame, from: 36, to: 0, config: {damping: 22, stiffness: 120}, delay: 22});
	const titleOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center',
			padding: '0 80px', gap: 60,
		}}>
			<TealGlow />
			<div style={{
				transform: `translateY(${titleY}px)`, opacity: titleOpacity,
				fontFamily: FONT, fontSize: 14, fontWeight: 600,
				color: C.primary, letterSpacing: '0.18em', textTransform: 'uppercase',
			}}>
				Die Gemeinschaft in Zahlen
			</div>
			<div style={{display: 'flex', width: '100%', alignItems: 'center'}}>
				<StatItem target={1200}  label="Aktive Nachbarn"  delay={32} />
				<div style={{width: 1, alignSelf: 'stretch', background: 'rgba(30,170,166,0.18)', margin: '0 40px'}} />
				<StatItem target={3400}  label="Hilfsangebote"    delay={56} />
				<div style={{width: 1, alignSelf: 'stretch', background: 'rgba(30,170,166,0.18)', margin: '0 40px'}} />
				<StatItem target={24}    label="Nachbarschaften"  delay={80} />
			</div>
		</AbsoluteFill>
	);
};

// ════════════════════════════════════════════
// SCENE 6 — CTA  (dur=220, 7.3 s — ends the video)
// ════════════════════════════════════════════
export const CTAScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(SCENES.cta.dur);

	const logoScale   = spring({fps, frame, config: {damping: 18, stiffness: 95, mass: 1}, delay: 10});
	const logoOpacity = interpolate(frame, [10, 30], [0, 1], {extrapolateRight: 'clamp'});

	const headY       = spring({fps, frame, from: 55, to: 0, config: {damping: 20, stiffness: 108}, delay: 24});
	const headOpacity = interpolate(frame, [24, 50], [0, 1], {extrapolateRight: 'clamp'});

	const subOpacity  = interpolate(frame, [58, 78], [0, 1], {extrapolateRight: 'clamp'});

	const btnScale    = spring({fps, frame, config: {damping: 14, stiffness: 210, mass: 0.7}, delay: 88});
	const btnOpacity  = interpolate(frame, [88, 108], [0, 1], {extrapolateRight: 'clamp'});

	const urlOpacity  = interpolate(frame, [118, 140], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: `linear-gradient(150deg, ${C.bg} 0%, #0d2020 100%)`,
			opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
		}}>
			<TealGlow />
			<div style={{
				zIndex: 1, textAlign: 'center', padding: '0 80px',
				display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30,
			}}>
				<div style={{transform: `scale(${logoScale})`, opacity: logoOpacity}}>
					<Logo size={90} />
				</div>
				<div style={{
					transform: `translateY(${headY}px)`, opacity: headOpacity,
					fontFamily: FONT, fontSize: 72, fontWeight: 800,
					color: C.white, letterSpacing: '-0.04em', lineHeight: 1.08,
				}}>
					Deine Nachbarschaft<br />wartet auf dich.
				</div>
				<div style={{
					opacity: subOpacity, fontFamily: FONT, fontSize: 20,
					color: 'rgba(255,255,255,0.42)', letterSpacing: '-0.01em',
				}}>
					Kostenlos · Werbefrei · Gemeinnützig
				</div>
				<div style={{
					transform: `scale(${btnScale})`, opacity: btnOpacity,
					background: C.primary, color: C.white, fontFamily: FONT,
					fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em',
					padding: '20px 52px', borderRadius: 100,
				}}>
					Jetzt kostenlos starten →
				</div>
				<div style={{
					opacity: urlOpacity, fontFamily: FONT, fontSize: 26,
					color: C.primary, fontWeight: 600, letterSpacing: '0.01em',
				}}>
					mensaena.de
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ════════════════════════════════════════════
// ROOT COMPOSITION — 30 s / 900 frames / 30 fps
// ════════════════════════════════════════════
export const MensaenaAd: React.FC = () => (
	<AbsoluteFill style={{background: C.bg}}>
		<Sequence from={SCENES.intro.from}    durationInFrames={SCENES.intro.dur}>    <IntroScene    /></Sequence>
		<Sequence from={SCENES.problem.from}  durationInFrames={SCENES.problem.dur}>  <ProblemScene  /></Sequence>
		<Sequence from={SCENES.solution.from} durationInFrames={SCENES.solution.dur}> <SolutionScene /></Sequence>
		<Sequence from={SCENES.features.from} durationInFrames={SCENES.features.dur}> <FeaturesScene /></Sequence>
		<Sequence from={SCENES.stats.from}    durationInFrames={SCENES.stats.dur}>    <StatsScene    /></Sequence>
		<Sequence from={SCENES.cta.from}      durationInFrames={SCENES.cta.dur}>      <CTAScene      /></Sequence>
	</AbsoluteFill>
);
