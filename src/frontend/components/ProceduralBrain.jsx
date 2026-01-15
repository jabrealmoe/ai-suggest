import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Custom shader-like material for glowing points
const DotMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
});

function BrainParticles({ count = 1500 }) {
    const mesh = useRef();

    // Generate brain-like particle layout
    const particles = useMemo(() => {
        const temp = [];
        const colors = [];
        const color1 = new THREE.Color('#4F46E5'); // Indigo
        const color2 = new THREE.Color('#A855F7'); // Purple
        const color3 = new THREE.Color('#38BDF8'); // Light Blue

        for (let i = 0; i < count; i++) {
            // Create two hemispheres
            const isRight = Math.random() > 0.5;
            const xOffset = isRight ? 0.3 : -0.3;

            // Ellipsoid params to shape a brain hemisphere
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI;

            const theta = u;
            const phi = v;

            // Brain shape formulas (approximate ovoids)
            const r = 2 + Math.random() * 0.2; // Radius with some jitter

            // Distribute points in volume of ellipsoid, not just surface
            const volumeScale = Math.cbrt(Math.random());

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = (r * 0.8) * Math.sin(phi) * Math.sin(theta); // Flattened y
            let z = (r * 1.2) * Math.cos(phi); // Elongated z

            // Pinch the hemispheres together
            x *= volumeScale;
            y *= volumeScale;
            z *= volumeScale;

            // Add gap between hemispheres and shift
            x += xOffset;

            temp.push(x, y, z);

            // Mix colors based on position
            const mixedColor = color1.clone().lerp(color2, Math.random()).lerp(color3, (y + 2) / 4);
            colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
        }

        return {
            positions: new Float32Array(temp),
            colors: new Float32Array(colors)
        };
    }, [count]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (mesh.current) {
            // Gentle floating rotation
            // mesh.current.rotation.y = time * 0.2;

            // Pulse effect (scale breathing)
            const scale = 1 + Math.sin(time * 2) * 0.05;
            mesh.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 3}
                    array={particles.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <primitive object={DotMaterial} attach="material" />
        </points>
    );
}

const ProceduralBrain = () => {
    return (
        <div style={{ width: '100%', height: '240px' }}>
            <Canvas camera={{ position: [0, 0, 7], fov: 60 }} dpr={[1, 2]}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <BrainParticles />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={2.0}
                />
            </Canvas>
        </div>
    );
};

export default ProceduralBrain;
