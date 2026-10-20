
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

function normalizeResourceName(value) {
  try {
    return decodeURIComponent(value || '')
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      ?.toLowerCase() || '';
  } catch {
    return (value || '').split('/').pop()?.toLowerCase() || '';
  }
}

function isSupportedModelFile(file) {
  return Boolean(file?.name && /\.(glb|gltf)$/i.test(file.name));
}

function ImportedModel({ modelUrl, onError, onLoaded }) {
  const [scene, setScene] = useState(null);
  const onErrorRef = useRef(onError);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    if (!modelUrl) {
      setScene(null);
      return undefined;
    }

    let active = true;
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        if (!active) return;

        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) {
          onErrorRef.current?.('The selected file contains no 3D scene.');
          return;
        }

        root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(root);

        if (bounds.isEmpty()) {
          onErrorRef.current?.('The model contains no visible geometry.');
          return;
        }

        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);

        if (!Number.isFinite(largest) || largest <= 0) {
          onErrorRef.current?.('The model has invalid dimensions.');
          return;
        }

        const scale = 1.8 / largest;
        root.position.sub(center);
        root.scale.setScalar(scale);
        root.position.multiplyScalar(scale);
        root.position.y += 0.3;
        root.rotation.y = Math.PI;

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        root.updateMatrixWorld(true);
        setScene(root);
        onLoadedRef.current?.(root);
      },
      undefined,
      (error) => {
        if (!active) return;
        console.error('GLTFLoader error:', error);
        onErrorRef.current?.(
          error?.message || 'Could not load this model. Check its format and required files.'
        );
      }
    );

    return () => {
      active = false;
    };
  }, [modelUrl]);

  if (!scene) return null;
  return <primitive object={scene} />;
}

function createCompanionUrls(gltfFile, companionFiles) {
  return gltfFile.text().then((text) => {
    let json;

    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('The .gltf file is not valid JSON.');
    }

    if (!json.asset) {
      throw new Error('The .gltf file is missing asset metadata.');
    }

    const createdUrls = [];
    const missing = [];

    function rewrite(value) {
      if (!value || typeof value !== 'object') return;

      if (Array.isArray(value)) {
        value.forEach(rewrite);
        return;
      }

      for (const [key, item] of Object.entries(value)) {
        if (key === 'uri' && typeof item === 'string' && !/^(data:|blob:|https?:)/i.test(item)) {
          let decoded = item;
          try { decoded = decodeURIComponent(item); } catch {}

          const wanted = normalizeResourceName(decoded.split(/[?#]/)[0]);
          const match = companionFiles.find(
            (file) => normalizeResourceName(file.name) === wanted
          );

          if (match) {
            let url = match.__avatarStudioUrl;
            if (!url) {
              url = URL.createObjectURL(match);
              Object.defineProperty(match, '__avatarStudioUrl', {
                value: url,
                configurable: true
              });
              createdUrls.push(url);
            }
            value[key] = url;
          } else {
            missing.push(wanted || item);
          }
        } else {
          rewrite(item);
        }
      }
    }

    rewrite(json);

    if (missing.length) {
      createdUrls.forEach(URL.revokeObjectURL);
      throw new Error(
        `Missing companion file(s): ${[...new Set(missing)].join(', ')}. Select the .gltf, .bin and texture files together.`
      );
    }

    return {
      url: URL.createObjectURL(
        new Blob([JSON.stringify(json)], { type: 'model/gltf+json' })
      ),
      companionUrls: createdUrls
    };
  });
}

export default function App() {
  const [skin, setSkin] = useState('#e9b99a');
  const [shirt, setShirt] = useState('#4f86e8');
  const [hair, setHair] = useState('#49352d');
  const [height, setHeight] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [importedModelUrl, setImportedModelUrl] = useState(null);
  const [selectedFilename, setSelectedFilename] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const modelUrlCacheRef = useRef([]);

  const clearTemporaryModelUrls = useCallback(() => {
    modelUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    modelUrlCacheRef.current = [];
  }, []);

  useEffect(() => () => clearTemporaryModelUrls(), [clearTemporaryModelUrls]);

  const returnToStarterAvatar = useCallback(() => {
    clearTemporaryModelUrls();
    setImportedModelUrl(null);
    setSelectedFilename('');
    setImportError('');
    setImportStatus('Starter avatar restored');
  }, [clearTemporaryModelUrls]);

  const handleModelImport = async (event) => {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files || []);
    const file = selectedFiles.find(isSupportedModelFile);

    if (!file) {
      setImportError('Choose a .glb or .gltf model file.');
      setImportStatus('Import failed');
      input.value = '';
      return;
    }

    setSelectedFilename(file.name);
    setImportError('');
    setImportStatus(`Selected ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Preparing import…`);
    setIsImporting(true);

    try {
      let nextUrl;
      let companionUrls = [];

      if (/\.glb$/i.test(file.name)) {
        // Read binary bytes first to verify Android returned a readable File.
        const bytes = await file.arrayBuffer();
        if (!bytes.byteLength) throw new Error('The selected file is empty.');

        nextUrl = URL.createObjectURL(
          new Blob([bytes], { type: 'model/gltf-binary' })
        );
      } else {
        const companions = selectedFiles.filter((candidate) => candidate !== file);
        const result = await createCompanionUrls(file, companions);
        nextUrl = result.url;
        companionUrls = result.companionUrls;
      }

      clearTemporaryModelUrls();
      modelUrlCacheRef.current = [nextUrl, ...companionUrls];
      setImportedModelUrl(nextUrl);
      setImportStatus(`Loading ${file.name}…`);
    } catch (error) {
      console.error('Model import preparation failed:', error);
      setImportError(error?.message || 'Could not read the selected model.');
      setImportStatus('Import failed');
    } finally {
      setIsImporting(false);
      input.value = '';
    }
  };

  return (
    <main className="studio">
      <header className="topbar">
        <div>
          <span className="brand-icon">◆</span>
          <div>
            <h1>Avatar Studio</h1>
            <p>VRChat character creator</p>
          </div>
        </div>
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
            {!importedModelUrl && <Avatar skin={skin} shirt={shirt} hair={hair} height={height} />}
            {importedModelUrl && (
              <ImportedModel
                modelUrl={importedModelUrl}
                onError={(message) => {
                  setImportError(message);
                  setImportStatus('Import failed');
                  clearTemporaryModelUrls();
                  setImportedModelUrl(null);
                }}
                onLoaded={() => {
                  setImportError('');
                  setImportStatus(`Successfully loaded ${selectedFilename}`);
                }}
              />
            )}
            {showGrid && <gridHelper args={[10, 20, '#49546a', '#303746']} position={[0, -0.72, 0]} />}
            <OrbitControls target={[0, 1.15, 0]} enablePan={false} minDistance={3} maxDistance={9} />
          </Canvas>
          <div className="preview-footer">
            <span>● LIVE PREVIEW</span>
            <button type="button" onClick={() => setShowGrid((value) => !value)}>
              {showGrid ? 'Hide grid' : 'Show grid'}
            </button>
          </div>
        </div>

        <aside className="controls">
          <h2>Customize avatar</h2>
          <p className="subtext">Personalize your character.</p>

          <div className="import-panel">
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.bin,.png,.jpg,.jpeg,.webp,.ktx,.ktx2"
              multiple
              onChange={handleModelImport}
              className="import-input"
            />
            <button
              type="button"
              className="import-button"
              disabled={isImporting}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
            >
              {isImporting ? 'Importing…' : 'Import 3D Model'}
            </button>

            {selectedFilename && (
              <div className="file-meta">
                <span className="file-label">Selected file</span>
                <strong>{selectedFilename}</strong>
              </div>
            )}
            {(importStatus || importError) && (
              <p className={`status-message ${importError ? 'status-error' : 'status-success'}`}>
                {importError || importStatus}
              </p>
            )}
            {importedModelUrl && (
              <button type="button" className="return-button" onClick={returnToStarterAvatar}>
                Return to starter avatar
              </button>
            )}
          </div>

          <label>Skin color</label>
          <div className="color-row">
            <input aria-label="Skin color" type="color" value={skin} onChange={(e) => setSkin(e.target.value)} />
            <span>{skin}</span>
          </div>

          <label>Clothing color</label>
          <div className="color-row">
            <input aria-label="Clothing color" type="color" value={shirt} onChange={(e) => setShirt(e.target.value)} />
            <span>{shirt}</span>
          </div>

          <label>Hair color</label>
          <div className="color-row">
            <input aria-label="Hair color" type="color" value={hair} onChange={(e) => setHair(e.target.value)} />
            <span>{hair}</span>
          </div>

          <label htmlFor="height">Character height</label>
          <div className="slider-row">
            <input id="height" type="range" min="0.8" max="1.2" step="0.05" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            <span>{height.toFixed(2)}x</span>
          </div>

          <button
            type="button"
            className="reset"
            onClick={() => {
              setSkin('#e9b99a');
              setShirt('#4f86e8');
              setHair('#49352d');
              setHeight(1);
            }}
          >
            Reset appearance
          </button>

          <div className="notice">
            <strong>Next step</strong>
            <p>This starter editor previews 3D meshes. It does not automatically rig models or publish avatars to VRChat.</p>
          </div>
        </aside>
      </section>

      <footer className="footer">AVATAR STUDIO <span>Built for desktop, mobile and tablet</span></footer>
    </main>
  );
}
