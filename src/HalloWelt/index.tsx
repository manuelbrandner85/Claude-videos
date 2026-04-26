import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const HalloWelt: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const translateY = spring({
		fps,
		frame,
		from: 120,
		to: 0,
		config: {
			damping: 18,
			stiffness: 120,
			mass: 1,
		},
	});

	const opacity = spring({
		fps,
		frame,
		from: 0,
		to: 1,
		config: {
			damping: 30,
			stiffness: 200,
			mass: 0.5,
		},
	});

	const scale = spring({
		fps,
		frame,
		from: 0.85,
		to: 1,
		config: {
			damping: 18,
			stiffness: 120,
			mass: 1,
		},
	});

	return (
		<div className="flex items-center justify-center w-full h-full bg-slate-900">
			<div
				style={{
					transform: `translateY(${translateY}px) scale(${scale})`,
					opacity,
				}}
			>
				<h1
					style={{
						color: '#ffffff',
						fontSize: 120,
						fontFamily:
							'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
						fontWeight: 700,
						letterSpacing: '-0.03em',
						margin: 0,
						lineHeight: 1,
						textShadow: '0 4px 32px rgba(255,255,255,0.08)',
					}}
				>
					Hallo Welt
				</h1>
				<div
					style={{
						height: 4,
						background:
							'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
						borderRadius: 2,
						marginTop: 16,
						opacity: opacity,
					}}
				/>
			</div>
		</div>
	);
};
