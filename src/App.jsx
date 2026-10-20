
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

function ImportedModel({ data, format, resources, onLoaded, onError }) {
  const [scene, setScene] = useState(null);
  const loadedRef = useRef(onLoaded);
  const errorRef = useRef(onError);

  useEffect(() => { loadedRef.current = onLoaded; }, [onLoaded]);
  useEffect(() => { errorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!data) {
      setScene(null);
      return;
    }

    let cancelled = false;
    const loader = new GLTFLoader();

    loader.parse(
      data,
      '',
      (gltf) => {
        if (cancelled) return;

        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) {
          errorRef.current('The file contains no 3D scene.');
          return;
        }

        root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(root);

        if (bounds.isEmpty()) {
          errorRef.current('No visible 3D geometry was found in this model.');
          return;
        }

        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);

        if (!Number.isFinite(largest) || largest <= 0) {
          errorRef.current('The model has invalid dimensions.');
          return;
        }

        root.position.sub(center);
        root.scale.setScalar(2 / largest);
        root.position.multiplyScalar(2 / largest);
        root.position.y += 0.15;

        root.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            if (object.material) {
              object.material.side = THREE.DoubleSide;
            }
          }
        });

        root.updateMatrixWorld(true);
        setScene(root);
        loadedRef.current();
      },
      (error) => {
        if (cancelled) return;
        console.error('GLTF parse failed:', error);
        errorRef.current(
          error?.message || 'Could not read this model. Check the file and its textures.'
        );
      }
    );

    return () => { cancelled = true; };
  }, [data, format, resources]);

  return scene ? <primitive object={scene} /> : null;
}

function filenameOf(uri) {
  try {
    return decodeURIComponent(uri.split(/[?#]/)[0].split('/').pop()).toLowerCase();
  } catch {
    return uri.split(/[?#]/)[0].split('/').pop().toLowerCase();
  }
}

export default function App() {
  const [modelData, setModelData] = useState(null);
  const [modelFormat, setModelFormat] = useState('');
  const [resources, setResources] = useState([]);
  const [filename, setFilename] = useState('');
  const [status, setStatus] = useState('Choose a .glb or .gltf model to begin.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const inputRef = useRef(null);
  const urlsRef = useRef([]);

  function clearUrls() {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
  }

  useEffect(() => () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function importModel(event) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    const file = files.find((item) => /\.(glb|gltf)$/i.test(item.name));

    if (!file) {
      setError('Select a .glb or .gltf model file.');
      setStatus('Import failed.');
      input.value = '';
      return;
    }

    setBusy(true);
    setError('');
    setFilename(file.name);
    setStatus(`Reading ${file.name}…`);

    const newUrls = [];

    try {
      let data;
      const isGlb = /\.glb$/i.test(file.name);

      if (isGlb) {
        data = await file.arrayBuffer();
        if (!data.byteLength) throw new Error('The selected file is empty.');
      } else {
        const text = await file.text();
        let json;

        try {
          json = JSON.parse(text);
        } catch {
          throw new Error('The .gltf file is not valid JSON.');
        }

        if (!json.asset || !json.asset.version) {
          throw new Error('The .gltf file is missing asset version information.');
        }

        function rewriteUris(value) {
          if (!value || typeof value !== 'object') return;
          if (Array.isArray(value)) {
            value.forEach(rewriteUris);
            return;
          }

          for (const [key, item] of Object.entries(value)) {
            if (
              key === 'uri' &&
              typeof item === 'string' &&
              !/^(data:|blob:|https?:)/i.test(item)
            ) {
              const wanted = filenameOf(item);
              const companion = files.find(
                (candidate) =>
                  candidate !== file &&
                  candidate.name.toLowerCase() === wanted
              );

              if (!companion) {
                throw new Error(
                  `Missing file "${wanted}". Select the .gltf, .bin and texture files together.`
                );
              }

              let url = companion.__avatarStudioUrl;
              if (!url) {
                url = URL.createObjectURL(companion);
                Object.defineProperty(companion, '__avatarStudioUrl', {
                  value: url,
                  configurable: true
                });
              }

              newUrls.push(url);
              value[key] = url;
            } else {
              rewriteUris(item);
            }
          }
        }

        rewriteUris(json);
        data = JSON.stringify(json);
      }

      clearUrls();
      urlsRef.current = newUrls;
      setResources([...newUrls]);
      setModelFormat(isGlb ? 'glb' : 'gltf');
      setModelData(data);
      setStatus('Loading model into the 3D viewer…');
    } catch (err) {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
      setError(err?.message || 'Could not import this model.');
      setStatus('Import failed.');
      setBusy(false);
    } finally {
      input.value = '';
    }
  }

  function handleLoaded() {
    setError('');
    setStatus(`Successfully loaded ${filename}`);
    setBusy(false);
  }

  function handleError(message) {
    setError(message);
    setStatus('Import failed.');
    setBusy(false);
  }

  function resetModel() {
    clearUrls();
    setModelData(null);
    setModelFormat('');
    setResources([]);
    setFilename('');
    setError('');
    setStatus('Choose a .glb or .gltf model to begin.');
    setBusy(false);
  }

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
          <div className="viewport-label">
            3D PREVIEW <span>DRAG TO ROTATE</span>
          </div>

          <Canvas camera={{ position: [3, 2.5, 5], fov: 40 }} shadows>
            <color attach="background" args={['#151923']} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[4, 6, 5]} intensity={2} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.8} />
            {modelData !== null && (
              <ImportedModel
                data={modelData}
                format={modelFormat}
                resources={resources}
                onLoaded={handleLoaded}
                onError={handleError}
              />
            )}
            {showGrid && (
              <gridHelper
                args={[10, 20, '#49546a', '#303746']}
                position={[0, -0.72, 0]}
              />
            )}
            <OrbitControls
              makeDefault
              target={[0, 0.3, 0]}
              enablePan={false}
              minDistance={1}
              maxDistance={12}
            />
          </Canvas>

          <div className="preview-footer">
            <span>● LIVE PREVIEW</span>
            <button type="button" onClick={() => setShowGrid((value) => !value)}>
              {showGrid ? 'Hide grid' : 'Show grid'}
            </button>
          </div>
        </div>

        <aside className="controls">
          <h2>Import 3D model</h2>
          <p className="subtext">Load a model into the viewer.</p>

          <div className="import-panel">
            <input
              ref={inputRef}
              type="file"
              accept=".glb,.gltf,.bin,.png,.jpg,.jpeg,.webp,.ktx,.ktx2"
              multiple
              onChange={importModel}
              className="import-input"
            />

            <button
              type="button"
              className="import-button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Importing…' : 'Import 3D Model'}
            </button>

            {filename && (
              <div className="file-meta">
                <span className="file-label">Selected file</span>
                <strong>{filename}</strong>
              </div>
            )}

            <p className={`status-message ${error ? 'status-error' : 'status-success'}`}>
              {error || status}
            </p>

            {modelData !== null && (
              <button
                type="button"
                className="return-button"
                onClick={resetModel}
              >
                Remove model
              </button>
            )}
          </div>

          <div className="notice">
            <strong>Supported formats</strong>
            <p>GLB models are loaded from their binary data. For GLTF files, select the required .bin and texture files together.</p>
          </div>
        </aside>
      </section>

      <footer className="footer">
        AVATAR STUDIO <span>Built for desktop, mobile and tablet</span>
      </footer>
    </main>
  );
}
