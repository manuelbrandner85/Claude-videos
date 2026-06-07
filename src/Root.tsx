import React from 'react';
import {Composition} from 'remotion';
import {HalloWelt} from './HalloWelt';
import {MensaenaAd} from './MensaenaAd';
import {WorldTransition} from './WorldTransition';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="HalloWelt"
				component={HalloWelt}
				durationInFrames={150}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="MensaenaAd"
				component={MensaenaAd}
				durationInFrames={2100}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="WorldTransition"
				component={WorldTransition}
				durationInFrames={192}
				fps={24}
				width={720}
				height={1280}
				defaultProps={{from: 'materie' as const, to: 'ursprung' as const}}
			/>
		</>
	);
};
