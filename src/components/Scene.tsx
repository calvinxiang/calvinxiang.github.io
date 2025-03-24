import { useRef } from 'react'
import * as THREE from 'three'
import { Grid } from '@react-three/drei'
import Player from './Player'

function Scene() {
  const rinkRef = useRef<THREE.Group>(null)

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Environment */}
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 30, 100]} />

      {/* Grid Helper */}
      <Grid
        args={[100, 100]}
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={1}
        cellColor="#6f6f6f"
        sectionSize={5}
      />

      {/* Rink Group */}
      <group ref={rinkRef}>
        {/* Ice surface */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0.01, 0]} 
          receiveShadow
        >
          <planeGeometry args={[20, 40]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
        </mesh>

        {/* Boards */}
        <BoardWall position={[10, 1, 0]} rotation={[0, -Math.PI / 2, 0]} /> {/* Right */}
        <BoardWall position={[-10, 1, 0]} rotation={[0, Math.PI / 2, 0]} /> {/* Left */}
        <BoardWall position={[0, 1, 20]} rotation={[0, Math.PI, 0]} /> {/* Back */}
        <BoardWall position={[0, 1, -20]} rotation={[0, 0, 0]} /> {/* Front */}

        {/* Center line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[0.3, 40]} />
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Center circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[4.5, 5, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>

      {/* Player */}
      <Player />
    </>
  )
}

// Helper component for rink boards
function BoardWall({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[0.5, 2, 40]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  )
}

export default Scene 