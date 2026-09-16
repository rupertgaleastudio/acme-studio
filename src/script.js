import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import GUI from 'lil-gui'

import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import wobbleVertexShader from './shaders/wobble/vertex.glsl'
import wobbleFragmentShader from './shaders/wobble/fragment.glsl'

import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'


/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 })
const debugObject = {}
gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const rgbeLoader = new RGBELoader()

/**
 * Environment map for better reflections
 */
rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * Wobble
 */
// Material
debugObject.colorA = '#ff7b00'
debugObject.colorB = '#8c00ff'

const uniforms = {
    uTime: new THREE.Uniform(0),
    uPositionFrequency: new THREE.Uniform(0.357),
    uTimeFrequency: new THREE.Uniform(0.4),
    uStrength: new THREE.Uniform(0.357),

    uWarpPositionFrequency: new THREE.Uniform(0.38),
    uWarpTimeFrequency: new THREE.Uniform(0.292),
    uWarpStrength: new THREE.Uniform(1.412),

    // Colors
    uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),
    uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB))
}

const material = new CustomShaderMaterial({
    // CSM
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: wobbleVertexShader,
    fragmentShader: wobbleFragmentShader,
    uniforms: uniforms,

    //MeshPhysicalMaterial
    metalness: 0.033,
    roughness: 0.406,
    color: '#ffffff',
    transmission: 0.609,
    ior: 2.678,
    thickness: 1.46,
    transparent: true,
    wireframe: false,
})

const depthMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: wobbleVertexShader,
    uniforms: uniforms,

    // MeshDepthMaterial
    depthPacking: THREE.RGBADepthPacking
})

// Tweaks
gui.add(uniforms.uPositionFrequency, 'value', 0, 2, 0.001).name('uPositionFrequency')
gui.add(uniforms.uTimeFrequency, 'value', 0, 2, 0.001).name('uTimeFrequency')
gui.add(uniforms.uStrength, 'value', 0, 2, 0.001).name('uStrength')


gui.add(uniforms.uWarpPositionFrequency, 'value', 0, 2, 0.001).name('uWarpPositionFrequency')
gui.add(uniforms.uWarpTimeFrequency, 'value', 0, 2, 0.001).name('uWarpTimeFrequency')
gui.add(uniforms.uWarpStrength, 'value', 0, 2, 0.001).name('uWarpStrength')

gui.addColor(debugObject, 'colorA').onChange(() => uniforms.uColorA.value.set(debugObject.colorA))
gui.addColor(debugObject, 'colorB').onChange(() => uniforms.uColorB.value.set(debugObject.colorB))

gui.add(material, 'metalness', 0, 1, 0.001)
gui.add(material, 'roughness', 0, 1, 0.001)
gui.add(material, 'transmission', 0, 1, 0.001)
gui.add(material, 'ior', 0, 10, 0.001)
gui.add(material, 'thickness', 0, 10, 0.001)



// Geometry
let geometry = new THREE.IcosahedronGeometry(3, 50)

geometry = mergeVertices(geometry)
geometry.computeTangents()


// Mesh
const wobble = new THREE.Mesh(geometry, material)
wobble.customDepthMaterial = depthMaterial
wobble.receiveShadow = true
wobble.castShadow = true
wobble.position.x = -3.5
scene.add(wobble)

/**
 * Plane
 */
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500, 15),
    new THREE.MeshStandardMaterial({ color: '#ff8521' })
)
plane.receiveShadow = true
plane.rotation.y = Math.PI
plane.position.y = - 5
plane.position.z = 5
scene.add(plane)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(2048, 2048)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = -10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.bottom = -10

directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, - 2.25)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 1.5)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-2.53, - 0.12, - 15.08)
window.camera = camera
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = false

/**
 * Scroll parallax
 */
let scrollY = window.scrollY

window.addEventListener('scroll', () =>
{
    scrollY = window.scrollY
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.outputColorSpace = THREE.SRGBColorSpace

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Materials
    uniforms.uTime.value = elapsedTime

    // Parallax
    const parallaxTarget = scrollY * 0.0015
    wobble.position.y += (parallaxTarget - wobble.position.y) * 0.05

    const rotationTarget = scrollY * 0.004
    wobble.rotation.y += (rotationTarget - wobble.rotation.y) * 0.05

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()