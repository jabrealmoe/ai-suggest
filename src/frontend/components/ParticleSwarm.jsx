import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleSwarm = () => {
    // Canvas setup with camera
    return (
        <div style={{ height: '300px', width: '100%', marginBottom: '-50px', position: 'relative', zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Swarm />
            </Canvas>
        </div>
    );
};

const Swarm = () => {
    const { opacity } = useThree((state) => ({ opacity: state.viewport.width })); // Trigger re-render on resize
    const count = 1500;
    const mesh = useRef();
    const [hovered, setHover] = useState(false);

    // Generate random positions (start) and target positions (AI shape)
    const [positions, targets] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const tar = new Float32Array(count * 3);

        // Grid for "A"
        // A shape: two slanted lines and a crossbar
        // Normalized roughly to -5 to 5 space
        const aPoints = [];
        for (let i = 0; i < 400; i++) {
            // Left leg
            aPoints.push([-2 - (i / 200), -2 + (i / 100), 0]);
            // Right leg
            aPoints.push([-2 + (i / 200), -2 + (i / 100), 0]);
        }
        for (let i = 0; i < 100; i++) {
            // Crossbar
            aPoints.push([-2.5 + (i / 100), 0, 0]);
        }

        // Grid for "I"
        const iPoints = [];
        for (let i = 0; i < 400; i++) {
            // Vertical bar
            iPoints.push([2, -2 + (i / 100), 0]);
        }
        for (let i = 0; i < 100; i++) {
            // Top cap
            iPoints.push([1.5 + (i / 100), 2, 0]);
            // Bottom cap
            iPoints.push([1.5 + (i / 100), -2, 0]);
        }

        const totalShapePoints = aPoints.length + iPoints.length;

        for (let i = 0; i < count; i++) {
            // Random start
            pos[i * 3] = (Math.random() - 0.5) * 30; // x
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30; // z

            // Target assignment
            if (i < aPoints.length) {
                tar[i * 3] = aPoints[i][0] * 1.5;
                tar[i * 3 + 1] = aPoints[i][1] * 1.5;
                tar[i * 3 + 2] = 0;
            } else if (i < aPoints.length + iPoints.length) {
                const idx = i - aPoints.length;
                tar[i * 3] = iPoints[idx][0] * 1.5;
                tar[i * 3 + 1] = iPoints[idx][1] * 1.5;
                tar[i * 3 + 2] = 0;
            } else {
                // Leftovers float nearby
                tar[i * 3] = (Math.random() - 0.5) * 10;
                tar[i * 3 + 1] = (Math.random() - 0.5) * 10;
                tar[i * 3 + 2] = (Math.random() - 0.5) * 5;
            }
        }
        return [pos, tar];
    }, [count]);

    const dummy = new THREE.Object3D();
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: positions[i * 3],
                y: positions[i * 3 + 1],
                z: positions[i * 3 + 2],
                vx: 0,
                vy: 0,
                vz: 0
            });
        }
        return temp;
    }, [positions]);

    useFrame((state) => {
        if (!mesh.current) return;

        const time = state.clock.getElapsedTime();
        const mouse = state.pointer; // Normalized -1 to 1

        // Convert mouse to world space roughly (camera at z=20)
        const mouseX = mouse.x * 20;
        const mouseY = mouse.y * 10; // Aspect ratio approx

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            const tx = targets[i * 3];
            const ty = targets[i * 3 + 1];
            const tz = targets[i * 3 + 2];

            // Attraction to target
            const dx = tx - p.x;
            const dy = ty - p.y;
            const dz = tz - p.z;

            // Basic spring force
            p.vx += dx * 0.05;
            p.vy += dy * 0.05;
            p.vz += dz * 0.05;

            // Mouse Repulsion
            const mdx = p.x - mouseX;
            const mdy = p.y - mouseY;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (dist < 4) {
                const force = (4 - dist) * 0.5;
                p.vx += (mdx / dist) * force;
                p.vy += (mdy / dist) * force;
                p.vz += Math.random() * force; // Add some chaos Z
            }

            // Friction
            p.vx *= 0.90;
            p.vy *= 0.90;
            p.vz *= 0.90;

            // Update pos
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Apply wobbling noise
            const noise = Math.sin(time + i) * 0.02;

            dummy.position.set(p.x + noise, p.y + noise, p.z);

            // Scale based on "AI" formation vs chaos
            const scale = (i < 1000) ? 0.15 : 0.08;
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color={hovered ? "#00B8D9" : "#0052CC"} transparent opacity={0.8} />
        </instancedMesh>
    );
};

export default ParticleSwarm;
