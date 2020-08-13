import * as THREE from 'three'
import { OBJLoader } from '../loaders/OBJLoader'
import { MTLLoader } from '../loaders/MTLLoader'
import { LoadingManager } from 'three'

let scene, camera, renderer, mesh, meshFloor, ambientLight, spotLight, loadingManager, clock
let keyboard = {}
let player = { height: 1.8, speed: 0.05, turnSpeed: Math.PI * 0.005 }
let crate, crateTexture, crateNormal, crateBumpMap
let RESOURCES_LOADED = false

const models = {
    cannon: {
        obj: 'cannonLarge.obj',
        mtl: 'cannonLarge.mtl',
        mesh: null
    },
    tree: {
        obj: 'tree_pineTallA.obj',
        mtl: 'tree_pineTallA.mtl',
        mesh: null
    },
    gun: {
        obj: 'uziLong.obj',
        mtl: 'uziLong.mtl',
        mesh: null
    }
}

const meshes = {}

let bullets = []

function init() {
    clock = new THREE.Clock()

    //Loading manager
    loadingManager = new THREE.LoadingManager()
    loadingManager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total)
    }
    loadingManager.onLoad = () => {
        console.log('loading complete!')
        RESOURCES_LOADED = true
        onResourcesLoaded()
    }

    // Create a scene and camera
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(90, 1280 / 720, 0.1, 1000)

    // A Mesh is made up of a geometry and a material.
    // Materials affect how the geometry looks, especially under lights.
    mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1), // width, height, depth
        new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: false }) // Color is given in hexadecimal RGB
        // 0xff0000 is pure red, 0x00ff00 is pure green, and 0x0000ff is pure blue.
        // white would be 0xffffff and black would be 0x000000.
    );
    // Add the mesh to the scene.
    mesh.position.y += 1
    mesh.receiveShadow = true
    mesh.castShadow = true
    scene.add(mesh)

    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false })
    )
    // Add the mesh to the scene.
    meshFloor.rotation.x -= Math.PI / 2
    meshFloor.receiveShadow = true
    scene.add(meshFloor)

    //adding ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    //adding spot light
    spotLight = new THREE.PointLight(0xffffff, 0.8, 30)
    spotLight.position.set(-10, 10, -10)
    spotLight.castShadow = true
    spotLight.shadow.camera.near = 0.1
    spotLight.shadow.camera.far = 40
    scene.add(spotLight)

    let textureLoader = new THREE.TextureLoader(loadingManager)
    crateTexture = new textureLoader.load('crate0_diffuse.png')
    crateBumpMap = textureLoader.load('crate0_bump.png')
    crateNormal = textureLoader.load('crate0_normal.png')

    crate = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: crateTexture,
            bumpMap: crateBumpMap,
            normalMap: crateNormal
        })
    )

    crate.position.set(2.5, 1.5, 2.5)
    crate.receiveShadow = true
    crate.castShadow = true
    scene.add(crate)

    //load each model into models object

    Object.keys(models).forEach(key => {
        const mtlLoader = new MTLLoader(loadingManager)
        mtlLoader.load(models[key].mtl, materials => {
            const objLoader = new OBJLoader(loadingManager)
            objLoader.setMaterials(materials)
            objLoader.load(models[key].obj, (object) => {
                object.traverse((polygon) => {
                    polygon.castShadow = true
                    polygon.receiveShadow = true
                })
                models[key].mesh = object
            })
        })
    })

    // Move the camera to 0,0,-5 (the Y axis is "up")
    camera.position.set(0, player.height, -5)

    // Point the camera to look at 0,0,0
    camera.lookAt(new THREE.Vector3(0, player.height, 0))
    // Alternatively, this also works:
    // camera.lookAt(mesh.position);

    // Creates the renderer with size 1280x720
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(1280, 720)
    //enabling shadows
    renderer.shadowMap.enabled = true
    // Puts the "canvas" into our HTML page.
    document.body.appendChild(renderer.domElement)

    // Begin animation
    animate()
}

//runs when all resources are loaded
function onResourcesLoaded() {
    meshes['cannon1'] = models.cannon.mesh.clone()
    meshes['cannon2'] = models.cannon.mesh.clone()
    meshes['tree1'] = models.tree.mesh.clone()
    meshes['tree2'] = models.tree.mesh.clone()
    meshes['gun'] = models.gun.mesh.clone()


    meshes['tree1'].position.set(-2, 0, -2)
    meshes['tree2'].position.set(-2.5, 0, -2.5)
    meshes['gun'].position.set(0, player.height, -4)
    meshes['gun'].scale.set(10, 10, 10)
    scene.add(meshes.tree1)
    scene.add(meshes.tree2)
    scene.add(meshes.gun)
}

function animate() {

    requestAnimationFrame(animate); // Tells the browser to smoothly render at 60Hz

    var time = Date.now() * 0.0005
    var delta = clock.getDelta()

    // Rotate our mesh.
    mesh.rotation.x += 0.01
    mesh.rotation.y += 0.02
    crate.rotation.y += 0.01

    meshes['gun'].position.set(
        camera.position.x - Math.sin(camera.rotation.y + Math.PI / 6) * 0.6,
        camera.position.y - 0.5 + Math.sin(time * 8 + camera.position.x + camera.position.y) * 0.01,
        camera.position.z + Math.cos(camera.rotation.y + Math.PI / 6) * 0.6
    )

    meshes['gun'].rotation.set(
        camera.rotation.x,
        camera.rotation.y - Math.PI,
        camera.rotation.z
    )

    if (keyboard[32]) {// space bar
        //taking the x and z components out of the current direction the camera is pointing, and walking in that direction. (instead of absolute x & z)
        const bullet = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        )

        bullet.position.set(
            meshes['gun'].position.x,
            meshes['gun'].position.y,
            meshes['gun'].position.z
        )

        bullet.alive = true
        setTimeout(function () {
            bullet.alive = false
            scene.remove(bullet)
        }, 1000)

        bullet.velocity = new THREE.Vector3(
            -Math.sin(camera.rotation.y),
            0,
            Math.cos(camera.rotation.y)
        )

        bullets.push(bullet)
        scene.add(bullet)
    }

    for (let index = 0; index < bullets.length; index += 1) {
        if (bullets[index] === undefined) continue;
        if (bullets[index].alive === false) {
            bullets.splice(index, 1)
            continue;
        }
        bullets[index].position.add(bullets[index].velocity)
    }

    if (keyboard[87]) {// W key
        //taking the x and z components out of the current direction the camera is pointing, and walking in that direction. (instead of absolute x & z)
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed
        camera.position.z += Math.cos(camera.rotation.y) * player.speed
    }

    if (keyboard[83]) {// S key
        camera.position.x += Math.sin(camera.rotation.y) * player.speed
        camera.position.z -= Math.cos(camera.rotation.y) * player.speed
    }
    if (keyboard[65]) {// A key
        camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed
        camera.position.z -= Math.cos(camera.rotation.y + Math.PI / 2) * player.speed
    }
    if (keyboard[68]) {// D key
        camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed
        camera.position.z -= Math.cos(camera.rotation.y - Math.PI / 2) * player.speed
    }

    if (keyboard[37]) {//left arrow
        camera.rotation.y -= Math.PI * player.turnSpeed
    }

    if (keyboard[39]) {// right arrow
        camera.rotation.y += Math.PI * player.turnSpeed
    }
    // Draw the scene from the perspective of the camera.
    renderer.render(scene, camera);
}

function keydown(event) {
    keyboard[event.keyCode] = true
}

function keyup(event) {
    keyboard[event.keyCode] = false
}

window.addEventListener('keydown', keydown)
window.addEventListener('keyup', keyup)

// When the page has loaded, run init();
window.onload = init