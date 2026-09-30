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

const TWO_PI = 2 * Math.PI
const ONE_AU_ORBIT_SECONDS = 4
let playbackRate = 1
let sweepIntervalFraction = 1 / 8

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

        <section class="panel-section">
          <div class="section-title"><span>04</span> SETTINGS</div>
          <div class="control">
            <div class="control-heading">
              <label for="range-playback-rate">PLAYBACK RATE</label>
              <div class="numeric">
                <input
                  id="number-playback-rate"
                  class="number-input"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value="1"
                  aria-label="Playback rate"
                />
                <span>×</span>
              </div>
            </div>
            <input
              id="range-playback-rate"
              class="slider"
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value="1"
              aria-label="Playback rate"
            />
          </div>
          <div class="data-row"><span>1 AU PERIOD @ 1×</span><strong>4.0 s</strong></div>
          ${displayToggle('swept-area', 'KEPLER SWEPT AREA')}
          <div class="control">
            <div class="control-heading">
              <label for="range-sweep-interval">SWEEP INTERVAL Δt/T</label>
              <div class="numeric">
                <input
                  id="number-sweep-interval"
                  class="number-input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.005"
                  value="0.125"
                  aria-label="Swept-area time interval as a fraction of one period"
                />
                <span>T</span>
              </div>
            </div>
            <input
              id="range-sweep-interval"
              class="slider"
              type="range"
              min="0"
              max="1"
              step="0.005"
              value="0.125"
              aria-label="Swept-area time interval as a fraction of one period"
            />
          </div>
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
          <div><span class="dot periapsis"></span> PERIAPSIS</div>
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

function createStarGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to create star glow texture')
  }

  const gradient = context.createRadialGradient(
    64,
    64,
    0,
    64,
    64,
    64,
  )
  gradient.addColorStop(0, 'rgba(255, 246, 215, 0.95)')
  gradient.addColorStop(0.12, 'rgba(255, 199, 104, 0.55)')
  gradient.addColorStop(0.32, 'rgba(255, 139, 54, 0.20)')
  gradient.addColorStop(0.62, 'rgba(255, 112, 30, 0.055)')
  gradient.addColorStop(1, 'rgba(255, 90, 20, 0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const star = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xffdfa3,
    emissive: 0xff861f,
    emissiveIntensity: 2.15,
    roughness: 0.28,
  }),
)
scene.add(star)

const starCorona = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createStarGlowTexture(),
    color: 0xffb45f,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
)
starCorona.scale.set(0.44, 0.44, 1)
starCorona.renderOrder = 3
scene.add(starCorona)

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
  opacity: 0.40,
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

const radialGeometry = new THREE.BufferGeometry()
radialGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3),
)

const radialLine = new THREE.Line(
  radialGeometry,
  new THREE.LineBasicMaterial({
    color: 0xffb644,
    transparent: true,
    opacity: 0.82,
  }),
)
radialLine.frustumCulled = false
scene.add(radialLine)

const sweptAreaNear = new THREE.Mesh(
  new THREE.BufferGeometry(),
  new THREE.MeshBasicMaterial({
    color: 0xffb644,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
)

const sweptAreaFar = new THREE.Mesh(
  new THREE.BufferGeometry(),
  new THREE.MeshBasicMaterial({
    color: 0xffb644,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
)

const sweptAreaGroup = new THREE.Group()
sweptAreaGroup.add(sweptAreaFar, sweptAreaNear)
scene.add(sweptAreaGroup)

function marker(color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 18),
    new THREE.MeshBasicMaterial({ color }),
  )
}

const nodesGroup = new THREE.Group()
const ascendingNode = marker(0x55ffb0)
const descendingNode = marker(0x237c69)
nodesGroup.add(ascendingNode, descendingNode)
scene.add(nodesGroup)

const lineOfNodes = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({
    color: 0x77a6b2,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  }),
)
scene.add(lineOfNodes)

const apsidesGroup = new THREE.Group()
const periapsisMarker = marker(0xff7e3f)
const apoapsisMarker = marker(0xb966ff)
apsidesGroup.add(periapsisMarker, apoapsisMarker)
scene.add(apsidesGroup)

function degreesToRadians(degrees: number): number {
  return THREE.MathUtils.degToRad(degrees)
}

function normalizeRadians(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI
}

function meanAnomalyFromTrueAnomaly(
  trueAnomaly: number,
  eccentricity: number,
): number {
  const eccentricAnomaly = Math.atan2(
    Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(trueAnomaly),
    eccentricity + Math.cos(trueAnomaly),
  )
  const normalizedEccentricAnomaly = normalizeRadians(eccentricAnomaly)

  return normalizeRadians(
    normalizedEccentricAnomaly -
      eccentricity * Math.sin(normalizedEccentricAnomaly),
  )
}

function eccentricAnomalyFromMeanAnomaly(
  meanAnomaly: number,
  eccentricity: number,
): number {
  const normalizedMeanAnomaly = normalizeRadians(meanAnomaly)
  let eccentricAnomaly =
    eccentricity < 0.8 ? normalizedMeanAnomaly : Math.PI

  for (let iteration = 0; iteration < 15; iteration += 1) {
    const residual =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      normalizedMeanAnomaly
    const derivative =
      1 - eccentricity * Math.cos(eccentricAnomaly)
    const correction = residual / derivative

    eccentricAnomaly -= correction

    if (Math.abs(correction) < 1e-12) {
      break
    }
  }

  return normalizeRadians(eccentricAnomaly)
}

function trueAnomalyFromMeanAnomaly(
  meanAnomaly: number,
  eccentricity: number,
): number {
  const eccentricAnomaly = eccentricAnomalyFromMeanAnomaly(
    meanAnomaly,
    eccentricity,
  )

  return normalizeRadians(
    Math.atan2(
      Math.sqrt(1 - eccentricity * eccentricity) *
        Math.sin(eccentricAnomaly),
      Math.cos(eccentricAnomaly) - eccentricity,
    ),
  )
}

function orbitalPeriodSeconds(): number {
  return ONE_AU_ORBIT_SECONDS * Math.pow(state.a, 1.5)
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

function setTriangleGeometry(
  mesh: THREE.Mesh,
  vertices: THREE.Vector3[],
): void {
  mesh.geometry.dispose()
  mesh.geometry = new THREE.BufferGeometry().setFromPoints(vertices)
}

function updateSweptArea(): void {
  if (sweepIntervalFraction <= 0) {
    setTriangleGeometry(sweptAreaNear, [])
    setTriangleGeometry(sweptAreaFar, [])
    return
  }

  const cameraSide = cameraReferenceSide()
  const meanAnomalySpan = TWO_PI * sweepIntervalFraction
  const sampleCount = Math.max(
    1,
    Math.ceil(192 * sweepIntervalFraction),
  )
  const arcPoints: THREE.Vector3[] = []

  for (let index = 0; index <= sampleCount; index += 1) {
    const fraction = index / sampleCount
    const sampleMeanAnomaly =
      meanAnomalyRadians -
      meanAnomalySpan +
      meanAnomalySpan * fraction
    const sampleTrueAnomaly = trueAnomalyFromMeanAnomaly(
      sampleMeanAnomaly,
      state.e,
    )

    arcPoints.push(
      positionAtTrueAnomaly(
        THREE.MathUtils.radToDeg(sampleTrueAnomaly),
      ),
    )
  }

  const nearTriangles: THREE.Vector3[] = []
  const farTriangles: THREE.Vector3[] = []
  const origin = new THREE.Vector3(0, 0, 0)
  const epsilon = 1e-9

  const appendTriangle = (
    target: THREE.Vector3[],
    first: THREE.Vector3,
    second: THREE.Vector3,
  ): void => {
    target.push(origin.clone(), first.clone(), second.clone())
  }

  for (let index = 0; index < arcPoints.length - 1; index += 1) {
    const start = arcPoints[index]
    const end = arcPoints[index + 1]
    const startSignedHeight = cameraSide * start.z
    const endSignedHeight = cameraSide * end.z
    const startNear = startSignedHeight >= -epsilon
    const endNear = endSignedHeight >= -epsilon

    if (startNear === endNear) {
      appendTriangle(
        startNear ? nearTriangles : farTriangles,
        start,
        end,
      )
      continue
    }

    const denominator = start.z - end.z
    const crossingFraction =
      Math.abs(denominator) < epsilon
        ? 0.5
        : THREE.MathUtils.clamp(start.z / denominator, 0, 1)
    const crossing = start.clone().lerp(end, crossingFraction)

    appendTriangle(
      startNear ? nearTriangles : farTriangles,
      start,
      crossing,
    )
    appendTriangle(
      endNear ? nearTriangles : farTriangles,
      crossing,
      end,
    )
  }

  setTriangleGeometry(sweptAreaNear, nearTriangles)
  setTriangleGeometry(sweptAreaFar, farTriangles)
}

function syncTrueAnomalyInputs(): void {
  const displayValue = state.nu.toFixed(1)

  document
    .querySelectorAll<HTMLInputElement>('[data-key="nu"]')
    .forEach((input) => {
      input.value = displayValue
    })
}

function updateCurrentPosition(): void {
  const currentPosition = positionAtTrueAnomaly(state.nu)
  body.position.copy(currentPosition)

  const radialPositions = radialGeometry.getAttribute(
    'position',
  ) as THREE.BufferAttribute
  radialPositions.setXYZ(0, 0, 0, 0)
  radialPositions.setXYZ(
    1,
    currentPosition.x,
    currentPosition.y,
    currentPosition.z,
  )
  radialPositions.needsUpdate = true

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

function updateScene(): void {
  const samples = 512
  const orbitPoints: THREE.Vector3[] = []

  for (let index = 0; index < samples; index += 1) {
    orbitPoints.push(positionAtTrueAnomaly((360 * index) / samples))
  }

  currentOrbitPoints = orbitPoints
  updateOrbitDepthCue(orbitPoints)

  updateCurrentPosition()
  updateSweptArea()

  const planeRadius = Math.max(1, state.a * (1 + state.e) * 1.08)
  orbitalPlane.geometry.dispose()
  orbitalPlane.geometry = new THREE.CircleGeometry(planeRadius, 128)
  orbitalPlane.setRotationFromMatrix(orbitalPlaneRotationMatrix())

  const nodeLongitude = degreesToRadians(state.Omega)
  const nodeDirection = new THREE.Vector3(
    Math.cos(nodeLongitude),
    Math.sin(nodeLongitude),
    0,
  )
  const nodeExtent = planeRadius * 1.04
  lineOfNodes.geometry.dispose()
  lineOfNodes.geometry = new THREE.BufferGeometry().setFromPoints([
    nodeDirection.clone().multiplyScalar(-nodeExtent),
    nodeDirection.clone().multiplyScalar(nodeExtent),
  ])

  const markerScale = state.a
  ascendingNode.scale.setScalar(0.013 * markerScale)
  descendingNode.scale.setScalar(0.011 * markerScale)
  periapsisMarker.scale.setScalar(0.013 * markerScale)
  apoapsisMarker.scale.setScalar(0.012 * markerScale)

  ascendingNode.position.copy(positionAtTrueAnomaly(-state.omega))
  descendingNode.position.copy(positionAtTrueAnomaly(180 - state.omega))
  periapsisMarker.position.copy(positionAtTrueAnomaly(0))
  apoapsisMarker.position.copy(positionAtTrueAnomaly(180))

}

let meanAnomalyRadians = meanAnomalyFromTrueAnomaly(
  degreesToRadians(state.nu),
  state.e,
)

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

      if (key === 'nu' || key === 'e') {
        meanAnomalyRadians = meanAnomalyFromTrueAnomaly(
          degreesToRadians(state.nu),
          state.e,
        )
      }

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

function bindPlaybackRateInputs(): void {
  const inputs = [
    document.querySelector<HTMLInputElement>('#range-playback-rate'),
    document.querySelector<HTMLInputElement>('#number-playback-rate'),
  ].filter((input): input is HTMLInputElement => input !== null)

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      const requestedValue = Number(input.value)

      if (!Number.isFinite(requestedValue)) {
        return
      }

      playbackRate = THREE.MathUtils.clamp(requestedValue, 0.1, 10)

      inputs.forEach((peer) => {
        peer.value = playbackRate.toFixed(1)
      })
    })
  })
}

function bindSweepIntervalInputs(): void {
  const inputs = [
    document.querySelector<HTMLInputElement>('#range-sweep-interval'),
    document.querySelector<HTMLInputElement>('#number-sweep-interval'),
  ].filter((input): input is HTMLInputElement => input !== null)

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      const requestedValue = Number(input.value)

      if (!Number.isFinite(requestedValue)) {
        return
      }

      sweepIntervalFraction = THREE.MathUtils.clamp(
        requestedValue,
        0,
        1,
      )

      inputs.forEach((peer) => {
        peer.value = sweepIntervalFraction.toFixed(3)
      })

      updateSweptArea()
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
bindPlaybackRateInputs()
bindSweepIntervalInputs()
bindVisibilityToggle('swept-area', sweptAreaGroup)
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

let lastAnimationTimestamp: number | null = null

function animate(timestamp: number): void {
  requestAnimationFrame(animate)
  controls.update()

  if (lastAnimationTimestamp !== null) {
    const deltaSeconds = Math.min(
      (timestamp - lastAnimationTimestamp) / 1000,
      0.1,
    )
    const meanMotion =
      (TWO_PI / orbitalPeriodSeconds()) * playbackRate

    meanAnomalyRadians = normalizeRadians(
      meanAnomalyRadians + meanMotion * deltaSeconds,
    )
    state.nu = THREE.MathUtils.radToDeg(
      trueAnomalyFromMeanAnomaly(meanAnomalyRadians, state.e),
    )

    syncTrueAnomalyInputs()
    updateCurrentPosition()
    updateSweptArea()
  }

  lastAnimationTimestamp = timestamp

  if (cameraReferenceSide() !== lastCameraReferenceSide) {
    updateOrbitDepthCue()
    updateSweptArea()
  }

  star.rotation.z += 0.001
  renderer.render(scene, camera)
}

resetView()
updateScene()
resize()
requestAnimationFrame(animate)
