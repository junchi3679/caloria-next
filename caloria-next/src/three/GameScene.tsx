import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { MovementState, DetectedPose } from '../components/ar/PoseCamera'
import type { CharacterId, MapSnapshot } from '../types'
import { CHARACTERS, SKINS } from '../store/gameStore'
import { useGameStore } from '../store/gameStore'

const MOVE_SPEED = 0.12
const TURN_SPEED = 0.08
const ATTACK_RANGE = 4.5
const CHASE_RANGE = 16
const ENEMY_MELEE_RANGE = 2.8
const MOB_RESPAWN_FRAMES = 360

const FORMATION = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-1.8, 0, 2.2),
  new THREE.Vector3(1.8, 0, 2.2),
  new THREE.Vector3(0, 0, 4.0),
]

interface CharUnit {
  group: THREE.Group
  legs: THREE.Mesh[]
  arms: THREE.Mesh[]
  rimLight: THREE.PointLight
}

interface Enemy {
  type: 'mob' | 'boss'
  group: THREE.Group
  body: THREE.Mesh
  hp: number
  maxHp: number
  exp: number
  state: 'alive' | 'dying' | 'dead'
  spawnPos: THREE.Vector3
  wanderTarget: THREE.Vector3
  wanderTimer: number
  dyingTimer: number
  respawnTimer: number
  hitFlashTimer: number
  attackTimer: number
  hpBarPivot: THREE.Group
  hpFill: THREE.Mesh
  hpBarWidth: number
  originalColor: number
}

interface Props {
  selectedCharacters: CharacterId[]
  equippedSkinsKey?: string
  movementRef: React.MutableRefObject<MovementState>
  compassRef?: React.MutableRefObject<number>
  attackEventRef?: React.MutableRefObject<{ pose: DetectedPose; seq: number }>
  mapRef?: React.MutableRefObject<MapSnapshot>
}

// ── 캐릭터 빌더 ────────────────────────────────────────────

function buildLowPolyCharacter(headColor: number, bodyColor = 0x3d2a7a) {
  const color = headColor
  const group = new THREE.Group()

  // Head — character's attribute color (bright, visible)
  const headMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), headMat)
  head.position.y = 1.9
  head.castShadow = true
  group.add(head)

  // Body suit
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, emissive: bodyColor, emissiveIntensity: 0.3 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.84, 0.32), bodyMat)
  body.position.y = 1.2
  body.castShadow = true
  group.add(body)

  // Chest accent — character color stripe
  const accentMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.34), accentMat)
  chest.position.set(0, 1.3, 0)
  group.add(chest)

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x241850, emissive: 0x0e0a2a, emissiveIntensity: 0.3 })
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), legMat)
  legL.position.set(-0.19, 0.6, 0)
  legL.castShadow = true
  group.add(legL)

  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), legMat)
  legR.position.set(0.19, 0.6, 0)
  legR.castShadow = true
  group.add(legR)

  // Arms — character color
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.58, 0.2), headMat)
  armL.position.set(-0.48, 1.25, 0)
  armL.castShadow = true
  group.add(armL)

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.58, 0.2), headMat)
  armR.position.set(0.48, 1.25, 0)
  armR.castShadow = true
  group.add(armR)

  // Core gem (glowing)
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13),
    new THREE.MeshBasicMaterial({ color }),
  )
  core.position.set(0, 1.2, 0.18)
  group.add(core)

  // Scale up slightly for better visibility
  group.scale.setScalar(1.15)

  return { group, legs: [legL, legR] as THREE.Mesh[], arms: [armL, armR] as THREE.Mesh[] }
}

function buildEnemy(type: 'mob' | 'boss'): Enemy {
  const isBoss = type === 'boss'
  const s = isBoss ? 2.2 : 1.0
  const maxHp = isBoss ? 400 : 80
  const exp = isBoss ? 200 : 20
  const color = isBoss ? 0xdd2200 : 0xaa1500

  const group = new THREE.Group()
  const bodyMat = new THREE.MeshLambertMaterial({ color })
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.55 * s, 0), bodyMat)
  body.position.y = 0.55 * s
  group.add(body)

  const spike = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22 * s, 0),
    new THREE.MeshBasicMaterial({ color: isBoss ? 0xff6600 : 0xff3333 }),
  )
  spike.position.set(0.85 * s, 0.55 * s, 0)
  group.add(spike)

  if (isBoss) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.1, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xff4400 }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.55 * s
    group.add(ring)
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshBasicMaterial({ color: 0xff8800 }),
    )
    orb.position.set(-0.85 * s, 0.55 * s, 0)
    group.add(orb)
  }

  const hpBarWidth = isBoss ? 2.4 : 1.5
  const hpBarBg = new THREE.Mesh(
    new THREE.PlaneGeometry(hpBarWidth, 0.2),
    new THREE.MeshBasicMaterial({ color: 0x220000, side: THREE.DoubleSide }),
  )
  const hpFill = new THREE.Mesh(
    new THREE.PlaneGeometry(hpBarWidth * 0.95, 0.15),
    new THREE.MeshBasicMaterial({ color: isBoss ? 0xff6600 : 0xff2222, side: THREE.DoubleSide }),
  )
  hpFill.position.z = 0.01

  const hpBarPivot = new THREE.Group()
  hpBarPivot.add(hpBarBg)
  hpBarPivot.add(hpFill)

  return {
    type, group, body,
    hp: maxHp, maxHp, exp,
    state: 'alive',
    spawnPos: new THREE.Vector3(),
    wanderTarget: new THREE.Vector3(),
    wanderTimer: 0,
    dyingTimer: 0,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackTimer: isBoss ? 90 : 120,
    hpBarPivot, hpFill,
    hpBarWidth,
    originalColor: color,
  }
}

function buildPlanetInterior(scene: THREE.Scene) {
  const crystalMeshes: THREE.Mesh[] = []

  const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50)
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x1a1040, roughness: 0.9, metalness: 0.1 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  const gPos = groundGeo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < gPos.count; i++) gPos.setY(i, (Math.random() - 0.5) * 0.7)
  gPos.needsUpdate = true
  groundGeo.computeVertexNormals()
  scene.add(ground)

  const spots = [
    { px: -18, pz: -22, color: 0x00ffcc, n: 5 },
    { px: 15,  pz: -18, color: 0xaa44ff, n: 4 },
    { px: 0,   pz: -45, color: 0xff8822, n: 6 },
    { px: -25, pz: -35, color: 0x44aaff, n: 4 },
    { px: 22,  pz: -40, color: 0x88ff44, n: 3 },
    { px: 8,   pz: -15, color: 0xff44aa, n: 3 },
    { px: -10, pz: -55, color: 0x00ffcc, n: 4 },
    { px: 32,  pz: -28, color: 0xaa44ff, n: 3 },
    { px: -30, pz: -20, color: 0xff8822, n: 3 },
    { px: 5,   pz: -65, color: 0x44aaff, n: 5 },
  ]
  spots.forEach(({ px, pz, color, n }) => {
    for (let i = 0; i < n; i++) {
      const h = 1.2 + Math.random() * 3.5
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.18 + Math.random() * 0.32, h, 5),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      )
      crystal.position.set(
        px + (Math.random() - 0.5) * 3.5,
        h / 2,
        pz + (Math.random() - 0.5) * 3.5,
      )
      crystal.rotation.set(
        (Math.random() - 0.5) * 0.25,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.25,
      )
      scene.add(crystal)
      crystalMeshes.push(crystal)
    }
  })

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a1a50, roughness: 0.95 })
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1030, roughness: 0.95 })
  for (let i = 0; i < 22; i++) {
    const h = 5 + Math.random() * 14
    const w = 1 + Math.random() * 3.5
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.9), Math.random() < 0.5 ? rockMat : darkMat)
    const angle = Math.random() * Math.PI * 2
    const r = 18 + Math.random() * 65
    pillar.position.set(Math.cos(angle) * r, h / 2 - 0.5, -5 + Math.sin(angle) * r)
    pillar.rotation.y = Math.random() * 0.5
    scene.add(pillar)
  }

  const stalMat = new THREE.MeshStandardMaterial({ color: 0x200e3a, roughness: 0.9 })
  for (let i = 0; i < 35; i++) {
    const h = 2 + Math.random() * 6
    const stal = new THREE.Mesh(new THREE.ConeGeometry(0.3 + Math.random() * 0.55, h, 5), stalMat)
    stal.rotation.z = Math.PI
    stal.position.set((Math.random() - 0.5) * 100, 22 + Math.random() * 10, -Math.random() * 90)
    stal.rotation.y = Math.random() * Math.PI
    scene.add(stal)
  }

  const count = 350
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 100
    positions[i * 3 + 1] = Math.random() * 14
    positions[i * 3 + 2] = -Math.random() * 90
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  scene.add(new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: 0x9977ff, size: 0.16, transparent: true, opacity: 0.7, sizeAttenuation: true }),
  ))

  return { crystalMeshes, particlePositions: positions, particleGeo }
}

// ── 컴포넌트 ────────────────────────────────────────────────

export default function GameScene({ selectedCharacters, equippedSkinsKey = '', movementRef, compassRef, attackEventRef, mapRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07001a)
    scene.fog = new THREE.FogExp2(0x0c0028, 0.010)

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200)
    camera.position.set(0, 4, 10)

    // ── 조명 — 캐릭터 가시성 개선 ──
    // Soft ambient (blueish purple)
    scene.add(new THREE.AmbientLight(0x8866cc, 1.6))
    // Key light from above front
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(0, 20, 10)
    keyLight.castShadow = true
    scene.add(keyLight)
    // Fill from side
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4)
    fillLight.position.set(-10, 8, 0)
    scene.add(fillLight)

    // Crystal accent lights
    const glowLights = [
      [0x00ffcc, -18, 3, -22], [0xaa44ff, 15, 4, -18],
      [0xff8822, 0, 3, -45],   [0x44aaff, -25, 3, -35],
      [0x88ff44, 22, 3, -40],
    ] as [number, number, number, number][]
    glowLights.forEach(([c, x, y, z]) => {
      const pl = new THREE.PointLight(c, 2.0, 28)
      pl.position.set(x, y, z)
      scene.add(pl)
    })

    // Party follow light — always illuminates characters
    const partyLight = new THREE.PointLight(0xffffff, 2.2, 14)
    scene.add(partyLight)

    const { crystalMeshes, particlePositions, particleGeo } = buildPlanetInterior(scene)

    // Characters — build all selected, show only active one
    const ids = selectedCharacters.length > 0 ? selectedCharacters : ['ian_m' as CharacterId]
    const { equippedSkins } = useGameStore.getState()
    const units: CharUnit[] = ids.map((id) => {
      const charData = CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]
      const skinId = equippedSkins[id]
      const skin = skinId ? SKINS.find((s) => s.id === skinId) : null
      const headColorHex = skin ? skin.headColor : parseInt(charData.color.replace('#', ''), 16)
      const bodyColorHex = skin ? skin.bodyColor : 0x3d2a7a
      const { group, legs, arms } = buildLowPolyCharacter(headColorHex, bodyColorHex)
      scene.add(group)
      const rimLight = new THREE.PointLight(headColorHex, 1.6, 7)
      scene.add(rimLight)
      return { group, legs, arms, rimLight }
    })

    // Initialize HP
    useGameStore.getState().initPartyHp(ids.length)

    // Leader is always units[0] for position tracking; active char drives camera
    const leader = units[0]
    leader.group.position.set(0, 0, 0)

    const CAM_OFFSET = new THREE.Vector3(0, 4, 9)
    const camTarget = new THREE.Vector3()
    let t = 0
    let lastAttackSeq = -1

    // Enemies
    const enemies: Enemy[] = []
    const mobSpawns: [number, number][] = [
      [-12, -22], [10, -26], [-18, -33],
      [20, -19], [5, -40], [-8, -47],
    ]
    mobSpawns.forEach(([x, z]) => {
      const e = buildEnemy('mob')
      e.spawnPos.set(x, 0, z)
      e.group.position.set(x, 0, z)
      e.wanderTarget.set(x, 0, z)
      scene.add(e.group)
      scene.add(e.hpBarPivot)
      enemies.push(e)
    })

    const boss = buildEnemy('boss')
    boss.spawnPos.set(0, 0, -58)
    boss.group.position.set(0, 0, -58)
    boss.wanderTarget.set(0, 0, -58)
    scene.add(boss.group)
    scene.add(boss.hpBarPivot)
    enemies.push(boss)

    const animRef = { id: 0 }

    function animate() {
      animRef.id = requestAnimationFrame(animate)
      t += 0.016

      const mv = movementRef.current
      // Active character: read from store each frame (changes when user taps party slot)
      const storeState = useGameStore.getState()
      const activeIdx = Math.min(storeState.activeCharIndex, units.length - 1)
      const activeUnit = units[activeIdx]
      const activePos = activeUnit.group.position

      // Show only the active character
      units.forEach((u, i) => { u.group.visible = i === activeIdx; u.rimLight.visible = i === activeIdx })

      // Move speed from accessories
      const accStats = storeState.getEquippedStats()
      const moveBonus = accStats.moveSpeed / 100
      const dynSpeed = MOVE_SPEED * (0.35 + mv.speed * 0.65) * (1 + moveBonus)

      // Active unit movement
      if (mv.moving) {
        let targetAngle = activeUnit.group.rotation.y
        if (mv.direction === 'left') targetAngle -= Math.PI / 2
        else if (mv.direction === 'right') targetAngle += Math.PI / 2

        const diff = targetAngle - activeUnit.group.rotation.y
        const short = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI
        activeUnit.group.rotation.y += short * TURN_SPEED

        const dir = new THREE.Vector3(
          Math.sin(activeUnit.group.rotation.y), 0, Math.cos(activeUnit.group.rotation.y),
        )
        activePos.addScaledVector(dir, dynSpeed)

        const { legs, arms } = activeUnit
        legs[0].rotation.x = Math.sin(t * 8) * 0.45
        legs[1].rotation.x = -Math.sin(t * 8) * 0.45
        arms[0].rotation.x = -Math.sin(t * 8) * 0.3
        arms[1].rotation.x = Math.sin(t * 8) * 0.3
        activePos.y = Math.abs(Math.sin(t * 8)) * 0.08
      } else {
        const { legs, arms } = activeUnit
        legs[0].rotation.x *= 0.8; legs[1].rotation.x *= 0.8
        arms[0].rotation.x *= 0.8; arms[1].rotation.x *= 0.8
        activePos.y *= 0.8
      }

      // Keep leader position in sync for compass/map (use activePos)
      leader.group.position.copy(activePos)
      leader.group.rotation.copy(activeUnit.group.rotation)

      // Party follow light above active character
      partyLight.position.set(activePos.x, activePos.y + 6, activePos.z)

      // Rim light for active unit
      activeUnit.rimLight.position.set(activePos.x - 1.5, activePos.y + 2.5, activePos.z - 1.5)
      activeUnit.rimLight.intensity = 1.4 + Math.sin(t * 1.5) * 0.4

      // Attack from pose
      if (attackEventRef && attackEventRef.current.seq !== lastAttackSeq) {
        lastAttackSeq = attackEventRef.current.seq
        const dmgMap: Record<string, number> = { squat: 35, jump: 25, plank: 20 }
        const dmg = dmgMap[attackEventRef.current.pose] ?? 0
        if (dmg > 0) {
          enemies.forEach((e) => {
            if (e.state !== 'alive') return
            if (e.group.position.distanceTo(activePos) <= ATTACK_RANGE) {
              e.hp = Math.max(e.hp - dmg, 0)
              e.hitFlashTimer = 8
              if (e.hp <= 0) {
                e.state = 'dying'
                e.dyingTimer = 24
                const { addExp, addCrystals, addGold } = useGameStore.getState()
                addExp(e.exp)
                addCrystals(e.type === 'boss' ? 80 : 10)
                addGold(e.type === 'boss' ? 50 : 10)
              }
            }
          })
        }
      }

      // Enemy AI + attack active character only
      enemies.forEach((e) => {
        if (e.state === 'dead') {
          if (--e.respawnTimer <= 0) {
            e.state = 'alive'; e.hp = e.maxHp
            e.group.position.copy(e.spawnPos); e.group.scale.setScalar(1); e.group.visible = true
            e.hpBarPivot.visible = true; e.wanderTarget.copy(e.spawnPos); e.wanderTimer = 0
            ;(e.body.material as THREE.MeshLambertMaterial).color.setHex(e.originalColor)
          }
          return
        }
        if (e.state === 'dying') {
          e.group.scale.setScalar(Math.max(--e.dyingTimer / 24, 0))
          e.group.position.y += 0.06
          e.hpBarPivot.visible = false
          if (e.dyingTimer <= 0) {
            e.state = 'dead'; e.group.visible = false
            e.respawnTimer = e.type === 'boss' ? 1800 : MOB_RESPAWN_FRAMES
          }
          return
        }

        const dist = e.group.position.distanceTo(activePos)
        if (dist < CHASE_RANGE) {
          const d = new THREE.Vector3().subVectors(activePos, e.group.position).setY(0)
          if (d.length() > 0.05) {
            e.group.position.addScaledVector(d.normalize(), e.type === 'boss' ? 0.022 : 0.04)
            e.group.lookAt(activePos.x, e.group.position.y, activePos.z)
          }

          // Enemy attacks the active character
          if (--e.attackTimer <= 0) {
            e.attackTimer = e.type === 'boss' ? 90 : 120
            const dmg = e.type === 'boss' ? 20 : 8
            if (e.group.position.distanceTo(activePos) < ENEMY_MELEE_RANGE) {
              useGameStore.getState().damagePartyMember(activeIdx, dmg)
            }
          }
        } else {
          if (--e.wanderTimer <= 0) {
            const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 9
            e.wanderTarget.set(e.spawnPos.x + Math.cos(a) * r, 0, e.spawnPos.z + Math.sin(a) * r)
            e.wanderTimer = 80 + Math.floor(Math.random() * 100)
          }
          const wd = new THREE.Vector3().subVectors(e.wanderTarget, e.group.position).setY(0)
          if (wd.length() > 0.15) e.group.position.addScaledVector(wd.normalize(), 0.015)
        }

        e.group.position.y = Math.sin(t * 1.8 + e.spawnPos.x) * 0.12 + 0.5
        if (e.type === 'boss') { e.group.rotation.y += 0.012; e.body.rotation.y += 0.025 }

        if (e.hitFlashTimer > 0) {
          e.hitFlashTimer--
          ;(e.body.material as THREE.MeshLambertMaterial).color.setHex(
            e.hitFlashTimer % 4 < 2 ? 0xffffff : e.originalColor,
          )
        }

        e.hpBarPivot.position.set(
          e.group.position.x,
          e.group.position.y + (e.type === 'boss' ? 4.8 : 2.9),
          e.group.position.z,
        )
        e.hpBarPivot.quaternion.copy(camera.quaternion)
        const pct = Math.max(e.hp / e.maxHp, 0)
        e.hpFill.scale.x = Math.max(pct, 0.001)
        e.hpFill.position.x = (e.hpBarWidth * 0.95 / 2) * (pct - 1)
      })

      // Crystal pulse
      crystalMeshes.forEach((c, i) => {
        (c.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(t * 1.3 + i * 0.65) * 0.25
      })

      // Particle float
      for (let i = 0; i < particlePositions.length; i += 3) {
        particlePositions[i + 1] += 0.008
        if (particlePositions[i + 1] > 14) particlePositions[i + 1] = 0
      }
      particleGeo.attributes.position.needsUpdate = true

      // Camera follows active character
      const desiredCam = activePos.clone().add(
        CAM_OFFSET.clone().applyEuler(new THREE.Euler(0, activeUnit.group.rotation.y - Math.PI, 0)),
      )
      camera.position.lerp(desiredCam, 0.06)
      camTarget.lerp(new THREE.Vector3(activePos.x, activePos.y + 1.5, activePos.z), 0.08)
      camera.lookAt(camTarget)

      if (compassRef) compassRef.current = activeUnit.group.rotation.y

      if (mapRef) {
        mapRef.current = {
          px: activePos.x,
          pz: activePos.z,
          pa: activeUnit.group.rotation.y,
          enemies: enemies.map((e) => ({
            x: e.group.position.x,
            z: e.group.position.z,
            type: e.type,
            alive: e.state === 'alive',
          })),
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    function onResize() {
      const nw = mount.clientWidth, nh = mount.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animRef.id)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [selectedCharacters.join(','), equippedSkinsKey])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
