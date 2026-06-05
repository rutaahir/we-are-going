import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface City {
  name: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  phase: number; // anti-grav phase offset
  floatRadius: number;
  floatSpeed: number;
}

interface Arc {
  from: number;
  to: number;
  progress: number;
  speed: number;
  phase: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

// LabelCard interface and constant removed because they are not used anymore.
const CITIES: City[] = [
  { name: "Mumbai",      label: "Mumbai Samaj",    lat: 19.07, lng: 72.87, color: "#e07c00", phase: 0.0,  floatRadius: 28, floatSpeed: 0.0007 },
  { name: "Ahmedabad",   label: "Ahmedabad HQ",    lat: 23.02, lng: 72.57, color: "#e07c00", phase: 1.4,  floatRadius: 24, floatSpeed: 0.0009 },
  { name: "Delhi",       label: "Delhi Chapter",   lat: 28.61, lng: 77.20, color: "#e07c00", phase: 2.8,  floatRadius: 32, floatSpeed: 0.0006 },
  { name: "London",      label: "London Chapter",  lat: 51.50, lng: -0.12, color: "#c06830", phase: 0.7,  floatRadius: 26, floatSpeed: 0.0008 },
  { name: "New York",    label: "US Diaspora",     lat: 40.71, lng: -74.00,color: "#c06830", phase: 2.1,  floatRadius: 30, floatSpeed: 0.00065},
  { name: "Dubai",       label: "Dubai Samaj",     lat: 25.20, lng: 55.27, color: "#c06830", phase: 3.5,  floatRadius: 22, floatSpeed: 0.00095},
  { name: "Singapore",   label: "SG Chapter",      lat: 1.35,  lng: 103.82,color: "#c06830", phase: 4.9,  floatRadius: 20, floatSpeed: 0.00085},
];

const ARCS: Arc[] = [
  { from: 0, to: 1, progress: 0.0,  speed: 0.0012, phase: 0.0  },
  { from: 1, to: 2, progress: 0.3,  speed: 0.0010, phase: 0.5  },
  { from: 0, to: 3, progress: 0.6,  speed: 0.0008, phase: 1.0  },
  { from: 2, to: 4, progress: 0.1,  speed: 0.0009, phase: 1.5  },
  { from: 0, to: 5, progress: 0.8,  speed: 0.0011, phase: 2.0  },
  { from: 1, to: 6, progress: 0.45, speed: 0.0007, phase: 2.5  },
  { from: 3, to: 4, progress: 0.2,  speed: 0.0013, phase: 3.0  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function latLngToXY(
  lat: number, lng: number,
  rotAngle: number,
  cx: number, cy: number, r: number
): { x: number; y: number; visible: boolean } {
  const φ = (lat * Math.PI) / 180;
  const λ = (lng * Math.PI) / 180 + rotAngle;
  const cosφ = Math.cos(φ);
  const x = cx + r * cosφ * Math.sin(λ);
  const y = cy - r * Math.sin(φ);
  const z = cosφ * Math.cos(λ);
  return { x, y, visible: z > -0.1 };
}

function bezierPoint(
  t: number,
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number,
  p3x: number, p3y: number
) {
  const mt = 1 - t;
  return {
    x: mt**3*p0x + 3*mt**2*t*p1x + 3*mt*t**2*p2x + t**3*p3x,
    y: mt**3*p0y + 3*mt**2*t*p1y + 3*mt*t**2*p2y + t**3*p3y,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AntiGravityGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // ── Resize handler ────────────────────────────────────────────────────────
    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // ── Spawn particles ───────────────────────────────────────────────────────
    const spawnParticle = (cx: number, cy: number, r: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = r * (0.6 + Math.random() * 0.5);
      const life  = 80 + Math.random() * 120;
      return {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.2 + Math.random() * 0.5),
        alpha: 0.15 + Math.random() * 0.25,
        size: 1.5 + Math.random() * 2.5,
        life, maxLife: life,
      };
    };

    // ── Draw India polygon (simplified) ───────────────────────────────────────
    const drawIndia = (
      rotAngle: number,
      cx: number, cy: number, r: number
    ) => {
      // Simplified India outline as lat/lng points
      const india = [
        [37.1, 74.3],[34.0, 77.8],[32.7, 79.5],[30.8, 78.4],[28.6, 77.2],
        [28.0, 73.8],[24.9, 67.3],[23.0, 68.0],[22.6, 69.5],[20.2, 66.4],
        [16.5, 73.2],[14.0, 74.4],[10.0, 76.3],[8.1, 77.5],[8.9, 79.4],
        [11.9, 79.9],[13.1, 80.3],[16.5, 80.5],[18.9, 82.6],[20.4, 85.8],
        [21.5, 87.5],[22.7, 88.4],[22.5, 91.8],[24.2, 91.9],[26.2, 90.4],
        [27.5, 89.7],[27.0, 88.9],[27.5, 88.1],[28.2, 84.2],[30.2, 81.0],
        [32.4, 79.0],[34.5, 76.3],[36.2, 74.3],[37.1, 74.3],
      ];
      const pts = india.map(([lat, lng]) => latLngToXY(lat, lng, rotAngle, cx, cy, r));
      const visCount = pts.filter(p => p.visible).length;
      if (visCount < pts.length * 0.5) return;

      ctx.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(224,124,0,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(224,124,0,0.35)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    // ── Main draw loop ────────────────────────────────────────────────────────
    const draw = (t: number) => {
      tRef.current = t;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const R  = Math.min(W, H) * 0.38; // globe radius
      // Bob up/down (levitation)
      const bob = Math.sin(t * 0.0008) * 18;
      const cy  = H / 2 + bob;

      // Rotation
      const rotAngle = t * 0.00025;

      // ── Shadow below globe ──────────────────────────────────────────────────
      const shadowY = H / 2 + R * 0.82;
      const shadowScale = 0.9 - 0.18 * Math.sin(t * 0.0008);
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, R * shadowScale);
      shadowGrad.addColorStop(0, "rgba(180,100,0,0.18)");
      shadowGrad.addColorStop(1, "rgba(180,100,0,0)");
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * shadowScale, R * shadowScale * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();

      // ── Globe base sphere ───────────────────────────────────────────────────
      const globeGrad = ctx.createRadialGradient(cx - R*0.28, cy - R*0.28, R*0.05, cx, cy, R);
      globeGrad.addColorStop(0, "#fffdf5");
      globeGrad.addColorStop(0.35, "#fff8ee");
      globeGrad.addColorStop(0.7, "#f8d896");
      globeGrad.addColorStop(1, "#e8b860");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();

      // Globe border
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(224,124,0,0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Grid lines ──────────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const φ = (lat * Math.PI) / 180;
        const yr = cy - R * Math.sin(φ);
        const xr = R * Math.cos(φ);
        ctx.beginPath();
        ctx.ellipse(cx, yr, xr, xr * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(200,140,40,0.13)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      // Longitude lines
      for (let lng = 0; lng < 360; lng += 30) {
        const λ = ((lng * Math.PI) / 180) + rotAngle;
        ctx.beginPath();
        for (let φdeg = -90; φdeg <= 90; φdeg += 3) {
          const φ = (φdeg * Math.PI) / 180;
          const x = cx + R * Math.cos(φ) * Math.sin(λ);
          const y = cy - R * Math.sin(φ);
          if (φdeg === -90) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(200,140,40,0.10)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.restore();

      // ── India highlight ─────────────────────────────────────────────────────
      drawIndia(rotAngle, cx, cy, R);

      // ── Specular shimmer ────────────────────────────────────────────────────
      const shimmer = ctx.createRadialGradient(
        cx - R * 0.38, cy - R * 0.38, R * 0.02,
        cx - R * 0.35, cy - R * 0.35, R * 0.42
      );
      shimmer.addColorStop(0, "rgba(255,255,245,0.55)");
      shimmer.addColorStop(0.4, "rgba(255,255,240,0.18)");
      shimmer.addColorStop(1, "rgba(255,255,235,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = shimmer;
      ctx.fill();

      // ── Anti-gravity city nodes ─────────────────────────────────────────────
      // Compute screen positions, including anti-grav float
      const cityScreenPos: { x: number; y: number; visible: boolean; floatFraction: number }[] = CITIES.map(city => {
        const base = latLngToXY(city.lat, city.lng, rotAngle, cx, cy, R);
        // Anti-grav: sine wave that crosses threshold to "break free"
        const floatWave = Math.sin(t * city.floatSpeed + city.phase);
        const floatFraction = Math.max(0, (floatWave - 0.5) / 0.5); // 0..1

        let x = base.x, y = base.y;
        if (floatFraction > 0) {
          // Direction from globe center outward
          const dx = base.x - cx, dy = base.y - cy;
          const len = Math.sqrt(dx*dx + dy*dy) || 1;
          const drift = city.floatRadius * floatFraction;
          // Add slight lateral drift for organic feel
          const lateralAngle = t * city.floatSpeed * 3 + city.phase * 2;
          x = base.x + (dx / len) * drift + Math.cos(lateralAngle) * drift * 0.3;
          y = base.y + (dy / len) * drift + Math.sin(lateralAngle) * drift * 0.2;
        }
        return { x, y, visible: base.visible, floatFraction };
      });

      // ── Arc connections ─────────────────────────────────────────────────────
      ARCS.forEach(arc => {
        arc.progress = (arc.progress + arc.speed) % 1;
        const a = cityScreenPos[arc.from];
        const b = cityScreenPos[arc.to];
        if (!a.visible && !b.visible) return;

        // Control points lifted above surface
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        // Lift toward globe center's upper region
        const liftX = (midX - cx) * 0.35;
        const liftY = (midY - cy) * 0.35 - R * 0.28;
        const c1x = a.x + (midX - a.x) * 0.5 + liftX;
        const c1y = a.y + (midY - a.y) * 0.5 + liftY;
        const c2x = b.x + (midX - b.x) * 0.5 + liftX;
        const c2y = b.y + (midY - b.y) * 0.5 + liftY;

        // Draw arc path (faint static line)
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, b.x, b.y);
        ctx.strokeStyle = "rgba(224,124,0,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Animated shooting-star dot with tail
        const trailLen = 0.12;
        for (let i = 0; i < 20; i++) {
          const frac = i / 20;
          const tp = arc.progress - frac * trailLen;
          if (tp < 0 || tp > 1) continue;
          const pt = bezierPoint(tp, a.x, a.y, c1x, c1y, c2x, c2y, b.x, b.y);
          const alpha = (1 - frac) * 0.7;
          const r2 = frac === 0 ? 3.5 : 1.5 * (1 - frac);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224,124,0,${alpha})`;
          ctx.fill();
        }
        // Glow at head
        const head = bezierPoint(arc.progress, a.x, a.y, c1x, c1y, c2x, c2y, b.x, b.y);
        const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10);
        glow.addColorStop(0, "rgba(255,160,40,0.8)");
        glow.addColorStop(1, "rgba(255,160,40,0)");
        ctx.beginPath();
        ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      });

      // ── Draw nodes ──────────────────────────────────────────────────────────
      CITIES.forEach((city, i) => {
        const pos = cityScreenPos[i];
        if (!pos.visible) return;
        const ff = pos.floatFraction;

        // Pulsing ring while floating free
        if (ff > 0) {
          const pulseR = (5 + ff * 12) * (1 + 0.3 * Math.sin(t * 0.005 + city.phase));
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(224,124,0,${0.4 * ff})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Glow halo
        const dotR = 5 + ff * 4;
        const halo = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, dotR * 3.5);
        halo.addColorStop(0, city.color + "aa");
        halo.addColorStop(1, city.color + "00");
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotR * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = city.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,240,200,0.8)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // City name label (small)
        ctx.fillStyle = `rgba(90,50,10,${0.6 + ff * 0.4})`;
        ctx.font = `bold ${10 + ff * 2}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(city.name, pos.x, pos.y - dotR - 5);
      });

      // Floating label cards removed to prevent visual clutter and clipping at the container top

      // ── Particle field ──────────────────────────────────────────────────────
      // Spawn
      if (Math.random() < 0.35) {
        particlesRef.current.push(spawnParticle(cx, cy, R));
      }
      // Update & draw
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.life--;
        const fade = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224,124,0,${p.alpha * fade})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
