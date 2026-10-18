import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import './style.css';

function Avatar({ skin, shirt, hair, height }) {
  return (
    <group position={[0, -0.8, 0]} scale={[1, height, 1]}>
      <mesh position={[0, 1.65, 0]} castShadow>
        <capsuleGeometry args={[0.23, 0.55, 8, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 2.34, -0.035]} castShadow>
        <sphereGeometry args={[0.285, 32, 24]} />
        <meshStandardMaterial color={hair} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.12, 0.245]}>
        <boxGeometry args={[0.09, 0.035, 0.025]} />
        <meshStandardMaterial color="#29212a" />
      </mesh>
      <mesh position={[0, 1.14, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.48, 8, 16]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      {[-0.43, 0.43].map((x) => (
        <mesh key={x} position={[x, 1.18, 0]} rotation={[0, 0, x < 0 ? -0.12 : 0.12]} castShadow>
          <capsuleGeometry args={[0.105, 0.52, 8, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      ))}
      {[-0.17, 0.17].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.49, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.6, 8, 12]} />
            <meshStandardMaterial color="#26354d" />
          </mesh>
          <mesh position={[x, 0.08, 0.07]} castShadow>
            <boxGeometry args={[0.27, 0.15, 0.42]} />
            <meshStandardMaterial color="#20232a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function App() {
  const [skin, setSkin] = useState('#e9b99a');
  const [shirt, setShirt] = useState('#4f86e8');
  const [hair, setHair] = useState('#49352d');
  const [height, setHeight] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  return (
    <main className="studio">
      <header className="topbar">
        <div><span className="brand-icon">◆</span><div><h1>Avatar Studio</h1><p>VRChat character creator</p></div></div>
        <span className="status">● Studio ready</span>
      </header>
      <section className="workspace">
        <div className="viewport">
          <div className="viewport-label">3D PREVIEW <span>DRAG TO ROTATE</span></div>
          <Canvas camera={{ position: [3, 2.5, 5], fov: 40 }} shadows>
            <color attach="background" args={['#151923']} />
            <ambientLight intensity={1.4} />
            <directionalLight position={[4, 6, 5]} intensity={2} castShadow />
            <pointLight position={[-3, 2, -2]} intensity={12} color="#638bff" />
            <Avatar skin={skin} shirt={shirt} hair={hair} height={height} />
            {showGrid && <gridHelper args={[10, 20, '#49546a', '#303746']} position={[0, -0.72, 0]} />}
            <OrbitControls target={[0, 1.15, 0]} enablePan={false} minDistance={3} maxDistance={9} />
          </Canvas>
          <div className="preview-footer"><span>● LIVE PREVIEW</span><button onClick={() => setShowGrid(!showGrid)}>{showGrid ? 'Hide grid' : 'Show grid'}</button></div>
        </div>
        <aside className="controls">
          <h2>Customize avatar</h2>
          <p className="subtext">Personalize your character.</p>
          <label>Skin color</label><div className="color-row"><input aria-label="Skin color" type="color" value={skin} onChange={e => setSkin(e.target.value)} /><span>{skin}</span></div>
          <label>Clothing color</label><div className="color-row"><input aria-label="Clothing color" type="color" value={shirt} onChange={e => setShirt(e.target.value)} /><span>{shirt}</span></div>
          <label>Hair color</label><div className="color-row"><input aria-label="Hair color" type="color" value={hair} onChange={e => setHair(e.target.value)} /><span>{hair}</span></div>
          <label htmlFor="height">Character height</label><div className="slider-row"><input id="height" type="range" min="0.8" max="1.2" step="0.05" value={height} onChange={e => setHeight(Number(e.target.value))} /><span>{height.toFixed(2)}×</span></div>
          <button className="reset" onClick={() => {setSkin('#e9b99a');setShirt('#4f86e8');setHair('#49352d');setHeight(1);}}>Reset appearance</button>
          <div className="notice"><strong>Next step</strong><p>This is a starter 3D preview. VRChat-ready humanoid rigging, FBX/VRM export, and avatar validation still need to be implemented.</p></div>
        </aside>
      </section>
      <footer className="footer">AVATAR STUDIO <span>Built for desktop, mobile and tablet</span></footer>
    </main>
  );
}