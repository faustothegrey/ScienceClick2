import type { Geometry } from "@/lib/observeit/scene";
import { streetScene } from "@/lib/observeit/scenes/street";

// Every target is drawn from its geometry in the scene data, with all details
// kept inside that outline. Decoration around targets is free-form.

type Rect = Extract<Geometry, { kind: "rect" }>;
type Circle = Extract<Geometry, { kind: "circle" }>;
type Poly = Extract<Geometry, { kind: "polygon" }>;

const byId = new Map(streetScene.targets.map((t) => [t.id, t.geometry]));

function geo<K extends Geometry["kind"]>(id: string, kind: K): Extract<Geometry, { kind: K }> {
  const g = byId.get(id);
  if (!g || g.kind !== kind) throw new Error(`Street target ${id} is not a ${kind}`);
  return g as Extract<Geometry, { kind: K }>;
}

const pts = (points: Poly["points"]) => points.map((p) => p.join(",")).join(" ");

// Shrinks a polygon towards its centroid (for sign borders drawn inside the outline).
function inset(points: Poly["points"], factor: number): Poly["points"] {
  const cx = points.reduce((s, [x]) => s + x, 0) / points.length;
  const cy = points.reduce((s, [, y]) => s + y, 0) / points.length;
  return points.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor] as const);
}

const C = {
  stone: "#efe4cf",
  stoneShade: "#d8c9ab",
  glass: "#8fb0bf",
  glassLight: "#c7dbe3",
  glassDark: "#5f7c89",
  shutter: "#4d7a57",
  shutterDark: "#3a5f44",
  wood: "#6b4529",
  woodDark: "#523320",
  metal: "#8d939b",
  ink: "#2b2b2b",
};

// ---------- Building parts

function StoneWindow({ id, shutters }: { id: string; shutters: "open" | "closed" }) {
  const g = geo(id, "rect");
  const inner = { x: g.x + 9, y: g.y + 9, w: g.width - 18, h: g.height - 18 };
  return (
    <g>
      {shutters === "open" &&
        [g.x - 40, g.x + g.width].map((sx) => (
          <g key={sx}>
            <rect x={sx} y={g.y + 2} width={40} height={g.height - 4} fill={C.shutter} />
            {Array.from({ length: 13 }, (_, i) => (
              <line key={i} x1={sx + 4} x2={sx + 36} y1={g.y + 12 + i * 10} y2={g.y + 12 + i * 10} stroke={C.shutterDark} strokeWidth={3} />
            ))}
          </g>
        ))}
      <rect x={g.x + 4} y={g.y + 5} width={g.width} height={g.height} fill="#000" opacity={0.12} />
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill={C.stone} />
      {shutters === "open" ? (
        <>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={C.glass} />
          <polygon points={`${inner.x},${inner.y + 40} ${inner.x + inner.w},${inner.y + 10} ${inner.x + inner.w},${inner.y + 30} ${inner.x},${inner.y + 60}`} fill={C.glassLight} opacity={0.7} />
          <line x1={g.x + g.width / 2} x2={g.x + g.width / 2} y1={inner.y} y2={inner.y + inner.h} stroke={C.stone} strokeWidth={5} />
          <line x1={inner.x} x2={inner.x + inner.w} y1={inner.y + inner.h * 0.38} y2={inner.y + inner.h * 0.38} stroke={C.stone} strokeWidth={3} />
        </>
      ) : (
        <>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="#7d5a3c" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={inner.x + 3} x2={inner.x + inner.w - 3} y1={inner.y + 6 + i * 9.5} y2={inner.y + 6 + i * 9.5} stroke="#5f422b" strokeWidth={3} />
          ))}
          <line x1={g.x + g.width / 2} x2={g.x + g.width / 2} y1={inner.y} y2={inner.y + inner.h} stroke="#5f422b" strokeWidth={3} />
        </>
      )}
      {/* sill */}
      <path d={`M${g.x - 8} ${g.y + g.height} h${g.width + 16} l-4 9 h${-(g.width + 8)} Z`} fill={C.stoneShade} />
    </g>
  );
}

function FlowerBox({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${x + 8 + i * ((width - 16) / 6)} ${y + 2} q-6 -12 0 -18 q6 6 0 18`} fill="#5c8a45" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${x + 14 + i * ((width - 28) / 5)} ${y - 12} q5 -7 10 0 q-5 7 -10 0`} fill={i % 2 ? "#d64045" : "#e86a6e"} />
      ))}
      <path d={`M${x} ${y} h${width} l-5 16 h${-(width - 10)} Z`} fill="#a65a3a" />
    </g>
  );
}

function AtticWindow({ id }: { id: string }) {
  const g = geo(id, "rect");
  const i = 7;
  return (
    <g>
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill={C.stone} />
      <rect x={g.x + i} y={g.y + i} width={g.width - 2 * i} height={g.height - 2 * i} fill={C.glassDark} />
      <path d={`M${g.x + g.width / 2} ${g.y + i} V${g.y + g.height - i} M${g.x + i} ${g.y + g.height / 2} H${g.x + g.width - i}`} stroke={C.stone} strokeWidth={3} />
    </g>
  );
}

function Door({ id, kind }: { id: string; kind: "shop" | "portal" }) {
  const g = geo(id, "rect");
  if (kind === "shop") {
    return (
      <g>
        <rect x={g.x} y={g.y} width={g.width} height={g.height} fill="#3d3f42" />
        <rect x={g.x + 7} y={g.y + 7} width={g.width - 14} height={g.height - 7} fill={C.glass} />
        <polygon points={`${g.x + 7},${g.y + 60} ${g.x + g.width - 7},${g.y + 25} ${g.x + g.width - 7},${g.y + 45} ${g.x + 7},${g.y + 80}`} fill={C.glassLight} opacity={0.6} />
        <line x1={g.x + g.width - 18} x2={g.x + g.width - 18} y1={g.y + g.height * 0.45} y2={g.y + g.height * 0.6} stroke="#c9ccd0" strokeWidth={5} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <rect x={g.x - 10} y={g.y - 6} width={g.width + 20} height={g.height + 6} fill={C.stoneShade} />
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill={C.wood} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={g.x + 15 * (i + 1)} x2={g.x + 15 * (i + 1)} y1={g.y} y2={g.y + g.height} stroke={C.woodDark} strokeWidth={2} />
      ))}
      <line x1={g.x + g.width / 2} x2={g.x + g.width / 2} y1={g.y} y2={g.y + g.height} stroke={C.woodDark} strokeWidth={5} />
      {Array.from({ length: 5 }, (_, row) =>
        [0.2, 0.8].map((fx) => <circle key={`${row}-${fx}`} cx={g.x + g.width * fx} cy={g.y + 30 + row * 36} r={3} fill="#3a2414" />),
      )}
      <circle cx={g.x + g.width / 2 - 10} cy={g.y + 110} r={6} fill="none" stroke="#b08d57" strokeWidth={3} />
      <circle cx={g.x + g.width / 2 + 10} cy={g.y + 110} r={6} fill="none" stroke="#b08d57" strokeWidth={3} />
    </g>
  );
}

function SignBoard({ id, text, fill, color }: { id: string; text: string; fill: string; color: string }) {
  const g = geo(id, "rect");
  return (
    <g>
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill={fill} />
      <rect x={g.x + 4} y={g.y + 4} width={g.width - 8} height={g.height - 8} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
      <text x={g.x + g.width / 2} y={g.y + g.height / 2 + 9} textAnchor="middle" fontFamily="Georgia, serif" fontSize={26} letterSpacing={6} fill={color}>
        {text}
      </text>
    </g>
  );
}

function StreetPlate({ id }: { id: string }) {
  const g = geo(id, "rect");
  return (
    <g>
      <rect x={g.x + 2} y={g.y + 3} width={g.width} height={g.height} fill="#000" opacity={0.15} />
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill="#f7f4ee" stroke="#bdb6a8" strokeWidth={2} />
      <text x={g.x + g.width / 2} y={g.y + g.height / 2 + 5} textAnchor="middle" fontFamily="Georgia, serif" fontSize={11} fill={C.ink}>
        VIA SANTA MARIA
      </text>
    </g>
  );
}

function GroceryWindow({ id }: { id: string }) {
  const g = geo(id, "rect");
  const fruit = ["#e2a03f", "#d64045", "#8fb339", "#f2c94c"];
  return (
    <g>
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill="#3d3f42" />
      <rect x={g.x + 8} y={g.y + 8} width={g.width - 16} height={g.height - 16} fill="#a9c3cc" />
      {[0, 1, 2].map((shelf) => (
        <g key={shelf}>
          <line x1={g.x + 12} x2={g.x + g.width - 12} y1={g.y + 48 + shelf * 38} y2={g.y + 48 + shelf * 38} stroke="#6e6250" strokeWidth={4} />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={g.x + 20 + i * 12.5} cy={g.y + 40 + shelf * 38} r={5.5} fill={fruit[(i + shelf) % fruit.length]} />
          ))}
        </g>
      ))}
      <polygon points={`${g.x + 8},${g.y + 70} ${g.x + 70},${g.y + 8} ${g.x + 95},${g.y + 8} ${g.x + 8},${g.y + 95}`} fill="#fff" opacity={0.25} />
    </g>
  );
}

function BarWindow({ id }: { id: string }) {
  const g = geo(id, "rect");
  return (
    <g>
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill="#3d3f42" />
      <rect x={g.x + 7} y={g.y + 7} width={g.width - 14} height={g.height - 14} fill="#c6a77a" />
      {/* counter and cups inside */}
      <path d={`M${g.x + 7} ${g.y + 70} h${g.width - 14} v${g.height - 77} h${-(g.width - 14)} Z`} fill="#7a5233" />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${g.x + 30 + i * 38} ${g.y + 58} h14 l-2 12 h-10 Z`} fill="#fff" />
      ))}
      <path d={`M${g.x + 22} ${g.y + 22} q14 -10 28 0`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.6} />
      <polygon points={`${g.x + 120},${g.y + 7} ${g.x + 150},${g.y + 7} ${g.x + 100},${g.y + g.height - 7} ${g.x + 70},${g.y + g.height - 7}`} fill="#fff" opacity={0.18} />
    </g>
  );
}

function SmallPediment({ id }: { id: string }) {
  const g = geo(id, "polygon");
  return (
    <g>
      <polygon points={pts(g.points)} fill={C.stone} />
      <polygon points={pts(inset(g.points, 0.6))} fill={C.stoneShade} />
    </g>
  );
}

// ---------- Church

function Gable() {
  const g = geo("frontone-chiesa", "polygon");
  return (
    <g>
      <polygon points={pts(g.points)} fill="#f1e8d6" />
      <polygon points={pts(inset(g.points, 0.86))} fill="#e8dcc3" />
      {/* small blind arches under the roof line */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 650 + i * 21;
        const y = 210 - ((x < 820 ? x - 560 : 1080 - x) * 160) / 260 + 22;
        return <path key={`l${i}`} d={`M${x} ${y + 14} v-6 a7 7 0 0 1 14 0 v6`} fill="none" stroke="#cbbb9a" strokeWidth={2} />;
      })}
    </g>
  );
}

function Rose() {
  const g = geo("rosone", "circle");
  return (
    <g>
      <circle cx={g.cx} cy={g.cy} r={g.r} fill={C.stoneShade} />
      <circle cx={g.cx} cy={g.cy} r={g.r - 7} fill="#536f86" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={g.cx} y1={g.cy} x2={g.cx + Math.cos(a) * (g.r - 7)} y2={g.cy + Math.sin(a) * (g.r - 7)} stroke={C.stone} strokeWidth={3} />;
      })}
      <circle cx={g.cx} cy={g.cy} r={7} fill={C.stone} />
    </g>
  );
}

function Clock() {
  const g = geo("orologio", "circle");
  return (
    <g>
      <circle cx={g.cx + 3} cy={g.cy + 4} r={g.r} fill="#000" opacity={0.12} />
      <circle cx={g.cx} cy={g.cy} r={g.r} fill="#3b3b3b" />
      <circle cx={g.cx} cy={g.cy} r={g.r - 6} fill="#fbf8f1" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        const r1 = g.r - (i % 3 === 0 ? 18 : 13);
        return (
          <line key={i} x1={g.cx + Math.cos(a) * r1} y1={g.cy + Math.sin(a) * r1} x2={g.cx + Math.cos(a) * (g.r - 9)} y2={g.cy + Math.sin(a) * (g.r - 9)} stroke={C.ink} strokeWidth={i % 3 === 0 ? 4 : 2} />
        );
      })}
      <line x1={g.cx} y1={g.cy} x2={g.cx + 14} y2={g.cy - 16} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <line x1={g.cx} y1={g.cy} x2={g.cx - 4} y2={g.cy + 28} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      <circle cx={g.cx} cy={g.cy} r={3.5} fill={C.ink} />
    </g>
  );
}

function PortalPediment() {
  const g = geo("timpano-portale", "polygon");
  return (
    <g>
      <polygon points={pts(g.points)} fill="#cdbb97" />
      <polygon points={pts(inset(g.points, 0.7))} fill="#f3ead8" />
    </g>
  );
}

// ---------- Street furniture

function Pole({ x, top }: { x: number; top: number }) {
  return (
    <g>
      <line x1={x} x2={x} y1={top} y2={652} stroke={C.metal} strokeWidth={9} />
      <line x1={x - 2} x2={x - 2} y1={top} y2={652} stroke="#b9bec4" strokeWidth={2} />
    </g>
  );
}

function GiveWaySign() {
  const g = geo("cartello-precedenza", "polygon");
  return (
    <g>
      <polygon points={pts(g.points)} fill="#c62f2f" strokeLinejoin="round" stroke="#c62f2f" strokeWidth={4} />
      <polygon points={pts(inset(g.points, 0.68))} fill="#fafafa" />
    </g>
  );
}

function PedestrianSign() {
  const sq = geo("cartello-pedoni", "rect");
  const tri = geo("triangolo-pedoni", "polygon");
  const cx = sq.x + sq.width / 2;
  return (
    <g>
      <rect x={sq.x} y={sq.y} width={sq.width} height={sq.height} rx={6} fill="#1f5fa8" stroke="#fff" strokeWidth={3} />
      <polygon points={pts(tri.points)} fill="#fff" />
      {/* walking figure and zebra */}
      <circle cx={cx + 3} cy={338} r={5} fill={C.ink} />
      <path d={`M${cx + 2} 345 l-4 14 l-8 10 M${cx - 2} 359 l8 9 M${cx + 1} 349 l-9 5 M${cx + 1} 349 l8 4`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={cx - 22 + i * 16} x2={cx - 14 + i * 16} y1={372} y2={372} stroke={C.ink} strokeWidth={3} />
      ))}
    </g>
  );
}

function NoParkingSign() {
  const g = geo("cartello-divieto", "circle");
  const d = (g.r - 10) * Math.SQRT1_2;
  return (
    <g>
      <circle cx={g.cx} cy={g.cy} r={g.r} fill="#c62f2f" />
      <circle cx={g.cx} cy={g.cy} r={g.r - 10} fill="#1f5fa8" />
      <line x1={g.cx - d} y1={g.cy - d} x2={g.cx + d} y2={g.cy + d} stroke="#c62f2f" strokeWidth={9} />
    </g>
  );
}

function BikeWheel({ id }: { id: string }) {
  const g = geo(id, "circle");
  return (
    <g>
      <circle cx={g.cx} cy={g.cy} r={g.r - 3} fill="none" stroke="#26282b" strokeWidth={6} />
      <circle cx={g.cx} cy={g.cy} r={g.r - 8} fill="none" stroke="#a7adb4" strokeWidth={2} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        return <line key={i} x1={g.cx} y1={g.cy} x2={g.cx + Math.cos(a) * (g.r - 8)} y2={g.cy + Math.sin(a) * (g.r - 8)} stroke="#b9bec4" strokeWidth={1.2} />;
      })}
      <circle cx={g.cx} cy={g.cy} r={4} fill="#55595e" />
    </g>
  );
}

function Bicycle() {
  const back = geo("bici-ruota-dietro", "circle");
  const front = geo("bici-ruota-davanti", "circle");
  const crank = { x: back.cx + 52, y: back.cy };
  const seat = { x: back.cx + 38, y: back.cy - 62 };
  const head = { x: front.cx - 18, y: front.cy - 60 };
  return (
    <g>
      <ellipse cx={(back.cx + front.cx) / 2} cy={back.cy + back.r + 2} rx={110} ry={6} fill="#000" opacity={0.15} />
      <BikeWheel id="bici-ruota-dietro" />
      <BikeWheel id="bici-ruota-davanti" />
      <path
        d={`M${back.cx} ${back.cy} L${crank.x} ${crank.y} L${seat.x} ${seat.y} Z M${crank.x} ${crank.y} L${head.x} ${head.y + 10} L${seat.x + 4} ${seat.y + 8} M${head.x} ${head.y} L${front.cx} ${front.cy}`}
        stroke="#2a8c82"
        strokeWidth={6}
        strokeLinejoin="round"
        fill="none"
      />
      <path d={`M${seat.x - 4} ${seat.y - 2} l-2 -10 M${seat.x - 20} ${seat.y - 13} q14 -6 28 0`} stroke="#2b2b2b" strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d={`M${head.x} ${head.y} l-4 -10 q12 -6 24 2`} stroke="#2b2b2b" strokeWidth={5} strokeLinecap="round" fill="none" />
      <circle cx={crank.x} cy={crank.y} r={7} fill="#55595e" />
    </g>
  );
}

function CarWheel({ id }: { id: string }) {
  const g = geo(id, "circle");
  // The rim is big enough that a box around it still matches the whole wheel.
  const rim = g.r * 0.74;
  return (
    <g>
      <circle cx={g.cx} cy={g.cy} r={g.r} fill="#1f2124" />
      <circle cx={g.cx} cy={g.cy} r={rim} fill="#b8bdc4" />
      <circle cx={g.cx} cy={g.cy} r={rim - 5} fill="#9aa0a8" />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        return <line key={i} x1={g.cx + Math.cos(a) * 11} y1={g.cy + Math.sin(a) * 11} x2={g.cx + Math.cos(a) * (rim - 5)} y2={g.cy + Math.sin(a) * (rim - 5)} stroke="#c9ced5" strokeWidth={7} />;
      })}
      <circle cx={g.cx} cy={g.cy} r={10} fill="#5b6067" />
    </g>
  );
}

function Car() {
  const back = geo("auto-ruota-dietro", "circle");
  const front = geo("auto-ruota-davanti", "circle");
  const arch = (w: Circle) => `M${w.cx - w.r - 8} 826 a${w.r + 8} ${w.r + 8} 0 0 1 ${2 * (w.r + 8)} 0 Z`;
  return (
    <g>
      <ellipse cx={530} cy={872} rx={265} ry={10} fill="#000" opacity={0.25} />
      <path
        d="M292 828 L294 760 Q297 742 320 737 L418 728 L478 686 Q489 678 506 678 L640 678 Q660 678 673 690 L728 736 Q764 744 768 772 L770 828 Z"
        fill="#5b7aa0"
      />
      <path d="M296 790 L766 790" stroke="#4a6688" strokeWidth={3} />
      <path d="M432 730 L486 690 L566 690 L566 730 Z" fill="#a9c2d0" />
      <path d="M578 730 L578 690 L640 690 Q652 690 660 698 L700 730 Z" fill="#a9c2d0" />
      <path d="M520 690 L560 690 L530 730 L490 730 Z" fill="#fff" opacity={0.25} />
      <line x1={572} x2={572} y1={690} y2={828} stroke="#4a6688" strokeWidth={3} />
      <path d="M594 752 h22" stroke="#d7dde4" strokeWidth={5} strokeLinecap="round" />
      <path d="M744 752 q18 2 22 14 l-22 2 Z" fill="#f4e7b4" />
      <path d="M296 752 l14 -4 v18 l-14 2 Z" fill="#c0392b" />
      <path d={arch(back)} fill="#2a2d31" />
      <path d={arch(front)} fill="#2a2d31" />
      <CarWheel id="auto-ruota-dietro" />
      <CarWheel id="auto-ruota-davanti" />
    </g>
  );
}

function WallLantern({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y} q-26 0 -30 22`} stroke="#2f2f2f" strokeWidth={4} fill="none" />
      <path d={`M${x - 42} ${y + 22} h24 l-4 34 h-16 Z`} fill="#2f2f2f" />
      <path d={`M${x - 38} ${y + 27} h16 l-3 24 h-10 Z`} fill="#f5df9a" />
    </g>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      d={`M${x} ${y} q${8 * s} ${-22 * s} ${30 * s} ${-14 * s} q${10 * s} ${-26 * s} ${40 * s} ${-12 * s} q${26 * s} ${-6 * s} ${30 * s} ${18 * s} q${18 * s} ${4 * s} ${8 * s} ${16 * s} Z`}
      fill="#fff"
      opacity={0.85}
    />
  );
}

export default function StreetIllustration() {
  const b1: Rect = { kind: "rect", x: 0, y: 70, width: 560, height: 530 };
  const b3: Rect = { kind: "rect", x: 1080, y: 90, width: 520, height: 510 };
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9d2ea" />
          <stop offset="1" stopColor="#e4f0f4" />
        </linearGradient>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0.09 0" />
        </filter>
      </defs>

      {/* Sky */}
      <rect x={0} y={0} width={1600} height={600} fill="url(#sky)" />
      <Cloud x={300} y={50} s={1.2} />
      <Cloud x={1290} y={70} s={0.9} />

      {/* Left palazzo */}
      <rect x={b1.x} y={b1.y} width={b1.width} height={b1.height} fill="#d39b5b" />
      <rect x={0} y={58} width={566} height={16} fill={C.stone} />
      <rect x={0} y={74} width={566} height={8} fill="#b07d45" opacity={0.6} />
      <rect x={0} y={392} width={560} height={208} fill="#c78f52" />
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={0} x2={560} y1={455 + i * 30} y2={455 + i * 30} stroke="#b3804a" strokeWidth={2} />
      ))}
      <line x1={0} x2={560} y1={392} y2={392} stroke={C.stone} strokeWidth={8} />
      <AtticWindow id="palazzo-finestrella-1" />
      <AtticWindow id="palazzo-finestrella-2" />
      {["palazzo-finestra-1", "palazzo-finestra-2", "palazzo-finestra-3"].map((id) => (
        <StoneWindow key={id} id={id} shutters="open" />
      ))}
      {["palazzo-finestra-1", "palazzo-finestra-2", "palazzo-finestra-3"].map((id) => {
        const g = geo(id, "rect");
        return <FlowerBox key={id} x={g.x - 4} y={g.y + g.height + 9} width={g.width + 8} />;
      })}
      <SignBoard id="insegna-alimentari" text="ALIMENTARI" fill="#2f4f3e" color="#f3ead2" />
      <GroceryWindow id="vetrina-alimentari" />
      <Door id="porta-alimentari" kind="shop" />
      <StreetPlate id="targa-via" />
      <WallLantern x={548} y={300} />

      {/* Church */}
      <rect x={560} y={210} width={520} height={390} fill="#ece2cd" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${590 + i * 70} 600 V470 a28 28 0 0 1 56 0 V600`} fill="#e3d6bb" stroke="#d2c3a2" strokeWidth={2} />
      ))}
      <Gable />
      <path d="M552 214 L820 44 L1088 214" fill="none" stroke={C.stoneShade} strokeWidth={10} strokeLinejoin="round" />
      <Rose />
      <Clock />
      <PortalPediment />
      <Door id="portale" kind="portal" />

      {/* Right palazzo with bar */}
      <rect x={b3.x} y={b3.y} width={b3.width} height={b3.height} fill="#e3c47c" />
      <rect x={1074} y={78} width={526} height={16} fill={C.stone} />
      <rect x={1074} y={94} width={526} height={8} fill="#b99a55" opacity={0.6} />
      <line x1={1080} x2={1600} y1={398} y2={398} stroke={C.stone} strokeWidth={8} />
      <line x1={1352} x2={1352} y1={94} y2={600} stroke="#9c9a92" strokeWidth={7} />
      <AtticWindow id="bar-finestrella-1" />
      <AtticWindow id="bar-finestrella-2" />
      <SmallPediment id="bar-timpano-1" />
      <SmallPediment id="bar-timpano-2" />
      <StoneWindow id="bar-finestra-1" shutters="closed" />
      <StoneWindow id="bar-finestra-2" shutters="closed" />
      <SignBoard id="insegna-bar" text="BAR" fill="#7a2b2b" color="#f6e7c8" />
      <BarWindow id="vetrina-bar" />
      <Door id="porta-bar" kind="shop" />

      {/* Plaster texture over all façades */}
      <rect x={0} y={58} width={566} height={542} filter="url(#grain)" pointerEvents="none" />
      <rect x={1074} y={78} width={526} height={522} filter="url(#grain)" pointerEvents="none" />
      <polygon points="552,214 820,44 1088,214 1080,600 560,600" filter="url(#grain)" pointerEvents="none" />

      {/* Sidewalk, curb, road */}
      <rect x={0} y={600} width={1600} height={58} fill="#cfc6b8" />
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i} x1={i * 84 + 20} x2={i * 84 + 14} y1={600} y2={658} stroke="#bcb3a4" strokeWidth={2} />
      ))}
      <rect x={0} y={656} width={1600} height={14} fill="#a39b8d" />
      <rect x={0} y={670} width={1600} height={230} fill="#50555e" />
      <rect x={0} y={670} width={1600} height={230} filter="url(#grain)" opacity={0.8} pointerEvents="none" />
      <line x1={0} x2={1600} y1={690} y2={690} stroke="#e8e4da" strokeWidth={4} opacity={0.8} />

      {/* Signs */}
      <Pole x={600} top={330} />
      <GiveWaySign />
      <Pole x={1000} top={300} />
      <PedestrianSign />
      <Pole x={1545} top={350} />
      <NoParkingSign />

      <Bicycle />
      <Car />
    </g>
  );
}
