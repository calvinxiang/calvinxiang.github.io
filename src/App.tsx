import React, { Suspense, useEffect, useState, useRef, useMemo, useCallback, createContext } from 'react'
import { Canvas, useThree, useFrame, useLoader, extend, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Text, useTexture } from '@react-three/drei'
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon'
import * as THREE from 'three'
import './App.css'
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'
import Joystick from './components/Joystick'

// Create a context for mobile control
export const MobileControlContext = createContext<{
  joystickActive: boolean;
  joystickX: number;
  joystickY: number;
}>({
  joystickActive: false,
  joystickX: 0,
  joystickY: 0,
});

function InfoPanel() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className={`info-panel ${isVisible ? 'visible' : 'hidden'}`}>
      <button
        className="toggle-button"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? '×' : 'ℹ'}
      </button>

      <div className="info-content">
        <h1>Calvin Xiang</h1>
        <p className="bio">
          I'm 20 years old and I'm a student at Waterloo. I'm interested in software development and machine learning.
          I'm looking for a software engineering internship for Winter 2026. As you can see I also like to play hockey.
        </p>
        <div className="controls">
          <h2>Controls</h2>
          <ul>
            <li>WASD / Joystick - Move penguin</li>
            <li>Mouse/Touch - Rotate camera</li>
            <li>Scroll/Pinch - Zoom camera</li>
          </ul>
        </div>

        <div className="links">
          <a
            href="https://github.com/calvinxiang"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub size={24} />
          </a>
          <a
            href="https://www.linkedin.com/in/calvinxiang/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://x.com/Calxin__"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTwitter size={24} />
          </a>
          <a href="CalvinXiangResumeWebsite.pdf" target="_blank" rel="noopener noreferrer">
            Resume
          </a>
        </div>
      </div>
    </div>
  );
}

function Player() {
  const [position, setPosition] = useState<[number, number, number]>([0, 1, 0])
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set())
  const leftFlipperRef = useRef<THREE.Mesh>(null)
  const rightFlipperRef = useRef<THREE.Mesh>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  
  // Get joystick values from context
  const { joystickActive, joystickX, joystickY } = React.useContext(MobileControlContext);
  
  // Move constants outside component to prevent recreation
  const speed = 11
  const rotationSpeed = 6
  const rinkBounds = useMemo(() => ({ x: 14, z: 29 }), [])
  
  // Use refs for animation values to prevent re-renders
  const lastTime = useRef(performance.now())
  const isMoving = useRef(false)
  const flipperAngle = useRef(0)
  const waddleAngle = useRef(0)
  const currentPosition = useRef<[number, number, number]>([0, 1, 0])
  const currentRotation = useRef<[number, number, number]>([0, 0, 0])

  const checkCollision = useCallback((newX: number, newZ: number) => {
    const hitX = Math.abs(newX) > (rinkBounds.x - 0.01)
    const hitZ = Math.abs(newZ) > (rinkBounds.z - 0.01)

    if (!hitX && !hitZ) {
      return { collision: false, allowedX: newX, allowedZ: newZ }
    }

    return { 
      collision: true, 
      allowedX: hitX ? Math.sign(newX) * rinkBounds.x : newX,
      allowedZ: hitZ ? Math.sign(newZ) * rinkBounds.z : newZ
    }
  }, [rinkBounds])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed(prev => new Set(prev).add(e.key.toLowerCase()))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed(prev => {
        const next = new Set(prev)
        next.delete(e.key.toLowerCase())
        return next
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Optimize movement updates using useFrame
  useFrame((state, delta) => {
    // Update movement
    if (keysPressed.size > 0 || joystickActive) {
      const moveDirection = new THREE.Vector3(0, 0, 0)
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      // Handle keyboard input
      if (keysPressed.has('w')) moveDirection.add(forward)
      if (keysPressed.has('s')) moveDirection.sub(forward)
      if (keysPressed.has('a')) moveDirection.sub(right)
      if (keysPressed.has('d')) moveDirection.add(right)

      // Handle joystick input
      if (joystickActive) {
        // Convert joystick X/Y to movement vector
        moveDirection.add(right.clone().multiplyScalar(joystickX));
        moveDirection.add(forward.clone().multiplyScalar(-joystickY));
      }

      if (moveDirection.length() > 0) {
        moveDirection.normalize()
        const newX = currentPosition.current[0] + moveDirection.x * speed * delta
        const newZ = currentPosition.current[2] + moveDirection.z * speed * delta

        const targetAngle = Math.atan2(moveDirection.x, moveDirection.z)
        let angleDiff = targetAngle - currentRotation.current[1]
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        
        const newAngle = currentRotation.current[1] + angleDiff * rotationSpeed * delta
        const { allowedX, allowedZ } = checkCollision(newX, newZ)

        currentPosition.current = [allowedX, currentPosition.current[1], allowedZ]
        currentRotation.current = [0, newAngle, 0]
        
        // Batch state updates
        setPosition(currentPosition.current)
        setRotation(currentRotation.current)
      }
    }

    // Update animations
    if (keysPressed.size > 0 || joystickActive) {
      isMoving.current = true
      flipperAngle.current += delta * 5
      waddleAngle.current += delta * 5
      
      if (leftFlipperRef.current && rightFlipperRef.current) {
        // Animate the flippers
        leftFlipperRef.current.rotation.z = Math.sin(flipperAngle.current) * 0.25
        rightFlipperRef.current.rotation.z = -Math.sin(flipperAngle.current) * 0.25
        
        // Waddle animation (bobbing up and down slightly while moving)
        if (bodyRef.current) {
          bodyRef.current.position.y = Math.abs(Math.sin(waddleAngle.current)) * 0.1 + 0.05
        }
      }
    } else {
      isMoving.current = false
      
      // Reset animations when not moving
      if (leftFlipperRef.current && rightFlipperRef.current) {
        leftFlipperRef.current.rotation.z = THREE.MathUtils.lerp(leftFlipperRef.current.rotation.z, 0, delta * 5)
        rightFlipperRef.current.rotation.z = THREE.MathUtils.lerp(rightFlipperRef.current.rotation.z, 0, delta * 5)
        
        if (bodyRef.current) {
          bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, delta * 5)
        }
      }
    }

    // Apply animations
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(waddleAngle.current) * 0.05
      bodyRef.current.position.y = Math.abs(Math.sin(waddleAngle.current)) * 0.05
      bodyRef.current.rotation.x = Math.sin(waddleAngle.current * 2) * 0.02
    }

    if (leftFlipperRef.current && rightFlipperRef.current) {
      const flipperWave = Math.sin(flipperAngle.current) * 0.5
      leftFlipperRef.current.rotation.x = flipperWave
      rightFlipperRef.current.rotation.x = -flipperWave
    }
  })

  // Make position available to other components
  useEffect(() => {
    // @ts-ignore - Add player position to window for easy access by Puck
    window.playerPosition = position;
  }, [position])

  // Memoize the player model to prevent unnecessary re-renders
  const playerModel = useMemo(() => (
    <group ref={bodyRef}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.8, 1.4, 0.6]} />
        <meshStandardMaterial color="#2C3539" roughness={0.6} />
      </mesh>

      <group position={[0, 0.9, 0]}>
        <mesh 
          ref={leftFlipperRef}
          position={[-0.45, 0, 0]} 
          rotation={[0, 0, -Math.PI / 4]} 
          castShadow
        >
          <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
          <meshStandardMaterial color="#2C3539" roughness={0.6} />
        </mesh>
        <mesh 
          ref={rightFlipperRef}
          position={[0.45, 0, 0]} 
          rotation={[0, 0, Math.PI / 4]} 
          castShadow
        >
          <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
          <meshStandardMaterial color="#2C3539" roughness={0.6} />
        </mesh>
      </group>

      <mesh position={[0, 0.7, 0.31]} castShadow>
        <boxGeometry args={[0.6, 1.0, 0.01]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>

      <group position={[0, 1.2, 0.3]}>
        <mesh position={[-0.15, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color="black" roughness={0.3} />
        </mesh>
        <mesh position={[-0.13, 0.03, 0.05]}>
          <sphereGeometry args={[0.03, 32, 32]} />
          <meshStandardMaterial color="white" roughness={0.1} />
        </mesh>

        <mesh position={[0.15, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color="black" roughness={0.3} />
        </mesh>
        <mesh position={[0.17, 0.03, 0.05]}>
          <sphereGeometry args={[0.03, 32, 32]} />
          <meshStandardMaterial color="white" roughness={0.1} />
        </mesh>
      </group>

      <mesh position={[0, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color="#FF6B00" roughness={0.3} />
      </mesh>
    </group>
  ), [])

  return (
    <group position={[position[0], 0, position[2]]} rotation={rotation}>
      {playerModel}
      {/* Feet - kept outside body group to stay grounded */}
      <group position={[0.15, 0.02, 0.2]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.14, 0.035, 0.1]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        
        {/* Outline for feet */}
        <mesh scale={[1.25, 1.5, 1.25]}>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial 
            color="#00BFFF" 
            emissive="#00BFFF"
            emissiveIntensity={1.5}
            transparent 
            opacity={0.8} 
            side={THREE.BackSide} 
          />
        </mesh>
      </group>
      <group position={[-0.15, 0.02, 0.2]} rotation={[0, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.14, 0.035, 0.1]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

function GoalNet({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  // Use refs to store goal net meshes for collision detection
  const postLeftRef = useRef<THREE.Mesh>(null)
  const postRightRef = useRef<THREE.Mesh>(null)
  const crossbarRef = useRef<THREE.Mesh>(null)
  const baseBarRef = useRef<THREE.Mesh>(null)
  const backFrameRef = useRef<THREE.Group>(null)
  const netPaddingRef = useRef<THREE.Mesh>(null)
  
  // Store goal bounds for collision detection
  const goalBounds = useMemo(() => {
    // Create basic goal dimensions for collision
    return {
      width: 2.2,
      height: 1.2,
      depth: 0.8,
      postWidth: 0.05
    }
  }, [])

  // Add collision detection between player and goal
  useFrame(() => {
    // @ts-ignore - Access player position from window object
    if (window.playerPosition) {
      // @ts-ignore - Access player position
      const playerPos = window.playerPosition
      const playerX = playerPos[0]
      const playerZ = playerPos[2]
      
      // Calculate goal position in world space
      const goalX = position[0]
      const goalZ = position[2]
      
      // Rotate the player position around the goal to account for goal rotation
      // This simplifies collision detection by treating the goal as if it's not rotated
      const angleY = rotation[1]
      const relativeX = playerX - goalX
      const relativeZ = playerZ - goalZ
      
      // Apply inverse rotation to get player's position relative to the goal's orientation
      const rotatedX = relativeX * Math.cos(-angleY) - relativeZ * Math.sin(-angleY)
      const rotatedZ = relativeX * Math.sin(-angleY) + relativeZ * Math.cos(-angleY)
      
      // Player dimensions (approximate)
      const playerWidth = 0.8
      const playerDepth = 0.6
      
      // Check collision with posts and crossbar
      const halfPostWidth = goalBounds.postWidth / 2
      const halfGoalWidth = goalBounds.width / 2
      const postLeftX = -halfGoalWidth - halfPostWidth
      const postRightX = halfGoalWidth + halfPostWidth
      
      // Collision boxes for the main parts of the goal
      const postLeftCollision = {
        minX: postLeftX - halfPostWidth,
        maxX: postLeftX + halfPostWidth,
        minZ: -goalBounds.depth / 2,
        maxZ: goalBounds.depth / 2
      }
      
      const postRightCollision = {
        minX: postRightX - halfPostWidth,
        maxX: postRightX + halfPostWidth,
        minZ: -goalBounds.depth / 2,
        maxZ: goalBounds.depth / 2
      }
      
      const crossbarCollision = {
        minX: -halfGoalWidth,
        maxX: halfGoalWidth,
        minZ: -halfPostWidth,
        maxZ: halfPostWidth
      }
      
      const backCollision = {
        minX: -halfGoalWidth,
        maxX: halfGoalWidth,
        minZ: -goalBounds.depth - halfPostWidth,
        maxZ: -goalBounds.depth + halfPostWidth
      }
      
      // Player collision box (simplified)
      const playerCollision = {
        minX: rotatedX - playerWidth / 2,
        maxX: rotatedX + playerWidth / 2,
        minZ: rotatedZ - playerDepth / 2,
        maxZ: rotatedZ + playerDepth / 2
      }
      
      // Check for overlaps
      const collidesWith = (box1: any, box2: any) => {
        return (
          box1.minX < box2.maxX &&
          box1.maxX > box2.minX &&
          box1.minZ < box2.maxZ &&
          box1.maxZ > box2.minZ
        )
      }
      
      // If collision detected, prevent player movement
      if (
        collidesWith(playerCollision, postLeftCollision) ||
        collidesWith(playerCollision, postRightCollision) ||
        collidesWith(playerCollision, crossbarCollision) ||
        collidesWith(playerCollision, backCollision)
      ) {
        // Push the player away from the goal
        // Calculate push direction (simplified)
        const pushX = goalX - playerX
        const pushZ = goalZ - playerZ
        const pushDist = Math.sqrt(pushX * pushX + pushZ * pushZ)
        
        if (pushDist > 0) {
          const normalizedPushX = pushX / pushDist
          const normalizedPushZ = pushZ / pushDist
          
          // Update player position (push them away slightly)
          // @ts-ignore - We're updating the global player position
          window.playerPosition = [
            playerX - normalizedPushX * 0.1,
            playerPos[1],
            playerZ - normalizedPushZ * 0.1
          ]
        }
      }
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Net frame */}
      {/* Top bar */}
      <mesh ref={crossbarRef} position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#990000" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Bottom bar */}
      <mesh ref={baseBarRef} position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#990000" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Side posts */}
      <mesh ref={postLeftRef} position={[-1.1, 0.6, 0]} castShadow>
        <boxGeometry args={[0.05, 1.25, 0.05]} />
        <meshStandardMaterial color="#990000" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh ref={postRightRef} position={[1.1, 0.6, 0]} castShadow>
        <boxGeometry args={[0.05, 1.25, 0.05]} />
        <meshStandardMaterial color="#990000" metalness={0.3} roughness={0.3} />
      </mesh>
      
      {/* Back support bars */}
      <group ref={backFrameRef}>
        <mesh position={[0, 1.2, -0.8]} castShadow>
          <boxGeometry args={[2.2, 0.05, 0.05]} />
          <meshStandardMaterial color="#990000" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.8]} castShadow>
          <boxGeometry args={[2.2, 0.05, 0.05]} />
          <meshStandardMaterial color="#990000" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[-1.1, 0.6, -0.8]} castShadow>
          <boxGeometry args={[0.05, 1.25, 0.05]} />
          <meshStandardMaterial color="#990000" metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh position={[1.1, 0.6, -0.8]} castShadow>
          <boxGeometry args={[0.05, 1.25, 0.05]} />
          <meshStandardMaterial color="#990000" metalness={0.3} roughness={0.3} />
        </mesh>
      </group>
      
      {/* White net base at bottom - for the white net padding seen in hockey goals */}
      <mesh ref={netPaddingRef} position={[0, 0.08, -0.4]} castShadow>
        <boxGeometry args={[2.1, 0.16, 0.8]} />
        <meshStandardMaterial color="white" roughness={0.8} />
      </mesh>
      
      {/* Full net coverage - sides */}
      <mesh position={[-1.1, 0.6, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 1.25]} />
        <meshStandardMaterial color="white" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.1, 0.6, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 1.25]} />
        <meshStandardMaterial color="white" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Full net coverage - top */}
      <mesh position={[0, 1.225, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.25, 0.85]} />
        <meshStandardMaterial color="white" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Full net coverage - back */}
      <mesh position={[0, 0.6, -0.83]}>
        <planeGeometry args={[2.25, 1.25]} />
        <meshStandardMaterial color="white" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Net material - vertical netting lines */}
      {Array.from({ length: 17 }).map((_, i) => (
        <group key={`vertical-net-${i}`}>
          {/* Front to back vertical lines */}
          <mesh position={[-1.05 + i * 0.13, 0.6, -0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.003, 0.003, 0.85, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* Left side vertical lines */}
          <mesh position={[-1.1, 0.05 + i * 0.075, -0.4]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.003, 0.003, 0.85, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* Right side vertical lines */}
          <mesh position={[1.1, 0.05 + i * 0.075, -0.4]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.003, 0.003, 0.85, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ))}
      
      {/* Net material - horizontal netting lines */}
      {Array.from({ length: 13 }).map((_, i) => (
        <group key={`horizontal-net-${i}`}>
          {/* Top horizontal lines */}
          <mesh position={[0, 1.2, -0.4 - i * 0.07]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.003, 0.003, 2.2, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* Back horizontal lines */}
          <mesh position={[0, 0.05 + i * 0.1, -0.8]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.003, 0.003, 2.2, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ))}
      
      {/* Additional diagonal supports for realism */}
      <mesh position={[0, 0.6, -0.4]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 1.5, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.6, -0.4]} rotation={[-Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 1.5, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.6, -0.4]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 2.8, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.6, -0.4]} rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 2.8, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}

function HockeyRink() {
  return (
    <group>
      {/* Ice surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[30, 60]} />
        <meshStandardMaterial 
          color="#e8f4ff"
          roughness={0.05}
          metalness={0.4}
          emissive="#b3d9ff"
          emissiveIntensity={0.3}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Ice underlayer for depth effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[30, 60]} />
        <meshStandardMaterial 
          color="#b3d9ff" 
          roughness={0.1}
          metalness={0.3}
          emissive="#80bfff"
          emissiveIntensity={0.2}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Boards */}
      {/* Long sides */}
      <mesh position={[15, 1, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 2, 60]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-15, 1, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 2, 60]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.1} />
      </mesh>

      {/* Short sides */}
      <mesh position={[0, 1, 30]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 2, 0.5]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 1, -30]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 2, 0.5]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.1} />
      </mesh>

      {/* Blue lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -12]}>
        <planeGeometry args={[30, 0.3]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 12]}>
        <planeGeometry args={[30, 0.3]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.1} />
      </mesh>

      {/* Center red line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[30, 0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[4.5, 4.8, 32]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.1} />
      </mesh>

      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.1} />
      </mesh>

      {/* Face-off circles */}
      {/* Left side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, 0.01, -20]}>
        <ringGeometry args={[4.5, 4.8, 32]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, 0.01, -20]}>
        <ringGeometry args={[4.5, 4.8, 32]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      {/* Right side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, 0.01, 20]}>
        <ringGeometry args={[4.5, 4.8, 32]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, 0.01, 20]}>
        <ringGeometry args={[4.5, 4.8, 32]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>

      {/* Goal creases */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -27]}>
        <circleGeometry args={[2.3, 32, 0, Math.PI]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.01, 27]}>
        <circleGeometry args={[2.3, 32, 0, Math.PI]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>

      {/* Face-off dots */}
      {/* Neutral zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, 0.01, -7]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, 0.01, -7]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, 0.01, 7]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, 0.01, 7]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>

      {/* End zones face-off dots */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, 0.01, -20]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, 0.01, -20]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, 0.01, 20]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, 0.01, 20]}>
        <circleGeometry args={[0.3]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.1} />
      </mesh>

      {/* Team Benches - Left side */}
      <group position={[-17, 0, 0]}>
        {/* Home Team Wooden Bench */}
        <group position={[0, 0, -8]}>
          {/* Main support legs */}
          {[-5, 0, 5].map((z) => (
            <group key={z} position={[0, 0, z]}>
              {/* Vertical support */}
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.9, 0.3]} />
                <meshStandardMaterial color="#4A2511" roughness={0.9} />
              </mesh>
              {/* Horizontal support */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[1.5, 0.15, 0.3]} />
                <meshStandardMaterial color="#4A2511" roughness={0.9} />
              </mesh>
            </group>
          ))}

          {/* Seat slats */}
          {Array.from({length: 15}).map((_, i) => (
            <mesh key={`seat-${i}`} position={[0, 0.9, -5 + i * 0.7]} castShadow>
              <boxGeometry args={[1.5, 0.1, 0.4]} />
              <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
            </mesh>
          ))}

          {/* Back support posts */}
          {[-5, 0, 5].map((z) => (
            <mesh key={`back-${z}`} position={[-0.6, 0.9, z]} castShadow>
              <boxGeometry args={[0.1, 1, 0.2]} />
              <meshStandardMaterial color="#4A2511" roughness={0.9} />
            </mesh>
          ))}

          {/* Back slats */}
          {Array.from({length: 4}).map((_, i) => (
            <mesh key={`backslat-${i}`} position={[-0.6, 0.9 + i * 0.25, 0]} rotation={[0, 0, Math.PI * 0.1]} castShadow>
              <boxGeometry args={[0.1, 0.15, 11]} />
              <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* Center divider - simple wooden post */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.4, 2.4, 0.4]} />
          <meshStandardMaterial color="#4A2511" roughness={0.9} />
        </mesh>

        {/* Away Team Wooden Bench */}
        <group position={[0, 0, 8]}>
          {/* Main support legs */}
          {[-5, 0, 5].map((z) => (
            <group key={z} position={[0, 0, z]}>
              {/* Vertical support */}
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.9, 0.3]} />
                <meshStandardMaterial color="#4A2511" roughness={0.9} />
              </mesh>
              {/* Horizontal support */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[1.5, 0.15, 0.3]} />
                <meshStandardMaterial color="#4A2511" roughness={0.9} />
              </mesh>
            </group>
          ))}

          {/* Seat slats */}
          {Array.from({length: 15}).map((_, i) => (
            <mesh key={`seat-${i}`} position={[0, 0.9, -5 + i * 0.7]} castShadow>
              <boxGeometry args={[1.5, 0.1, 0.4]} />
              <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
            </mesh>
          ))}

          {/* Back support posts */}
          {[-5, 0, 5].map((z) => (
            <mesh key={`back-${z}`} position={[-0.6, 0.9, z]} castShadow>
              <boxGeometry args={[0.1, 1, 0.2]} />
              <meshStandardMaterial color="#4A2511" roughness={0.9} />
            </mesh>
          ))}

          {/* Back slats */}
          {Array.from({length: 4}).map((_, i) => (
            <mesh key={`backslat-${i}`} position={[-0.6, 0.9 + i * 0.25, 0]} rotation={[0, 0, Math.PI * 0.1]} castShadow>
              <boxGeometry args={[0.1, 0.15, 11]} />
              <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Enhanced Penalty Box - Right side */}
      <group position={[17, 0, 0]}>
        {/* Wooden Bench Structure */}
        <group>
          {/* Main support legs */}
          {[-3, 0, 3].map((z) => (
            <group key={z} position={[0, 0, z]}>
              {/* Vertical support */}
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.9, 0.3]} />
                <meshStandardMaterial color="#4A2511" roughness={0.9} />
              </mesh>
              {/* Horizontal support */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[1.5, 0.15, 0.3]} />
                <meshStandardMaterial color="#4A2511" roughness={0.9} />
              </mesh>
            </group>
          ))}

          {/* Seat slats */}
          {Array.from({length: 10}).map((_, i) => (
            <mesh key={`seat-${i}`} position={[0, 0.9, -3.5 + i * 0.7]} castShadow>
              <boxGeometry args={[1.5, 0.1, 0.4]} />
              <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
            </mesh>
          ))}

          {/* Back support posts */}
          {[-3, 0, 3].map((z) => (
            <mesh key={`back-${z}`} position={[0.6, 0.9, z]} castShadow>
              <boxGeometry args={[0.1, 1, 0.2]} />
              <meshStandardMaterial color="#4A2511" roughness={0.9} />
            </mesh>
          ))}

          {/* Back slats */}
          {Array.from({length: 4}).map((_, i) => (
            <mesh key={`backslat-${i}`} position={[0.6, 0.9 + i * 0.25, 0]} rotation={[0, 0, -Math.PI * 0.1]} castShadow>
              <boxGeometry args={[0.1, 0.15, 7]} />
              <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Doors */}
      {/* Team Bench Doors */}
      <mesh position={[-16, 1, -2]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 0.1]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>
      <mesh position={[-16, 1, 2]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 0.1]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>
      {/* Penalty Box Door */}
      <mesh position={[16, 1, -2]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 0.1]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>

      {/* Add goalie nets at both ends of the rink */}
      <GoalNet position={[0, 0, -27]} rotation={[0, 0, 0]} />
      <GoalNet position={[0, 0, 27]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

function Tree({ position, scale = 1, variant = 0 }: { position: [number, number, number], scale?: number, variant?: number }) {
  // Use variant to create different tree types
  const treeVariant = useMemo(() => {
    // Random values derived from the variant number for consistency
    const variantSeed = variant || Math.random() * 100;
    const pseudoRandom = (offset: number) => Math.sin(variantSeed * 0.1 + offset) * 0.5 + 0.5;
    
    return {
      // Tree height variation (taller or shorter)
      height: 1 + pseudoRandom(1) * 0.5,
      
      // Tree width variation (wider or narrower)
      width: 0.8 + pseudoRandom(2) * 0.4,
      
      // Trunk variation
      trunkWidth: 0.3 + pseudoRandom(3) * 0.2,
      trunkHeight: 3 + pseudoRandom(4) * 2,
      
      // Color variation - slight differences in green shade
      colorVariation: pseudoRandom(5) * 0.2,
      
      // Number of layers
      layers: Math.floor(pseudoRandom(6) * 2) + 3, // 3-4 layers
      
      // Layer spacing
      layerSpacing: 1 + pseudoRandom(7) * 0.5,
      
      // Slight trunk offset for windblown look
      trunkLean: (pseudoRandom(8) - 0.5) * 0.1,
      
      // Branch density
      branchDensity: Math.floor(pseudoRandom(9) * 3) + 6 // 6-8 sides for cone
    };
  }, [variant]);

  return (
    <group position={position} scale={scale * 1.8}>
      {/* Tree trunk with slight lean */}
      <mesh 
        castShadow 
        position={[
          treeVariant.trunkLean, 
          treeVariant.trunkHeight / 2 * treeVariant.height, 
          0
        ]}
        rotation={[0, 0, treeVariant.trunkLean * 2]}
      >
        <cylinderGeometry 
          args={[
            treeVariant.trunkWidth, 
            treeVariant.trunkWidth * 1.5, 
            treeVariant.trunkHeight * treeVariant.height
          ]} 
        />
        <meshStandardMaterial color="#3b2507" roughness={0.9} />
      </mesh>
      
      {/* Tree layers */}
      {Array.from({ length: treeVariant.layers }).map((_, layer) => {
        const layerHeight = treeVariant.trunkHeight * treeVariant.height + 
                           layer * treeVariant.layerSpacing;
        const layerWidth = (2.3 - layer * 0.3) * treeVariant.width;
        
        // Adjust color for each tree and layer
        const hue = 0.35 - treeVariant.colorVariation;
        const saturation = 0.7 + layer * 0.03;  
        const lightness = 0.2 + layer * 0.02 + treeVariant.colorVariation * 0.1;
        
        // Convert HSL to hex
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        
        return (
          <mesh 
            key={layer} 
            castShadow 
            position={[
              treeVariant.trunkLean * (1 + layer * 0.3), 
              layerHeight, 
              0
            ]}
          >
            <coneGeometry 
              args={[
                layerWidth, 
                1.5, 
                treeVariant.branchDensity
              ]} 
            />
            <meshStandardMaterial 
              color={color} 
              roughness={0.8} 
            />
          </mesh>
        );
      })}

      {/* Snow on tree layers */}
      {Array.from({ length: treeVariant.layers }).map((_, layer) => {
        const layerHeight = treeVariant.trunkHeight * treeVariant.height + 
                           layer * treeVariant.layerSpacing + 0.1;
        const layerWidth = (2.1 - layer * 0.3) * treeVariant.width;
        
        return (
          <mesh 
            key={`snow-${layer}`} 
            castShadow 
            position={[
              treeVariant.trunkLean * (1 + layer * 0.3), 
              layerHeight, 
              0
            ]}
          >
            <coneGeometry 
              args={[
                layerWidth, 
                0.2, 
                treeVariant.branchDensity
              ]} 
            />
            <meshStandardMaterial color="white" roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  )
}

function WarmingHut({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.1, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>

      {/* Walls - single piece */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[6, 3, 4]} />
        <meshStandardMaterial color="#5c4033" roughness={0.8} />
      </mesh>

      {/* Roof */}
      <group position={[0, 3, 0]}>
        {/* Left roof panel */}
        <mesh position={[0, 0.8, -1]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[6.4, 0.2, 2.8]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
        
        {/* Right roof panel */}
        <mesh position={[0, 0.8, 1]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[6.4, 0.2, 2.8]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>

        {/* Snow on roof - slightly offset to prevent z-fighting */}
        <mesh position={[0, 0.86, -1]} rotation={[-Math.PI / 6, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.4, 0.1, 2.8]} />
          <meshStandardMaterial color="white" roughness={0.2} transparent opacity={0.95} />
        </mesh>

        <mesh position={[0, 0.86, 1]} rotation={[Math.PI / 6, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.4, 0.1, 2.8]} />
          <meshStandardMaterial color="white" roughness={0.2} transparent opacity={0.95} />
        </mesh>

        {/* Ridge beam along roof peak */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[6.6, 0.51, 0.51]} />
          <meshStandardMaterial color="#8b4513" roughness={0.9} />
        </mesh>

        {/* Triangular end walls - adjusted position to prevent z-fighting */}
        <mesh position={[3.01, 0, 0]} castShadow>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                0, 0, -2,    // bottom left
                0, 0, 2,     // bottom right
                0, 1.6, 0,   // top
              ])}
              count={3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-normal"
              array={new Float32Array([
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
              ])}
              count={3}
              itemSize={3}
            />
          </bufferGeometry>
          <meshStandardMaterial color="#5c4033" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>

        <mesh position={[-3.01, 0, 0]} castShadow>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                0, 0, -2,    // bottom left
                0, 0, 2,     // bottom right
                0, 1.6, 0,   // top
              ])}
              count={3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-normal"
              array={new Float32Array([
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
              ])}
              count={3}
              itemSize={3}
            />
          </bufferGeometry>
          <meshStandardMaterial color="#5c4033" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Door */}
      <mesh position={[3.01, 1.2, 0]} castShadow>
        <boxGeometry args={[0.1, 2, 1.2]} />
        <meshStandardMaterial color="#8b4513" roughness={0.6} />
      </mesh>

      {/* Windows with frames */}
      {[-1, 0, 1].map((z) => (
        <group key={`window-${z}`} position={[3.01, 1.8, z * 1.2]}>
          {/* Window base */}
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.8, 0.8]} />
            <meshStandardMaterial 
              color="#FFE5B4"
              roughness={0.1} 
              metalness={0.3}
              emissive="#FFB347"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Window cross - vertical */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.8, 0.05]} />
            <meshStandardMaterial color="#8b4513" roughness={0.6} />
          </mesh>
          
          {/* Window cross - horizontal */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.05, 0.8]} />
            <meshStandardMaterial color="#8b4513" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function LightPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 8]} />
        <meshStandardMaterial color="#2c3539" roughness={0.7} />
      </mesh>

      {/* Light fixture */}
      <group position={[0, 3.8, 0.6]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.2, 0.8]} />
          <meshStandardMaterial color="#2c3539" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.3, 0.1, 0.6]} />
          <meshStandardMaterial color="#FFF9D6" emissive="#FFF9D6" emissiveIntensity={1} />
        </mesh>
        
        <pointLight
          position={[0, -0.5, 0]}
          intensity={1}
          distance={15}
          decay={2}
          color="#FFF9D6"
        />
      </group>
    </group>
  )
}

// Optimize TerrainSystem which is likely a major source of lag
function TerrainSystem() {
  // Create mountain ranges using useMemo to optimize performance
  const mountainGeometries = useMemo(() => {
    // Same mountain creation logic, but reduced complexity
    const ranges = []
    
    // Helper function to create a mountain range with fewer segments
    const createRange = (width: number, zPos: number, baseHeight: number, variance: number, jaggedness: number) => {
      const points: Array<{ x: number; y: number; z: number }> = []
      const segments = 20 // Reduced from 40 to 20 segments for better performance
      
      // Generate points
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments - 0.5) * width
        const z = zPos + (Math.random() - 0.5) * 20
        const height = baseHeight + 
          Math.sin(i * 0.2) * variance * 0.5 +
          Math.sin(i * 0.5) * variance * 0.3 +
          Math.random() * variance * jaggedness
        
        points.push({ x, y: height, z })
      }
      
      // Create vertices and indices for mountain mesh
      const vertices: number[] = []
      const indices: number[] = []
      
      // Front face
      points.forEach((p, i) => {
        vertices.push(p.x, p.y, p.z)      // Peak
        vertices.push(p.x, 0, p.z)        // Base
      })
      
      // Back face (offset by 10 units for thickness)
      points.forEach((p, i) => {
        vertices.push(p.x, p.y, p.z + 10)  // Peak
        vertices.push(p.x, 0, p.z + 10)    // Base
      })
      
      // Create triangles
      const numPoints = points.length
      for (let i = 0; i < numPoints - 1; i++) {
        const frontBaseIndex = i * 2
        const backBaseIndex = (numPoints * 2) + (i * 2)
        
        // Front face triangles
        indices.push(
          frontBaseIndex, frontBaseIndex + 1, frontBaseIndex + 2,
          frontBaseIndex + 1, frontBaseIndex + 3, frontBaseIndex + 2
        )
        
        // Back face triangles
        indices.push(
          backBaseIndex + 2, backBaseIndex + 1, backBaseIndex,
          backBaseIndex + 2, backBaseIndex + 3, backBaseIndex + 1
        )
        
        // Connect front to back
        indices.push(
          frontBaseIndex, backBaseIndex, frontBaseIndex + 1,
          backBaseIndex, backBaseIndex + 1, frontBaseIndex + 1
        )
      }
      
      // Add top faces to close the mountain
      indices.push(
        0, numPoints * 2, 2,              // First triangle on top
        numPoints * 2, numPoints * 2 + 2, 2  // Second triangle on top
      )
      
      // Calculate normals
      const normals = new Float32Array(vertices.length)
      for (let i = 0; i < indices.length; i += 3) {
        const idx1 = indices[i] * 3
        const idx2 = indices[i + 1] * 3
        const idx3 = indices[i + 2] * 3
        
        const v1 = new THREE.Vector3(vertices[idx1], vertices[idx1 + 1], vertices[idx1 + 2])
        const v2 = new THREE.Vector3(vertices[idx2], vertices[idx2 + 1], vertices[idx2 + 2])
        const v3 = new THREE.Vector3(vertices[idx3], vertices[idx3 + 1], vertices[idx3 + 2])
        
        const normal = new THREE.Vector3()
          .subVectors(v2, v1)
          .cross(new THREE.Vector3().subVectors(v3, v1))
          .normalize()
        
        // Apply normal to all three vertices
        for (let j = 0; j < 3; j++) {
          const idx = indices[i + j] * 3
          normals[idx] = normal.x
          normals[idx + 1] = normal.y
          normals[idx + 2] = normal.z
        }
      }
      
      return {
        vertices,
        indices,
        normals: Array.from(normals)
      }
    }
    
    // Create fewer mountain ranges for better performance - only include the most important ones
    // North mountains (essential for framing the scene)
    ranges.push(createRange(1000, -350, 60, 40, 0.8))  // Back range
    ranges.push(createRange(900, -250, 40, 30, 0.5))   // Middle range
    
    // South mountains (essential for framing the scene)
    ranges.push(createRange(1000, 350, 60, 40, 0.8))
    ranges.push(createRange(900, 250, 40, 30, 0.5))
    
    // East mountains - reduced
    ranges.push(createRange(0, 350, 60, 40, 0.8))
    
    // West mountains - reduced
    ranges.push(createRange(0, 350, 60, 40, 0.8))
    
    // Only include one corner mountain range (NE) for better performance
    ranges.push(createRange(400, -250, 50, 35, 0.7))  // Back range - NE corner

    return ranges
  }, [])
  
  // Rest of TerrainSystem rendering logic with fewer groups
  return (
    <group>
      {/* Simple ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Render only the most important mountain ranges */}
      {/* North mountains */}
      <group position={[0, 0, 0]}>
        {mountainGeometries.slice(0, 2).map((range, index) => (
          <mesh key={`mountain-north-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array(range.vertices)}
                count={range.vertices.length / 3}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-normal"
                array={new Float32Array(range.normals)}
                count={range.normals.length / 3}
                itemSize={3}
              />
              <bufferAttribute
                attach="index"
                array={new Uint16Array(range.indices)}
                count={range.indices.length}
                itemSize={1}
              />
            </bufferGeometry>
            <meshStandardMaterial 
              color={index === 0 ? "#0A1E3C" : "#1E4D8C"}
              side={THREE.DoubleSide}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Only render the most important other mountain ranges */}
      {/* South mountains */}
      <group position={[0, 0, 500]} rotation={[0, Math.PI, 0]}>
        {mountainGeometries.slice(2, 4).map((range, index) => (
          <mesh key={`mountain-south-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array(range.vertices)}
                count={range.vertices.length / 3}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-normal"
                array={new Float32Array(range.normals)}
                count={range.normals.length / 3}
                itemSize={3}
              />
              <bufferAttribute
                attach="index"
                array={new Uint16Array(range.indices)}
                count={range.indices.length}
                itemSize={1}
              />
            </bufferGeometry>
            <meshStandardMaterial 
              color={index === 0 ? "#ED7171" : "#D43838"}
              side={THREE.DoubleSide}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
      
      {/* Add the Maple Leafs flag directly to the scene, facing south mountains */}
      <group position={[0, 10, -100]} rotation={[0, Math.PI/4, 0]}>
        {/* Flag Pole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 60, 16]} />
          <meshStandardMaterial color="#777777" metalness={0.7} roughness={0.1} />
        </mesh>
        
        {/* Flag */}
        <group position={[22, 40, 0]}>
          {/* Remove the banner - Maple Leafs Blue */}
          
          {/* Just use the actual image directly */}
          <MapleLeafsLogo position={[-40, -15, 0]} rotation={[0, 30.6, 0]} scale={8} />
        </group>
        
        {/* Flag Rod - connecting pole to flag */}
        <mesh position={[0, 30, 0]} rotation={[0, 120, Math.PI/2]}>
          <cylinderGeometry args={[0.6, 0.6, 22, 12]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>
    </group>
  )
}

function WinterEnvironment() {
  // Implement a simple level-of-detail system
  const { camera } = useThree()
  const [detailLevel, setDetailLevel] = useState(0) // 0: high, 1: medium, 2: low
  
  useFrame(() => {
    // Adjust detail level based on camera distance
    const distance = camera.position.length()
    const newDetailLevel = distance < 30 ? 0 : distance < 60 ? 1 : 2
    
    if (newDetailLevel !== detailLevel) {
      setDetailLevel(newDetailLevel)
    }
  })
  
  // Adjust tree counts based on detail level
  const innerTreeCount = detailLevel === 0 ? 24 : detailLevel === 1 ? 16 : 8
  const outerTreeCount = detailLevel === 0 ? 36 : detailLevel === 1 ? 24 : 12
  const clumpCount = detailLevel === 0 ? 4 : detailLevel === 1 ? 2 : 0
  
  return (
    <group>
      <TerrainSystem />

      {/* Inner ring of trees - reduced count based on detail level */}
      {Array.from({ length: innerTreeCount }).map((_, i) => {
        const angle = (i / innerTreeCount) * Math.PI * 2
        const radius = 45 + Math.random() * 15
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const scale = 0.8 + Math.random() * 0.6
        const variant = i * 10 // Deterministic variant for stable visuals
        return <Tree key={`tree-inner-${i}`} position={[x, 0, z]} scale={scale} variant={variant} />
      })}

      {/* Outer ring of trees - reduced count based on detail level */}
      {Array.from({ length: outerTreeCount }).map((_, i) => {
        const angle = (i / outerTreeCount) * Math.PI * 2
        const radius = 90 + Math.random() * 25
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const scale = 1.0 + Math.random() * 0.8
        const variant = i * 10 + 100 // Deterministic variant for stable visuals
        return <Tree key={`tree-outer-${i}`} position={[x, 0, z]} scale={scale} variant={variant} />
      })}

      {/* Clumps of trees - only show on higher detail levels */}
      {detailLevel < 2 && Array.from({ length: clumpCount }).map((_, clumpIndex) => {
        const clumpAngle = (clumpIndex / clumpCount) * Math.PI * 2
        const clumpRadius = 60 + Math.random() * 15
        const clumpX = Math.cos(clumpAngle) * clumpRadius
        const clumpZ = Math.sin(clumpAngle) * clumpRadius
        
        return Array.from({ length: 5 }).map((_, i) => {
          // Trees clustered around the clump center
          const treeAngle = Math.random() * Math.PI * 2
          const treeRadius = 5 + Math.random() * 10
          const x = clumpX + Math.cos(treeAngle) * treeRadius
          const z = clumpZ + Math.sin(treeAngle) * treeRadius
          const scale = 1.2 + Math.random() * 0.5
          const variant = clumpIndex * 50 + i * 10 // Deterministic variant
          return (
            <Tree 
              key={`tree-clump-${clumpIndex}-${i}`} 
              position={[x, 0, z]} 
              scale={scale} 
              variant={variant} 
            />
          )
        })
      }).flat()}

      {/* Warming hut */}
      <WarmingHut position={[-25, 0, -20]} />

      {/* Light poles */}
      <LightPole position={[-20, 0, -35]} />
      <LightPole position={[20, 0, -35]} />
      <LightPole position={[-20, 0, 35]} />
      <LightPole position={[20, 0, 35]} />
    </group>
  )
}

function Scene() {
  // Use useMemo for more components to prevent re-renders
  const memoizedScene = useMemo(() => {
    return (
      <>
        {/* Lights */}
        <ambientLight intensity={0.6} />
        
        {/* Optimized shadow settings - reduced shadow map size for performance */}
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8}
          castShadow
          shadow-mapSize={[256, 256]} // Reduced for better performance
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-bias={-0.0005} // Fix shadow artifacts
        />
        
        <color attach="background" args={['#87CEEB']} />

        <WinterEnvironment />
        <HockeyRink />
        
        {/* Static penguins with built-in outline glow effect */}
        <BenchPenguin position={[-16.9, 0.95, -7]} rotation={[0, Math.PI * 0.25, 0]} key="penguin-1" /> {/* Home team bench penguin - looking more toward center */}
        <BenchPenguin position={[-16.9, 0.95, 7]} rotation={[0, Math.PI * 0.6, 0]} key="penguin-2" /> {/* Away team bench penguin - looking slightly upward */}
        <PenaltyBoxPenguin position={[16.4, 0, 0]} rotation={[0, Math.PI * 0.2, 0]} key="penguin-3" /> {/* Penalty box penguin - looking toward center of rink */}

        <Player />

        {/* Interactive hockey puck */}
        <MovablePuck />
      </>
    )
  }, [])

  return (
    <>
      {memoizedScene}
      <OrbitControls 
        minDistance={20}
        maxDistance={100}
        minPolarAngle={Math.PI / 12}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping={true}
        dampingFactor={0.05}
        target={[0, 0, 0]}
      />
    </>
  )
}

// Static penguin for the team bench
function BenchPenguin({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  // Simple wiggle animation
  const bodyRef = useRef<THREE.Group>(null)
  const leftFlipperRef = useRef<THREE.Mesh>(null)
  const rightFlipperRef = useRef<THREE.Mesh>(null)
  const glowLightRef = useRef<THREE.PointLight>(null)
  
  useFrame((state) => {
    // Gentle idle animation
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.03
      bodyRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 0.5)) * 0.02
    }
    
    if (leftFlipperRef.current && rightFlipperRef.current) {
      const flipperWave = Math.sin(state.clock.elapsedTime * 0.8) * 0.2
      leftFlipperRef.current.rotation.x = flipperWave
      rightFlipperRef.current.rotation.x = -flipperWave
    }
    
    // Animate the glow light intensity for pulsing effect
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <group position={position} rotation={rotation} scale={[1.3, 1.3, 1.3]}>
      {/* Add a point light for enhanced glow effect */}
      <pointLight 
        ref={glowLightRef}
        color="#00BFFF"
        intensity={0.6}
        distance={2}
        decay={2}
      />
      
      {/* Penguin body - positioned lower to properly sit on bench */}
      <group ref={bodyRef} position={[0, 0.6, 0]}>
        {/* Regular body */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.8, 1.4, 0.6]} />
          <meshStandardMaterial color="#2C3539" roughness={0.6} />
        </mesh>
        
        {/* Outline glow effect for body */}
        <mesh position={[0, 0.7, 0]} scale={[1.2, 1.2, 1.2]}>
          <boxGeometry args={[0.8, 1.4, 0.6]} />
          <meshStandardMaterial 
            color="#00BFFF" 
            emissive="#00BFFF"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>

        <group position={[0, 0.9, 0]}>
          <mesh 
            ref={leftFlipperRef}
            position={[-0.45, 0, 0]} 
            rotation={[0, 0, -Math.PI / 4]} 
            castShadow
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial color="#2C3539" roughness={0.6} />
          </mesh>
          
          {/* Outline for left flipper */}
          <mesh 
            position={[-0.45, 0, 0]} 
            rotation={[0, 0, -Math.PI / 4]} 
            scale={[1.4, 1.4, 1.4]}
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial 
              color="#00BFFF" 
              emissive="#00BFFF"
              emissiveIntensity={2.0}
              transparent 
              opacity={0.85} 
              side={THREE.BackSide} 
            />
          </mesh>
          
          <mesh 
            ref={rightFlipperRef}
            position={[0.45, 0, 0]} 
            rotation={[0, 0, Math.PI / 4]} 
            castShadow
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial color="#2C3539" roughness={0.6} />
          </mesh>
          
          {/* Outline for right flipper */}
          <mesh 
            position={[0.45, 0, 0]} 
            rotation={[0, 0, Math.PI / 4]} 
            scale={[1.4, 1.4, 1.4]}
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial 
              color="#00BFFF" 
              emissive="#00BFFF"
              emissiveIntensity={2.0}
              transparent 
              opacity={0.85} 
              side={THREE.BackSide} 
            />
          </mesh>
        </group>

        <mesh position={[0, 0.7, 0.31]} castShadow>
          <boxGeometry args={[0.6, 1.0, 0.01]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        
        {/* Outline for white belly */}
        <mesh position={[0, 0.7, 0.31]} scale={[1.2, 1.2, 1.2]}>
          <boxGeometry args={[0.6, 1.0, 0.01]} />
          <meshStandardMaterial 
            color="#00BFFF" 
            emissive="#00BFFF"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>

        <group position={[0, 1.2, 0.3]}>
          <mesh position={[-0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="black" roughness={0.3} />
          </mesh>
          <mesh position={[-0.13, 0.03, 0.05]}>
            <sphereGeometry args={[0.03, 32, 32]} />
            <meshStandardMaterial color="white" roughness={0.1} />
          </mesh>

          <mesh position={[0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="black" roughness={0.3} />
          </mesh>
          <mesh position={[0.17, 0.03, 0.05]}>
            <sphereGeometry args={[0.03, 32, 32]} />
            <meshStandardMaterial color="white" roughness={0.1} />
          </mesh>
        </group>

        <mesh position={[0, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.1, 0.2, 32]} />
          <meshStandardMaterial color="#FF6B00" roughness={0.3} />
        </mesh>
        
        {/* Outline for beak */}
        <mesh position={[0, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 1.4, 1.4]}>
          <coneGeometry args={[0.1, 0.2, 32]} />
          <meshStandardMaterial 
            color="#00BFFF" 
            emissive="#00BFFF"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>
      </group>

      {/* Feet */}
      <group position={[0.15, 0.62, 0.2]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.14, 0.035, 0.1]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        
        {/* Outline for feet */}
        <mesh scale={[1.25, 1.5, 1.25]}>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial 
            color="#00BFFF" 
            emissive="#00BFFF"
            emissiveIntensity={1.5}
            transparent 
            opacity={0.8} 
            side={THREE.BackSide} 
          />
        </mesh>
      </group>
      <group position={[-0.15, 0.62, 0.2]} rotation={[0, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.14, 0.035, 0.1]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// Angry penguin for the penalty box
function PenaltyBoxPenguin({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  // Simple wiggle animation
  const bodyRef = useRef<THREE.Group>(null)
  const leftFlipperRef = useRef<THREE.Mesh>(null)
  const rightFlipperRef = useRef<THREE.Mesh>(null)
  const glowLightRef = useRef<THREE.PointLight>(null)
  
  useFrame((state) => {
    // More agitated animation for the penalty box penguin
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.05
      bodyRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.03
    }
    
    if (leftFlipperRef.current && rightFlipperRef.current) {
      const flipperWave = Math.sin(state.clock.elapsedTime * 2) * 0.3
      leftFlipperRef.current.rotation.x = flipperWave
      rightFlipperRef.current.rotation.x = -flipperWave
    }
    
    // Animate the glow light intensity for an angry, pulsing effect
    if (glowLightRef.current) {
      // More rapid and intense pulsing for the angry penguin
      glowLightRef.current.intensity = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.4
    }
  })

  return (
    <group position={position} rotation={rotation} scale={[1.3, 1.3, 1.3]}>
      {/* Add a point light for enhanced glow effect */}
      <pointLight 
        ref={glowLightRef}
        color="#FF3300"
        intensity={1.2}
        distance={3.0}
        decay={2}
      />
      
      {/* Penguin body - slightly smaller with an angry tilt */}
      <group ref={bodyRef} position={[0, 1.1, 0]} rotation={[0.1, 0, 0]}>
        {/* Regular body */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.8, 1.4, 0.6]} />
          <meshStandardMaterial color="#2C3539" roughness={0.6} />
        </mesh>
        
        {/* Outline glow effect for body */}
        <mesh position={[0, 0.7, 0]} scale={[1.15, 1.15, 1.15]}>
          <boxGeometry args={[0.8, 1.4, 0.6]} />
          <meshStandardMaterial 
            color="#FF3300" 
            emissive="#FF3300"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>

        <group position={[0, 0.9, 0]}>
          <mesh 
            ref={leftFlipperRef}
            position={[-0.45, 0, 0]} 
            rotation={[0, 0, -Math.PI / 4]} 
            castShadow
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial color="#2C3539" roughness={0.6} />
          </mesh>
          
          {/* Outline for left flipper */}
          <mesh 
            position={[-0.45, 0, 0]} 
            rotation={[0, 0, -Math.PI / 4]} 
            scale={[1.4, 1.4, 1.4]}
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial 
              color="#FF3300" 
              emissive="#FF3300"
              emissiveIntensity={2.0}
              transparent 
              opacity={0.85} 
              side={THREE.BackSide} 
            />
          </mesh>
          
          <mesh 
            ref={rightFlipperRef}
            position={[0.45, 0, 0]} 
            rotation={[0, 0, Math.PI / 4]} 
            castShadow
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial color="#2C3539" roughness={0.6} />
          </mesh>
          
          {/* Outline for right flipper */}
          <mesh 
            position={[0.45, 0, 0]} 
            rotation={[0, 0, Math.PI / 4]} 
            scale={[1.4, 1.4, 1.4]}
          >
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial 
              color="#FF3300" 
              emissive="#FF3300"
              emissiveIntensity={2.0}
              transparent 
              opacity={0.85} 
              side={THREE.BackSide} 
            />
          </mesh>
        </group>

        <mesh position={[0, 0.7, 0.31]} castShadow>
          <boxGeometry args={[0.6, 1.0, 0.01]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        
        {/* Outline for white belly */}
        <mesh position={[0, 0.7, 0.31]} scale={[1.2, 1.2, 1.2]}>
          <boxGeometry args={[0.6, 1.0, 0.01]} />
          <meshStandardMaterial 
            color="#FF3300" 
            emissive="#FF3300"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>

        {/* Angry eyes - tilted down */}
        <group position={[0, 1.2, 0.3]} rotation={[0.2, 0, 0]}>
          <mesh position={[-0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="black" roughness={0.3} />
          </mesh>
          <mesh position={[-0.13, 0.01, 0.05]}>
            <sphereGeometry args={[0.03, 32, 32]} />
            <meshStandardMaterial color="white" roughness={0.1} />
          </mesh>

          <mesh position={[0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="black" roughness={0.3} />
          </mesh>
          <mesh position={[0.17, 0.01, 0.05]}>
            <sphereGeometry args={[0.03, 32, 32]} />
            <meshStandardMaterial color="white" roughness={0.1} />
          </mesh>
        </group>

        <mesh position={[0, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.1, 0.2, 32]} />
          <meshStandardMaterial color="#FF6B00" roughness={0.3} />
        </mesh>
        
        {/* Outline for beak */}
        <mesh position={[0, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 1.4, 1.4]}>
          <coneGeometry args={[0.1, 0.2, 32]} />
          <meshStandardMaterial 
            color="#FF3300" 
            emissive="#FF3300"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>
      </group>

      {/* Feet */}
      <group position={[0.15, 1.12, 0.2]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.14, 0.035, 0.1]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        
        {/* Outline for feet */}
        <mesh scale={[1.3, 1.5, 1.3]}>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial 
            color="#FF3300" 
            emissive="#FF3300"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>
      </group>
      <group position={[-0.15, 1.12, 0.2]} rotation={[0, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.14, 0.035, 0.1]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.5} />
        </mesh>
        
        {/* Outline for feet */}
        <mesh scale={[1.3, 1.5, 1.3]}>
          <boxGeometry args={[0.15, 0.04, 0.25]} />
          <meshStandardMaterial 
            color="#FF3300" 
            emissive="#FF3300"
            emissiveIntensity={2.0}
            transparent 
            opacity={0.85} 
            side={THREE.BackSide} 
          />
        </mesh>
      </group>
    </group>
  )
}

// Interactive hockey puck that can be pushed around
function MovablePuck() {
  const [position, setPosition] = useState<[number, number, number]>([0, 0.1, 5])
  const puckRef = useRef<THREE.Mesh>(null)
  const positionRef = useRef<[number, number, number]>([0, 0.1, 5])
  const velocityRef = useRef<[number, number, number]>([0, 0, 0])
  
  // Track if a goal was recently scored to prevent multiple triggers
  const goalScoredCooldown = useRef<boolean>(false)
  
  // Physics constants
  const friction = 0.98
  const bounceFactor = 0.8
  const kickStrength = 20 
  const rinkBounds = { x: 14, z: 29 }
  const collisionDistance = 0.8 // Reduced from 2.0 to make collision more precise
  
  // Goal positions for collision checking
  const goals = useMemo(() => [
    { position: [0, 0, -27], rotation: [0, 0, 0] },
    { position: [0, 0, 27], rotation: [0, Math.PI, 0] }
  ], [])
  
  // Function to reset puck position after goal
  const resetPuck = useCallback(() => {
    // Place puck at center ice
    positionRef.current = [0, 0.1, 0]
    // Stop all movement
    velocityRef.current = [0, 0, 0]
    // Update rendered position
    setPosition([0, 0.1, 0])
    
    // Set cooldown to prevent multiple goal triggers
    goalScoredCooldown.current = true
    // Reset cooldown after a short delay
    setTimeout(() => {
      goalScoredCooldown.current = false
    }, 1000)
    
    console.log("GOAL SCORED! Puck reset to center ice.")
  }, [])
  
  // Track player position manually
  const playerPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0))
  const lastPlayerPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0))
  const playerVelocity = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  
  // Direct access to player position via the window object
  useFrame((state, delta) => {
    // Detect player position from the window object that we added in the Player component
    // @ts-ignore - Access player position from window object
    if (window.playerPosition) {
      // @ts-ignore - Access player position
      const playerPos = window.playerPosition
      
      // Update player position reference
      playerPositionRef.current.set(playerPos[0], playerPos[1], playerPos[2])
      
      // Calculate player velocity
      playerVelocity.current.set(
        playerPositionRef.current.x - lastPlayerPosition.current.x,
        0,
        playerPositionRef.current.z - lastPlayerPosition.current.z
      ).multiplyScalar(1 / delta) // Scale by inverse delta to get units per second
      
      // Store current position for next frame
      lastPlayerPosition.current.copy(playerPositionRef.current)
    }
    
    if (!puckRef.current) return
    
    // Apply friction to slow down the puck
    velocityRef.current = [
      velocityRef.current[0] * friction,
      velocityRef.current[1],
      velocityRef.current[2] * friction
    ]
    
    // Calculate new position based on velocity
    const newX = positionRef.current[0] + velocityRef.current[0] * delta
    const newZ = positionRef.current[2] + velocityRef.current[2] * delta
    
    // Bounce off walls
    let finalX = newX
    let finalZ = newZ
    let vx = velocityRef.current[0]
    let vz = velocityRef.current[2]
    
    if (Math.abs(newX) > rinkBounds.x) {
      finalX = Math.sign(newX) * rinkBounds.x
      vx = -vx * bounceFactor
    }
    
    if (Math.abs(newZ) > rinkBounds.z) {
      finalZ = Math.sign(newZ) * rinkBounds.z
      vz = -vz * bounceFactor
    }
    
    // Check for collision with player - use actual distance
    const dx = positionRef.current[0] - playerPositionRef.current.x
    const dz = positionRef.current[2] - playerPositionRef.current.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    // If player is close to puck, apply force
    if (distance < collisionDistance) {
      // Calculate direction from player to puck (normalized)
      const dirX = dx / (distance || 1) // Avoid division by zero
      const dirZ = dz / (distance || 1) // Avoid division by zero
      
      // Calculate impact force based on player velocity
      const playerSpeed = playerVelocity.current.length()
      const impactMultiplier = 3.0 // Increased to maintain strong kicks despite smaller collision area
      
      // Kick the puck away from player with stronger force
      vx += dirX * kickStrength * delta * impactMultiplier
      vz += dirZ * kickStrength * delta * impactMultiplier
      
      // Add player's velocity component to the puck
      vx += playerVelocity.current.x * 0.7 
      vz += playerVelocity.current.z * 0.7
    }
    
    // Check for collisions with goal nets
    for (const goal of goals) {
      // Goal dimensions (approximate)
      const goalWidth = 2.2
      const goalDepth = 0.8
      
      // Calculate goal position in world space
      const goalX = goal.position[0]
      const goalZ = goal.position[2]
      const goalRotY = goal.rotation[1]
      
      // Rotate the puck position around the goal to account for goal rotation
      const relativeX = finalX - goalX
      const relativeZ = finalZ - goalZ
      
      // Apply inverse rotation to get puck's position relative to the goal's orientation
      const rotatedX = relativeX * Math.cos(-goalRotY) - relativeZ * Math.sin(-goalRotY)
      const rotatedZ = relativeX * Math.sin(-goalRotY) + relativeZ * Math.cos(-goalRotY)
      
      // Check if puck is inside the goal net or colliding with posts
      const halfGoalWidth = goalWidth / 2
      const postWidth = 0.05
      
      // Main collision zones
      const insideNet = 
        rotatedX > -halfGoalWidth && 
        rotatedX < halfGoalWidth && 
        rotatedZ < 0 && 
        rotatedZ > -goalDepth
      
      // Goal detection - front opening of the net (goal line)
      const crossedGoalLine = 
        rotatedX > -halfGoalWidth && 
        rotatedX < halfGoalWidth && 
        Math.abs(rotatedZ) < 0.2 && // Small threshold for crossing the goal line
        Math.sign(velocityRef.current[2]) === Math.sign(rotatedZ) // Moving into the net
      
      // Post collisions - check left post, right post, and crossbar
      const postLeftCollision = 
        Math.abs(rotatedX - (-halfGoalWidth)) < (postWidth + 0.4) && 
        Math.abs(rotatedZ) < postWidth && 
        rotatedZ > -goalDepth
      
      const postRightCollision = 
        Math.abs(rotatedX - halfGoalWidth) < (postWidth + 0.4) && 
        Math.abs(rotatedZ) < postWidth && 
        rotatedZ > -goalDepth
      
      const crossbarCollision = 
        Math.abs(rotatedZ) < postWidth && 
        rotatedX > -halfGoalWidth && 
        rotatedX < halfGoalWidth
      
      // Back of net collision
      const backNetCollision = 
        Math.abs(rotatedZ - (-goalDepth)) < postWidth && 
        rotatedX > -halfGoalWidth && 
        rotatedX < halfGoalWidth
      
      // If puck crossed the goal line, reset to center ice (only if not on cooldown)
      if (crossedGoalLine && !goalScoredCooldown.current) {
        resetPuck()
        // Skip the rest of processing for this frame
        return
      }
      
      // If collision with a post, bounce the puck
      if (postLeftCollision || postRightCollision || crossbarCollision || backNetCollision) {
        // Calculate bounce direction
        if (postLeftCollision) {
          vx = Math.abs(vx) * bounceFactor // Bounce right
        } else if (postRightCollision) {
          vx = -Math.abs(vx) * bounceFactor // Bounce left
        }
        
        if (crossbarCollision || backNetCollision) {
          vz = -vz * bounceFactor // Reverse z direction
        }
        
        // Add sound effect placeholder
        console.log("Puck hit goal post!");
      }
      
      // If inside the net, slow the puck down significantly
      if (insideNet) {
        vx *= 0.5
        vz *= 0.5
        // Add slight drift toward back of net
        vz -= 0.5 * delta
      }
    }
    
    // Update refs
    positionRef.current = [finalX, positionRef.current[1], finalZ]
    velocityRef.current = [vx, velocityRef.current[1], vz]
    
    // Update state with typed tuple
    setPosition([
      positionRef.current[0],
      positionRef.current[1],
      positionRef.current[2]
    ])
  })
  
  // Handle user click on puck
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    // Apply a random impulse for testing
    const strength = 30;
    const randomX = (Math.random() - 0.5) * strength;
    const randomZ = (Math.random() - 0.5) * strength;
    
    velocityRef.current = [randomX, 0, randomZ];
  };
  
  return (
    <group>
      <mesh 
        ref={puckRef} 
        position={[position[0], position[1], position[2]]} 
        castShadow 
        receiveShadow
        onPointerDown={handlePointerDown}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial color="black" roughness={0.3} />
        
        {/* Add puck detail - white stripe */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.02, 32]} />
          <meshStandardMaterial color="white" roughness={0.2} />
        </mesh>
      </mesh>
    </group>
  )
}

// Update the MapleLeafsLogo component to handle potential loading errors
function MapleLeafsLogo({ position, rotation, scale = 1 }: { position: [number, number, number], rotation: [number, number, number], scale?: number }) {
  // Use Three.js TextureLoader directly
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [aspect, setAspect] = useState<number>(1);
  
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/maple_leafs_logo.png',
      (loadedTexture) => {
        console.log("Texture loaded successfully", loadedTexture.image.width, loadedTexture.image.height);
        // Calculate and store the actual aspect ratio
        const imageAspect = loadedTexture.image.width / loadedTexture.image.height;
        setAspect(imageAspect);
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
      }
    );
  }, []);
  
  if (!texture) return null;
  
  // Use the actual image aspect ratio for the geometry
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[6 * aspect, 6]} />
      <meshBasicMaterial transparent side={THREE.DoubleSide} map={texture} />
    </mesh>
  );
}

function App() {
  const [joystickState, setJoystickState] = useState({
    joystickActive: false,
    joystickX: 0,
    joystickY: 0,
  });

  const handleJoystickMove = (x: number, y: number) => {
    setJoystickState({
      joystickActive: true,
      joystickX: x,
      joystickY: y
    });
  };

  const handleJoystickStop = () => {
    setJoystickState({
      joystickActive: false,
      joystickX: 0,
      joystickY: 0
    });
  };

  return (
    <MobileControlContext.Provider value={joystickState}>
      <div className="canvas-container">
        <InfoPanel />
        <Canvas
          shadows
          camera={{ position: [-25, 15, 25], fov: 65 }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor('#87CEEB')
            
            // More aggressive renderer optimizations
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Cap pixel ratio lower
            gl.shadowMap.type = THREE.PCFShadowMap // Use PCF instead of PCFSoft for better performance
            gl.shadowMap.autoUpdate = false // Disable auto updates for shadows
            gl.shadowMap.needsUpdate = true // Update once
            
            // Optimize camera
            camera.near = 1
            camera.far = 200 // Reduced from 300
            
            // Look at center of rink
            camera.lookAt(0, 0, 0)
          }}
          // Add stronger performance options to Canvas
          dpr={Math.min(window.devicePixelRatio, 1.5)} // Cap pixel ratio lower
          performance={{ min: 0.5, max: 1.0 }} // Allow frame rate to drop to maintain smoothness
          frameloop="demand" // Only render when needed
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
        <Joystick 
          onMove={handleJoystickMove} 
          onStop={handleJoystickStop} 
        />
      </div>
    </MobileControlContext.Provider>
  )
}

export default App;