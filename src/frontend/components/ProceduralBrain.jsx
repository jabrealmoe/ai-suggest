import React, { useMemo, useRef, useState } from 'react';
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

<<<<<<< HEAD
function BrainParticles({ count = 2500 }) {
=======
function BrainParticles({ count = 3000 }) {
>>>>>>> dev
    const mesh = useRef();
    const [hovered, setHover] = useState(false);
    const shockwave = useRef(0);

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

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        if (mesh.current) {
<<<<<<< HEAD
            // 1. Rotation Interaction (Mouse Follow - Aggressive)
            // state.mouse.x is -1 to 1
            mesh.current.rotation.y += delta * 0.5 + (state.mouse.x * delta * 2.0);
            mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, state.mouse.y * 0.5, 0.1);
=======
            // 1. Rotation Interaction (Mouse Follow)
            mesh.current.rotation.y += delta * 0.2 + (state.mouse.x * delta * 0.5);
            mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, state.mouse.y * 0.2, 0.1);
>>>>>>> dev

            // 2. Shockwave Decay
            shockwave.current = THREE.MathUtils.lerp(shockwave.current, 0, 0.05);

<<<<<<< HEAD
            // 3. Pulse + Hover + Shockwave Scale (Dynamic)
            // Faster heart-beat pulse
            const baseScale = 1 + Math.sin(time * 6) * 0.15;
            // High freq jitter
            const jitter = Math.sin(time * 20) * 0.01;
=======
            // 3. Pulse + Hover + Shockwave Scale
            const baseScale = 1 + Math.sin(time * 2.5) * 0.05;
            const hoverScale = hovered ? 0.1 : 0;
            const impulseScale = shockwave.current * 0.4;
>>>>>>> dev

            const hoverScale = hovered ? 0.15 : 0;
            const impulseScale = shockwave.current * 0.8; // Huge burst

            const finalScale = baseScale + jitter + hoverScale + impulseScale;
            mesh.current.scale.set(finalScale, finalScale, finalScale);

            // 4. Particle Fluid Movement
            const positions = mesh.current.geometry.attributes.position;
            const initialPositions = particles.positions;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const x = initialPositions[i3];
                const y = initialPositions[i3 + 1];
                const z = initialPositions[i3 + 2];

                // Create organic wave movement
                // Different frequencies per axis for non-uniform motion
                const movementX = Math.sin(time * 0.5 + y * 2) * 0.05 + Math.sin(time * 1.5 + z) * 0.02;
                const movementY = Math.cos(time * 0.7 + x * 1.5) * 0.05 + Math.cos(time * 2 + z) * 0.02;
                const movementZ = Math.sin(time * 0.6 + x * 2.5) * 0.05 + Math.sin(time * 1.8 + y) * 0.02;

                positions.setXYZ(i, x + movementX, y + movementY, z + movementZ);
            }
            positions.needsUpdate = true;
        }
    });

    const triggerShockwave = () => {
        shockwave.current = 1.5; // Stronger initial shock
    };

    return (
        <points
            ref={mesh}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            onClick={triggerShockwave}
        >
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
        <div style={{ width: '100%', height: '240px', cursor: 'pointer' }} title="Click me!">
            <Canvas camera={{ position: [0, 0, 7], fov: 60 }} dpr={[1, 2]}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <BrainParticles />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={false} /* Disable manual drag rotation to let mouse-follow take over */
                />
            </Canvas>
        </div>
    );
};

export default ProceduralBrain;
