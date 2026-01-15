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
    const { opacity } = useThree((state) => ({ opacity: state.viewport.width }));
    const count = 1500;
    const mesh = useRef();
    const [hovered, setHover] = useState(false);

    // Theme Awareness: Polling for CSS variable changes
    const [particleColor, setParticleColor] = useState('#0052CC');

    useEffect(() => {
        const updateColor = () => {
            // --ds-link is Blue in Light Mode (#0052CC) and Light Blue in Dark Mode (#4794FF)
            const styles = getComputedStyle(document.documentElement);
            const color = styles.getPropertyValue('--ds-link').trim();
            // Fallback if variable is not set (e.g. dev env without tokens)
            setParticleColor(color || '#0052CC');
        };

        updateColor();
        // Poll for theme changes (cheap and effective for iframe context)
        const interval = setInterval(updateColor, 2000);
        return () => clearInterval(interval);
    }, []);

    // Generate random positions (start) and target positions from Text (Canvas)
    const [positions, targets] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const tar = new Float32Array(count * 3);

        // --- Canvas Text Generation ---
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 200;
        const height = 50;
        canvas.width = width;
        canvas.height = height;

        // Draw text
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height); // Clear
        ctx.fillStyle = 'white';
        // Bold sans-serif font
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // "Dr. Jira"
        ctx.fillText('Dr. Jira', width / 2, height / 2);

        // Scan pixel data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const textPoints = [];

        // Sample pixels
        for (let y = 0; y < height; y += 1) { // Step size affects density
            for (let x = 0; x < width; x += 1) {
                const index = (y * width + x) * 4;
                // If pixel is bright enough
                if (data[index] > 128) {
                    // Map x/y to 3D space 
                    // Canvas y goes down, 3D y goes up. Flip Y.
                    // Center the text (width/2, height/2 offsets)
                    const px = (x - width / 2) * 0.15;
                    const py = -(y - height / 2) * 0.15; // Flip Y
                    textPoints.push([px, py, 0]);
                }
            }
        }

        // --- Assign Targets ---
        for (let i = 0; i < count; i++) {
            // Random start
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 40;

            if (i < textPoints.length) {
                // Assign to text grid, reusing points if we have fewer particles
                // Or random sampling if we have more points than particles
                const pointIndex = i % textPoints.length; // Cycle through points if not enough
                tar[i * 3] = textPoints[pointIndex][0];
                tar[i * 3 + 1] = textPoints[pointIndex][1];
                tar[i * 3 + 2] = 0;
            } else {
                // Leftover particles float around the text as "dust"
                // Pick a random text point and add noise
                const pointIndex = Math.floor(Math.random() * textPoints.length);
                if (textPoints.length > 0) {
                    tar[i * 3] = textPoints[pointIndex][0] + (Math.random() - 0.5) * 5;
                    tar[i * 3 + 1] = textPoints[pointIndex][1] + (Math.random() - 0.5) * 5;
                    tar[i * 3 + 2] = (Math.random() - 0.5) * 3;
                } else {
                    tar[i * 3] = 0; tar[i * 3 + 1] = 0; tar[i * 3 + 2] = 0;
                }
            }
        }
        return [pos, tar];
    }, [count]);

    const dummy = new THREE.Object3D();
    // Initialize particle data (velocity, current pos)
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
        const mouse = state.pointer;

        const mouseX = mouse.x * 20;
        const mouseY = mouse.y * 10;

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            const tx = targets[i * 3];
            const ty = targets[i * 3 + 1];
            const tz = targets[i * 3 + 2];

            // Attraction
            const dx = tx - p.x;
            const dy = ty - p.y;
            const dz = tz - p.z;

            // Spring
            p.vx += dx * 0.03; // Slower convergence for "swarming" feel
            p.vy += dy * 0.03;
            p.vz += dz * 0.03;

            // Repulsion
            const mdx = p.x - mouseX;
            const mdy = p.y - mouseY;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (dist < 4) {
                const force = (4 - dist) * 0.5;
                p.vx += (mdx / dist) * force;
                p.vy += (mdy / dist) * force;
                p.vz += (Math.random() - 0.5) * force;
            }

            // Friction
            p.vx *= 0.92;
            p.vy *= 0.92;
            p.vz *= 0.92;

            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Noise wobble
            const noise = Math.sin(time * 2 + i) * 0.05;

            dummy.position.set(p.x + noise, p.y + noise, p.z);

            // Scale logic
            dummy.scale.set(0.08, 0.08, 0.08);

            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
            <sphereGeometry args={[1, 8, 8]} />
            {/* Using the theme-aware text color */}
            <meshStandardMaterial color={hovered ? "#36B37E" : particleColor} transparent opacity={0.7} />
        </instancedMesh>
    );
};

export default ParticleSwarm;
