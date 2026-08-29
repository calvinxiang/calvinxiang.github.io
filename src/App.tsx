import { Suspense, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, RoundedBox, useTexture } from '@react-three/drei'
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

        <section className="experience" aria-labelledby="experience-title">
          <div className="experience-heading">
            <h2 id="experience-title">Recent experience</h2>
            <span>AI agents · infrastructure</span>
          </div>
          <div className="experience-grid">
            <a href="https://www.safetykit.com/" target="_blank" rel="noreferrer">
              <img src="./safetykit-logo.svg" alt="" />
              <span className="experience-copy">
                <strong>SafetyKit</strong>
                <small>Technical Staff · 2026</small>
              </span>
              <span className="experience-link" aria-hidden="true">↗</span>
            </a>
            <a href="https://ridges.ai/" target="_blank" rel="noreferrer">
              <img src="./ridges-logo.png" alt="" />
              <span className="experience-copy">
                <strong>Ridges AI</strong>
                <small>Founding SWE · 2025</small>
              </span>
              <span className="experience-link" aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

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

function BoardSponsor({
  logo,
  position,
  rotation,
}: {
  logo: string
  position: [number, number, number]
  rotation: number
}) {
  const texture = useTexture(logo)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[2.05, 0.72, 0.035]} radius={0.06} smoothness={3}>
        <meshStandardMaterial color="#f8fbfc" roughness={0.68} />
      </RoundedBox>
      <mesh position={[0, 0, 0.024]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

function RinkSponsors() {
  return (
    <group>
      <BoardSponsor logo="./safetykit-logo.svg" position={[9.35, 0.78, -4.25]} rotation={Math.PI / 2} />
      <BoardSponsor logo="./ridges-logo.png" position={[9.35, 0.78, 4.25]} rotation={Math.PI / 2} />
      <BoardSponsor logo="./ridges-logo.png" position={[-9.35, 0.78, -4.25]} rotation={-Math.PI / 2} />
      <BoardSponsor logo="./safetykit-logo.svg" position={[-9.35, 0.78, 4.25]} rotation={-Math.PI / 2} />
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
      <RinkSponsors />
    </group>
  )
}

function PenguinPlayer() {
  const group = useRef<THREE.Group>(null)
  const skater = useRef<THREE.Group>(null)
  const leftFoot = useRef<THREE.Group>(null)
  const rightFoot = useRef<THREE.Group>(null)
  const leftFlipper = useRef<THREE.Group>(null)
  const rightFlipper = useRef<THREE.Group>(null)
  const stick = useRef<THREE.Group>(null)
  const keys = useRef(new Set<string>())
  const facing = useRef(0)
  const strideTime = useRef(0)
  const motionBlend = useRef(0)
  const movementVelocity = useRef(new THREE.Vector3())
  const { camera } = useThree()
  const joystick = useContext(MobileControlContext)
  const jerseyLogo = useTexture('./maple_leafs_logo.png')

  useEffect(() => {
    jerseyLogo.colorSpace = THREE.SRGBColorSpace
    jerseyLogo.needsUpdate = true
  }, [jerseyLogo])

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

  useFrame((_, frameDelta) => {
    if (!group.current) return
    const delta = Math.min(frameDelta, 0.05)
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

    const hasInput = move.lengthSq() > 0.01
    const inputStrength = Math.min(move.length(), 1)
    if (hasInput) {
      move.normalize()
    }

    const targetVelocity = hasInput ? move.multiplyScalar(7 * inputStrength) : move.set(0, 0, 0)
    const responsiveness = hasInput ? 11 : 7
    movementVelocity.current.lerp(targetVelocity, 1 - Math.exp(-responsiveness * delta))
    if (!hasInput && movementVelocity.current.lengthSq() < 0.0025) movementVelocity.current.set(0, 0, 0)

    group.current.position.addScaledVector(movementVelocity.current, delta)
    const clampedX = THREE.MathUtils.clamp(group.current.position.x, -8.15, 8.15)
    const clampedZ = THREE.MathUtils.clamp(group.current.position.z, -15.1, 15.1)
    if (clampedX !== group.current.position.x) movementVelocity.current.x = 0
    if (clampedZ !== group.current.position.z) movementVelocity.current.z = 0
    group.current.position.set(clampedX, group.current.position.y, clampedZ)

    const speed = movementVelocity.current.length()
    const skating = speed > 0.12
    if (skating) {
      const target = Math.atan2(movementVelocity.current.x, movementVelocity.current.z)
      let difference = target - facing.current
      difference = Math.atan2(Math.sin(difference), Math.cos(difference))
      facing.current += difference * (1 - Math.exp(-10 * delta))
      group.current.rotation.y = facing.current
    }

    const targetBlend = THREE.MathUtils.clamp(speed / 5.5, 0, 1)
    motionBlend.current = THREE.MathUtils.lerp(motionBlend.current, targetBlend, 1 - Math.exp(-9 * delta))
    const blend = motionBlend.current
    strideTime.current += delta * (5.5 + speed * 0.85)
    const stride = Math.sin(strideTime.current)
    const counterStride = Math.sin(strideTime.current + Math.PI)

    if (skater.current) {
      skater.current.position.y = 0.025 + Math.abs(Math.sin(strideTime.current * 2)) * 0.035 * blend
      skater.current.rotation.x = THREE.MathUtils.lerp(skater.current.rotation.x, -0.1 * blend, 1 - Math.exp(-8 * delta))
      skater.current.rotation.z = stride * 0.035 * blend
    }
    if (leftFoot.current && rightFoot.current) {
      leftFoot.current.position.x = -0.22 - Math.max(0, stride) * 0.06 * blend
      rightFoot.current.position.x = 0.22 + Math.max(0, counterStride) * 0.06 * blend
      leftFoot.current.position.z = 0.11 + stride * 0.18 * blend
      rightFoot.current.position.z = 0.11 + counterStride * 0.18 * blend
      leftFoot.current.rotation.y = 0.12 + stride * 0.18 * blend
      rightFoot.current.rotation.y = -0.12 + counterStride * 0.18 * blend
    }
    if (leftFlipper.current && rightFlipper.current) {
      leftFlipper.current.rotation.z = 0.56 - stride * 0.14 * blend
      rightFlipper.current.rotation.z = 0.56 + stride * 0.1 * blend
      leftFlipper.current.rotation.x = counterStride * 0.1 * blend
      rightFlipper.current.rotation.x = stride * 0.1 * blend
    }
    if (stick.current) stick.current.rotation.x = -0.05 + stride * 0.045 * blend

    playerWorldPosition.copy(group.current.position)
  })

  return (
    <group ref={group} position={[0, 0.45, 4]}>
      <group ref={skater}>
        <mesh position={[0, 0.82, -0.02]} scale={[0.94, 0.9, 0.9]} castShadow>
          <capsuleGeometry args={[0.49, 0.44, 10, 24]} />
          <meshStandardMaterial color="#2564a3" roughness={0.62} />
        </mesh>
        <mesh position={[0, 1.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.39, 0.05, 10, 32]} />
          <meshStandardMaterial color="#f6f8f6" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.47, 0.47, 0.1, 24]} />
          <meshStandardMaterial color="#f6f8f6" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.88, 0.485]}>
          <planeGeometry args={[0.45, 0.255]} />
          <meshBasicMaterial map={jerseyLogo} toneMapped={false} />
        </mesh>

        <mesh position={[0, 1.68, 0]} castShadow>
          <sphereGeometry args={[0.5, 30, 26]} />
          <meshStandardMaterial color="#14242c" roughness={0.68} />
        </mesh>
        <mesh position={[0, 1.63, 0.44]} scale={[0.74, 0.65, 0.2]}>
          <sphereGeometry args={[0.48, 24, 20]} />
          <meshStandardMaterial color="#f4f7f4" roughness={0.76} />
        </mesh>
        <mesh position={[-0.145, 1.7, 0.525]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color="#10191f" /></mesh>
        <mesh position={[0.145, 1.7, 0.525]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color="#10191f" /></mesh>
        <mesh position={[-0.13, 1.715, 0.562]}><sphereGeometry args={[0.012, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0.16, 1.715, 0.562]}><sphereGeometry args={[0.012, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 1.54, 0.555]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.115, 0.3, 4]} />
          <meshStandardMaterial color="#f3a33c" roughness={0.62} />
        </mesh>

        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.53, 26, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#205b96" roughness={0.5} />
        </mesh>
        <RoundedBox args={[0.68, 0.07, 0.17]} radius={0.025} smoothness={2} position={[0, 1.91, 0.45]}>
          <meshStandardMaterial color="#174a7d" roughness={0.48} />
        </RoundedBox>
        <RoundedBox args={[0.085, 0.29, 0.025]} radius={0.018} smoothness={2} position={[0, 2.02, 0.43]}>
          <meshStandardMaterial color="#f5f7f5" roughness={0.54} />
        </RoundedBox>

        <group ref={leftFlipper} position={[-0.5, 1.05, 0]} rotation={[0, 0, 0.56]}>
          <mesh position={[0, -0.13, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.34, 6, 12]} />
            <meshStandardMaterial color="#245f9d" roughness={0.66} />
          </mesh>
          <mesh position={[0, -0.38, 0.02]} scale={[0.7, 1.15, 0.55]}>
            <sphereGeometry args={[0.15, 16, 12]} />
            <meshStandardMaterial color="#14242c" roughness={0.74} />
          </mesh>
        </group>
        <group ref={rightFlipper} position={[0.5, 1.05, 0.12]} rotation={[0, 0, 0.56]}>
          <mesh position={[0, -0.13, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.34, 6, 12]} />
            <meshStandardMaterial color="#245f9d" roughness={0.66} />
          </mesh>
          <mesh position={[0, -0.38, 0.1]} scale={[0.7, 1.15, 0.55]}>
            <sphereGeometry args={[0.15, 16, 12]} />
            <meshStandardMaterial color="#14242c" roughness={0.74} />
          </mesh>
        </group>

        <group ref={leftFoot} position={[-0.22, 0.11, 0.11]}>
          <mesh position={[0, 0.035, 0.06]} scale={[1.18, 0.45, 1.45]} castShadow>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial color="#f2a23b" roughness={0.7} />
          </mesh>
          <RoundedBox args={[0.28, 0.045, 0.38]} radius={0.015} smoothness={2} position={[0, -0.055, 0.035]}>
            <meshStandardMaterial color="#26343a" metalness={0.28} roughness={0.48} />
          </RoundedBox>
        </group>
        <group ref={rightFoot} position={[0.22, 0.11, 0.11]}>
          <mesh position={[0, 0.035, 0.06]} scale={[1.18, 0.45, 1.45]} castShadow>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial color="#f2a23b" roughness={0.7} />
          </mesh>
          <RoundedBox args={[0.28, 0.045, 0.38]} radius={0.015} smoothness={2} position={[0, -0.055, 0.035]}>
            <meshStandardMaterial color="#26343a" metalness={0.28} roughness={0.48} />
          </RoundedBox>
        </group>

        <group ref={stick} position={[0.7, 0.73, 0.22]} rotation={[-0.05, 0, 0]}>
          <RoundedBox args={[0.055, 1.45, 0.055]} radius={0.012} smoothness={2} rotation={[0, 0, 0.18]} castShadow>
            <meshStandardMaterial color="#26343a" metalness={0.18} roughness={0.55} />
          </RoundedBox>
          <RoundedBox args={[0.072, 0.22, 0.072]} radius={0.012} smoothness={2} position={[-0.105, 0.59, 0]} rotation={[0, 0, 0.18]}>
            <meshStandardMaterial color="#eef2ed" roughness={0.82} />
          </RoundedBox>
          <RoundedBox args={[0.4, 0.075, 0.09]} radius={0.02} smoothness={2} position={[0.33, -0.71, 0]} rotation={[0, -0.08, 0.02]}>
            <meshStandardMaterial color="#273238" roughness={0.7} />
          </RoundedBox>
        </group>
      </group>
    </group>
  )
}

function Puck() {
  const puck = useRef<THREE.Mesh>(null)
  const velocity = useRef(new THREE.Vector3())
  const lastPlayerPosition = useRef(playerWorldPosition.clone())
  const resetTimer = useRef(0)

  useFrame((_, frameDelta) => {
    if (!puck.current) return
    const delta = Math.min(frameDelta, 0.05)

    if (resetTimer.current > 0) {
      resetTimer.current -= delta
      if (resetTimer.current <= 0) {
        puck.current.position.set(0, 0.52, 0)
        puck.current.visible = true
        velocity.current.set(0, 0, 0)
        lastPlayerPosition.current.copy(playerWorldPosition)
      }
      return
    }

    const playerVelocity = playerWorldPosition.clone().sub(lastPlayerPosition.current).divideScalar(Math.max(delta, 0.001))
    lastPlayerPosition.current.copy(playerWorldPosition)
    const difference = puck.current.position.clone().sub(playerWorldPosition)
    difference.y = 0
    if (difference.length() < 0.95 && playerVelocity.length() > 0.2) {
      velocity.current.add(difference.normalize().multiplyScalar(4.5)).addScaledVector(playerVelocity, 0.65)
    }
    velocity.current.multiplyScalar(Math.pow(0.35, delta))
    puck.current.position.addScaledVector(velocity.current, delta)

    const crossedGoalLine = Math.abs(puck.current.position.z) > 14.2
    const insideGoal = Math.abs(puck.current.position.x) < 1.16
    if (crossedGoalLine && insideGoal) {
      resetTimer.current = 0.7
      puck.current.visible = false
      velocity.current.set(0, 0, 0)
      return
    }

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
