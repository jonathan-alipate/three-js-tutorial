const { TetrahedronGeometry } = require("three");

let scene, camera, renderer, mesh, meshFloor;
let keyboard = {}
let player = { height: 1.8 }


function init() {
    // Create a scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, 1280 / 720, 0.1, 1000);

    // A Mesh is made up of a geometry and a material.
    // Materials affect how the geometry looks, especially under lights.
    mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1), // width, height, depth
        new THREE.MeshBasicMaterial({ color: 0xff4444, wireframe: true }) // Color is given in hexadecimal RGB
        // 0xff0000 is pure red, 0x00ff00 is pure green, and 0x0000ff is pure blue.
        // white would be 0xffffff and black would be 0x000000.
    );
    // Add the mesh to the scene.
    scene.add(mesh);

    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(10,10),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    )
    // Add the mesh to the scene.
    scene.add(meshFloor);

    // Move the camera to 0,0,-5 (the Y axis is "up")
    camera.position.set(0, 0, -5);

    // Point the camera to look at 0,0,0
    camera.lookAt(new THREE.Vector3(0, player.height, 0));
    // Alternatively, this also works:
    // camera.lookAt(mesh.position);

    // Creates the renderer with size 1280x720
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(1280, 720);
    // Puts the "canvas" into our HTML page.
    document.body.appendChild(renderer.domElement);

    // Begin animation
    animate();
}

function animate() {
    requestAnimationFrame(animate); // Tells the browser to smoothly render at 60Hz

    // Rotate our mesh.
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    if (keyboard[37]) {
        camera.rotation.y -= Math.PI * 0.01
    }

    if (keyboard[39]) {
        camera.rotation.y += Math.PI * 0.01
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