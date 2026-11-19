import { useId } from 'react';

// Illustrated placeholder used whenever a vehicle has no uploaded photo (and for the hero).
// Replace with real photography by uploading images in the admin area.
const SPECS = {
  sedan: { w: 300, h: 58, cabinW: 168, cabinH: 48, windows: 2, wheel: 24 },
  suv: { w: 330, h: 80, cabinW: 250, cabinH: 52, windows: 3, wheel: 28 },
  van: { w: 380, h: 112, cabinW: 0, cabinH: 0, windows: 4, wheel: 27 },
  minibus: { w: 470, h: 120, cabinW: 0, cabinH: 0, windows: 6, wheel: 28 },
  coach: { w: 600, h: 136, cabinW: 0, cabinH: 0, windows: 8, wheel: 30 },
};
const SCENES = {
  meadow: { sky: ['#F9E7BE', '#F7F4EC'], sun: '#E9A83A', far: '#C9D3C2', mid: '#A8B7A0', near: '#2A5A4C', ground: '#173C32', body: '#F7F4EC' },
  dusk: { sky: ['#EFB45A', '#F7E4BB'], sun: '#FFF3D6', far: '#9FB095', mid: '#5E7F6B', near: '#245043', ground: '#12302A', body: '#F7F4EC' },
  coast: { sky: ['#CFE0D6', '#F7F4EC'], sun: '#E9A83A', far: '#A8B7A0', mid: '#7F9A8B', near: '#1F4A3E', ground: '#173C32', body: '#E9A83A' },
};
const SCENE_FOR = { sedan: 'meadow', suv: 'dusk', van: 'coast', minibus: 'meadow', coach: 'dusk' };

export default function VehicleArt({ type = 'sedan', scene, label, seed = 0, className = '', animate = false }) {
  const uid = useId().replace(/:/g, '');
  const s = SPECS[type] || SPECS.sedan;
  const c = SCENES[scene || SCENE_FOR[type] || 'meadow'];
  const g = 372; // ground line of the vehicle
  const bodyY = g - s.wheel - s.h + 10;
  const k = { coach: 1.0, minibus: 1.15 }[type] || 1.3; // scale so the vehicle fills the frame
  const x0 = 400 - (s.w * k) / 2;
  const hill = (base, amp, phase) => {
    let d = `M0 500 L0 ${base}`;
    for (let x = 0; x <= 800; x += 100) d += ` Q${x + 50} ${base - amp * Math.sin(phase + x / 140 + seed)} ${x + 100} ${base - (amp / 3) * Math.cos(phase + x / 90 + seed)}`;
    return d + ' L800 500 Z';
  };
  const windowRects = [];
  if (s.cabinH) {
    const area = s.cabinW - 36;
    const ww = area / s.windows - 8;
    for (let i = 0; i < s.windows; i++) windowRects.push({ x: (s.w - s.cabinW) / 2 + 18 + i * (ww + 8), y: bodyY - s.cabinH + 9, w: ww, h: s.cabinH - 17 });
  } else {
    const area = s.w - 120;
    const ww = area / s.windows - 8;
    for (let i = 0; i < s.windows; i++) windowRects.push({ x: 22 + i * (ww + 8), y: bodyY + 14, w: ww, h: s.h * 0.34 });
    windowRects.push({ x: s.w - 84, y: bodyY + 14, w: 62, h: s.h * 0.34 }); // windscreen
  }
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label || `${type} illustration`}>
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.sky[0]} /><stop offset="1" stopColor={c.sky[1]} /></linearGradient>
      </defs>
      <rect width="800" height="500" fill={`url(#sky${uid})`} />
      <circle cx={580 + (seed % 3) * 30} cy="150" r="64" fill={c.sun} opacity=".9" />
      <g className={animate ? 'animate-drift' : undefined}>
        <ellipse cx="150" cy="110" rx="70" ry="14" fill="#fff" opacity=".55" /><ellipse cx="205" cy="98" rx="46" ry="12" fill="#fff" opacity=".55" />
      </g>
      <path d={hill(300, 50, 0.4)} fill={c.far} />
      <path d={hill(335, 42, 1.7)} fill={c.mid} />
      <path d={hill(365, 30, 2.9)} fill={c.near} />
      <rect y="385" width="800" height="115" fill={c.ground} />
      <rect y="385" width="800" height="5" fill="#fff" opacity=".12" />
      {[40, 190, 340, 490, 640].map((x) => <rect key={x} x={x} y="448" width="80" height="7" rx="3.500" fill={c.sun} opacity=".85" />)}
      <g transform={`translate(${x0} ${g - g * k}) scale(${k})`}>
        <ellipse cx={s.w / 2} cy={g + 4} rx={s.w / 2 + 8} ry="9" fill="#000" opacity=".28" />
        {s.cabinH > 0 && <rect x={(s.w - s.cabinW) / 2} y={bodyY - s.cabinH} width={s.cabinW} height={s.cabinH + 12} rx="20" fill={c.body} />}
        <rect y={bodyY} width={s.w} height={s.h} rx="16" fill={c.body} />
        <rect y={bodyY + s.h * 0.62} width={s.w} height="7" fill={c.sun} opacity=".95" />
        {windowRects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx="7" fill="#173C32" opacity=".9" />)}
        <rect x={s.w - 14} y={bodyY + s.h * 0.45} width="10" height="12" rx="3" fill="#FFE9A8" />
        {[0.2, 0.78].map((p) => (
          <g key={p}>
            <circle cx={s.w * p} cy={g - s.wheel + 6} r={s.wheel} fill="#252A27" />
            <circle cx={s.w * p} cy={g - s.wheel + 6} r={s.wheel * 0.45} fill="#A8B7A0" />
          </g>
        ))}
      </g>
    </svg>
  );
}
