import React from 'react';
import {Composition} from 'remotion';
import {HalloWelt} from './HalloWelt';
import {MensaenaAd} from './MensaenaAd';

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
				durationInFrames={1950}
				fps={30}
				width={1920}
				height={1080}
			/>
		</>
	);
};
