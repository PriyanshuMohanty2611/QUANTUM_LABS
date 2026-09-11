"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Sliders,
  Play,
  Activity,
  Layers,
} from "lucide-react";

interface BlochSphere3DStudioProps {
  initialTheta?: number; // radians
  initialPhi?: number;   // radians
}

export const BlochSphere3DStudio: React.FC<BlochSphere3DStudioProps> = ({
  initialTheta = Math.PI / 3, // ~60 deg
  initialPhi = Math.PI / 4,   // ~45 deg
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [theta, setTheta] = useState<number>(initialTheta); // 0 to PI
  const [phi, setPhi] = useState<number>(initialPhi);       // 0 to 2*PI
  const [purity, setPurity] = useState<number>(1.0);       // r in [0, 1] for mixed states
  const [sphereScale, setSphereScale] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isRotatingGate, setIsRotatingGate] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"gates" | "coordinates" | "decoherence">("gates");
  const [selectedNote, setSelectedNote] = useState<string>("default");

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const vectorArrowRef = useRef<THREE.Group | null>(null);
  const projLineRef = useRef<THREE.Line | null>(null);
  const projShadowRef = useRef<THREE.Mesh | null>(null);

  // Drag rotation state
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sphereRotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: 0.5 });

  // Calculate amplitudes and Born probabilities
  // |psi> = cos(theta/2)|0> + e^(i*phi)sin(theta/2)|1>
  const alphaMag = Math.cos(theta / 2);
  const betaMag = Math.sin(theta / 2);
  const betaReal = betaMag * Math.cos(phi);
  const betaImag = betaMag * Math.sin(phi);

  const prob0 = (alphaMag * alphaMag * purity + (1 - purity) * 0.5) * 100;
  const prob1 = (100 - prob0);

  // Cartesian Bloch vector (r * sin(theta)cos(phi), r * sin(theta)sin(phi), r * cos(theta))
  // Three.js axes: X = green, Y = yellow (up/equator), Z = blue (North/South)
  // Standard physics: Z is polar axis, X & Y span equator.
  // We map physics Z -> Three.js Y (up), physics X -> Three.js X, physics Y -> Three.js Z
  const vecX = purity * Math.sin(theta) * Math.cos(phi);
  const vecY = purity * Math.cos(theta); // Polar (Z in physics)
  const vecZ = purity * Math.sin(theta) * Math.sin(phi); // Y in physics

  const radius = 2.4 * sphereScale;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 20);
    pointLight.position.set(-4, -4, -4);
    scene.add(pointLight);

    // Root Sphere Group
    const sphereGroup = new THREE.Group();
    sphereGroup.rotation.x = sphereRotationRef.current.x;
    sphereGroup.rotation.y = sphereRotationRef.current.y;
    scene.add(sphereGroup);
    sphereGroupRef.current = sphereGroup;

    // 1. Translucent Wireframe Outer Sphere
    const sphereGeo = new THREE.SphereGeometry(2.4, 32, 24);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereGroup.add(sphereMesh);

    // 2. Inner smooth glowing sphere
    const innerGeo = new THREE.SphereGeometry(2.38, 32, 24);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.65,
      shininess: 90,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    sphereGroup.add(innerMesh);

    // 3. Equatorial Great Circles (XY, XZ, YZ)
    const createCircle = (color: number, rotX: number, rotY: number) => {
      const circleGeo = new THREE.RingGeometry(2.39, 2.41, 64);
      const circleMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const circle = new THREE.Mesh(circleGeo, circleMat);
      circle.rotation.x = rotX;
      circle.rotation.y = rotY;
      return circle;
    };
    sphereGroup.add(createCircle(0x38bdf8, Math.PI / 2, 0)); // Equator
    sphereGroup.add(createCircle(0x64748b, 0, 0));             // X-Z plane
    sphereGroup.add(createCircle(0x64748b, 0, Math.PI / 2));  // Y-Z plane

    // 4. Colored Coordinate Axes (Physics: Z=Up, X=Right, Y=Depth)
    const createAxis = (dir: THREE.Vector3, color: number, length: number) => {
      const group = new THREE.Group();
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        dir.clone().multiplyScalar(length),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 3 });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);

      // Arrowhead cone
      const coneGeo = new THREE.ConeGeometry(0.08, 0.25, 16);
      const coneMat = new THREE.MeshBasicMaterial({ color });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(dir.clone().multiplyScalar(length));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      group.add(cone);

      return group;
    };

    sphereGroup.add(createAxis(new THREE.Vector3(0, 1, 0), 0x3b82f6, 2.9));   // Z (|0> blue)
    sphereGroup.add(createAxis(new THREE.Vector3(0, -1, 0), 0x3b82f6, 2.9));  // -Z (|1> blue)
    sphereGroup.add(createAxis(new THREE.Vector3(1, 0, 0), 0x22c55e, 2.9));   // X (green)
    sphereGroup.add(createAxis(new THREE.Vector3(-1, 0, 0), 0x22c55e, 2.9));  // -X (green)
    sphereGroup.add(createAxis(new THREE.Vector3(0, 0, 1), 0xeab308, 2.9));   // Y (yellow)
    sphereGroup.add(createAxis(new THREE.Vector3(0, 0, -1), 0xeab308, 2.9));  // -Y (yellow)

    // 5. State Vector Arrow (Red Glowing)
    const vectorGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.4, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.6,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 1.2;
    vectorGroup.add(shaft);

    const tipGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff2222,
      emissiveIntensity: 0.8,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 2.4;
    vectorGroup.add(tip);

    // Center Origin Pivot Sphere
    const centerGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    sphereGroup.add(centerMesh);

    sphereGroup.add(vectorGroup);
    vectorArrowRef.current = vectorGroup;

    // 6. Projection lines (dotted) to XY plane & Z axis
    const projLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const projLineMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.1,
      gapSize: 0.08,
    });
    const projLine = new THREE.Line(projLineGeo, projLineMat);
    sphereGroup.add(projLine);
    projLineRef.current = projLine;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && sphereGroupRef.current) {
        sphereGroupRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
  }, []);

  // Update State Vector orientation when theta, phi, purity, or scale changes
  useEffect(() => {
    if (!vectorArrowRef.current || !sphereGroupRef.current) return;

    // Vector direction in Three.js coordinates:
    // X = purity * sin(theta) * cos(phi)
    // Y = purity * cos(theta)
    // Z = purity * sin(theta) * sin(phi)
    const targetDir = new THREE.Vector3(vecX, vecY, vecZ);
    const currentLength = targetDir.length() * radius;

    // Align vectorGroup (which points up along +Y by default) to targetDir
    const up = new THREE.Vector3(0, 1, 0);
    const normDir = targetDir.clone().normalize();
    if (normDir.lengthSq() > 0.0001) {
      vectorArrowRef.current.quaternion.setFromUnitVectors(up, normDir);
      vectorArrowRef.current.scale.set(1, (currentLength / 2.4), 1);
    }

    // Update projection line from (X, Y, Z) to equator (X, 0, Z)
    if (projLineRef.current) {
      const pTip = targetDir.clone().multiplyScalar(radius);
      const pEquator = new THREE.Vector3(pTip.x, 0, pTip.z);
      const pOrigin = new THREE.Vector3(0, 0, 0);

      const positions = new Float32Array([
        pTip.x, pTip.y, pTip.z,
        pEquator.x, pEquator.y, pEquator.z,
        pOrigin.x, pOrigin.y, pOrigin.z,
        pEquator.x, pEquator.y, pEquator.z,
      ]);
      projLineRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      projLineRef.current.computeLineDistances();
    }
  }, [vecX, vecY, vecZ, radius, purity]);

  // Interactive Drag Controls for Sphere Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !sphereGroupRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    sphereRotationRef.current.y += deltaX * 0.008;
    sphereRotationRef.current.x += deltaY * 0.008;

    // Clamp vertical pitch to avoid flipping
    sphereRotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, sphereRotationRef.current.x));

    sphereGroupRef.current.rotation.y = sphereRotationRef.current.y;
    sphereGroupRef.current.rotation.x = sphereRotationRef.current.x;

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Smooth gate rotation animation
  const animateGateApplication = (targetTheta: number, targetPhi: number, noteDesc: string) => {
    if (isRotatingGate) return;
    setIsRotatingGate(true);
    setSelectedNote(noteDesc);

    const startTheta = theta;
    const startPhi = phi;
    const duration = 650; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setTheta(startTheta + (targetTheta - startTheta) * ease);
      setPhi(startPhi + (targetPhi - startPhi) * ease);

      if (progress < 1.0) {
        requestAnimationFrame(step);
      } else {
        setTheta(targetTheta);
        setPhi(targetPhi);
        setIsRotatingGate(false);
      }
    };
    requestAnimationFrame(step);
  };

  // Gate actions implementation
  const applyGateX = () => {
    // X rotates pi around X-axis: theta -> pi - theta, phi -> -phi
    const nextTheta = Math.PI - theta;
    const nextPhi = (2 * Math.PI - phi) % (2 * Math.PI);
    animateGateApplication(nextTheta, nextPhi, "Pauli-X applied: bit-flip rotation of π around the X-axis.");
  };

  const applyGateY = () => {
    // Y rotates pi around Y-axis
    const nextTheta = Math.PI - theta;
    const nextPhi = (Math.PI - phi + 2 * Math.PI) % (2 * Math.PI);
    animateGateApplication(nextTheta, nextPhi, "Pauli-Y applied: bit-and-phase flip rotation of π around the Y-axis.");
  };

  const applyGateZ = () => {
    // Z rotates pi around Z-axis: phi -> phi + pi
    const nextPhi = (phi + Math.PI) % (2 * Math.PI);
    animateGateApplication(theta, nextPhi, "Pauli-Z applied: phase-flip rotation of π around the Z-axis (polar axis).");
  };

  const applyGateH = () => {
    // Hadamard flips around (X+Z)/sqrt(2)
    // If |0> -> |+> (theta = pi/2, phi = 0)
    // If |1> -> |-> (theta = pi/2, phi = pi)
    // If |+> -> |0> (theta = 0)
    // General transformation via Bloch coordinates:
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    const newX = z;
    const newY = -y;
    const newZ = x;

    const newTheta = Math.acos(Math.max(-1, Math.min(1, newZ)));
    let newPhi = Math.atan2(newY, newX);
    if (newPhi < 0) newPhi += 2 * Math.PI;

    animateGateApplication(newTheta, newPhi, "Hadamard (H) applied: superposition creation via π rotation around diagonal (X+Z)/√2.");
  };

  const applyGateS = () => {
    // S gate rotates pi/2 around Z-axis
    const nextPhi = (phi + Math.PI / 2) % (2 * Math.PI);
    animateGateApplication(theta, nextPhi, "S Gate (Phase) applied: +π/2 rotation around the Z-axis.");
  };

  const applyGateT = () => {
    // T gate rotates pi/4 around Z-axis
    const nextPhi = (phi + Math.PI / 4) % (2 * Math.PI);
    animateGateApplication(theta, nextPhi, "T Gate (π/8) applied: +π/4 rotation around the Z-axis.");
  };

  const applyRx = (angle: number) => {
    // Rotation around X axis by angle
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const newX = x;
    const newY = y * cosA - z * sinA;
    const newZ = y * sinA + z * cosA;

    const newTheta = Math.acos(Math.max(-1, Math.min(1, newZ)));
    let newPhi = Math.atan2(newY, newX);
    if (newPhi < 0) newPhi += 2 * Math.PI;

    animateGateApplication(newTheta, newPhi, `Rx(${((angle * 180) / Math.PI).toFixed(0)}°) rotation around the X-axis.`);
  };

  const applyRy = (angle: number) => {
    // Rotation around Y axis by angle
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const newX = x * cosA + z * sinA;
    const newY = y;
    const newZ = -x * sinA + z * cosA;

    const newTheta = Math.acos(Math.max(-1, Math.min(1, newZ)));
    let newPhi = Math.atan2(newY, newX);
    if (newPhi < 0) newPhi += 2 * Math.PI;

    animateGateApplication(newTheta, newPhi, `Ry(${((angle * 180) / Math.PI).toFixed(0)}°) rotation around the Y-axis.`);
  };

  const applyRz = (angle: number) => {
    const nextPhi = (phi + angle + 2 * Math.PI) % (2 * Math.PI);
    animateGateApplication(theta, nextPhi, `Rz(${((angle * 180) / Math.PI).toFixed(0)}°) rotation around the Z-axis.`);
  };

  // State Presets
  const setPresetState = (t: number, p: number, name: string) => {
    animateGateApplication(t, p, `Jumped to basis state |${name}⟩`);
  };

  return (
    <div className="flex flex-col bg-white text-[#0F172A] rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
      {/* Top Real-Time Quantum HUD Banner */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Theta θ:</span>
            <span className="text-[#2563EB] font-bold">{((theta * 180) / Math.PI).toFixed(2)}°</span>
            <span className="text-[#94A3B8] text-xs">({theta.toFixed(3)} rad)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Phi φ:</span>
            <span className="text-[#D97706] font-bold">{((phi * 180) / Math.PI).toFixed(2)}°</span>
            <span className="text-[#94A3B8] text-xs">({phi.toFixed(3)} rad)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Purity r:</span>
            <span className={`font-bold ${purity === 1 ? "text-[#16A34A]" : "text-purple-600"}`}>
              {purity.toFixed(2)} {purity < 1 ? "(Mixed)" : "(Pure)"}
            </span>
          </div>
        </div>

        {/* Live Qubit Formula & Probabilities */}
        <div className="flex items-center gap-5 text-xs sm:text-sm font-mono bg-white px-4 py-2 rounded-lg border border-[#CBD5E1] shadow-xs">
          <div className="text-[#0F172A]">
            |ψ⟩ = <span className="text-[#2563EB] font-bold">{alphaMag.toFixed(3)}</span>|0⟩ + (
            <span className="text-[#D97706] font-bold">{betaReal.toFixed(3)}</span>
            {betaImag >= 0 ? "+" : ""}
            <span className="text-[#D97706] font-bold">{betaImag.toFixed(3)}i</span>)|1⟩
          </div>
          <div className="border-l border-[#E2E8F0] pl-4 flex items-center gap-3">
            <span className="text-[#2563EB] font-semibold">P(|0⟩): {prob0.toFixed(1)}%</span>
            <span className="text-[#D97706] font-semibold">P(|1⟩): {prob1.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Main Studio Body: 3D Canvas + Interactive Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Side 3D Canvas Area */}
        <div
          className="lg:col-span-8 relative flex items-center justify-center bg-[#090D16] select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Three.js Container */}
          <div ref={mountRef} className="w-full h-full min-h-[520px]" />

          {/* Basis State Overlay Tags on 3D Sphere */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
            <span className="text-blue-400 font-bold font-mono text-base tracking-wide bg-slate-900/80 px-2.5 py-0.5 rounded border border-blue-500/40 backdrop-blur-sm shadow-md">
              |0⟩
            </span>
            <span className="text-xs text-blue-300 font-mono mt-0.5">North Pole (+Z)</span>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
            <span className="text-xs text-blue-300 font-mono mb-0.5">South Pole (-Z)</span>
            <span className="text-blue-400 font-bold font-mono text-base tracking-wide bg-slate-900/80 px-2.5 py-0.5 rounded border border-blue-500/40 backdrop-blur-sm shadow-md">
              |1⟩
            </span>
          </div>

          <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
            <span className="text-emerald-400 font-bold font-mono text-sm bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/40 shadow-md">
              |-⟩ / +X
            </span>
          </div>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
            <span className="text-emerald-400 font-bold font-mono text-sm bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/40 shadow-md">
              |+⟩ / -X
            </span>
          </div>

          {/* Floating Canvas Controls (Bottom Left) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                autoRotate ? "bg-[#2563EB] text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Toggle Auto Rotation"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{autoRotate ? "Pause Orbit" : "Auto Orbit"}</span>
            </button>
            <button
              onClick={() => {
                sphereRotationRef.current = { x: 0.35, y: 0.5 };
                if (sphereGroupRef.current) {
                  sphereGroupRef.current.rotation.x = 0.35;
                  sphereGroupRef.current.rotation.y = 0.5;
                }
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition flex items-center gap-1.5"
              title="Reset View Orientation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>
          </div>

          {/* Probability Gauge Bar (Bottom Center-Right) */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 backdrop-blur-md w-48 shadow-lg">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-blue-400">|0⟩ {prob0.toFixed(0)}%</span>
              <span className="text-yellow-400">|1⟩ {prob1.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div className="bg-blue-500 transition-all duration-300" style={{ width: `${prob0}%` }} />
              <div className="bg-yellow-500 transition-all duration-300" style={{ width: `${prob1}%` }} />
            </div>
          </div>
        </div>

        {/* Right Side Control Deck & Physics Notes */}
        <div className="lg:col-span-4 bg-[#F8FAFC] border-t lg:border-t-0 lg:border-l border-[#E2E8F0] flex flex-col justify-between p-5">
          {/* Navigation Tabs */}
          <div>
            <div className="flex rounded-lg bg-[#E2E8F0] p-1 border border-[#CBD5E1] mb-5">
              <button
                onClick={() => setActiveTab("gates")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "gates" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                Quantum Gates
              </button>
              <button
                onClick={() => setActiveTab("coordinates")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "coordinates" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                Angles (θ, φ)
              </button>
              <button
                onClick={() => setActiveTab("decoherence")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "decoherence" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                Noise (T1/T2)
              </button>
            </div>

            {/* TAB 1: GATES */}
            {activeTab === "gates" && (
              <div className="space-y-4">
                {/* Basis State Shortcuts */}
                <div>
                  <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider block mb-2">
                    Basis State Presets
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => setPresetState(0, 0, "0")}
                      className="py-1.5 bg-white hover:bg-[#F1F5F9] text-[#2563EB] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      |0⟩
                    </button>
                    <button
                      onClick={() => setPresetState(Math.PI, 0, "1")}
                      className="py-1.5 bg-white hover:bg-[#F1F5F9] text-[#2563EB] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      |1⟩
                    </button>
                    <button
                      onClick={() => setPresetState(Math.PI / 2, 0, "+")}
                      className="py-1.5 bg-white hover:bg-[#F1F5F9] text-[#16A34A] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      |+⟩
                    </button>
                    <button
                      onClick={() => setPresetState(Math.PI / 2, Math.PI, "-")}
                      className="py-1.5 bg-white hover:bg-[#F1F5F9] text-[#16A34A] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      |-⟩
                    </button>
                    <button
                      onClick={() => setPresetState(Math.PI / 2, Math.PI / 2, "+i")}
                      className="py-1.5 bg-white hover:bg-[#F1F5F9] text-[#D97706] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      |+i⟩
                    </button>
                    <button
                      onClick={() => setPresetState(Math.PI / 2, (3 * Math.PI) / 2, "-i")}
                      className="py-1.5 bg-white hover:bg-[#F1F5F9] text-[#D97706] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      |-i⟩
                    </button>
                    <button
                      onClick={() => setPresetState(Math.PI / 3, Math.PI / 4, "Superposition")}
                      className="col-span-2 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#2563EB] rounded-lg text-xs font-mono font-bold transition border border-[#CBD5E1] shadow-xs"
                    >
                      Equal Mix (θ=60°)
                    </button>
                  </div>
                </div>

                {/* Basic Pauli & Hadamard Gates */}
                <div>
                  <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider block mb-2">
                    Single-Qubit Unitary Gates
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={applyGateX}
                      className="p-2.5 bg-white hover:bg-[#EFF6FF] text-[#0F172A] rounded-xl border border-[#CBD5E1] hover:border-[#2563EB] font-mono text-center transition flex flex-col items-center shadow-xs"
                    >
                      <span className="text-base font-bold text-[#2563EB]">X</span>
                      <span className="text-[10px] text-[#64748B] mt-0.5">NOT / π-X</span>
                    </button>
                    <button
                      onClick={applyGateY}
                      className="p-2.5 bg-white hover:bg-[#EFF6FF] text-[#0F172A] rounded-xl border border-[#CBD5E1] hover:border-[#2563EB] font-mono text-center transition flex flex-col items-center shadow-xs"
                    >
                      <span className="text-base font-bold text-[#2563EB]">Y</span>
                      <span className="text-[10px] text-[#64748B] mt-0.5">π-Y</span>
                    </button>
                    <button
                      onClick={applyGateZ}
                      className="p-2.5 bg-white hover:bg-[#EFF6FF] text-[#0F172A] rounded-xl border border-[#CBD5E1] hover:border-[#2563EB] font-mono text-center transition flex flex-col items-center shadow-xs"
                    >
                      <span className="text-base font-bold text-[#2563EB]">Z</span>
                      <span className="text-[10px] text-[#64748B] mt-0.5">Phase-Flip</span>
                    </button>
                    <button
                      onClick={applyGateH}
                      className="p-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] rounded-xl border border-[#BFDBFE] font-mono text-center transition flex flex-col items-center shadow-xs"
                    >
                      <span className="text-base font-bold">H</span>
                      <span className="text-[10px] text-[#2563EB] mt-0.5 font-semibold">Hadamard</span>
                    </button>
                  </div>
                </div>

                {/* Phase & Continuous Rotations */}
                <div>
                  <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider block mb-2">
                    Phase & Parameterized Rotations
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                    <button
                      onClick={applyGateS}
                      className="py-2 bg-white hover:bg-[#F1F5F9] text-purple-700 rounded-lg border border-[#CBD5E1] transition text-center font-bold shadow-xs"
                      title="S Gate (+π/2 phase)"
                    >
                      S
                    </button>
                    <button
                      onClick={applyGateT}
                      className="py-2 bg-white hover:bg-[#F1F5F9] text-purple-700 rounded-lg border border-[#CBD5E1] transition text-center font-bold shadow-xs"
                      title="T Gate (+π/4 phase)"
                    >
                      T
                    </button>
                    <button
                      onClick={() => applyRx(Math.PI / 4)}
                      className="py-2 bg-white hover:bg-[#F1F5F9] text-[#16A34A] rounded-lg border border-[#CBD5E1] transition text-center font-bold shadow-xs"
                      title="Rx(π/4)"
                    >
                      Rx(45°)
                    </button>
                    <button
                      onClick={() => applyRy(Math.PI / 4)}
                      className="py-2 bg-white hover:bg-[#F1F5F9] text-[#D97706] rounded-lg border border-[#CBD5E1] transition text-center font-bold shadow-xs"
                      title="Ry(π/4)"
                    >
                      Ry(45°)
                    </button>
                    <button
                      onClick={() => applyRz(Math.PI / 4)}
                      className="py-2 bg-white hover:bg-[#F1F5F9] text-[#2563EB] rounded-lg border border-[#CBD5E1] transition text-center font-bold shadow-xs"
                      title="Rz(π/4)"
                    >
                      Rz(45°)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COORDINATES */}
            {activeTab === "coordinates" && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>Polar Angle (θ):</span>
                    <span className="text-cyan-400 font-bold">{((theta * 180) / Math.PI).toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI}
                    step="0.01"
                    value={theta}
                    onChange={(e) => setTheta(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0° (|0⟩)</span>
                    <span>90° (Equator)</span>
                    <span>180° (|1⟩)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>Azimuthal Angle (φ):</span>
                    <span className="text-amber-400 font-bold">{((phi * 180) / Math.PI).toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={2 * Math.PI}
                    step="0.01"
                    value={phi}
                    onChange={(e) => setPhi(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0° (+X)</span>
                    <span>90° (+Y)</span>
                    <span>180° (-X)</span>
                    <span>270° (-Y)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono">
                  <div className="text-slate-200 font-semibold mb-1">Cartesian Coordinates (r):</div>
                  <div>x = sin(θ)cos(φ) = <span className="text-emerald-400">{vecX.toFixed(3)}</span></div>
                  <div>y = sin(θ)sin(φ) = <span className="text-yellow-400">{vecZ.toFixed(3)}</span></div>
                  <div>z = cos(θ) = <span className="text-blue-400">{vecY.toFixed(3)}</span></div>
                </div>
              </div>
            )}

            {/* TAB 3: DECOHERENCE */}
            {activeTab === "decoherence" && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>State Purity (r = |v|):</span>
                    <span className="text-purple-400 font-bold">{purity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={purity}
                    onChange={(e) => setPurity(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0.0 (Maximally Mixed)</span>
                    <span>1.0 (Pure State)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bloch Ball Interior & Decoherence</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    While pure states lie exclusively on the <strong>surface</strong> of the sphere (radius = 1),
                    environmental thermal noise, energy relaxation (T1), and dephasing (T2) shrink the vector into the
                    <strong> interior of the Bloch ball</strong> ($r &lt; 1$).
                  </p>
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                    ρ = ½ (I + r · σ)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Educational Notes Box (Linked to Domain 05) */}
          <div className="mt-5 p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <Info className="w-4 h-4" />
              <span>Physics Note</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedNote !== "default"
                ? selectedNote
                : "The Bloch sphere is a geometrical representation of the pure state space of a 2-level quantum system (qubit). The north and south poles correspond to the computational basis states |0⟩ and |1⟩."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlochSphere3DStudio;
