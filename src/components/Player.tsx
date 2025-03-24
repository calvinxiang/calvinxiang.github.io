import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

export default function Player() {
  const playerRef = useRef<THREE.Mesh>(null)
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const speed = 5

  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.key.toLowerCase()) {
        case 'w':
          direction.current.z = -1
          break
        case 's':
          direction.current.z = 1
          break
        case 'a':
          direction.current.x = -1
          break
        case 'd':
          direction.current.x = 1
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch(event.key.toLowerCase()) {
        case 'w':
        case 's':
          direction.current.z = 0
          break
        case 'a':
        case 'd':
          direction.current.x = 0
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!playerRef.current) return

    // Update velocity based on direction
    velocity.current.x = direction.current.x * speed * delta
    velocity.current.z = direction.current.z * speed * delta

    // Update position
    playerRef.current.position.x += velocity.current.x
    playerRef.current.position.z += velocity.current.z

    // Rotate player in movement direction
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z)
      playerRef.current.rotation.y = angle
    }

    // Update camera to follow player
    const camera = state.camera
    const playerPosition = playerRef.current.position
    camera.position.x = playerPosition.x
    camera.position.z = playerPosition.z + 10
    camera.position.y = 5
    camera.lookAt(playerPosition)
  })

  return (
    <mesh ref={playerRef} position={[0, 1, 0]} castShadow receiveShadow>
      {/* Temporary player model - will be replaced with proper hockey player model */}
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="#0066cc" />
    </mesh>
  )
} 