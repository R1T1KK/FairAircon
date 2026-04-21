import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float, PerspectiveCamera, Environment, ContactShadows, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ACObject = () => {
  const leftShellRef = useRef();
  const rightShellRef = useRef();
  const fanRef = useRef();
  const mainGroup = useRef();

  // Fan Rotation Animation
  useFrame((state) => {
    if (fanRef.current) {
      fanRef.current.rotation.x += 0.1;
    }
    // Gentle floating movement
    const t = state.clock.getElapsedTime();
    mainGroup.current.position.y = Math.sin(t) * 0.1;
  });

  useEffect(() => {
    // GSAP ScrollTrigger for splitting
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom center",
        scrub: 1,
      }
    });

    tl.to(leftShellRef.current.position, { x: -1.5, duration: 1 }, 0)
      .to(rightShellRef.current.position, { x: 1.5, duration: 1 }, 0)
      .to(mainGroup.current.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 1 }, 0);

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <group ref={mainGroup} rotation={[0, -Math.PI / 6, 0]}>
      {/* 1. Internal Core (Visible when split) */}
      <group>
        {/* Fan Unit */}
        <mesh ref={fanRef} position={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.3, 0.3, 2, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Copper Coils */}
        {[ -0.8, -0.4, 0, 0.4, 0.8 ].map((x, i) => (
          <mesh key={i} position={[x, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.35, 0.05, 16, 32]} />
            <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* 2. Left Shell */}
      <group ref={leftShellRef}>
        <RoundedBox args={[1.5, 1, 0.5]} radius={0.1} smoothness={4} position={[-0.75, 0, 0]}>
          <meshStandardMaterial color="white" roughness={0.1} metalness={0.1} />
        </RoundedBox>
        <mesh position={[-0.75, -0.3, 0.26]}>
          <boxGeometry args={[1.2, 0.05, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      {/* 3. Right Shell */}
      <group ref={rightShellRef}>
        <RoundedBox args={[1.5, 1, 0.5]} radius={0.1} smoothness={4} position={[0.75, 0, 0]}>
          <meshStandardMaterial color="white" roughness={0.1} metalness={0.1} />
        </RoundedBox>
        {/* Logo area on right */}
        <mesh position={[1.2, 0.2, 0.26]}>
           <planeGeometry args={[0.3, 0.1]} />
           <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* 4. Lights inside */}
      <pointLight position={[0, 0, 0]} color="#0ea5e9" intensity={2} distance={2} />
    </group>
  );
};

const MistParticles = () => {
  const points = useRef();
  const count = 200;
  
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  useFrame((state) => {
    points.current.rotation.y += 0.002;
    points.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#bae6fd" transparent opacity={0.4} />
    </points>
  );
};

// Error boundary or wrapper for the Canvas
const HeroAC3D = () => {
  return (
    <div className="hero-visual-3d">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <Environment preset="city" />
        
        <MistParticles />
        <ACObject />
        
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={4} 
        />
      </Canvas>
    </div>
  );
};

export default HeroAC3D;
