import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { MovementState } from '../components/ar/PoseCamera'

const ATTR_COLOR: Record<string, number> = {
  arc: 0x00d4ff, plasma: 0xff4466, bio: 0x44ff88, cryo: 0x44aaff, cyber: 0xaa44ff,
}

const MOVE_SPEED = 0.12
const TURN_SPEED = 0.08

interface Props {
  attribute: string
  movementRef: React.MutableRefObject<MovementState>
  compassRef?: React.MutableRefObject<number> // 플레이어 Y축 회전각(라디안)
}

export default function GameScene({ attribute, movementRef, compassRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    // ── 렌더러 ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    mount.appendChild(renderer.domElement)

    // ── 씬 ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x040e1a)
    scene.fog = new THREE.Fog(0x040e1a, 40, 130)

    // ── 카메라 ──
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200)
    camera.position.set(0, 4, 10)
    camera.lookAt(0, 1, 0)

    // ── 조명 ──
    scene.add(new THREE.AmbientLight(0x112233, 1.2))
    const sun = new THREE.DirectionalLight(0xff8844, 1.5)
    sun.position.set(20, 30, 10)
    sun.castShadow = true
    scene.add(sun)

    const attrColor = ATTR_COLOR[attribute] ?? 0x00d4ff
    const rimLight = new THREE.PointLight(attrColor, 2, 20)
    rimLight.position.set(-5, 3, -5)
    scene.add(rimLight)

    // ── 월드 ──
    buildDesertWorld(scene)
    const stars = buildStars()
    scene.add(stars)

    // ── 플레이어 ──
    const { group: player, legs, arms } = buildLowPolyCharacter(attrColor)
    player.position.set(0, 0, 0)
    scene.add(player)

    // 플레이어가 향하는 방향 (Y축 회전 각도, 라디안)
    // 0 = 전방(-Z), π/2 = 오른쪽(+X), -π/2 = 왼쪽(-X)
    let facingAngle = Math.PI // 카메라 방향 기준 앞쪽

    // 카메라 오프셋 (플레이어 뒤에서 따라오는 거리)
    const CAM_OFFSET = new THREE.Vector3(0, 4, 9)
    const camTarget = new THREE.Vector3()

    let t = 0

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      t += 0.016

      const mv = movementRef.current

      if (mv.moving) {
        // ── 방향 결정 ──
        let targetAngle = facingAngle
        if (mv.direction === 'forward') {
          targetAngle = facingAngle // 현재 향하는 방향 유지
        } else if (mv.direction === 'left') {
          targetAngle = facingAngle - Math.PI / 2 // 왼쪽 90°
        } else if (mv.direction === 'right') {
          targetAngle = facingAngle + Math.PI / 2 // 오른쪽 90°
        }

        // 부드럽게 회전
        const angleDiff = targetAngle - player.rotation.y
        player.rotation.y += angleDiff * TURN_SPEED

        // 이동 방향 벡터
        const moveDir = new THREE.Vector3(
          Math.sin(player.rotation.y),
          0,
          Math.cos(player.rotation.y),
        )
        player.position.addScaledVector(moveDir, MOVE_SPEED)

        // 다리 걸음 애니메이션
        legs[0].rotation.x = Math.sin(t * 8) * 0.45
        legs[1].rotation.x = -Math.sin(t * 8) * 0.45
        arms[0].rotation.x = -Math.sin(t * 8) * 0.3
        arms[1].rotation.x = Math.sin(t * 8) * 0.3

        // 몸 위아래 바운스
        player.position.y = Math.abs(Math.sin(t * 8)) * 0.08
      } else {
        // 정지: 다리 원위치 (부드럽게)
        legs[0].rotation.x *= 0.8
        legs[1].rotation.x *= 0.8
        arms[0].rotation.x *= 0.8
        arms[1].rotation.x *= 0.8
        player.position.y *= 0.8
      }

      // ── 카메라가 플레이어 뒤에서 따라오기 ──
      const desiredCamPos = player.position.clone().add(
        CAM_OFFSET.clone().applyEuler(new THREE.Euler(0, player.rotation.y - Math.PI, 0))
      )
      camera.position.lerp(desiredCamPos, 0.06)

      camTarget.lerp(
        new THREE.Vector3(player.position.x, player.position.y + 1.5, player.position.z),
        0.08
      )
      camera.lookAt(camTarget)

      // 나침반 ref 업데이트
      if (compassRef) compassRef.current = player.rotation.y

      // 림라이트 플레이어 추적
      rimLight.position.set(
        player.position.x - 5,
        player.position.y + 3,
        player.position.z - 5,
      )
      rimLight.intensity = 1.5 + Math.sin(t * 2) * 0.5

      renderer.render(scene, camera)
    }
    animate()

    // ── 리사이즈 ──
    function onResize() {
      const nw = mount!.clientWidth
      const nh = mount!.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      mount!.removeChild(renderer.domElement)
    }
  }, [attribute])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}

// ── 사막 월드 ──
function buildDesertWorld(scene: THREE.Scene) {
  const sandMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 })
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x3d2b0a })
  const metalMat = new THREE.MeshLambertMaterial({ color: 0x445566 })

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 30, 30), sandMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  const pos = ground.geometry.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, (Math.random() - 0.5) * 0.4)
  pos.needsUpdate = true
  ground.geometry.computeVertexNormals()
  scene.add(ground)

  const buildingPos = [
    [-15, -20], [-8, -30], [12, -25], [20, -15],
    [-20, -10], [18, -35], [-5, -45], [8, -40],
    [25, -50], [-25, -55], [0, -60], [30, -30],
  ]
  buildingPos.forEach(([x, z]) => {
    const bh = 3 + Math.random() * 9
    const bw = 2 + Math.random() * 4
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), darkMat)
    mesh.position.set(x, bh / 2 - 0.5, z)
    mesh.rotation.y = Math.random() * 0.3 - 0.15
    mesh.castShadow = true
    scene.add(mesh)
  })

  for (let i = 0; i < 20; i++) {
    const r = 1.5 + Math.random() * 3
    const dune = new THREE.Mesh(new THREE.ConeGeometry(r, 0.8 + Math.random(), 5, 1), sandMat)
    dune.position.set((Math.random() - 0.5) * 120, 0, -10 - Math.random() * 80)
    dune.rotation.y = Math.random() * Math.PI
    scene.add(dune)
  }

  for (let i = 0; i < 12; i++) {
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 + Math.random(), 0.3 + Math.random(), 0.5 + Math.random()),
      metalMat,
    )
    debris.position.set((Math.random() - 0.5) * 50, 0.1, -5 - Math.random() * 30)
    debris.rotation.set(Math.random(), Math.random(), Math.random())
    scene.add(debris)
  }
}

// ── 로우폴리 캐릭터 (다리·팔 참조 반환) ──
function buildLowPolyCharacter(color: number) {
  const group = new THREE.Group()
  const mat = new THREE.MeshLambertMaterial({ color })
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x223344 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), bodyMat)
  body.position.y = 1.2
  body.castShadow = true
  group.add(body)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), mat)
  head.position.y = 1.85
  head.castShadow = true
  group.add(head)

  // 다리 — 애니메이션용으로 ref 보관
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), bodyMat)
  legL.position.set(-0.18, 0.62, 0)
  legL.castShadow = true
  group.add(legL)

  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), bodyMat)
  legR.position.set(0.18, 0.62, 0)
  legR.castShadow = true
  group.add(legR)

  // 팔
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), mat)
  armL.position.set(-0.45, 1.25, 0)
  armL.castShadow = true
  group.add(armL)

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), mat)
  armR.position.set(0.45, 1.25, 0)
  armR.castShadow = true
  group.add(armR)

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12),
    new THREE.MeshBasicMaterial({ color }),
  )
  core.position.y = 1.2
  group.add(core)

  return { group, legs: [legL, legR], arms: [armL, armR] }
}

// ── 별 파티클 ──
function buildStars() {
  const geo = new THREE.BufferGeometry()
  const count = 800
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 300
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaaccff, size: 0.3, sizeAttenuation: true }))
}
