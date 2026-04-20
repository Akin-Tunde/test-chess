import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Float, MeshDistortMaterial , Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Chess, Move } from 'chess.js';

interface ChessBoard3DProps {
  gameId?: string;
  isPlayable?: boolean;
  onMove?: (move: any) => void;
  initialFen?: string;
  moves?: any[];
  playerColor?: 'white' | 'black';
}

const PIECE_MODELS: Record<string, string> = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙'
};

const Square3D = ({ 
  position, 
  color, 
  isHighlighted, 
  isLegal, 
  onClick 
}: { 
  position: [number, number, number], 
  color: string, 
  isHighlighted: boolean, 
  isLegal: boolean,
  onClick: () => void 
}) => {
  return (
    <mesh position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <boxGeometry args={[0.95, 0.2, 0.95]} />
      <meshStandardMaterial 
        color={isHighlighted ? '#ff006e' : (isLegal ? '#39ff14' : color)} 
        emissive={isHighlighted ? '#ff006e' : (isLegal ? '#39ff14' : color)}
        emissiveIntensity={isHighlighted || isLegal ? 0.5 : 0.1}
      />
    </mesh>
  );
};

const Piece3D = ({ 
  type, 
  color, 
  position, 
  isSelected 
}: { 
  type: string, 
  color: 'w' | 'b', 
  position: [number, number, number],
  isSelected: boolean
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const pieceChar = PIECE_MODELS[color === 'w' ? type.toUpperCase() : type.toLowerCase()];
  
  const [currentPos, setCurrentPos] = useState(position);

  useEffect(() => {
    setCurrentPos(position);
  }, [position]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, currentPos[0], 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, currentPos[2], 0.1);
      
      if (isSelected) {
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1] + 0.8 + Math.sin(state.clock.elapsedTime * 5) * 0.1, 0.1);
      } else {
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1] + 0.4, 0.1);
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* The Billboard component makes the piece always face the camera */}
      <Billboard position={[0, 0, 0]} follow={true}>
        <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
          <Text
            fontSize={0.9}
            color={color === 'w' ? '#00f5ff' : '#ffffff'}
            anchorX="center"
            anchorY="middle"
            // REMOVED the rotation that made it lie flat
          >
            {pieceChar}
            <meshStandardMaterial 
              emissive={color === 'w' ? '#00f5ff' : '#ffffff'} 
              emissiveIntensity={isSelected ? 3 : 1} 
              toneMapped={false}
            />
          </Text>
        </Float>
      </Billboard>
    </group>
  );
};

const ChessBoard3D: React.FC<ChessBoard3DProps> = ({
  isPlayable = true,
  onMove,
  initialFen,
  moves = [],
  playerColor = 'white',
}) => {
  const chess = useMemo(() => {
    const c = new Chess(initialFen);
    moves.forEach(m => {
      try { c.move(m); } catch (e) {}
    });
    return c;
  }, [initialFen, moves]);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);

  const board = chess.board();

  const handleSquareClick = (square: string) => {
    if (!isPlayable) return;
    const turn = chess.turn() === 'w' ? 'white' : 'black';
    if (turn !== playerColor) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          setSelectedSquare(null);
          setLegalMoves([]);
          if (onMove) onMove(move);
          return;
        }
      } catch (e) {}
    }

    const piece = chess.get(square as any);
    if (piece && (piece.color === 'w' ? 'white' : 'black') === playerColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as any, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const renderBoard = () => {
    const squares = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const file = String.fromCharCode(97 + j);
        const rank = 8 - i;
        const squareName = `${file}${rank}`;
        const isDark = (i + j) % 2 === 1;
        const pos: [number, number, number] = [j - 3.5, 0, i - 3.5];
        
        squares.push(
          <Square3D 
            key={squareName}
            position={pos}
            color={isDark ? '#1a2a4a' : '#2a3a5a'}
            isHighlighted={selectedSquare === squareName}
            isLegal={legalMoves.includes(squareName)}
            onClick={() => handleSquareClick(squareName)}
          />
        );

        const piece = board[i][j];
        if (piece) {
          squares.push(
            <Piece3D 
              key={`piece-${squareName}`}
              type={piece.type}
              color={piece.color}
              position={pos}
              isSelected={selectedSquare === squareName}
            />
          );
        }
      }
    }
    return squares;
  };

  return (
    <div style={{ width: '100%', height: '600px', background: '#0a0a1a', borderRadius: '8px', overflow: 'hidden', border: '2px solid #00f5ff' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={50} />
        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={5} 
          maxDistance={15} 
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

        <group rotation={[0, playerColor === 'black' ? Math.PI : 0, 0]}>
          {renderBoard()}
          
          {/* Board Base */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[8.5, 0.2, 8.5]} />
            <meshStandardMaterial color="#050510" />
          </mesh>
          
          {/* Neon Border */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[8.2, 0.05, 8.2]} />
            <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2} wireframe />
          </mesh>
        </group>

        <gridHelper args={[20, 20, '#00f5ff', '#1a2a4a']} position={[0, -0.5, 0]} />
      </Canvas>
      
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: '#00f5ff', pointerEvents: 'none', fontFamily: 'monospace' }}>
        3D VIEW ENABLED • ORBIT TO ROTATE
      </div>
    </div>
  );
};

export default ChessBoard3D;
