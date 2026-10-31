import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Auth3DSceneProps {
  primaryColor: string;
  secondaryColor: string;
}

export const Auth3DScene: React.FC<Auth3DSceneProps> = ({
  primaryColor,
  secondaryColor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const c1 = new THREE.Color(primaryColor);
    const c2 = new THREE.Color(secondaryColor);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const pLight1 = new THREE.PointLight(primaryColor, 4.5, 400);
    pLight1.position.set(90, 90, 110);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(secondaryColor, 4.0, 400);
    pLight2.position.set(-90, -80, 90);
    scene.add(pLight2);

    // 1. Inner Faceted Architectural Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(42, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f17,
      roughness: 0.2,
      metalness: 0.85,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Wireframe shell around core
    const shellGeo = new THREE.IcosahedronGeometry(44, 1);
    const shellMat = new THREE.MeshBasicMaterial({
      color: c1,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    group.add(shellMesh);

    // 2. Three Precision Gyroscopic Orbital Rings
    const ring1Geo = new THREE.TorusGeometry(66, 0.55, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: c1,
      transparent: true,
      opacity: 0.55,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(82, 0.45, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: c2,
      transparent: true,
      opacity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    group.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(98, 0.35, 16, 120);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.22,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 2.2;
    group.add(ring3);

    // 3. 3D Orbital Particle Field
    const particleCount = 650;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 52 + Math.random() * 95;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      posArray[i * 3 + 2] = r * Math.cos(phi);
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const partMat = new THREE.PointsMaterial({
      color: c1,
      size: 1.5,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(partGeo, partMat);
    group.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove);

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

      coreMesh.rotation.y += 0.004;
      coreMesh.rotation.x += 0.002;
      shellMesh.rotation.y -= 0.003;
      shellMesh.rotation.z += 0.002;

      ring1.rotation.z += 0.005;
      ring2.rotation.x -= 0.004;
      ring3.rotation.y += 0.003;
      particles.rotation.y += 0.0015;

      // Smooth cursor parallax
      group.rotation.y += (mouseX * 0.55 - group.rotation.y) * 0.05;
      group.rotation.x += (mouseY * 0.45 - group.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [primaryColor, secondaryColor]);

  return <div ref={mountRef} className="w-full h-full min-h-[420px]" />;
};

