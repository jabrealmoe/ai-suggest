import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Html, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const COLORS = ['#0052CC', '#36B37E', '#FFAB00', '#FF5630', '#6554C0', '#00B8D9'];

const ArcSlice = ({ startAngle, endAngle, color, radius, innerRadius, height, label, value, percentage, onHover, onClick, isActive }) => {
    const mesh = useRef();
    const [hovered, setHovered] = useState(false);

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();

        // Outer circle (CCW)
        shape.absarc(0, 0, radius, startAngle, endAngle, false);
        // Inner circle (connection back to start of inner is handled by shape) - wait, hole is better for donut

        // Better path for ring sector:
        // 1. Move to start outer
        // 2. Arc to end outer
        // 3. Line to end inner
        // 4. Arc to start inner (CW)
        // 5. Close

        const shape2 = new THREE.Shape();
        shape2.moveTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);
        shape2.absarc(0, 0, radius, startAngle, endAngle, false); // Outer
        shape2.lineTo(Math.cos(endAngle) * innerRadius, Math.sin(endAngle) * innerRadius);
        shape2.absarc(0, 0, innerRadius, endAngle, startAngle, true); // Inner (reverse)
        shape2.closePath();

        return new THREE.ExtrudeGeometry(shape2, {
            depth: height,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2,
            steps: 1
        });
    }, [startAngle, endAngle, radius, innerRadius, height]);

    // Animation values
    useFrame((state, delta) => {
        if (mesh.current) {
            // Pop out effect on hover
            const targetScale = hovered || isActive ? 1.05 : 1;
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 10);

            // Emissive pulse on hover
            if (mesh.current.material) {
                const targetEmissive = hovered ? new THREE.Color(0x444444) : new THREE.Color(0x000000);
                mesh.current.material.emissive.lerp(targetEmissive, delta * 10);
            }
        }
    });

    return (
        <mesh
            ref={mesh}
            geometry={geometry}
            castShadow
            receiveShadow
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label, value, percentage); }}
            onPointerOut={(e) => { setHovered(false); onHover(null); }}
            onClick={(e) => { e.stopPropagation(); onClick(label, value, percentage); }}
        >
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
    );
};

const DonutGroup = ({ data, onUpdateTooltip, onSegmentClick }) => {
    const groupRef = useRef();

    // Constant nice rotation
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1; // Slow spin
            groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1; // Gentle tilt bob
        }
    });

    let cumulativeAngle = 0;
    const total = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <group ref={groupRef} rotation={[0.5, 0, 0]}> {/* Initial tilt for 3D view */}
            {data.map((item, index) => {
                const angle = (item.value / total) * Math.PI * 2;
                const start = cumulativeAngle;
                const end = cumulativeAngle + angle;
                const percentage = Math.round((item.value / total) * 100);

                // Gap adjustment (simple way: reduce end angle slightly)
                const gap = 0.05;
                const safeEnd = end - gap > start ? end - gap : end;

                cumulativeAngle += angle;

                return (
                    <ArcSlice
                        key={item.name}
                        startAngle={start}
                        endAngle={safeEnd}
                        color={COLORS[index % COLORS.length]}
                        radius={2.5}
                        innerRadius={1.5}
                        height={0.5}
                        label={item.name}
                        value={item.value}
                        percentage={percentage}
                        onHover={onUpdateTooltip}
                        onClick={onSegmentClick}
                    />
                );
            })}
        </group>
    );
};

const ThreeDonutChart = ({ data, onSegmentClick }) => {
    const [tooltipState, setTooltipState] = useState(null);

    const handleHover = (label, value, percentage) => {
        if (label) {
            setTooltipState({ label, value, percentage });
        } else {
            setTooltipState(null);
        }
    };

    if (!data || data.length === 0) return null;

    return (
        <div style={{ position: 'relative', width: '100%', height: '300px' }}>
            <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                {data.some(d => d.value > 0) && (
                    <DonutGroup
                        data={data}
                        onUpdateTooltip={handleHover}
                        onSegmentClick={onSegmentClick}
                    />
                )}
                <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
                <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} />
            </Canvas>

            {/* HTML Overlay Tooltip inside the container */}
            {tooltipState && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(23, 43, 77, 0.9)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    zIndex: 10,
                    textAlign: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}>
                    <div>{tooltipState.label}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>{tooltipState.value} ({tooltipState.percentage}%)</div>
                </div>
            )}
        </div>
    );
};

export default ThreeDonutChart;
