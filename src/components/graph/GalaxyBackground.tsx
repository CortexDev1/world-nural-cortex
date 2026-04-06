'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { ThemeId } from '@/lib/themes';

interface GalaxyConfig {
  bgColor: number;
  coreColor: number;
  nebulaColor1: number;
  nebulaColor2: number;
  starColor: number;
  spiralColors: number[];
  particleOpacity: number;
}

const GALAXY_CONFIGS: Record<ThemeId, GalaxyConfig> = {
  dark: {
    bgColor: 0x0a0a12,
    coreColor: 0xffe8cc,
    nebulaColor1: 0x2a1050,
    nebulaColor2: 0x102040,
    starColor: 0xccddff,
    spiralColors: [0x4EA8FF, 0xB17EF5, 0x50E3A0, 0xFFB347, 0xFF7B6B, 0x47D4E8, 0xE878B8],
    particleOpacity: 0.6,
  },
  light: {
    bgColor: 0xf0f0f5,
    coreColor: 0xddccaa,
    nebulaColor1: 0xe8e0f0,
    nebulaColor2: 0xe0e8f0,
    starColor: 0x888899,
    spiralColors: [0x4EA8FF, 0xB17EF5, 0x50E3A0, 0xFFB347, 0xFF7B6B, 0x47D4E8, 0xE878B8],
    particleOpacity: 0.15,
  },
  midnight: {
    bgColor: 0x050810,
    coreColor: 0xaaccff,
    nebulaColor1: 0x101830,
    nebulaColor2: 0x081020,
    starColor: 0xaabbee,
    spiralColors: [0x4EA8FF, 0x6688cc, 0x88aadd, 0x4488bb, 0x6699cc, 0x5577aa, 0x7799cc],
    particleOpacity: 0.7,
  },
  ember: {
    bgColor: 0x0e0806,
    coreColor: 0xffcc88,
    nebulaColor1: 0x301808,
    nebulaColor2: 0x201008,
    starColor: 0xffddaa,
    spiralColors: [0xFFB347, 0xD4A853, 0xFF7B6B, 0xC4856A, 0xE878B8, 0xB17EF5, 0x47D4E8],
    particleOpacity: 0.6,
  },
};

interface GalaxyBackgroundProps {
  theme: ThemeId;
}

export function GalaxyBackground({ theme }: GalaxyBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config = GALAXY_CONFIGS[theme] ?? GALAXY_CONFIGS.dark;

    // ── Setup ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.bgColor);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Star field — 2000 random stars ─────────────────────────────────────
    const starGeom = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 30 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: config.starColor,
      size: 0.15,
      transparent: true,
      opacity: config.particleOpacity * 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    // ── Galaxy spiral — 800 particles in 3 logarithmic arms ────────────────
    const spiralGeom = new THREE.BufferGeometry();
    const spiralCount = 800;
    const spiralPositions = new Float32Array(spiralCount * 3);
    const spiralColorArr = new Float32Array(spiralCount * 3);
    const arms = 3;

    for (let i = 0; i < spiralCount; i++) {
      const arm = i % arms;
      const t = (i / spiralCount) * 6;
      const angle = t * 0.8 + arm * ((Math.PI * 2) / arms);
      const radius = 1 + t * 1.8;
      const scatter = (0.3 + t * 0.15) * (Math.random() - 0.5) * 2;

      spiralPositions[i * 3] = Math.cos(angle) * radius + scatter;
      spiralPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      spiralPositions[i * 3 + 2] = Math.sin(angle) * radius + scatter;

      const col = new THREE.Color(config.spiralColors[i % config.spiralColors.length]);
      spiralColorArr[i * 3] = col.r;
      spiralColorArr[i * 3 + 1] = col.g;
      spiralColorArr[i * 3 + 2] = col.b;
    }
    spiralGeom.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));
    spiralGeom.setAttribute('color', new THREE.BufferAttribute(spiralColorArr, 3));

    const spiralMat = new THREE.PointsMaterial({
      size: 0.12,
      transparent: true,
      opacity: config.particleOpacity,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const spiral = new THREE.Points(spiralGeom, spiralMat);
    scene.add(spiral);

    // ── Central glow — galaxy core ─────────────────────────────────────────
    const coreGeom = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: config.coreColor,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    scene.add(core);

    // ── Outer core halo ────────────────────────────────────────────────────
    const haloGeom = new THREE.SphereGeometry(3, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: config.coreColor,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    scene.add(halo);

    // ── Nebula dust layer — extra particles in a wide disk ─────────────────
    const dustGeom = new THREE.BufferGeometry();
    const dustCount = 400;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const nebCol1 = new THREE.Color(config.nebulaColor1);
    const nebCol2 = new THREE.Color(config.nebulaColor2);

    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 10;
      dustPositions[i * 3] = Math.cos(angle) * radius;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius;

      const t = Math.random();
      dustColors[i * 3] = nebCol1.r * (1 - t) + nebCol2.r * t;
      dustColors[i * 3 + 1] = nebCol1.g * (1 - t) + nebCol2.g * t;
      dustColors[i * 3 + 2] = nebCol1.b * (1 - t) + nebCol2.b * t;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeom.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.35,
      transparent: true,
      opacity: config.particleOpacity * 0.35,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // ── Animation loop ─────────────────────────────────────────────────────
    let animId = 0;
    let time = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      time += 0.001;

      // Slow galaxy rotation
      spiral.rotation.y += 0.0003;
      dust.rotation.y += 0.0002;
      stars.rotation.y += 0.00005;

      // Core pulse
      const pulse = 1 + Math.sin(time * 2) * 0.1;
      core.scale.set(pulse, pulse, pulse);
      halo.scale.set(pulse * 0.98, pulse * 0.98, pulse * 0.98);

      // Gentle camera orbit
      camera.position.x = 18 * Math.sin(time * 0.15);
      camera.position.z = 18 * Math.cos(time * 0.15);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    // ── Resize handler ─────────────────────────────────────────────────────
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      starGeom.dispose();
      starMat.dispose();
      spiralGeom.dispose();
      spiralMat.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      haloGeom.dispose();
      haloMat.dispose();
      dustGeom.dispose();
      dustMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
