import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ATTR_COLOR: Record<string, number> = {
  arc: 0x00d4ff, plasma: 0xff4466, bio: 0x44ff88, cryo: 0x44aaff, cyber: 0xaa44ff,
}

interface Props {
  attribute: string
}

export default function GameScene({ attribute }: Props) {
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
    scene.fog = new THREE.Fog(0x040e1a, 30, 120)

    // ── 3인칭 카메라 ──
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200)
    camera.position.set(0, 4, 10)
    camera.lookAt(0, 1, 0)

    // ── 조명 ──
    const ambient = new THREE.AmbientLight(0x112233, 1.2)
    scene.add(ambient)

    const sunLight = new THREE.DirectionalLight(0xff8844, 1.5)
    sunLight.position.set(20, 30, 10)
    sunLight.castShadow = true
    scene.add(sunLight)

    const attrColor = ATTR_COLOR[attribute] ?? 0x00d4ff
    const rimLight = new THREE.PointLight(attrColor, 2, 20)
    rimLight.position.set(-5, 3, -5)
    scene.add(rimLight)

    // ── 사막 지형 (로우폴리) ──
    buildDesertWorld(scene)

    // ── 플레이어 캐릭터 (임시 로우폴리) ──
    const player = buildLowPolyCharacter(attrColor)
    player.position.set(0, 0, 0)
    scene.add(player)

    // ── 별 파티클 ──
    const stars = buildStars()
    scene.add(stars)

    // ── 카메라 타겟 ──
    const camTarget = new THREE.Vector3(0, 1, 0)

    // ── 애니메이션 ──
    let t = 0
    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      t += 0.016

      // 플레이어 약간 부유 효과
      player.position.y = Math.sin(t * 1.5) * 0.05

      // 카메라 부드럽게 따라가기
      camTarget.lerp(new THREE.Vector3(player.position.x, player.position.y + 1, player.position.z), 0.05)
      camera.position.x += (player.position.x - camera.position.x) * 0.03
      camera.position.z += (player.position.z + 10 - camera.position.z) * 0.03
      camera.lookAt(camTarget)

      // 속성 빛 맥동
      rimLight.intensity = 1.5 + Math.sin(t * 2) * 0.5

      renderer.render(scene, camera)
    }
    animate()

    // ── 리사이즈 ──
    function onResize() {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [attribute])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}

// ── 사막 월드 빌더 ──
function buildDesertWorld(scene: THREE.Scene) {
  const sandMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 })
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x3d2b0a })
  const metalMat = new THREE.MeshLambertMaterial({ color: 0x445566 })

  // 바닥 평면
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 20, 20), sandMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  // 로우폴리 느낌: 버텍스 랜덤 displacement
  const pos = ground.geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, (Math.random() - 0.5) * 0.4)
  }
  pos.needsUpdate = true
  ground.geometry.computeVertexNormals()
  scene.add(ground)

  // 폐허 건물들
  const buildingPositions = [
    [-15, 0, -20], [-8, 0, -30], [12, 0, -25], [20, 0, -15],
    [-20, 0, -10], [18, 0, -35], [-5, 0, -45], [8, 0, -40],
  ]
  buildingPositions.forEach(([x, , z]) => {
    const h = 3 + Math.random() * 8
    const w = 2 + Math.random() * 4
    const geo = new THREE.BoxGeometry(w, h, w)
    const mesh = new THREE.Mesh(geo, darkMat)
    mesh.position.set(x, h / 2 - 0.5, z)
    mesh.rotation.y = Math.random() * 0.3 - 0.15
    mesh.castShadow = true
    scene.add(mesh)
  })

  // 모래 언덕
  for (let i = 0; i < 12; i++) {
    const r = 1.5 + Math.random() * 3
    const dune = new THREE.Mesh(
      new THREE.ConeGeometry(r, 0.8 + Math.random(), 5, 1),
      sandMat,
    )
    dune.position.set((Math.random() - 0.5) * 80, 0, -10 - Math.random() * 60)
    dune.rotation.y = Math.random() * Math.PI
    scene.add(dune)
  }

  // 고철 잔해
  for (let i = 0; i < 8; i++) {
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 + Math.random(), 0.3 + Math.random(), 0.5 + Math.random()),
      metalMat,
    )
    debris.position.set((Math.random() - 0.5) * 30, 0.1, -5 - Math.random() * 20)
    debris.rotation.set(Math.random(), Math.random(), Math.random())
    scene.add(debris)
  }
}

// ── 로우폴리 캐릭터 ──
function buildLowPolyCharacter(color: number) {
  const group = new THREE.Group()
  const mat = new THREE.MeshLambertMaterial({ color })
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x223344 })

  // 몸통
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), bodyMat)
  body.position.y = 1.2
  body.castShadow = true
  group.add(body)

  // 머리
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), mat)
  head.position.y = 1.85
  head.castShadow = true
  group.add(head)

  // 다리
  ;[-0.18, 0.18].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), bodyMat)
    leg.position.set(x, 0.6, 0)
    leg.castShadow = true
    group.add(leg)
  })

  // 팔
  ;[-0.45, 0.45].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), mat)
    arm.position.set(x, 1.25, 0)
    arm.castShadow = true
    group.add(arm)
  })

  // 발광 코어
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color }))
  core.position.y = 1.2
  group.add(core)

  return group
}

// ── 별 파티클 ──
function buildStars() {
  const geo = new THREE.BufferGeometry()
  const count = 800
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 300
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xaaccff, size: 0.3, sizeAttenuation: true }),
  )
}
