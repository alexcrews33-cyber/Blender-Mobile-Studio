
function ImportedModel({ modelUrl, onError, onLoaded }) {
  const [scene, setScene] = useState(null);

  // Keep callbacks current without restarting the model loader.
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
          onErrorRef.current?.(
            "The file loaded, but it contains no 3D scene."
          );
          return;
        }

        root.updateMatrixWorld(true);

        // Measure the model before changing its transform.
        const bounds = new THREE.Box3().setFromObject(root);

        if (bounds.isEmpty()) {
          onErrorRef.current?.(
            "The model contains no visible 3D geometry."
          );
          return;
        }

        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);

        if (!Number.isFinite(largest) || largest <= 0) {
          onErrorRef.current?.(
            "The model has invalid dimensions."
          );
          return;
        }

        // Center the model around its origin and scale it.
        root.position.sub(center);
        root.scale.setScalar(1.8 / largest);
        root.position.multiplyScalar(1.8 / largest);
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

        console.error(
          "Failed to load the selected 3D model:",
          error
        );

        onErrorRef.current?.(
          error?.message ||
          "Unable to load this model. Check the file format and required assets."
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
