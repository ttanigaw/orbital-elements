import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type OrbitalElements = {
  a: number
  e: number
  i: number
  Omega: number
  omega: number
  nu: number
}

const state: OrbitalElements = {
  a: 2,
  e: 0.35,
  i: 32,
  Omega: 45,
  omega: 60,
  nu: 35,
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root not found')
}

function elementControl(
  key: keyof OrbitalElements,
  label: string,
  min: number,
  max: number,
  step: number,
  unit: string,
): string {
  return `
    <div class="control">
      <div class="control-heading">
        <label for="range-${key}">${label}</label>
        <div class="numeric">
          <input
            id="number-${key}"
            class="number-input"
            type="number"
            data-key="${key}"
            min="${min}"
            max="${max}"
            step="${step}"
            value="${state[key]}"
            aria-label="${label}"
          />
          <span>${unit}</span>
        </div>
      </div>
      <input
        id="range-${key}"
        class="slider"
        type="range"
        data-key="${key}"
        min="${min}"
        max="${max}"
        step="${step}"
        value="${state[key]}"
      />
    </div>
  `
}

function displayToggle(id: string, label: string): string {
  return `
    <label class="toggle-row" for="${id}">
      <span>${label}</span>
      <span class="switch">
        <input id="${id}" type="checkbox" checked />
        <span class="switch-track"></span>
      </span>
    </label>
  `
}

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div>
        <div class="eyebrow">ASTRO-NAVIGATION SYSTEM // ORBITAL SOLUTION</div>
        <h1>ORBITAL ELEMENT VISUALIZER</h1>
      </div>
      <button id="reset-view" class="hud-button" type="button">RESET VIEW</button>
    </header>

    <main>
      <aside class="control-panel">
        <section class="panel-section">
          <div class="section-title"><span>01</span> ORBITAL ELEMENTS</div>
          ${elementControl('a', 'SEMI-MAJOR AXIS a', 0.5, 5, 0.01, 'AU')}
          ${elementControl('e', 'ECCENTRICITY e', 0, 0.9, 0.001, '')}
          ${elementControl('i', 'INCLINATION i', 0, 180, 0.1, '°')}
          ${elementControl('Omega', 'LONG. ASC. NODE Ω', 0, 360, 0.1, '°')}
          ${elementControl('omega', 'ARG. PERIAPSIS ω', 0, 360, 0.1, '°')}
          ${elementControl('nu', 'TRUE ANOMALY ν', 0, 360, 0.1, '°')}
        </section>

        <section class="panel-section">
          <div class="section-title"><span>02</span> DISPLAY LAYERS</div>
          ${displayToggle('reference-plane', 'REFERENCE PLANE')}
          ${displayToggle('orbit-plane', 'ORBITAL PLANE')}
          ${displayToggle('nodes', 'ASC. / DESC. NODES')}
          ${displayToggle('apsides', 'PERIAPSIS / APOAPSIS')}
          ${displayToggle('radial', 'POSITION VECTOR')}
          ${displayToggle('axes', 'XYZ AXES')}
        </section>

        <section class="panel-section data-panel">
          <div class="section-title"><span>03</span> LIVE SOLUTION</div>
          <div class="data-row"><span>RADIUS r</span><strong id="radius-value">---</strong></div>
          <div class="data-row"><span>X</span><strong id="x-value">---</strong></div>
          <div class="data-row"><span>Y</span><strong id="y-value">---</strong></div>
          <div class="data-row"><span>Z</span><strong id="z-value">---</strong></div>
          <div class="data-row"><span>PERIAPSIS q</span><strong id="periapsis-value">---</strong></div>
          <div class="data-row"><span>APOAPSIS Q</span><strong id="apoapsis-value">---</strong></div>
        </section>
      </aside>

      <section id="viewport" aria-label="Interactive three-dimensional orbit view">
        <div class="viewport-hud hud-top-left">
          <span>REFERENCE FRAME</span>
          <strong>INERTIAL // XY REFERENCE PLANE</strong>
        </div>

        <div class="viewport-hud hud-top-right">
          <span>ELEMENT ORDER</span>
          <strong>Rz(Ω) · Rx(i) · Rz(ω)</strong>
        </div>

        <div class="viewport-hud hud-bottom-left legend">
          <div><span class="dot cyan"></span> ORBIT</div>
          <div><span class="dot amber"></span> BODY POSITION</div>
          <div><span class="dot green"></span> ASCENDING NODE</div>
          <div><span class="dot purple"></span> APOAPSIS</div>
        </div>

        <div class="viewport-hud hud-bottom-right">
          LEFT DRAG : ROTATE<br />
          WHEEL : ZOOM<br />
          RIGHT DRAG : PAN
        </div>

        <div class="scanlines"></div>
      </section>
    </main>
  </div>
`

const viewportElement = document.querySelector<HTMLDivElement>('#viewport')

if (!viewportElement) {
  throw new Error('Viewport not found')
}

const viewport: HTMLDivElement = viewportElement

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x02070d)
scene.fog = new THREE.FogExp2(0x02070d, 0.012)

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100)
camera.up.set(0, 0, 1)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
viewport.prepend(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.07
controls.target.set(0, 0, 0)
controls.minDistance = 0.8
controls.maxDistance = 40
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN

scene.add(new THREE.AmbientLight(0x668aa0, 1.4))

const centralLight = new THREE.PointLight(0xffb35c, 28, 35)
scene.add(centralLight)

const star = new THREE.Mesh(
  new THREE.SphereGeometry(0.14, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xffd693,
    emissive: 0xff7a18,
    emissiveIntensity: 2.5,
    roughness: 0.25,
  }),
)
scene.add(star)

const starGlow = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 24, 24),
  new THREE.MeshBasicMaterial({
    color: 0xff9b38,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
  }),
)
scene.add(starGlow)

const referenceGrid = new THREE.GridHelper(22, 44, 0x194d63, 0x0a2634)
referenceGrid.rotation.x = Math.PI / 2
scene.add(referenceGrid)

function lineBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number,
  opacity = 0.8,
): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start, end]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  )
}

const axesGroup = new THREE.Group()
axesGroup.add(
  lineBetween(new THREE.Vector3(-11, 0, 0), new THREE.Vector3(11, 0, 0), 0x1b5870),
  lineBetween(new THREE.Vector3(0, -11, 0), new THREE.Vector3(0, 11, 0), 0x1b5870),
  lineBetween(new THREE.Vector3(0, 0, -7), new THREE.Vector3(0, 0, 7), 0x27677f),
)
scene.add(axesGroup)

const orbitalPlane = new THREE.Mesh(
  new THREE.CircleGeometry(1, 128),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
)
scene.add(orbitalPlane)

const orbitNearMaterial = new THREE.LineBasicMaterial({
  color: 0x32e6ff,
  transparent: true,
  opacity: 0.96,
  depthWrite: false,
})

const orbitFarMaterial = new THREE.LineBasicMaterial({
  color: 0x32e6ff,
  transparent: true,
  opacity: 0.50,
  depthWrite: false,
})

const orbitNearLine = new THREE.LineSegments(
  new THREE.BufferGeometry(),
  orbitNearMaterial,
)

const orbitFarLine = new THREE.LineSegments(
  new THREE.BufferGeometry(),
  orbitFarMaterial,
)

orbitFarLine.renderOrder = 1
orbitNearLine.renderOrder = 2

scene.add(orbitFarLine, orbitNearLine)

let currentOrbitPoints: THREE.Vector3[] = []
let lastCameraReferenceSide: 1 | -1 = 1

const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.085, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xffc65a,
    emissive: 0xff7b00,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  }),
)
scene.add(body)

const radialLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineDashedMaterial({
    color: 0xffb644,
    dashSize: 0.12,
    gapSize: 0.07,
  }),
)
scene.add(radialLine)

function marker(color: number, radius: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 18, 18),
    new THREE.MeshBasicMaterial({ color }),
  )
}

const nodesGroup = new THREE.Group()
const ascendingNode = marker(0x55ffb0, 0.065)
const descendingNode = marker(0x237c69, 0.055)
nodesGroup.add(ascendingNode, descendingNode)
scene.add(nodesGroup)

const apsidesGroup = new THREE.Group()
const periapsisMarker = marker(0xff7e3f, 0.065)
const apoapsisMarker = marker(0xb966ff, 0.06)
apsidesGroup.add(periapsisMarker, apoapsisMarker)
scene.add(apsidesGroup)

function degreesToRadians(degrees: number): number {
  return THREE.MathUtils.degToRad(degrees)
}

function orbitalRotationMatrix(): THREE.Matrix4 {
  const longitudeRotation = new THREE.Matrix4().makeRotationZ(
    degreesToRadians(state.Omega),
  )
  const inclinationRotation = new THREE.Matrix4().makeRotationX(
    degreesToRadians(state.i),
  )
  const periapsisRotation = new THREE.Matrix4().makeRotationZ(
    degreesToRadians(state.omega),
  )

  return new THREE.Matrix4()
    .multiplyMatrices(longitudeRotation, inclinationRotation)
    .multiply(periapsisRotation)
}

function orbitalPlaneRotationMatrix(): THREE.Matrix4 {
  const longitudeRotation = new THREE.Matrix4().makeRotationZ(
    degreesToRadians(state.Omega),
  )
  const inclinationRotation = new THREE.Matrix4().makeRotationX(
    degreesToRadians(state.i),
  )

  return new THREE.Matrix4().multiplyMatrices(longitudeRotation, inclinationRotation)
}

function positionAtTrueAnomaly(trueAnomalyDegrees: number): THREE.Vector3 {
  const nu = degreesToRadians(trueAnomalyDegrees)
  const radius =
    (state.a * (1 - state.e * state.e)) /
    (1 + state.e * Math.cos(nu))

  return new THREE.Vector3(
    radius * Math.cos(nu),
    radius * Math.sin(nu),
    0,
  ).applyMatrix4(orbitalRotationMatrix())
}

function setText(id: string, value: string): void {
  const target = document.getElementById(id)
  if (target) {
    target.textContent = value
  }
}

function cameraReferenceSide(): 1 | -1 {
  const epsilon = 1e-6

  if (camera.position.z > epsilon) {
    return 1
  }

  if (camera.position.z < -epsilon) {
    return -1
  }

  return lastCameraReferenceSide
}

function setLineSegmentsGeometry(
  line: THREE.LineSegments,
  points: THREE.Vector3[],
): void {
  line.geometry.dispose()
  line.geometry = new THREE.BufferGeometry().setFromPoints(points)
}

function updateOrbitDepthCue(points: THREE.Vector3[] = currentOrbitPoints): void {
  if (points.length < 2) {
    return
  }

  const cameraSide = cameraReferenceSide()
  const nearSegments: THREE.Vector3[] = []
  const farSegments: THREE.Vector3[] = []
  const epsilon = 1e-9

  const appendSegment = (
    target: THREE.Vector3[],
    start: THREE.Vector3,
    end: THREE.Vector3,
  ): void => {
    target.push(start.clone(), end.clone())
  }

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index]
    const end = points[(index + 1) % points.length]

    const startSignedHeight = cameraSide * start.z
    const endSignedHeight = cameraSide * end.z

    const startNear = startSignedHeight >= -epsilon
    const endNear = endSignedHeight >= -epsilon

    if (startNear === endNear) {
      appendSegment(startNear ? nearSegments : farSegments, start, end)
      continue
    }

    const denominator = start.z - end.z
    const fraction =
      Math.abs(denominator) < epsilon
        ? 0.5
        : THREE.MathUtils.clamp(start.z / denominator, 0, 1)

    const crossing = start.clone().lerp(end, fraction)

    if (startNear) {
      appendSegment(nearSegments, start, crossing)
      appendSegment(farSegments, crossing, end)
    } else {
      appendSegment(farSegments, start, crossing)
      appendSegment(nearSegments, crossing, end)
    }
  }

  setLineSegmentsGeometry(orbitNearLine, nearSegments)
  setLineSegmentsGeometry(orbitFarLine, farSegments)
  lastCameraReferenceSide = cameraSide
}

function updateScene(): void {
  const samples = 512
  const orbitPoints: THREE.Vector3[] = []

  for (let index = 0; index < samples; index += 1) {
    orbitPoints.push(positionAtTrueAnomaly((360 * index) / samples))
  }

  currentOrbitPoints = orbitPoints
  updateOrbitDepthCue(orbitPoints)

  const currentPosition = positionAtTrueAnomaly(state.nu)
  body.position.copy(currentPosition)

  radialLine.geometry.dispose()
  radialLine.geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    currentPosition,
  ])
  radialLine.computeLineDistances()

  const planeRadius = Math.max(1, state.a * (1 + state.e) * 1.08)
  orbitalPlane.geometry.dispose()
  orbitalPlane.geometry = new THREE.CircleGeometry(planeRadius, 128)
  orbitalPlane.setRotationFromMatrix(orbitalPlaneRotationMatrix())

  ascendingNode.position.copy(positionAtTrueAnomaly(-state.omega))
  descendingNode.position.copy(positionAtTrueAnomaly(180 - state.omega))
  periapsisMarker.position.copy(positionAtTrueAnomaly(0))
  apoapsisMarker.position.copy(positionAtTrueAnomaly(180))

  const radius = currentPosition.length()
  const periapsisDistance = state.a * (1 - state.e)
  const apoapsisDistance = state.a * (1 + state.e)

  setText('radius-value', `${radius.toFixed(3)} AU`)
  setText('x-value', currentPosition.x.toFixed(3))
  setText('y-value', currentPosition.y.toFixed(3))
  setText('z-value', currentPosition.z.toFixed(3))
  setText('periapsis-value', `${periapsisDistance.toFixed(3)} AU`)
  setText('apoapsis-value', `${apoapsisDistance.toFixed(3)} AU`)
}

function bindElementInputs(): void {
  document.querySelectorAll<HTMLInputElement>('[data-key]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.key as keyof OrbitalElements
      const min = Number(input.min)
      const max = Number(input.max)
      const requestedValue = Number(input.value)

      if (!Number.isFinite(requestedValue)) {
        return
      }

      const value = Math.min(max, Math.max(min, requestedValue))
      state[key] = value

      document
        .querySelectorAll<HTMLInputElement>(`[data-key="${key}"]`)
        .forEach((peer) => {
          if (peer !== input) {
            peer.value = String(value)
          }
        })

      updateScene()
    })
  })
}

function bindVisibilityToggle(id: string, object: THREE.Object3D): void {
  const checkbox = document.querySelector<HTMLInputElement>(`#${id}`)
  if (!checkbox) {
    return
  }

  checkbox.addEventListener('change', () => {
    object.visible = checkbox.checked
  })
}

function resetView(): void {
  const extent = Math.max(2.4, state.a * (1 + state.e))
  camera.position.set(extent * 1.55, -extent * 1.55, extent * 1.05)
  controls.target.set(0, 0, 0)
  controls.update()
}

bindElementInputs()
bindVisibilityToggle('reference-plane', referenceGrid)
bindVisibilityToggle('orbit-plane', orbitalPlane)
bindVisibilityToggle('nodes', nodesGroup)
bindVisibilityToggle('apsides', apsidesGroup)
bindVisibilityToggle('radial', radialLine)
bindVisibilityToggle('axes', axesGroup)

document.querySelector<HTMLButtonElement>('#reset-view')?.addEventListener('click', resetView)

function resize(): void {
  const width = viewport.clientWidth
  const height = viewport.clientHeight
  if (width === 0 || height === 0) {
    return
  }

  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

new ResizeObserver(resize).observe(viewport)

function animate(): void {
  requestAnimationFrame(animate)
  controls.update()

  if (cameraReferenceSide() !== lastCameraReferenceSide) {
    updateOrbitDepthCue()
  }

  star.rotation.z += 0.001
  renderer.render(scene, camera)
}

resetView()
updateScene()
resize()
animate()
