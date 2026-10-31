import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowUpRight, Compass, Globe, MapPin, Pause, Play, Radio, RotateCcw } from 'lucide-react';
import { NewsPost } from '../types';

interface Globe3DProps {
  posts: NewsPost[];
  primaryColor: string;
  breakingColor: string;
  isDark: boolean;
  selectedPostId?: string | null;
  onSelectPost?: (post: NewsPost) => void;
  compact?: boolean;
}

// Convert Lat/Lng to 3D Cartesian Vector3 on a sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const Globe3D: React.FC<Globe3DProps> = ({
  posts,
  primaryColor,
  breakingColor,
  isDark,
  selectedPostId,
  onSelectPost,
  compact = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredPost, setHoveredPost] = useState<NewsPost | null>(null);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const targetRotationRef = useRef({ x: 0.25, y: -1.8 });
  const currentRotationRef = useRef({ x: 0.25, y: -1.8 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. WebGL Scene, Camera & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, compact ? 275 : 255);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Master Pivot Group for smooth damping rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const RADIUS = 88;
    const primaryThreeColor = new THREE.Color(primaryColor);
    const breakingThreeColor = new THREE.Color(breakingColor);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(primaryColor, 2.2);
    dirLight1.position.set(180, 140, 160);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(breakingColor, 1.1);
    dirLight2.position.set(-180, -120, 100);
    scene.add(dirLight2);

    // 3. Core Earth Sphere
    const sphereGeo = new THREE.SphereGeometry(RADIUS, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x090d16 : 0xe2e8f0,
      roughness: 0.65,
      metalness: 0.25,
    });
    const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(earthMesh);

    // 4. Geodesic Graticule Wireframe Overlay
    const wireGeo = new THREE.SphereGeometry(RADIUS + 0.35, 32, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: isDark ? primaryThreeColor : new THREE.Color(0x0284c7),
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.08 : 0.11,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // 5. Fibonacci Lattice Landmass Particle Cloud (2,400 3D surface points)
    const numPoints = 2400;
    const positions = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      // Procedural continent clustering mask
      const noise =
        Math.sin(x * 5.2 + z * 3.1) * Math.cos(y * 4.5) +
        Math.sin(z * 8.0 - x * 4.2) * 0.5;

      const alt = noise > 0.05 ? RADIUS + 0.9 : RADIUS + 0.2;
      positions[i * 3] = x * alt;
      positions[i * 3 + 1] = y * alt;
      positions[i * 3 + 2] = z * alt;

      const c = noise > 0.05
        ? primaryThreeColor
        : new THREE.Color(isDark ? 0x334155 : 0x94a3b8);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const dotMat = new THREE.PointsMaterial({
      size: compact ? 1.35 : 1.55,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.72 : 0.65,
    });
    const dotPoints = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(dotPoints);

    // 6. Outer Atmospheric Halo Ring
    const haloGeo = new THREE.RingGeometry(RADIUS * 1.01, RADIUS * 1.13, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: primaryThreeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isDark ? 0.11 : 0.08,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 7. Ambient 3D Space Starfield
    const starCount = 500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 2] = -80 - Math.random() * 250;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: isDark ? 0x94a3b8 : 0x64748b,
      size: 1.2,
      transparent: true,
      opacity: 0.45,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 8. 3D Cubic Bezier Orbital Telemetry Arcs between News Bureaus
    if (posts.length >= 2) {
      for (let i = 0; i < posts.length; i++) {
        const postA = posts[i];
        const postB = posts[(i + 1) % posts.length];
        const startVec = latLngToVector3(postA.latitude, postA.longitude, RADIUS + 1);
        const endVec = latLngToVector3(postB.latitude, postB.longitude, RADIUS + 1);

        const midVec = startVec.clone().add(endVec).multiplyScalar(0.5);
        const distance = startVec.distanceTo(endVec);
        midVec.normalize().multiplyScalar(RADIUS + distance * 0.42);

        const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
        const arcPoints = curve.getPoints(44);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMat = new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? primaryThreeColor : breakingThreeColor,
          transparent: true,
          opacity: 0.42,
        });
        const arcLine = new THREE.Line(arcGeo, arcMat);
        globeGroup.add(arcLine);
      }
    }

    // 9. Interactive 3D News Beacon Pillars & Raycast Targets
    const interactiveMeshes: THREE.Object3D[] = [];
    const pulseRings: THREE.Mesh[] = [];

    posts.forEach((post) => {
      const surfacePos = latLngToVector3(post.latitude, post.longitude, RADIUS);
      const normal = surfacePos.clone().normalize();

      const isBreaking = post.isEyewitness || post.isBreakingPinned;
      const isDisputed = post.status === 'disputed';
      const beaconColor = isDisputed
        ? new THREE.Color(0xf59e0b)
        : isBreaking
        ? breakingThreeColor
        : primaryThreeColor;

      // 3D Pillar rising along the normal vector
      const pillarHeight = selectedPostId === post.id ? 18 : isBreaking ? 13 : 9;
      const pillarGeo = new THREE.CylinderGeometry(0.85, 0.35, pillarHeight, 12);
      pillarGeo.translate(0, pillarHeight / 2, 0);
      pillarGeo.rotateX(Math.PI / 2);

      const pillarMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
      });
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.copy(surfacePos);
      pillarMesh.lookAt(surfacePos.clone().add(normal));
      pillarMesh.userData = { post };
      globeGroup.add(pillarMesh);

      // Glowing Tip Sphere for easy 3D Raycasting
      const tipPos = latLngToVector3(
        post.latitude,
        post.longitude,
        RADIUS + pillarHeight
      );
      const tipGeo = new THREE.SphereGeometry(selectedPostId === post.id ? 3.4 : 2.5, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
      });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.copy(tipPos);
      tipMesh.userData = { post };
      globeGroup.add(tipMesh);
      interactiveMeshes.push(tipMesh, pillarMesh);

      // Surface Pulse Ring
      const ringGeo = new THREE.RingGeometry(2.2, 3.6, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(
        latLngToVector3(post.latitude, post.longitude, RADIUS + 0.6)
      );
      ringMesh.lookAt(surfacePos.clone().add(normal));
      globeGroup.add(ringMesh);
      pulseRings.push(ringMesh);
    });

    // 10. Pointer Drag & 3D Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let prevPointerPos = { x: 0, y: 0 };

    const domElem = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      prevPointerPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = domElem.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevPointerPos.x;
        const dy = e.clientY - prevPointerPos.y;
        targetRotationRef.current.y += dx * 0.0065;
        targetRotationRef.current.x = Math.max(
          -1.15,
          Math.min(1.15, targetRotationRef.current.x + dy * 0.0065)
        );
        prevPointerPos = { x: e.clientX, y: e.clientY };
        return;
      }

      // Raycast against 3D beacon tips
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        const hitPost = intersects[0].object.userData?.post as NewsPost | undefined;
        setHoveredPost(hitPost || null);
        domElem.style.cursor = 'pointer';
      } else {
        setHoveredPost(null);
        domElem.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (moveDist < 6) {
        // Click event -> check raycaster
        const rect = domElem.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, false);
        if (intersects.length > 0) {
          const hitPost = intersects[0].object.userData?.post as NewsPost | undefined;
          if (hitPost && onSelectPost) {
            onSelectPost(hitPost);
          }
        }
      }
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 11. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 12. 60fps Animation Loop with Spring Damping
    let frameId: number;
    let clock = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      clock += 0.035;

      if (autoRotateRef.current && !isDragging) {
        targetRotationRef.current.y += 0.0028;
      }

      // Smooth inertial interpolation
      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      globeGroup.rotation.x = currentRotationRef.current.x;
      globeGroup.rotation.y = currentRotationRef.current.y;

      // Animate surface sonar rings
      pulseRings.forEach((ring, i) => {
        const s = 1 + ((Math.sin(clock + i * 1.3) + 1) * 0.85);
        ring.scale.set(s, s, 1);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.1, 0.85 - (s - 1) * 0.45);
      });

      starField.rotation.y -= 0.0004;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [posts, primaryColor, breakingColor, isDark, compact, selectedPostId]);

  return (
    <div className="relative select-none overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-slate-950/90 via-slate-950 to-black text-white shadow-2xl">
      {/* Top Minimal Architectural Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: breakingColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: breakingColor }}
            />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            WebGL Orbital Telemetry • {posts.length} Active Bureaus
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title={autoRotate ? 'Pause Orbital Rotation' : 'Resume Orbital Rotation'}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              targetRotationRef.current = { x: 0.25, y: -1.8 };
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Reset Camera Axis"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* True Three.js WebGL Viewport */}
      <div
        ref={mountRef}
        className={`relative w-full ${
          compact ? 'h-72' : 'h-[480px]'
        } cursor-grab active:cursor-grabbing`}
      />

      {/* Hovered 3D Beacon Telemetry Overlay */}
      {hoveredPost ? (
        <div className="pointer-events-none absolute bottom-3.5 left-3.5 right-3.5 p-3.5 rounded-xl bg-slate-950/90 border border-white/15 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-white font-sans font-medium">
              <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {hoveredPost.locationName}
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <Radio className="w-3 h-3 animate-pulse" />
              {hoveredPost.latitude.toFixed(2)}°N, {hoveredPost.longitude.toFixed(2)}°E
            </span>
          </div>
          <p className="text-xs sm:text-sm font-editorial font-medium text-white line-clamp-2">
            {hoveredPost.headline}
          </p>
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-slate-400">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            Drag to orbit 3D sphere • Click any beacon pillar
          </span>
          <span className="flex items-center gap-1">
            THREE.WebGLRenderer <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
};
