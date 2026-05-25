import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';

// ── Tuning ──────────────────────────────────────────────────────────────────
const COUNT        = 1800;
const REPEL_RADIUS = 2.4;
const REPEL_FORCE  = 0.22;
const DAMPING      = 0.86;
const SPRING       = 0.03;

// ── Global mouse NDC tracked via window listener (bypasses R3F + pointer-events) ──
const mouseNDC = { x: 0, y: 0 };

function onWindowMouseMove(e: MouseEvent) {
  // Convert clientX/Y → NDC: x ∈ [-1, +1], y ∈ [-1, +1] (bottom-left origin)
  mouseNDC.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

// ── ParticleField ───────────────────────────────────────────────────────────
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const originPos  = useRef<Float32Array>(new Float32Array(COUNT * 3));
  const vel        = useRef<Float32Array>(new Float32Array(COUNT * 3));
  const phaseOfs   = useRef<Float32Array>(new Float32Array(COUNT)); // unique per-particle phase

  const mouseWorld = useRef(new THREE.Vector3());
  const ndcVec     = useRef(new THREE.Vector2());
  const raycaster  = useMemo(() => new THREE.Raycaster(), []);
  const planeZ     = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const { camera } = useThree();

  // Attach window-level mouse listener
  useEffect(() => {
    window.addEventListener('mousemove', onWindowMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onWindowMouseMove);
  }, []);

  // ── Build geometry imperatively ───────────────────────────────────────────
  const { geometry, posAttr } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color('#4ade80'),
      new THREE.Color('#a3e635'),
      new THREE.Color('#2dd4bf'),
      new THREE.Color('#86efac'),
    ];

    for (let i = 0; i < COUNT; i++) {
      const r     = 2.5 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const x     = r * Math.sin(phi) * Math.cos(theta);
      const y     = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      const z     = r * Math.cos(phi);

      pos[i * 3] = x;  pos[i * 3 + 1] = y;  pos[i * 3 + 2] = z;
      originPos.current[i * 3]     = x;
      originPos.current[i * 3 + 1] = y;
      originPos.current[i * 3 + 2] = z;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

      // Random phase so each particle drifts independently
      phaseOfs.current[i] = Math.random() * Math.PI * 2;
    }

    const pa = new THREE.BufferAttribute(pos, 3);
    pa.setUsage(THREE.DynamicDrawUsage);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', pa);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    return { geometry: geo, posAttr: pa };
  }, []);

  // ── Per-frame physics ─────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    // Use our own tracked NDC (not R3F's mouse which needs pointer events on canvas)
    ndcVec.current.set(mouseNDC.x, mouseNDC.y);
    raycaster.setFromCamera(ndcVec.current, camera);
    raycaster.ray.intersectPlane(planeZ, mouseWorld.current);

    const mx = mouseWorld.current.x;
    const my = mouseWorld.current.y;

    const pos = posAttr.array as Float32Array;
    const org = originPos.current;
    const v   = vel.current;

    const t = clock.getElapsedTime();
    const ph = phaseOfs.current;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const p = ph[i]; // unique phase

      // Spring toward origin
      let ax = (org[ix] - pos[ix]) * SPRING;
      let ay = (org[iy] - pos[iy]) * SPRING;
      let az = (org[iz] - pos[iz]) * SPRING;

      // Ambient drift — gentle sine-wave float unique per particle
      ax += Math.sin(t * 0.4 + p)       * 0.003;
      ay += Math.cos(t * 0.35 + p * 1.3) * 0.004;
      az += Math.sin(t * 0.3 + p * 0.7)  * 0.002;

      // Repulsion from cursor
      const dx   = pos[ix] - mx;
      const dy   = pos[iy] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0.0001) {
        const str = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
        ax += (dx / dist) * str;
        ay += (dy / dist) * str;
      }

      v[ix] = (v[ix] + ax) * DAMPING;
      v[iy] = (v[iy] + ay) * DAMPING;
      v[iz] = (v[iz] + az) * DAMPING;

      pos[ix] += v[ix];
      pos[iy] += v[iy];
      pos[iz] += v[iz];
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

// ── Orbiting Ring ───────────────────────────────────────────────────────────
function OrbitingRing() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.14;
    groupRef.current.rotation.z = clock.getElapsedTime() * 0.04;
  });

  const dots = useMemo(() => {
    const items: { pos: [number, number, number]; color: string }[] = [];
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 2.9;
      items.push({
        pos:   [Math.cos(a) * r, Math.sin(a * 2) * 0.38, Math.sin(a) * r],
        color: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#a3e635' : '#2dd4bf',
      });
    }
    return items;
  }, []);

  return (
    <group ref={groupRef}>
      {dots.map(({ pos, color }, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export function HeroCanvas() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Canvas
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 55 }}
      style={{ width: '100%', height: '100%' }}
      performance={{ min: 0.5 }}
    >
      <Suspense fallback={null}>
        <ParticleField />
        {!isMobile && <OrbitingRing />}
      </Suspense>
    </Canvas>
  );
}
