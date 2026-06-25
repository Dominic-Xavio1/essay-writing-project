"use client"; // Required because Three.js needs browser-only APIs (window, WebGL)

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function StormtrooperCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Setup variables that live across loops
    let stats, clock, controls;
    let camera, scene, renderer, mixer;

    // 2. Initialize the scene setup
    init();
    animate();

    function init() {
      const container = containerRef.current;
      if (!container) return;

      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
      camera.position.set(15, 10, -15);

      scene = new THREE.Scene();
      clock = new THREE.Clock();

      // Collada model loader
      const loadingManager = new THREE.LoadingManager(() => {
        // Model is done loading here if you want to remove a loading spinner
      });

      const loader = new ColladaLoader(loadingManager);
      
      // NOTICE: Path points directly to our public folder copy
      loader.load("/models/stormtrooper/stormtrooper.dae", function (collada) {
        const avatar = collada.scene;
        const animations = collada.animations;

        // Turn on animations
        mixer = new THREE.AnimationMixer(avatar);
        mixer.clipAction(animations[0]).play();

        scene.add(avatar);
      });

      // Lighting setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(10, 20, 20);
      scene.add(directionalLight);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      
      // Inject the canvas into our React div element reference
      container.appendChild(renderer.domElement);

      // Camera Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.screenSpacePanning = true;
      controls.minDistance = 5;
      controls.maxDistance = 40;
      controls.target.set(0, 2, 0);
      controls.update();

      // Window resizing listener
      window.addEventListener("resize", onWindowResize);
    }

    function onWindowResize() {
      const container = containerRef.current;
      if (!container) return;

      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      render();
    }

    function render() {
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    }

    // 3. Clean up when component unmounts to prevent memory leaks!
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Return the styling container wrapper
  return (
    <div 
      ref={containerRef} 
      style={{ width: "100%", height: "100vh", position: "relative", backgroundColor: "#000" }} 
    />
  );
}
