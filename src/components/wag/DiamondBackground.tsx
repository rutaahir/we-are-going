import { useEffect, useState } from "react";

const COLORS = ["#E8A090", "#E8B86D", "#F0C4A0", "#D4907A"];

interface Diamond {
  id: number;
  size: number;
  left: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  rotateStart: number;
  rotateEnd: number;
  tx: number;
}

export function DiamondBackground() {
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);

  useEffect(() => {
    // Generate 18 to 24 diamonds
    const count = Math.floor(Math.random() * (24 - 18 + 1)) + 18; 
    const newDiamonds: Diamond[] = [];
    
    for (let i = 0; i < count; i++) {
      newDiamonds.push({
        id: i,
        size: Math.random() * (40 - 12) + 12, // 12px to 40px
        left: Math.random() * 100, // 0 to 100 vw
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * (0.35 - 0.15) + 0.15, // 0.15 to 0.35
        duration: Math.random() * (20 - 8) + 8, // 8s to 20s
        delay: Math.random() * -20, // Negative delay to start mid-animation
        rotateStart: Math.random() * 90,
        rotateEnd: Math.random() * 360 + 360, // Multiple rotations
        tx: (Math.random() - 0.5) * 150, // Gentle horizontal drift
      });
    }
    setDiamonds(newDiamonds);
  }, []);

  return (
    <>
      <div 
        className="diamond-bg" 
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          backgroundColor: "#FFF5EE",
        }}
      >
        {diamonds.map((d) => (
          <div
            key={d.id}
            style={{
              position: "absolute",
              width: `${d.size}px`,
              height: `${d.size}px`,
              left: `${d.left}vw`,
              top: `100%`,
              backgroundColor: d.color,
              opacity: d.opacity,
              animation: `float-diamond-${d.id} ${d.duration}s linear infinite`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>
      {/* Generate dynamic keyframes for each diamond */}
      <style>{`
        ${diamonds.map(d => `
          @keyframes float-diamond-${d.id} {
            0% {
              transform: translateY(10vh) translateX(0px) rotate(${d.rotateStart}deg);
            }
            100% {
              transform: translateY(-120vh) translateX(${d.tx}px) rotate(${d.rotateEnd}deg);
            }
          }
        `).join('')}
      `}</style>
    </>
  );
}
