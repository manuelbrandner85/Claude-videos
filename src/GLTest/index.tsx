import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';

const Spinner: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<mesh rotation={[frame * 0.05, frame * 0.05, 0]}>
			<torusKnotGeometry args={[1, 0.3, 128, 32]} />
			<meshStandardMaterial color="#00D4AA" emissive="#008866" emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
		</mesh>
	);
};

export const GLTest: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#050510'}}>
			<ThreeCanvas width={640} height={640} camera={{position: [0, 0, 5], fov: 50}}>
				<ambientLight intensity={0.4} />
				<pointLight position={[5, 5, 5]} intensity={80} color="#40E8C0" />
				<pointLight position={[-5, -3, 2]} intensity={40} color="#00D4AA" />
				<Spinner />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
