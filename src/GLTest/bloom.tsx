import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {EffectComposer, Bloom} from '@react-three/postprocessing';
import * as THREE from 'three';

const Core: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<group rotation={[0, frame * 0.03, 0]}>
			<mesh>
				<sphereGeometry args={[1, 32, 32]} />
				<meshBasicMaterial color="#ffffff" toneMapped={false} />
			</mesh>
			<mesh rotation={[Math.PI / 2.5, 0, 0]}>
				<torusGeometry args={[2.4, 0.12, 16, 120]} />
				<meshBasicMaterial color="#00D4AA" toneMapped={false} />
			</mesh>
		</group>
	);
};

export const BloomTest: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#050510'}}>
			<ThreeCanvas width={640} height={640} camera={{position: [0, 0, 7], fov: 50}}>
				<ambientLight intensity={0.3} />
				<Core />
				<EffectComposer>
					<Bloom intensity={2.2} luminanceThreshold={0.2} luminanceSmoothing={0.6} mipmapBlur radius={0.8} />
				</EffectComposer>
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
