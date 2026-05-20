import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { useMemo } from 'react';

// ─── Constants ──────────────────────────────────────────────
const WALL_H = 1.8;        // Wall height (short for dollhouse look)
const WALL_T = 0.12;       // Wall thickness
const FLOOR_T = 0.1;       // Floor thickness

// ─── Room floor/accent colors ────────────────────────────────
const FLOOR_COLORS: Record<string, string> = {
  living:   '#e8d4a0',
  kitchen:  '#c8dfc8',
  bedroom:  '#ddd0be',
  bathroom: '#c4d4e8',
  dining:   '#e4d6a8',
  stairs:   '#d0c4a8',
  parking:  '#a4a4a4',
  hall:     '#d4ccc0',
  default:  '#d8d0c4',
};

const FURNITURE_COLORS = {
  sofa:    '#3a5f7a',
  pillow:  '#4cae8a',
  table:   '#f0f0f0',
  chair:   '#4cae8a',
  counter: '#6a4a38',
  appliance: '#555',
  bed:     '#3a5a78',
  mattress:'#e8e8f0',
  carpet:  '#a87c5a',
  tv:      '#111',
  bathtub: '#dde8f0',
  toilet:  '#e8e8e8',
  plant:   '#2a7a3a',
  parking: '#888',
};

// ─── Small helpers ────────────────────────────────────────────
function Box({ pos, size, color, roughness = 0.75, metalness = 0 }: any) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

// ─── Furniture per room type ──────────────────────────────────
function LivingFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Main sofa */}
      <Box pos={[-w * 0.28, 0.22, -d * 0.25]} size={[w * 0.5, 0.44, 0.85]} color={FURNITURE_COLORS.sofa} />
      <Box pos={[-w * 0.28, 0.44, -d * 0.62]} size={[w * 0.5, 0.35, 0.25]} color={FURNITURE_COLORS.sofa} />
      {/* Side sofa arm */}
      <Box pos={[w * 0.18, 0.22, -d * 0.05]} size={[0.8, 0.44, d * 0.45]} color={FURNITURE_COLORS.sofa} />
      <Box pos={[w * 0.38, 0.44, -d * 0.05]} size={[0.22, 0.35, d * 0.45]} color={FURNITURE_COLORS.sofa} />
      {/* Pillows */}
      <Box pos={[-w * 0.35, 0.48, -d * 0.22]} size={[0.4, 0.12, 0.35]} color={FURNITURE_COLORS.pillow} />
      <Box pos={[-w * 0.1, 0.48, -d * 0.22]} size={[0.4, 0.12, 0.35]} color={FURNITURE_COLORS.pillow} />
      {/* Coffee table */}
      <Box pos={[-w * 0.1, 0.2, d * 0.05]} size={[1.0, 0.06, 0.6]} color={FURNITURE_COLORS.table} roughness={0.2} metalness={0.1} />
      <Box pos={[-w * 0.1, 0.08, d * 0.05]} size={[0.9, 0.28, 0.5]} color="#aaa" roughness={0.3} />
      {/* TV unit */}
      <Box pos={[w * 0.35, 0.22, -d * 0.38]} size={[0.15, 0.44, 1.6]} color="#222" />
      <Box pos={[w * 0.28, 0.44, -d * 0.38]} size={[0.05, 0.72, 1.4]} color={FURNITURE_COLORS.tv} roughness={0.1} metalness={0.8} />
      {/* Carpet */}
      <Box pos={[-w * 0.06, 0.01, -d * 0.08]} size={[w * 0.55, 0.02, d * 0.5]} color={FURNITURE_COLORS.carpet} />
      {/* Plant */}
      <Box pos={[-w * 0.4, 0.18, d * 0.35]} size={[0.22, 0.35, 0.22]} color="#553322" />
      <Box pos={[-w * 0.4, 0.46, d * 0.35]} size={[0.3, 0.3, 0.3]} color={FURNITURE_COLORS.plant} roughness={1} />
    </group>
  );
}

function KitchenFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* L-counter top part (back wall) */}
      <Box pos={[0, 0.45, -d * 0.42]} size={[w * 0.85, 0.9, 0.55]} color={FURNITURE_COLORS.counter} />
      <Box pos={[0, 0.92, -d * 0.42]} size={[w * 0.85, 0.08, 0.55]} color="#e8e0d8" roughness={0.3} />
      {/* L-counter side */}
      <Box pos={[-w * 0.4, 0.45, -d * 0.1]} size={[0.55, 0.9, d * 0.55]} color={FURNITURE_COLORS.counter} />
      <Box pos={[-w * 0.4, 0.92, -d * 0.1]} size={[0.55, 0.08, d * 0.55]} color="#e8e0d8" roughness={0.3} />
      {/* Sink */}
      <Box pos={[w * 0.1, 0.94, -d * 0.42]} size={[0.5, 0.06, 0.35]} color="#888" roughness={0.2} metalness={0.8} />
      {/* Stove */}
      <Box pos={[-w * 0.15, 0.94, -d * 0.42]} size={[0.55, 0.04, 0.45]} color="#333" />
      {/* Fridge */}
      <Box pos={[w * 0.38, 0.9, -d * 0.42]} size={[0.55, 1.8, 0.55]} color="#ddd" />
      {/* Upper cabinets */}
      <Box pos={[0, 1.7, -d * 0.42]} size={[w * 0.85, 0.55, 0.28]} color={FURNITURE_COLORS.counter} />
      <Box pos={[-w * 0.4, 1.7, -d * 0.1]} size={[0.28, 0.55, d * 0.5]} color={FURNITURE_COLORS.counter} />
    </group>
  );
}

function DiningFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Table */}
      <Box pos={[0, 0.37, 0]} size={[1.8, 0.06, 0.9]} color={FURNITURE_COLORS.table} roughness={0.15} metalness={0.05} />
      {/* Table legs */}
      {[[-0.78, 0.38], [0.78, 0.38], [-0.78, -0.38], [0.78, -0.38]].map(([tx, tz], i) => (
        <Box key={i} pos={[tx, 0.18, tz]} size={[0.06, 0.36, 0.06]} color="#ddd" />
      ))}
      {/* Chairs */}
      {[[-0.55, -0.62, 0], [0, -0.62, 0], [0.55, -0.62, 0],
        [-0.55, 0.62, Math.PI], [0, 0.62, Math.PI], [0.55, 0.62, Math.PI]].map(([cx, cz, _ry], i) => (
        <group key={i} position={[cx, 0, cz]}>
          <Box pos={[0, 0.2, 0]} size={[0.42, 0.05, 0.4]} color={FURNITURE_COLORS.chair} />
          <Box pos={[0, 0.42, 0.18]} size={[0.42, 0.4, 0.05]} color={FURNITURE_COLORS.chair} />
          {[[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].map(([lx, lz], li) => (
            <Box key={li} pos={[lx, 0.1, lz]} size={[0.04, 0.2, 0.04]} color={FURNITURE_COLORS.chair} />
          ))}
        </group>
      ))}
    </group>
  );
}

function BedroomFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Bed frame */}
      <Box pos={[0, 0.2, -d * 0.28]} size={[1.55, 0.4, 2.05]} color={FURNITURE_COLORS.bed} />
      {/* Mattress */}
      <Box pos={[0, 0.44, -d * 0.28]} size={[1.4, 0.15, 1.9]} color={FURNITURE_COLORS.mattress} />
      {/* Pillows */}
      <Box pos={[-0.3, 0.62, -d * 0.28 - 0.7]} size={[0.55, 0.12, 0.3]} color="#dde8f0" />
      <Box pos={[0.3, 0.62, -d * 0.28 - 0.7]} size={[0.55, 0.12, 0.3]} color="#dde8f0" />
      {/* Headboard */}
      <Box pos={[0, 0.65, -d * 0.28 - 1.0]} size={[1.55, 0.9, 0.1]} color={FURNITURE_COLORS.bed} />
      {/* Wardrobe */}
      <Box pos={[w * 0.32, 0.9, -d * 0.35]} size={[0.55, 1.8, 1.2]} color="#7a6a5a" />
      <Box pos={[w * 0.32, 0.9, -d * 0.35]} size={[0.58, 1.82, 1.22]} color="rgba(255,255,255,0.03)" roughness={0.2} metalness={0.3} />
      {/* Desk */}
      <Box pos={[-w * 0.3, 0.38, d * 0.3]} size={[0.8, 0.06, 0.5]} color="#9a8a70" roughness={0.4} />
      <Box pos={[-w * 0.3, 0.18, d * 0.3]} size={[0.72, 0.36, 0.44]} color="#9a8a70" />
      {/* Chair at desk */}
      <Box pos={[-w * 0.3, 0.22, d * 0.05]} size={[0.44, 0.05, 0.4]} color="#3a5a78" />
      {/* Bedside table */}
      <Box pos={[0.85, 0.3, -d * 0.28 - 0.5]} size={[0.4, 0.6, 0.4]} color="#9a8a70" />
      {/* Lamp */}
      <Box pos={[0.85, 0.65, -d * 0.28 - 0.5]} size={[0.08, 0.35, 0.08]} color="#888" />
    </group>
  );
}

function BathroomFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Bathtub / shower */}
      <Box pos={[w * 0.2, 0.22, -d * 0.2]} size={[w * 0.45, 0.44, d * 0.55]} color={FURNITURE_COLORS.bathtub} />
      <Box pos={[w * 0.2, 0.24, -d * 0.2]} size={[w * 0.38, 0.38, d * 0.45]} color="#c0d8ee" roughness={0.1} />
      {/* Toilet */}
      <Box pos={[-w * 0.28, 0.2, -d * 0.3]} size={[0.38, 0.4, 0.55]} color={FURNITURE_COLORS.toilet} />
      <Box pos={[-w * 0.28, 0.42, -d * 0.45]} size={[0.38, 0.12, 0.22]} color={FURNITURE_COLORS.toilet} />
      {/* Sink / vanity */}
      <Box pos={[-w * 0.28, 0.4, d * 0.3]} size={[0.55, 0.8, 0.42]} color="#8a8a7a" />
      <Box pos={[-w * 0.28, 0.82, d * 0.3]} size={[0.52, 0.06, 0.38]} color="#c8d8e8" roughness={0.2} />
      {/* Mirror */}
      <Box pos={[-w * 0.28, 1.3, d * 0.3]} size={[0.5, 0.6, 0.04]} color="#c0d8f0" roughness={0.1} metalness={0.9} />
    </group>
  );
}

function StairsFurniture({ w, d }: { w: number; d: number }) {
  const steps = 8;
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => (
        <Box
          key={i}
          pos={[0, i * (WALL_H / steps) / 2 + 0.04, -d / 2 + (i / steps) * d + d / steps / 2]}
          size={[w * 0.85, WALL_H / steps, d / steps]}
          color={i % 2 === 0 ? '#d8cfc0' : '#ccc4b0'}
        />
      ))}
      {/* Railing */}
      <Box pos={[w * 0.4, WALL_H * 0.55, 0]} size={[0.05, WALL_H * 0.9, d * 0.9]} color="#aaa" roughness={0.3} metalness={0.5} />
    </group>
  );
}

function ParkingFurniture({ w, d }: { w: number; d: number }) {
  return (
    <group position={[0, FLOOR_T / 2, 0]}>
      {/* Car outline */}
      <Box pos={[0, 0.25, 0]} size={[w * 0.6, 0.5, d * 0.75]} color="#4a6a8a" roughness={0.5} metalness={0.4} />
      <Box pos={[0, 0.52, -d * 0.05]} size={[w * 0.5, 0.28, d * 0.45]} color="#4a6a8a" roughness={0.5} />
      {/* Wheels */}
      {[[-w * 0.25, -d * 0.28], [w * 0.25, -d * 0.28], [-w * 0.25, d * 0.28], [w * 0.25, d * 0.28]].map(([cx, cz], i) => (
        <Box key={i} pos={[cx, 0.1, cz]} size={[0.22, 0.22, 0.18]} color="#222" />
      ))}
    </group>
  );
}

// ─── Single Room Component ────────────────────────────────────
interface RoomDef {
  type: string;
  position: [number, number, number];
  size: [number, number];
  color?: string;
}

function Room({ room, wallColor }: { room: RoomDef; wallColor: string }) {
  const { type, position, size } = room;
  const [x, y, z] = position;
  const [w, d] = size;
  const floorColor = FLOOR_COLORS[type] || FLOOR_COLORS.default;

  return (
    <group position={[x, y, z]}>
      {/* Floor slab */}
      <mesh receiveShadow>
        <boxGeometry args={[w, FLOOR_T, d]} />
        <meshPhysicalMaterial color={floorColor} roughness={0.6} />
      </mesh>

      {/* North wall */}
      <mesh position={[0, WALL_H / 2 + FLOOR_T / 2, -d / 2 + WALL_T / 2]} castShadow>
        <boxGeometry args={[w, WALL_H, WALL_T]} />
        <meshPhysicalMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, WALL_H / 2 + FLOOR_T / 2, d / 2 - WALL_T / 2]} castShadow>
        <boxGeometry args={[w, WALL_H, WALL_T]} />
        <meshPhysicalMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* West wall */}
      <mesh position={[-w / 2 + WALL_T / 2, WALL_H / 2 + FLOOR_T / 2, 0]} castShadow>
        <boxGeometry args={[WALL_T, WALL_H, d]} />
        <meshPhysicalMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* East wall */}
      <mesh position={[w / 2 - WALL_T / 2, WALL_H / 2 + FLOOR_T / 2, 0]} castShadow>
        <boxGeometry args={[WALL_T, WALL_H, d]} />
        <meshPhysicalMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* Room label */}
      <group position={[0, 0.06, 0]}>
        {/* Room type indicator dot */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
          <meshPhysicalMaterial color={floorColor} emissive={floorColor} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Furniture */}
      <group position={[0, FLOOR_T / 2, 0]}>
        {type === 'living'   && <LivingFurniture w={w} d={d} />}
        {type === 'kitchen'  && <KitchenFurniture w={w} d={d} />}
        {type === 'dining'   && <DiningFurniture w={w} d={d} />}
        {type === 'bedroom'  && <BedroomFurniture w={w} d={d} />}
        {type === 'bathroom' && <BathroomFurniture w={w} d={d} />}
        {type === 'stairs'   && <StairsFurniture w={w} d={d} />}
        {type === 'parking'  && <ParkingFurniture w={w} d={d} />}
      </group>
    </group>
  );
}

// ─── Default house layout (shown before any prompt) ───────────
const defaultRooms: RoomDef[] = [
  { type: 'kitchen',  position: [-3.2, 0, -4.5], size: [4.2, 3.5] },
  { type: 'dining',   position: [1.8,  0, -4.5], size: [3.8, 3.5] },
  { type: 'bedroom',  position: [-3.2, 0, -0.2], size: [4.2, 3.8] },
  { type: 'bathroom', position: [1.8,  0, -1.2], size: [3.8, 2.0] },
  { type: 'stairs',   position: [1.8,  0,  1.0], size: [2.2, 2.5] },
  { type: 'bedroom',  position: [3.5,  0,  2.5], size: [2.8, 2.5] },
  { type: 'living',   position: [0.5,  0,  4.8], size: [9.5, 4.2] },
];

// ─── Main component ───────────────────────────────────────────
export default function ProceduralHouse({ houseData }: { houseData: any }) {
  const rooms = houseData?.rooms || defaultRooms;
  const wallColor = houseData?.wallColor || '#f5f5f5';

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="px-3 py-1 bg-black/50 border border-[#00f0ff]/40 rounded-full text-xs font-semibold text-[#00f0ff] tracking-widest uppercase">
          Live 3D View
        </div>
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-xs text-gray-400">
          {rooms.length} rooms
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 text-xs text-gray-500">
        Drag to rotate · Scroll to zoom
      </div>

      <Canvas shadows camera={{ position: [18, 20, 18], fov: 42 }}>
        <color attach="background" args={['#07080f']} />

        {/* Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[15, 25, 10]}
          intensity={2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <directionalLight position={[-10, 15, -5]} intensity={0.5} color="#9d80ff" />
        <pointLight position={[0, 8, 0]} intensity={0.8} color="#fff" />

        {/* Foundation slab */}
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <boxGeometry args={[24, 0.18, 24]} />
          <meshPhysicalMaterial color="#3a3a3a" roughness={0.9} />
        </mesh>

        {/* All rooms */}
        {rooms.map((room: any, i: number) => (
          <Room key={`${i}-${JSON.stringify(room)}`} room={room} wallColor={wallColor} />
        ))}

        <ContactShadows position={[0, -0.03, 0]} opacity={0.5} scale={35} blur={2} far={10} />
        <Environment preset="apartment" />

        <OrbitControls
          makeDefault
          autoRotate
          autoRotateSpeed={0.4}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          minDistance={8}
          maxDistance={40}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
}
