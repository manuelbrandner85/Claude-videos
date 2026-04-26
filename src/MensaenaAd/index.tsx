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

// ── Brand colours
const C = {
	primary:    '#1EAAA6',
	primaryMid: '#147170',
	bg:         '#060e0e',
	bgDeep:     '#020606',
	white:      '#FFFFFF',
} as const;

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ── Full timeline — 1950 frames = 65 s @ 30 fps
// 30-frame crossfade between every adjacent pair
const T = {
	opener:     {from: 0,    dur: 190},
	escalation: {from: 160,  dur: 200},
	wendepunkt: {from: 330,  dur: 195},
	szenarien:  {from: 495,  dur: 340},
	features:   {from: 805,  dur: 410},
	howItWorks: {from: 1185, dur: 330},
	stats:      {from: 1485, dur: 265},
	cta:        {from: 1720, dur: 230},
} as const;

// ── Shared helpers ──────────────────────────────────

function useFade(dur: number, noExit = false): number {
	const frame = useCurrentFrame();
	const enter = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp'});
	if (noExit) return enter;
	const exit = interpolate(frame, [dur - 22, dur], [1, 0], {
		extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
	});
	return Math.min(enter, exit);
}

const Vignette: React.FC = () => (
	<div style={{
		position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
		background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)',
	}} />
);

const TealGlow: React.FC<{x?: string; y?: string; a?: number}> = ({x = '50%', y = '46%', a = 0.18}) => (
	<div style={{
		position: 'absolute', inset: 0, pointerEvents: 'none',
		background: `radial-gradient(ellipse at ${x} ${y}, rgba(30,170,166,${a}) 0%, transparent 58%)`,
	}} />
);

const MensaenaImg: React.FC<{size: number; glow?: number}> = ({size, glow = 0}) => (
	<div style={{
		width: size, height: size, flexShrink: 0,
		filter: glow > 0
			? `drop-shadow(0 0 ${Math.round(glow * 72)}px rgba(30,170,166,${(glow * 0.88).toFixed(2)}))`
			: undefined,
	}}>
		<Img src={staticFile('mensaena-logo.png')}
			style={{width: size, height: size, objectFit: 'contain', display: 'block'}} />
	</div>
);

const LogoBadge: React.FC<{delay?: number}> = ({delay = 0}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [delay, delay + 22], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{
			position: 'absolute', top: 44, left: 56, zIndex: 20,
			display: 'flex', alignItems: 'center', gap: 14, opacity,
		}}>
			<MensaenaImg size={44} />
			<span style={{fontFamily: FONT, fontSize: 18, fontWeight: 700,
				color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em'}}>
				mensaena
			</span>
		</div>
	);
};

// Word-by-word spring reveal
const WordReveal: React.FC<{
	text: string; startFrame: number; stagger?: number; style?: React.CSSProperties;
}> = ({text, startFrame, stagger = 8, style = {}}) => {
	const frame  = useCurrentFrame();
	const {fps}  = useVideoConfig();
	const words  = text.split(' ');
	return (
		<span style={{display: 'inline', ...style}}>
			{words.map((word, i) => {
				const d  = startFrame + i * stagger;
				const y  = spring({fps, frame, from: 40, to: 0,
					config: {damping: 28, stiffness: 160}, delay: d});
				const op = interpolate(frame, [d, d + 14], [0, 1], {extrapolateRight: 'clamp'});
				return (
					<span key={i} style={{
						display: 'inline-block',
						transform: `translateY(${y}px)`,
						opacity: op,
						marginRight: i < words.length - 1 ? '0.27em' : 0,
					}}>
						{word}
					</span>
				);
			})}
		</span>
	);
};

// ══════════════════════════════════════════════════════════
// SCENE 1 — OPENER  dur=190  (0–6.3 s)
// Pure black. One sentence appears, word by word. Dramatic.
// ══════════════════════════════════════════════════════════
export const OpenerScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = useFade(T.opener.dur);

	// The sentence completes around frame 110, then we hold
	const metaOpacity = interpolate(frame, [10, 28], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bgDeep, opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			flexDirection: 'column', gap: 24, padding: '0 140px',
		}}>
			<Vignette />

			{/* Subtle chapter label */}
			<div style={{
				opacity: metaOpacity,
				fontFamily: FONT, fontSize: 13, fontWeight: 600,
				color: 'rgba(30,170,166,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase',
				marginBottom: 8,
			}}>
				01 / Die Realität
			</div>

			{/* Main sentence — slow, dramatic word-by-word reveal */}
			<div style={{
				fontFamily: FONT, fontSize: 82, fontWeight: 800,
				color: C.white, letterSpacing: '-0.04em', lineHeight: 1.08,
				textAlign: 'center', maxWidth: 1100,
			}}>
				<WordReveal
					text="Du kennst deinen Nachbarn nicht."
					startFrame={30}
					stagger={13}
				/>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════════════
// SCENE 2 — ESCALATION  dur=200  (5.3–12 s)
// Two more sentences build tension. Last one in teal.
// ══════════════════════════════════════════════════════════
export const EscalationScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = useFade(T.escalation.dur);

	return (
		<AbsoluteFill style={{background: C.bgDeep, opacity,
			display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
			flexDirection: 'column', justifyContent: 'center',
			padding: '0 140px', gap: 12,
		}}>
			<Vignette />

			{/* Dimmed — past context */}
			<div style={{
				fontFamily: FONT, fontSize: 64, fontWeight: 700,
				color: 'rgba(255,255,255,0.22)', letterSpacing: '-0.035em', lineHeight: 1.2,
				textAlign: 'center',
			}}>
				<WordReveal text="Dabei wohnt er seit Jahren neben dir." startFrame={22} stagger={7} />
			</div>

			{/* Teal — emotional peak */}
			<div style={{
				fontFamily: FONT, fontSize: 70, fontWeight: 800,
				color: C.primary, letterSpacing: '-0.038em', lineHeight: 1.2,
				textAlign: 'center',
			}}>
				<WordReveal text="Vielleicht braucht er gerade Hilfe." startFrame={90} stagger={8} />
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════════════
// SCENE 3 — WENDEPUNKT  (placeholder, filled in Phase 2)
// ══════════════════════════════════════════════════════════
export const WendepunktScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.wendepunkt.dur);
	const flash = interpolate(frame, [0, 5, 20], [0.92, 0.5, 0], {extrapolateRight: 'clamp'});
	const logoScale = spring({fps, frame, from: 0.5, to: 1, config: {damping: 20, stiffness: 85, mass: 1.4}, delay: 18});
	const logoOpacity = interpolate(frame, [18, 42], [0, 1], {extrapolateRight: 'clamp'});
	const glow = interpolate(frame, [30, 90], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const textY = spring({fps, frame, from: 40, to: 0, config: {damping: 24, stiffness: 120}, delay: 55});
	const textOpacity = interpolate(frame, [55, 78], [0, 1], {extrapolateRight: 'clamp'});
	const subOpacity = interpolate(frame, [80, 100], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 46%, #0e2424 0%, ${C.bgDeep} 66%)`,
			opacity, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 28,
		}}>
			<div style={{position: 'absolute', inset: 0, background: C.primary, opacity: flash, zIndex: 30}} />
			<TealGlow />
			<Vignette />
			<div style={{transform: `scale(${logoScale})`, opacity: logoOpacity, zIndex: 10}}>
				<MensaenaImg size={180} glow={glow} />
			</div>
			<div style={{transform: `translateY(${textY}px)`, opacity: textOpacity, zIndex: 10, textAlign: 'center'}}>
				<div style={{fontFamily: FONT, fontSize: 88, fontWeight: 800, color: C.white, letterSpacing: '-0.045em', lineHeight: 1}}>
					mensaena
				</div>
			</div>
			<div style={{opacity: subOpacity, zIndex: 10, textAlign: 'center'}}>
				<div style={{fontFamily: FONT, fontSize: 26, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em'}}>
					Das ändert sich jetzt.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════════════
// PLACEHOLDER SCENES (filled in subsequent phases)
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// SCENE 4 — SZENARIEN  dur=340  (16.5–28 s)
// 3 real-world scenario cards fly in with stagger
// ══════════════════════════════════════════════════════════
const UMZUG_ICON = (
	<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);
const EINKAUF_ICON = (
	<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
		<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
	</svg>
);
const KRISE_ICON = (
	<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
		<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
		<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
	</svg>
);

const scenarienData = [
	{
		num: '01', icon: UMZUG_ICON, tag: 'Alltag',
		title: 'Umzug',
		quote: '„Wer kann mir beim Tragen helfen?"',
		body: 'Nachbarn mit Zeit und Kraft finden dich in Sekunden — kostenlos, lokal, unkompliziert.',
	},
	{
		num: '02', icon: EINKAUF_ICON, tag: 'Gegenseitigkeit',
		title: 'Einkaufen',
		quote: '„Ich fahre — wer braucht noch etwas?"',
		body: 'Kleine Gesten, die zählen. Teile deine Fahrt und stärke deine Nachbarschaft.',
	},
	{
		num: '03', icon: KRISE_ICON, tag: 'Solidarität',
		title: 'Krise',
		quote: '„Hochwasser — wer hat Sandsäcke?"',
		body: 'Im Notfall aktiviert Mensaena den Krisenmodus für sofortige, koordinierte Hilfe.',
	},
];

const SzenarienCard: React.FC<{data: (typeof scenarienData)[number]; delay: number}> = ({data, delay}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const cardY       = spring({fps, frame, from: 120, to: 0, config: {damping: 24, stiffness: 100}, delay});
	const cardOpacity = interpolate(frame, [delay, delay + 35], [0, 1], {extrapolateRight: 'clamp'});
	const quoteOpacity = interpolate(frame, [delay + 30, delay + 55], [0, 1], {extrapolateRight: 'clamp'});
	const bodyOpacity  = interpolate(frame, [delay + 50, delay + 72], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<div style={{
			transform: `translateY(${cardY}px)`, opacity: cardOpacity,
			flex: 1, background: 'rgba(30,170,166,0.06)',
			border: '1px solid rgba(30,170,166,0.22)',
			borderRadius: 20, padding: '36px 32px',
			display: 'flex', flexDirection: 'column', gap: 16,
		}}>
			{/* Header row */}
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
				<div>
					<div style={{fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', marginBottom: 6}}>
						{data.num}
					</div>
					<div style={{fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.primary, letterSpacing: '0.12em', textTransform: 'uppercase'}}>
						{data.tag}
					</div>
				</div>
				<div style={{color: C.primary}}>{data.icon}</div>
			</div>

			{/* Title */}
			<div style={{fontFamily: FONT, fontSize: 36, fontWeight: 800, color: C.white, letterSpacing: '-0.028em', lineHeight: 1.1}}>
				{data.title}
			</div>

			{/* Quote */}
			<div style={{opacity: quoteOpacity, fontFamily: FONT, fontSize: 18, fontWeight: 500, color: C.primary, fontStyle: 'italic', lineHeight: 1.5}}>
				{data.quote}
			</div>

			{/* Body */}
			<div style={{opacity: bodyOpacity, fontFamily: FONT, fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7}}>
				{data.body}
			</div>
		</div>
	);
};

export const SzenarienScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.szenarien.dur);

	const labelY       = spring({fps, frame, from: 28, to: 0, config: {damping: 24, stiffness: 130}, delay: 22});
	const labelOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});
	const titleY       = spring({fps, frame, from: 28, to: 0, config: {damping: 24, stiffness: 130}, delay: 30});
	const titleOpacity = interpolate(frame, [30, 52], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 72px',
		}}>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 80%, rgba(30,170,166,0.07) 0%, transparent 50%)`}} />
			<Vignette />
			<LogoBadge delay={22} />

			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 40}}>
				{/* Labels */}
				<div style={{textAlign: 'center'}}>
					<div style={{transform: `translateY(${labelY}px)`, opacity: labelOpacity,
						fontFamily: FONT, fontSize: 13, fontWeight: 700,
						color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10}}>
						02 / Echte Situationen
					</div>
					<div style={{transform: `translateY(${titleY}px)`, opacity: titleOpacity,
						fontFamily: FONT, fontSize: 40, fontWeight: 800,
						color: C.white, letterSpacing: '-0.03em'}}>
						Jeder braucht manchmal Hilfe.
					</div>
				</div>

				{/* Cards */}
				<div style={{display: 'flex', gap: 22, width: '100%', zIndex: 10}}>
					{scenarienData.map((data, i) => (
						<SzenarienCard key={i} data={data} delay={50 + i * 45} />
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};
// ══════════════════════════════════════════════════════════
// SCENE 5 — FEATURES  dur=410  (26.8–40.5 s)
// 6 feature tiles in a 3×2 grid, staggered spring entry
// ══════════════════════════════════════════════════════════
const featuresData = [
	{
		num: '01',
		icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
		title: 'Hyperlokal',
		body: 'Deine Straße, dein Radius — finde Hilfe um die Ecke.',
	},
	{
		num: '02',
		icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
		title: 'Echtzeit-Chat',
		body: 'Direkt, privat, ohne Telefonnummer — sicher kommunizieren.',
	},
	{
		num: '03',
		icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>,
		title: 'Gemeinnützig',
		body: 'Kostenlos für immer — kein Profit, kein Abo, keine Werbung.',
	},
	{
		num: '04',
		icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
		title: 'Interaktive Karte',
		body: 'Sieh auf einen Blick, was in deiner Nachbarschaft passiert.',
	},
	{
		num: '05',
		icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
		title: 'Krisenmodus',
		body: 'SOS-Funktion bei Hochwasser, Sturm & lokalen Notlagen.',
	},
	{
		num: '06',
		icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
		title: 'DSGVO-konform',
		body: 'Deine Daten bleiben deine — Made & hosted in Germany.',
	},
];

const FeatureTile: React.FC<{data: (typeof featuresData)[number]; delay: number}> = ({data, delay}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const tileY       = spring({fps, frame, from: 80, to: 0, config: {damping: 26, stiffness: 115}, delay});
	const tileOpacity = interpolate(frame, [delay, delay + 28], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<div style={{
			transform: `translateY(${tileY}px)`, opacity: tileOpacity,
			background: 'rgba(255,255,255,0.04)',
			border: '1px solid rgba(30,170,166,0.18)',
			borderRadius: 16, padding: '28px 26px',
			display: 'flex', flexDirection: 'column', gap: 12,
		}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<span style={{fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.14em'}}>
					{data.num}
				</span>
				<div style={{color: C.primary}}>{data.icon}</div>
			</div>
			<div style={{fontFamily: FONT, fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: '-0.022em', lineHeight: 1.15}}>
				{data.title}
			</div>
			<div style={{fontFamily: FONT, fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65}}>
				{data.body}
			</div>
		</div>
	);
};

export const FeaturesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.features.dur);

	const labelY       = spring({fps, frame, from: 26, to: 0, config: {damping: 24, stiffness: 130}, delay: 22});
	const labelOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});
	const titleY       = spring({fps, frame, from: 26, to: 0, config: {damping: 24, stiffness: 130}, delay: 30});
	const titleOpacity = interpolate(frame, [30, 52], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: C.bg, opacity,
			display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 72px', gap: 36,
		}}>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 30%, rgba(30,170,166,0.07) 0%, transparent 42%), radial-gradient(ellipse at 80% 70%, rgba(20,113,112,0.06) 0%, transparent 42%)`}} />
			<Vignette />
			<LogoBadge delay={22} />

			{/* Header */}
			<div style={{textAlign: 'center', zIndex: 10}}>
				<div style={{transform: `translateY(${labelY}px)`, opacity: labelOpacity,
					fontFamily: FONT, fontSize: 13, fontWeight: 700,
					color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10}}>
					03 / Was Mensaena bietet
				</div>
				<div style={{transform: `translateY(${titleY}px)`, opacity: titleOpacity,
					fontFamily: FONT, fontSize: 40, fontWeight: 800,
					color: C.white, letterSpacing: '-0.03em'}}>
					Alles, was deine Nachbarschaft braucht.
				</div>
			</div>

			{/* 3×2 Grid */}
			<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, width: '100%', zIndex: 10}}>
				{featuresData.map((data, i) => (
					<FeatureTile key={i} data={data} delay={48 + i * 32} />
				))}
			</div>
		</AbsoluteFill>
	);
};
// ══════════════════════════════════════════════════════════
// SCENE 6 — HOW IT WORKS  dur=330  (39.5–50.5 s)
// 3 numbered steps with connecting animated line
// ══════════════════════════════════════════════════════════
const steps = [
	{n: '1', title: 'Registrieren', sub: '30 Sekunden, kostenlos, keine Kreditkarte.'},
	{n: '2', title: 'Standort wählen', sub: 'Hinterlege Adresse und Radius — du bleibst anonym.'},
	{n: '3', title: 'Loslegen', sub: 'Biete Hilfe an, finde sie — oder lerne einfach deine Nachbarn kennen.'},
];

const StepCircle: React.FC<{n: string; delay: number}> = ({n, delay}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const scale   = spring({fps, frame, from: 0.5, to: 1, config: {damping: 22, stiffness: 180, mass: 0.7}, delay});
	const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{
			width: 72, height: 72, borderRadius: '50%',
			border: `2px solid ${C.primary}`,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			transform: `scale(${scale})`, opacity,
			background: 'rgba(30,170,166,0.1)', flexShrink: 0,
		}}>
			<span style={{fontFamily: FONT, fontSize: 26, fontWeight: 800, color: C.primary}}>
				{n}
			</span>
		</div>
	);
};

export const HowItWorksScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.howItWorks.dur);

	const labelY       = spring({fps, frame, from: 26, to: 0, config: {damping: 24, stiffness: 130}, delay: 22});
	const labelOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});
	const titleY       = spring({fps, frame, from: 26, to: 0, config: {damping: 24, stiffness: 130}, delay: 30});
	const titleOpacity = interpolate(frame, [30, 52], [0, 1], {extrapolateRight: 'clamp'});

	// Connecting lines draw in between circles
	const line1W = interpolate(frame, [90, 140], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const line2W = interpolate(frame, [140, 190], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 50%, #0c1c1c 0%, ${C.bgDeep} 68%)`,
			opacity, display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 100px', gap: 52,
		}}>
			<TealGlow a={0.1} />
			<Vignette />
			<LogoBadge delay={22} />

			{/* Header */}
			<div style={{textAlign: 'center'}}>
				<div style={{transform: `translateY(${labelY}px)`, opacity: labelOpacity,
					fontFamily: FONT, fontSize: 13, fontWeight: 700,
					color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10}}>
					04 / So einfach geht's
				</div>
				<div style={{transform: `translateY(${titleY}px)`, opacity: titleOpacity,
					fontFamily: FONT, fontSize: 40, fontWeight: 800, color: C.white, letterSpacing: '-0.03em'}}>
					In drei Schritten zur aktiven Nachbarschaft.
				</div>
			</div>

			{/* Steps row */}
			<div style={{display: 'flex', alignItems: 'flex-start', width: '100%', zIndex: 10}}>
				{steps.map((step, i) => {
					const stepDelay   = 55 + i * 50;
					const textOpacity = interpolate(frame, [stepDelay + 15, stepDelay + 38], [0, 1], {extrapolateRight: 'clamp'});
					const textY       = spring({fps, frame, from: 20, to: 0, config: {damping: 24, stiffness: 130}, delay: stepDelay + 15});
					return (
						<React.Fragment key={i}>
							<div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center'}}>
								<StepCircle n={step.n} delay={stepDelay} />
								<div style={{transform: `translateY(${textY}px)`, opacity: textOpacity}}>
									<div style={{fontFamily: FONT, fontSize: 26, fontWeight: 700, color: C.white, letterSpacing: '-0.022em', marginBottom: 10}}>
										{step.title}
									</div>
									<div style={{fontFamily: FONT, fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, maxWidth: 280}}>
										{step.sub}
									</div>
								</div>
							</div>
							{/* Connecting line between steps */}
							{i < steps.length - 1 && (
								<div style={{display: 'flex', alignItems: 'center', paddingTop: 36, width: 80, flexShrink: 0}}>
									<div style={{
										height: 2, borderRadius: 1, background: C.primary, opacity: 0.4,
										width: `${(i === 0 ? line1W : line2W) * 100}%`, transition: 'none',
									}} />
								</div>
							)}
						</React.Fragment>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════════════
// SCENE 7 — STATS  dur=265  (49.5–58.3 s)
// Count-up numbers + one testimonial card
// ══════════════════════════════════════════════════════════
const StatItem: React.FC<{target: number; suffix?: string; label: string; delay: number}> = ({
	target, suffix = '', label, delay,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const itemY       = spring({fps, frame, from: 34, to: 0, config: {damping: 24, stiffness: 120}, delay});
	const itemOpacity = interpolate(frame, [delay, delay + 22], [0, 1], {extrapolateRight: 'clamp'});
	const progress    = interpolate(frame, [delay + 5, delay + 75], [0, 1], {
		extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
	});
	const count = Math.round(target * progress);
	return (
		<div style={{opacity: itemOpacity, transform: `translateY(${itemY}px)`, textAlign: 'center', flex: 1}}>
			<div style={{fontFamily: FONT, fontSize: 80, fontWeight: 800, color: C.primary, letterSpacing: '-0.046em', lineHeight: 1}}>
				{count.toLocaleString('de-DE')}{suffix}
			</div>
			<div style={{width: 40, height: 2, background: C.primary, opacity: 0.45, borderRadius: 1, margin: '10px auto 12px'}} />
			<div style={{fontFamily: FONT, fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.01em'}}>
				{label}
			</div>
		</div>
	);
};

export const StatsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.stats.dur);

	const labelY       = spring({fps, frame, from: 26, to: 0, config: {damping: 24, stiffness: 128}, delay: 22});
	const labelOpacity = interpolate(frame, [22, 44], [0, 1], {extrapolateRight: 'clamp'});

	// Testimonial card
	const cardDelay   = 130;
	const cardY       = spring({fps, frame, from: 50, to: 0, config: {damping: 24, stiffness: 100}, delay: cardDelay});
	const cardOpacity = interpolate(frame, [cardDelay, cardDelay + 30], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 42%, #0c1e1e 0%, ${C.bgDeep} 66%)`,
			opacity, display: 'flex', flexDirection: 'column',
			alignItems: 'center', justifyContent: 'center', padding: '0 80px', gap: 48,
		}}>
			<TealGlow a={0.12} />
			<Vignette />
			<LogoBadge delay={22} />

			{/* Section label */}
			<div style={{transform: `translateY(${labelY}px)`, opacity: labelOpacity, textAlign: 'center'}}>
				<div style={{fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.22em', textTransform: 'uppercase'}}>
					05 / Die Gemeinschaft wächst
				</div>
			</div>

			{/* Stats row */}
			<div style={{display: 'flex', width: '100%', alignItems: 'center', zIndex: 10}}>
				<StatItem target={1200} suffix="+"  label="Aktive Nachbarn"   delay={36} />
				<div style={{width: 1, alignSelf: 'stretch', background: 'rgba(30,170,166,0.16)', margin: '0 36px', flexShrink: 0}} />
				<StatItem target={3400} suffix="+"  label="Hilfsangebote"     delay={60} />
				<div style={{width: 1, alignSelf: 'stretch', background: 'rgba(30,170,166,0.16)', margin: '0 36px', flexShrink: 0}} />
				<StatItem target={24}               label="Nachbarschaften"   delay={84} />
			</div>

			{/* Testimonial */}
			<div style={{
				transform: `translateY(${cardY}px)`, opacity: cardOpacity,
				background: 'rgba(30,170,166,0.07)', border: '1px solid rgba(30,170,166,0.22)',
				borderRadius: 16, padding: '28px 32px',
				display: 'flex', alignItems: 'flex-start', gap: 20, width: '100%', zIndex: 10,
			}}>
				{/* Avatar */}
				<div style={{
					width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
					background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
				}}>
					<span style={{fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.white}}>M</span>
				</div>
				<div>
					<div style={{fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.primary, letterSpacing: '0.06em', marginBottom: 8}}>
						Maria K. · München
					</div>
					<div style={{fontFamily: FONT, fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontStyle: 'italic'}}>
						„Mensaena hat mir beim Umzug so geholfen — Nachbarn, die ich nie getroffen hätte, packten einfach mit an."
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
// ══════════════════════════════════════════════════════════
// SCENE 8 — CTA  dur=230  (57.3–65 s)
// Logo + headline + urgency + button + domain — ends clean
// ══════════════════════════════════════════════════════════
export const CTAScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFade(T.cta.dur, true); // no exit — holds on screen

	const logoScale   = spring({fps, frame, from: 0.45, to: 1, config: {damping: 20, stiffness: 82, mass: 1.5}, delay: 10});
	const logoOpacity = interpolate(frame, [10, 36], [0, 1], {extrapolateRight: 'clamp'});
	const glow        = interpolate(frame, [30, 110], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

	const h1Y       = spring({fps, frame, from: 48, to: 0, config: {damping: 22, stiffness: 118}, delay: 32});
	const h1Opacity = interpolate(frame, [32, 55], [0, 1], {extrapolateRight: 'clamp'});
	const h2Y       = spring({fps, frame, from: 48, to: 0, config: {damping: 22, stiffness: 118}, delay: 46});
	const h2Opacity = interpolate(frame, [46, 68], [0, 1], {extrapolateRight: 'clamp'});

	const urgencyOpacity = interpolate(frame, [70, 90], [0, 1], {extrapolateRight: 'clamp'});
	const subOpacity     = interpolate(frame, [80, 100], [0, 1], {extrapolateRight: 'clamp'});

	const btnScale   = spring({fps, frame, from: 0.78, to: 1, config: {damping: 12, stiffness: 240, mass: 0.55}, delay: 108});
	const btnOpacity = interpolate(frame, [108, 128], [0, 1], {extrapolateRight: 'clamp'});
	const urlOpacity = interpolate(frame, [135, 155], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{
			background: `radial-gradient(ellipse at 50% 44%, #0e2424 0%, ${C.bgDeep} 64%)`,
			opacity, display: 'flex', alignItems: 'center', justifyContent: 'center',
		}}>
			{/* Pulsing teal backdrop */}
			<div style={{
				position: 'absolute', inset: 0,
				background: `radial-gradient(ellipse at 50% 50%, rgba(30,170,166,${(glow * 0.18).toFixed(2)}) 0%, transparent 55%)`,
			}} />
			<Vignette />

			<div style={{
				zIndex: 10, textAlign: 'center', padding: '0 80px',
				display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
			}}>
				{/* Logo — large, glowing */}
				<div style={{transform: `scale(${logoScale})`, opacity: logoOpacity,
					filter: `drop-shadow(0 0 ${Math.round(glow * 75)}px rgba(30,170,166,${(glow * 0.9).toFixed(2)}))`}}>
					<MensaenaImg size={140} />
				</div>

				{/* Headline */}
				<div>
					<div style={{transform: `translateY(${h1Y}px)`, opacity: h1Opacity,
						fontFamily: FONT, fontSize: 78, fontWeight: 800,
						color: C.white, letterSpacing: '-0.043em', lineHeight: 1.06}}>
						Deine Nachbarschaft
					</div>
					<div style={{transform: `translateY(${h2Y}px)`, opacity: h2Opacity,
						fontFamily: FONT, fontSize: 78, fontWeight: 800,
						color: C.primary, letterSpacing: '-0.043em', lineHeight: 1.06}}>
						wartet auf dich.
					</div>
				</div>

				{/* Urgency line */}
				<div style={{opacity: urgencyOpacity, fontFamily: FONT, fontSize: 22, fontWeight: 600,
					color: 'rgba(255,255,255,0.62)', letterSpacing: '-0.015em'}}>
					Deine Nachbarn sind schon dabei — bist du dabei?
				</div>

				{/* Pillars */}
				<div style={{opacity: subOpacity, fontFamily: FONT, fontSize: 16,
					color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em'}}>
					KOSTENLOS · WERBEFREI · GEMEINNÜTZIG · DSGVO-KONFORM
				</div>

				{/* CTA Button */}
				<div style={{
					transform: `scale(${btnScale})`, opacity: btnOpacity,
					background: C.primary, color: C.white,
					fontFamily: FONT, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em',
					padding: '22px 60px', borderRadius: 100,
					boxShadow: `0 0 60px rgba(30,170,166,${(glow * 0.5).toFixed(2)})`,
				}}>
					Jetzt kostenlos registrieren →
				</div>

				{/* Domain */}
				<div style={{opacity: urlOpacity, fontFamily: FONT, fontSize: 24,
					color: C.primary, fontWeight: 600, letterSpacing: '0.01em'}}>
					mensaena.de
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ══════════════════════════════════════════════════════════
// ROOT — 1950 frames / 30 fps / 65 s
// ══════════════════════════════════════════════════════════
export const MensaenaAd: React.FC = () => (
	<AbsoluteFill style={{background: C.bgDeep}}>
		<Sequence from={T.opener.from}     durationInFrames={T.opener.dur}>     <OpenerScene     /></Sequence>
		<Sequence from={T.escalation.from} durationInFrames={T.escalation.dur}> <EscalationScene /></Sequence>
		<Sequence from={T.wendepunkt.from} durationInFrames={T.wendepunkt.dur}> <WendepunktScene /></Sequence>
		<Sequence from={T.szenarien.from}  durationInFrames={T.szenarien.dur}>  <SzenarienScene  /></Sequence>
		<Sequence from={T.features.from}   durationInFrames={T.features.dur}>   <FeaturesScene   /></Sequence>
		<Sequence from={T.howItWorks.from} durationInFrames={T.howItWorks.dur}> <HowItWorksScene /></Sequence>
		<Sequence from={T.stats.from}      durationInFrames={T.stats.dur}>      <StatsScene      /></Sequence>
		<Sequence from={T.cta.from}        durationInFrames={T.cta.dur}>        <CTAScene        /></Sequence>
	</AbsoluteFill>
);
