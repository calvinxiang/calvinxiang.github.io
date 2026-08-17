import { Suspense, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei'
import { FaFilePdf, FaGithub, FaLinkedinIn } from 'react-icons/fa'
import * as THREE from 'three'
import Joystick from './components/Joystick'
import './App.css'

type JoystickState = {
  joystickActive: boolean
  joystickX: number
  joystickY: number
}

export const MobileControlContext = createContext<JoystickState>({
  joystickActive: false,
  joystickX: 0,
  joystickY: 0,
})

const playerWorldPosition = new THREE.Vector3(0, 0, 4)

function PortfolioCard() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <aside className={`portfolio-card ${isVisible ? 'is-open' : 'is-closed'}`} aria-label="About Calvin Xiang">
      <button
        className="panel-toggle"
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-expanded={isVisible}
        aria-label={isVisible ? 'Minimize profile' : 'Open profile'}
      >
        <span>{isVisible ? '−' : 'CX'}</span>
      </button>

      <div className="card-content">
        <div className="availability"><span /> Open to full-time roles</div>
        <p className="eyebrow">Software engineer · Waterloo</p>
        <h1>Calvin<br />Xiang<span>.</span></h1>
        <p className="intro">
          I'm a 21-year-old Waterloo student interested in software development and machine learning.
          I'm looking for full-time roles starting <strong>Fall 2026</strong> or <strong>Winter 2027</strong>.
        </p>

        <div className="card-actions">
          <a className="primary-action" href="./Calvin-Xiang-Resume.pdf" target="_blank" rel="noreferrer">
            <FaFilePdf aria-hidden="true" /> View résumé <span>↗</span>
          </a>
          <a className="icon-action" href="https://github.com/calvinxiang" target="_blank" rel="noreferrer" aria-label="GitHub">
            <FaGithub aria-hidden="true" />
          </a>
          <a className="icon-action" href="https://www.linkedin.com/in/calvinxiang/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <FaLinkedinIn aria-hidden="true" />
          </a>
        </div>

        <div className="controls-note">
          <span className="controls-icon">✦</span>
          <div>
            <strong>The rink is interactive</strong>
            <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move · drag to orbit · scroll to zoom</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Snowfall() {
  const points = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const values = new Float32Array(750 * 3)
    for (let index = 0; index < 750; index += 1) {
      values[index * 3] = (Math.random() - 0.5) * 75
      values[index * 3 + 1] = Math.random() * 35
      values[index * 3 + 2] = (Math.random() - 0.5) * 75
    }
    return values
  }, [])

  useFrame((_, delta) => {
    if (!points.current) return
    const array = points.current.geometry.attributes.position.array as Float32Array
    for (let index = 1; index < array.length; index += 3) {
      array[index] -= delta * 1.15
      if (array[index] < 0) array[index] = 35
    }
    points.current.geometry.attributes.position.needsUpdate = true
    points.current.rotation.y += delta * 0.006
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.11} transparent opacity={0.75} depthWrite={false} />
    </points>
  )
}

function PineTree({ position, scale = 1, tint = '#174b43' }: { position: [number, number, number], scale?: number, tint?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.29, 2.3, 7]} />
        <meshStandardMaterial color="#5b4033" roughness={1} />
      </mesh>
      {[1.45, 2.2, 2.9].map((height, index) => (
        <mesh key={height} position={[0, height, 0]} castShadow>
          <coneGeometry args={[1.35 - index * 0.22, 2.25, 7]} />
          <meshStandardMaterial color={tint} roughness={0.88} flatShading />
        </mesh>
      ))}
      {[1.9, 2.65, 3.3].map((height, index) => (
        <mesh key={height} position={[0, height, 0]}>
          <coneGeometry args={[1.18 - index * 0.2, 0.45, 7]} />
          <meshStandardMaterial color="#f5fbff" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

const treeLayout: Array<[[number, number, number], number, string]> = [
  [[-22, 0, -15], 1.45, '#123f3a'], [[-17, 0, -23], 1.1, '#1c564b'],
  [[-9, 0, -25], 0.85, '#174b43'], [[5, 0, -26], 1.15, '#123f3a'],
  [[15, 0, -23], 1.35, '#1c564b'], [[23, 0, -15], 1.05, '#174b43'],
  [[25, 0, -3], 1.5, '#123f3a'], [[22, 0, 11], 1.05, '#1c564b'],
  [[18, 0, 20], 1.3, '#174b43'], [[8, 0, 24], 0.9, '#123f3a'],
  [[-7, 0, 25], 1.35, '#1c564b'], [[-17, 0, 22], 1, '#174b43'],
  [[-25, 0, 13], 1.4, '#123f3a'], [[-24, 0, 0], 0.95, '#1c564b'],
]

function WinterIsland() {
  return (
    <group>
      <mesh position={[0, -1.7, 0]} receiveShadow>
        <cylinderGeometry args={[34, 36, 3.2, 48]} />
        <meshStandardMaterial color="#9ab5be" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[34, 34, 0.16, 48]} />
        <meshStandardMaterial color="#edf6f8" roughness={0.96} />
      </mesh>

      {treeLayout.map(([position, scale, tint], index) => (
        <PineTree key={index} position={position} scale={scale} tint={tint} />
      ))}

      <group position={[-18, 0, -13]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[4.4, 1, 3.1]} />
          <meshStandardMaterial color="#b45f3c" roughness={0.95} />
        </mesh>
        <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.3, 1.8, 4]} />
          <meshStandardMaterial color="#173b48" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.98, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3.05, 0.35, 4]} />
          <meshStandardMaterial color="#f8fcff" roughness={1} />
        </mesh>
        <mesh position={[0, 0.54, 1.56]}>
          <planeGeometry args={[0.8, 1.05]} />
          <meshStandardMaterial color="#21475a" />
        </mesh>
        <pointLight position={[0, 1.1, 2]} color="#ffc978" intensity={1.8} distance={7} />
      </group>
    </group>
  )
}

function RinkLine({ position, color, size }: { position: [number, number, number], color: string, size: [number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size[0], 0.025, size[1]]} />
      <meshStandardMaterial color={color} roughness={0.42} transparent opacity={0.82} />
    </mesh>
  )
}

function FaceoffCircle({ position, center = false }: { position: [number, number, number], center?: boolean }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.055, 8, 64]} />
        <meshStandardMaterial color="#cf4151" roughness={0.45} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.11, 0.11, 0.028, 24]} />
        <meshStandardMaterial color="#cf4151" />
      </mesh>
    </group>
  )
}

function Goal({ z, rotation = 0 }: { z: number, rotation?: number }) {
  return (
    <group position={[0, 0.19, z]} rotation={[0, rotation, 0]}>
      <mesh position={[-1.25, 0.58, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 1.16, 12]} /><meshStandardMaterial color="#df3542" /></mesh>
      <mesh position={[1.25, 0.58, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 1.16, 12]} /><meshStandardMaterial color="#df3542" /></mesh>
      <mesh position={[0, 1.16, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 2.5, 12]} /><meshStandardMaterial color="#df3542" /></mesh>
      <mesh position={[0, 0.57, -0.72]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[2.5, 1.15, 0.035]} />
        <meshStandardMaterial color="#d8e6ec" wireframe transparent opacity={0.62} />
      </mesh>
      <mesh position={[-1.23, 0.5, -0.36]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.75, 1]} /><meshStandardMaterial color="#d8e6ec" wireframe transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.23, 0.5, -0.36]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.75, 1]} /><meshStandardMaterial color="#d8e6ec" wireframe transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function HockeyRink() {
  return (
    <group>
      <RoundedBox args={[18.5, 0.5, 32.5]} radius={0.22} smoothness={4} position={[0, 0.14, 0]} receiveShadow>
        <meshPhysicalMaterial color="#d7eff7" roughness={0.24} metalness={0.05} clearcoat={0.45} clearcoatRoughness={0.3} />
      </RoundedBox>

      <RinkLine position={[0, 0.432, 0]} color="#d84954" size={[18, 0.16]} />
      <RinkLine position={[0, 0.432, -4.5]} color="#3472b8" size={[18, 0.2]} />
      <RinkLine position={[0, 0.432, 4.5]} color="#3472b8" size={[18, 0.2]} />
      <RinkLine position={[0, 0.432, -14.1]} color="#d84954" size={[18, 0.1]} />
      <RinkLine position={[0, 0.432, 14.1]} color="#d84954" size={[18, 0.1]} />
      <FaceoffCircle position={[0, 0.445, 0]} center />
      <FaceoffCircle position={[-4.6, 0.445, -10.4]} />
      <FaceoffCircle position={[4.6, 0.445, -10.4]} />
      <FaceoffCircle position={[-4.6, 0.445, 10.4]} />
      <FaceoffCircle position={[4.6, 0.445, 10.4]} />

      <Goal z={-14.1} />
      <Goal z={14.1} rotation={Math.PI} />

      <group>
        <RoundedBox args={[0.24, 1.05, 32.2]} radius={0.1} position={[-9.2, 0.74, 0]} castShadow><meshStandardMaterial color="#f8fbfc" roughness={0.68} /></RoundedBox>
        <RoundedBox args={[0.24, 1.05, 32.2]} radius={0.1} position={[9.2, 0.74, 0]} castShadow><meshStandardMaterial color="#f8fbfc" roughness={0.68} /></RoundedBox>
        <RoundedBox args={[18.2, 1.05, 0.24]} radius={0.1} position={[0, 0.74, -16.2]} castShadow><meshStandardMaterial color="#f8fbfc" roughness={0.68} /></RoundedBox>
        <RoundedBox args={[18.2, 1.05, 0.24]} radius={0.1} position={[0, 0.74, 16.2]} castShadow><meshStandardMaterial color="#f8fbfc" roughness={0.68} /></RoundedBox>
        <mesh position={[-9.34, 0.78, 0]}><boxGeometry args={[0.04, 0.23, 31.8]} /><meshStandardMaterial color="#1d5c9b" /></mesh>
        <mesh position={[9.34, 0.78, 0]}><boxGeometry args={[0.04, 0.23, 31.8]} /><meshStandardMaterial color="#1d5c9b" /></mesh>
      </group>
    </group>
  )
}

function PenguinPlayer() {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const keys = useRef(new Set<string>())
  const facing = useRef(Math.PI)
  const walkTime = useRef(0)
  const { camera } = useThree()
  const joystick = useContext(MobileControlContext)

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase())
    const onUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase())
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (!group.current) return
    const move = new THREE.Vector3()
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    if (keys.current.has('w')) move.add(forward)
    if (keys.current.has('s')) move.sub(forward)
    if (keys.current.has('a')) move.sub(right)
    if (keys.current.has('d')) move.add(right)
    if (joystick.joystickActive) {
      move.addScaledVector(right, joystick.joystickX)
      move.addScaledVector(forward, -joystick.joystickY)
    }

    if (move.lengthSq() > 0.01) {
      move.normalize()
      group.current.position.addScaledVector(move, delta * 7)
      group.current.position.x = THREE.MathUtils.clamp(group.current.position.x, -8.15, 8.15)
      group.current.position.z = THREE.MathUtils.clamp(group.current.position.z, -15.1, 15.1)
      const target = Math.atan2(move.x, move.z)
      let difference = target - facing.current
      difference = Math.atan2(Math.sin(difference), Math.cos(difference))
      facing.current += difference * Math.min(delta * 8, 1)
      group.current.rotation.y = facing.current
      walkTime.current += delta * 9
      if (body.current) {
        body.current.position.y = Math.abs(Math.sin(walkTime.current)) * 0.09
        body.current.rotation.z = Math.sin(walkTime.current) * 0.055
      }
    } else if (body.current) {
      body.current.position.y = THREE.MathUtils.lerp(body.current.position.y, 0, delta * 7)
      body.current.rotation.z = THREE.MathUtils.lerp(body.current.rotation.z, 0, delta * 7)
    }
    playerWorldPosition.copy(group.current.position)
  })

  return (
    <group ref={group} position={[0, 0.42, 4]}>
      <group ref={body}>
        <mesh position={[0, 0.75, 0]} castShadow><sphereGeometry args={[0.65, 24, 24]} /><meshStandardMaterial color="#16252e" roughness={0.7} /></mesh>
        <mesh position={[0, 0.75, 0.49]} scale={[0.7, 0.86, 0.2]}><sphereGeometry args={[0.62, 24, 24]} /><meshStandardMaterial color="#f3f7f4" roughness={0.75} /></mesh>
        <mesh position={[0, 1.42, 0]} castShadow><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color="#16252e" roughness={0.68} /></mesh>
        <mesh position={[-0.18, 1.5, 0.43]}><sphereGeometry args={[0.075, 16, 16]} /><meshStandardMaterial color="#eef6f5" /></mesh>
        <mesh position={[0.18, 1.5, 0.43]}><sphereGeometry args={[0.075, 16, 16]} /><meshStandardMaterial color="#eef6f5" /></mesh>
        <mesh position={[-0.18, 1.5, 0.495]}><sphereGeometry args={[0.035, 12, 12]} /><meshStandardMaterial color="#17212a" /></mesh>
        <mesh position={[0.18, 1.5, 0.495]}><sphereGeometry args={[0.035, 12, 12]} /><meshStandardMaterial color="#17212a" /></mesh>
        <mesh position={[0, 1.34, 0.55]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.11, 0.32, 4]} /><meshStandardMaterial color="#f3a33c" /></mesh>
        <mesh position={[-0.55, 0.86, 0]} rotation={[0.1, 0, 0.45]} castShadow><capsuleGeometry args={[0.13, 0.55, 6, 12]} /><meshStandardMaterial color="#16252e" /></mesh>
        <mesh position={[0.55, 0.86, 0]} rotation={[-0.1, 0, -0.45]} castShadow><capsuleGeometry args={[0.13, 0.55, 6, 12]} /><meshStandardMaterial color="#16252e" /></mesh>
        <mesh position={[0, 1.12, 0]}><torusGeometry args={[0.52, 0.105, 10, 32]} /><meshStandardMaterial color="#2f70b7" roughness={0.62} /></mesh>
        <mesh position={[-0.25, 0.07, 0.2]} scale={[1.5, 0.3, 2]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#f3a33c" /></mesh>
        <mesh position={[0.25, 0.07, 0.2]} scale={[1.5, 0.3, 2]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#f3a33c" /></mesh>
      </group>
    </group>
  )
}

function Puck() {
  const puck = useRef<THREE.Mesh>(null)
  const velocity = useRef(new THREE.Vector3())
  const lastPlayerPosition = useRef(playerWorldPosition.clone())

  useFrame((_, delta) => {
    if (!puck.current) return
    const playerVelocity = playerWorldPosition.clone().sub(lastPlayerPosition.current).divideScalar(Math.max(delta, 0.001))
    lastPlayerPosition.current.copy(playerWorldPosition)
    const difference = puck.current.position.clone().sub(playerWorldPosition)
    difference.y = 0
    if (difference.length() < 0.95 && playerVelocity.length() > 0.2) {
      velocity.current.add(difference.normalize().multiplyScalar(4.5)).addScaledVector(playerVelocity, 0.65)
    }
    velocity.current.multiplyScalar(Math.pow(0.35, delta))
    puck.current.position.addScaledVector(velocity.current, delta)
    if (Math.abs(puck.current.position.x) > 8.45) {
      puck.current.position.x = Math.sign(puck.current.position.x) * 8.45
      velocity.current.x *= -0.72
    }
    if (Math.abs(puck.current.position.z) > 15.45) {
      puck.current.position.z = Math.sign(puck.current.position.z) * 15.45
      velocity.current.z *= -0.72
    }
  })

  return (
    <mesh ref={puck} position={[1.3, 0.52, 3.7]} castShadow>
      <cylinderGeometry args={[0.25, 0.25, 0.11, 24]} />
      <meshStandardMaterial color="#11191d" roughness={0.48} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={['#c9e4ee', 42, 105]} />
      <hemisphereLight color="#e9f8ff" groundColor="#55757e" intensity={1.65} />
      <directionalLight
        position={[-18, 30, 16]}
        intensity={2.5}
        color="#fff9ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
      />
      <WinterIsland />
      <HockeyRink />
      <PenguinPlayer />
      <Puck />
      <Snowfall />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.32} scale={65} blur={2.7} far={22} color="#294b58" />
      <OrbitControls
        makeDefault
        target={[0, 0.6, 0]}
        minDistance={24}
        maxDistance={65}
        minPolarAngle={0.45}
        maxPolarAngle={1.32}
        enableDamping
        dampingFactor={0.055}
      />
    </>
  )
}

function App() {
  const [joystickState, setJoystickState] = useState<JoystickState>({
    joystickActive: false,
    joystickX: 0,
    joystickY: 0,
  })

  return (
    <MobileControlContext.Provider value={joystickState}>
      <main className="canvas-container">
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <PortfolioCard />
        <div className="scene-label" aria-hidden="true">
          <span>Calvin's pond</span><small>Waterloo, ON · 43.5° N</small>
        </div>
        <Canvas
          shadows
          camera={{ position: [28, 24, 37], fov: 42, near: 0.1, far: 140 }}
          dpr={[1, 1.7]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.shadowMap.type = THREE.PCFSoftShadowMap
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
          }}
        >
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
        <Joystick
          onMove={(x, y) => setJoystickState({ joystickActive: true, joystickX: x, joystickY: y })}
          onStop={() => setJoystickState({ joystickActive: false, joystickX: 0, joystickY: 0 })}
        />
      </main>
    </MobileControlContext.Provider>
  )
}

export default App
