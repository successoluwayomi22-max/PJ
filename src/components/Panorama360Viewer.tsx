import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Expand, Minimize2, Move, ShieldCheck } from 'lucide-react';

interface Panorama360ViewerProps {
  imageUrl: string;
  caption?: string;
  locationName?: string;
}

export const Panorama360Viewer: React.FC<Panorama360ViewerProps> = ({
  imageUrl,
  caption,
  locationName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [heading, setHeading] = useState(180);
  const [expanded, setExpanded] = useState(false);

  const lonLatRef = useRef({ lon: 180, lat: 4, targetLon: 180, targetLat: 4 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, width / height, 1, 1100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Inverted 3D Sphere for true WebGL 360° Equirectangular projection
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const texture = loader.load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

    // Subtle internal 3D horizon reference ring inside the 360 sphere
    const ringGeo = new THREE.RingGeometry(195, 198, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -35;
    scene.add(ringMesh);

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLon = 0;
    let startLat = 0;

    const domElem = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLon = lonLatRef.current.targetLon;
      startLat = lonLatRef.current.targetLat;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      lonLatRef.current.targetLon = (startX - e.clientX) * 0.18 + startLon;
      lonLatRef.current.targetLat = Math.max(
        -75,
        Math.min(75, (e.clientY - startY) * 0.18 + startLat)
      );
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.max(38, Math.min(88, camera.fov + e.deltaY * 0.04));
      camera.updateProjectionMatrix();
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (!isDragging) {
        lonLatRef.current.targetLon += 0.035;
      }

      lonLatRef.current.lon +=
        (lonLatRef.current.targetLon - lonLatRef.current.lon) * 0.09;
      lonLatRef.current.lat +=
        (lonLatRef.current.targetLat - lonLatRef.current.lat) * 0.09;

      const phi = THREE.MathUtils.degToRad(90 - lonLatRef.current.lat);
      const theta = THREE.MathUtils.degToRad(lonLatRef.current.lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);

      const deg = ((Math.round(lonLatRef.current.lon) % 360) + 360) % 360;
      setHeading(deg);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      texture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [imageUrl, expanded]);

  const cardinal =
    heading >= 315 || heading < 45
      ? 'N'
      : heading < 135
      ? 'E'
      : heading < 225
      ? 'S'
      : 'W';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-slate-950 select-none transition-all duration-300 ${
        expanded ? 'h-[500px]' : 'h-72 sm:h-80'
      }`}
    >
      {/* True Three.js WebGL 360° Sphere Viewport */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Minimal Architectural HUD */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 text-white text-[11px] font-mono tracking-wider uppercase backdrop-blur-md border border-white/15">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>WebGL 360° Sphere</span>
          <span className="text-sky-300">
            {heading}° {cardinal}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 text-white text-[11px] font-medium hover:bg-white/15 border border-white/15 backdrop-blur-md transition-colors"
        >
          {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
          <span>{expanded ? 'Collapse' : 'Fullscreen 360°'}</span>
        </button>
      </div>

      {/* Bottom Spatial Metadata Bar */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-black/70 text-slate-200 text-xs backdrop-blur-md border border-white/10">
        <span className="flex items-center gap-1.5 truncate font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{caption || locationName || '360° Field Capture'}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-sky-300 shrink-0 ml-3">
          <Move className="w-3.5 h-3.5" /> Drag 360° • Scroll to Zoom
        </span>
      </div>
    </div>
  );
};
