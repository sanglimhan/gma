import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

//configuration
const WALL_THICKNESS = 1;
const PUSH_COOLDOWN_MS = 200; //cooldown for mouse push
const MOUSE_PUSH_STRENGTH_SCALE = 0.5; //scale factor for push force
const MOUSE_VERTICAL_STRENGTH_SCALE = 1.5; //scale factor for push force
const OBJECT_TYPES = Object.freeze(Array(4).fill('Dodecahedron')
    .concat(Array(4).fill('Icosahedron'))
    .concat(Array(4).fill('Tetrahedron'))
    .concat(['TorusKnot']));
const LIGHT_SHADOW_MAP_SIZE = 2048;
const LIGHT_SHADOW_CAMERA_FRUSTUM_SIZE = 50;
const PHYSICS_SOLVER_ITERATIONS = 10;
const PHYSICS_TIMESTEP = 1 / 60;
const PHYSICS_MAX_SUBSTEPS = 3;
const ANGULAR_DAMPING = 0.8;
const LINEAR_DAMPING = 0;
const OBJECT_WORLD_FRICTION = 0.1;
const OBJECT_WORLD_RESTITUTION = 0.8;
const OBJECT_OBJECT_FRICTION = 0.1;
const OBJECT_OBJECT_RESTITUTION = 0.5;
const INITIAL_IMPULSE_STRENGTH = 0.3;
const OBJECT_SCALE_DIVISOR_FROM_AREA = 6;
const ROUGHNESS = 0.2;
const METALNESS = 0.01;

//setup variables
let scene, camera, renderer, world;
let clock;
const animatedDirectionalLights = [];
const baseLightAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
let frustumHeight, frustumWidth, halfW, halfH, wallHeightBoundary, baseObjectSize;

//physics
let groundMesh, groundBody;
const dynamicMeshes = []; //visual objects
const dynamicBodies = []; //physics bodies
const initialPlacementData = [];
const wallBodies = [];
const worldMaterial = new CANNON.Material("worldMaterial");
const objectMaterial = new CANNON.Material("objectMaterial");

//pointer interation
const raycaster = new THREE.Raycaster();
const mousePosition = new THREE.Vector2();
let lastPushTime = 0;

//initialization
function init() {
    setupScene();
    setupLights();
    setupPhysicsWorld();
    setupEventListeners();
    updateSceneAndObjectDimensions();//initial setup of dimensions
    createWorldObjects();
    createDynamicObjects();
    clock = new THREE.Clock();
    animate();
}

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, window.innerHeight / 50, 0);
    camera.up.set(0, 0, -1);//z is up
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.insertBefore(renderer.domElement, document.querySelector('.dot-nav'));
}
function setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.5);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    
    const lightColors = [0xff69b4, 0x00ff7f, 0x3399ff, 0xffa500];
    lightColors.forEach((color, i) => {
        const directionalLight = new THREE.DirectionalLight(color, 0.4);
        const angle = baseLightAngles[i];
        directionalLight.position.set(Math.sin(angle) * 15, 10, Math.cos(angle) * 15);
        configureLightShadows(directionalLight);
        scene.add(directionalLight);
        animatedDirectionalLights.push({ light: directionalLight, initialAngle: angle });
    });
}
function configureLightShadows(light) {
    light.castShadow = true;
    light.shadow.mapSize.set(LIGHT_SHADOW_MAP_SIZE, LIGHT_SHADOW_MAP_SIZE);
    const d = LIGHT_SHADOW_CAMERA_FRUSTUM_SIZE;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = Math.max(d, 200);
    light.shadow.bias = -0.001;
    light.target.position.set(0, 0, 0);
    scene.add(light.target);
}
function setupPhysicsWorld() {
    world = new CANNON.World();
    world.gravity.set(0, -0.5, 0);//gravity along z-axis
    world.broadphase = new CANNON.NaiveBroadphase(); //collision detection
    world.solver.iterations = PHYSICS_SOLVER_ITERATIONS;
    //collision materials
    const object_worldCollision = new CANNON.ContactMaterial(worldMaterial, objectMaterial, {
        friction: OBJECT_WORLD_FRICTION,
        restitution: OBJECT_WORLD_RESTITUTION,
    });
    world.addContactMaterial(object_worldCollision);
    
    const object_objectCollision = new CANNON.ContactMaterial(objectMaterial, objectMaterial, {
        friction: OBJECT_OBJECT_FRICTION,
        restitution: OBJECT_OBJECT_RESTITUTION,
    });
    world.addContactMaterial(object_objectCollision);
}

function initialWorldSize(currentFrustumWidth, currentFrustumHeight, currentWallHeight, thickness) {
    const halfW = currentFrustumWidth / 2;
    const halfH = currentFrustumHeight / 2;
    return [
        { position: [halfW + thickness / 2, currentWallHeight / 2, 0], size: [thickness, currentWallHeight, currentFrustumHeight] },
        { position: [-halfW - thickness / 2, currentWallHeight / 2, 0], size: [thickness, currentWallHeight, currentFrustumHeight] },
        { position: [0, currentWallHeight / 2, halfH + thickness / 2], size: [currentFrustumWidth, currentWallHeight, thickness] },
        { position: [0, currentWallHeight / 2, -halfH - thickness / 2], size: [currentFrustumWidth, currentWallHeight, thickness] },
        { position: [0, currentWallHeight + thickness / 2, 0], size: [currentFrustumWidth, thickness, currentFrustumHeight] }
    ];
}
function createWorldObjects() {
    groundBody = new CANNON.Body({ mass: 0, material: worldMaterial });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Orient plane horizontally
    world.addBody(groundBody);
    const groundGeo = new THREE.PlaneGeometry(frustumWidth * 2, frustumHeight * 2);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0xDDDDDD, side: THREE.DoubleSide,
        roughness: ROUGHNESS,
        metalness: METALNESS
    });
    groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    
    const worldDefs = initialWorldSize(frustumWidth, frustumHeight, wallHeightBoundary, WALL_THICKNESS);
    worldDefs.forEach(wDef => {
        const shape = new CANNON.Box(new CANNON.Vec3(wDef.size[0] / 2, wDef.size[1] / 2, wDef.size[2] / 2));
        const body = new CANNON.Body({ mass: 0, shape: shape, material: worldMaterial });
        body.position.set(...wDef.position);
        world.addBody(body);
        wallBodies.push(body); //store for potential updates if walls need to change dynamically
    });
}

function getGeometryForType(type, radius) {
    switch (type) {
        case 'TorusKnot': return new THREE.TorusKnotGeometry(radius, radius / 4, 100, 16);
        case 'Dodecahedron': return new THREE.DodecahedronGeometry(radius);
        case 'Icosahedron': return new THREE.IcosahedronGeometry(radius);
        case 'Tetrahedron': return new THREE.TetrahedronGeometry(radius);
        default: return new THREE.SphereGeometry(radius); // Fallback
    }
}
function createDynamicObjects() {
    OBJECT_TYPES.forEach((type) => {
        const radius = baseObjectSize / 2;
        let physicsRadius = radius; //physcis bodies size
        const geometry = getGeometryForType(type, radius);
        if (!geometry || !geometry.attributes.position) {
            console.warn(`Failed to create geometry for type: ${type}`);
            return;
        }
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xffffff),//new THREE.Color(Math.random() * 0xffffff),
            roughness: ROUGHNESS,
            metalness: METALNESS,
            flatShading: type !== 'TorusKnot',
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const wireframeColorHex = getComputedStyle(document.documentElement).getPropertyValue('--wireframe-color').trim() || '#000000';
        const wireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(wireframeColorHex), wireframe: true });
        const wireframeMesh = new THREE.Mesh(geometry.clone(), wireMat);
        mesh.add(wireframeMesh);
        
        // Initial position calculation (try to avoid overlaps)
        let x = 0, z = 0;
        const baseY = 0.01 + physicsRadius; // Position slightly above ground
        const maxPlacementAttempts = 50;
        for (let attempt = 0; attempt < maxPlacementAttempts; attempt++) {
            const placeableHalfW = halfW - physicsRadius - WALL_THICKNESS;
            const placeableHalfH = halfH - physicsRadius - WALL_THICKNESS;
            const randomRadius = Math.sqrt(Math.random()) * (Math.min(placeableHalfW, placeableHalfH) * 0.9);
            const angle = Math.random() * 2 * Math.PI;
            x = randomRadius * Math.cos(angle);
            z = randomRadius * Math.sin(angle);
            let isOverlapping = false;
            for (const prev of initialPlacementData) {
                const dx = x - prev.x;
                const dz = z - prev.z;
                const minDistance = (physicsRadius + prev.halfExtent) * 1.1;
                if (dx * dx + dz * dz < minDistance * minDistance) {
                    isOverlapping = true;
                    break;
                }
            }
            if (!isOverlapping) break;
        }
        if (OBJECT_TYPES.filter(t => t === 'TorusKnot').length === 1 && type === 'TorusKnot' && initialPlacementData.length === OBJECT_TYPES.length -1) {
             x = 0; z = 0;
         }

        mesh.position.set(x, baseY, z);
        scene.add(mesh);
        dynamicMeshes.push(mesh);

        // Physics Body
        const sphereShape = new CANNON.Sphere(physicsRadius);
        const body = new CANNON.Body({
            mass: type === 'TorusKnot' ? 3 : 2,
            material: objectMaterial,
            angularDamping: ANGULAR_DAMPING,
            linearDamping: LINEAR_DAMPING,
        });

        body.addShape(sphereShape);
        body.position.set(x, baseY, z);
        world.addBody(body);
        const initialImpulseStrength = INITIAL_IMPULSE_STRENGTH;
        const randomDirection = new CANNON.Vec3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        randomDirection.normalize();
        randomDirection.scale(initialImpulseStrength, randomDirection);
        dynamicBodies.push(body);
        
        const randomPoint = new CANNON.Vec3(
            body.position.x + (Math.random() - 0.5) * 0.1,
            body.position.y + (Math.random() - 0.5) * 0.1,
            body.position.z + (Math.random() - 0.5) * 0.1
        );
        body.applyImpulse(randomDirection, randomPoint);

        initialPlacementData.push({ x, z, halfExtent: physicsRadius });
    });
}


// --- RESIZE AND UPDATE LOGIC ---
function updateSceneAndObjectDimensions() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    wallHeightBoundary = Math.abs(camera.position.y); //distance from camera to ground
    frustumHeight = 2 * Math.tan(vFOV / 2) * wallHeightBoundary * 0.8;
    frustumWidth = frustumHeight * camera.aspect * 0.8;
    halfW = frustumWidth / 2;
    halfH = frustumHeight / 2;
    const frustumAreaTerm = Math.sqrt(frustumWidth * frustumHeight);
    baseObjectSize = frustumAreaTerm / OBJECT_SCALE_DIVISOR_FROM_AREA;
    if (groundMesh) {
        groundMesh.geometry.dispose();
        groundMesh.geometry = new THREE.PlaneGeometry(frustumWidth * 2, frustumHeight * 2);
    }
    const newWorldDefs = initialWorldSize(frustumWidth, frustumHeight, wallHeightBoundary, WALL_THICKNESS);
    wallBodies.forEach((body, i) => {
        if (body && body.shapes[0] && newWorldDefs[i]) {
            const wDef = newWorldDefs[i];
            body.position.set(...wDef.position);
            body.shapes[0].halfExtents.set(wDef.size[0] / 2, wDef.size[1] / 2, wDef.size[2] / 2);
            body.shapes[0].updateConvexPolyhedronRepresentation(); // Important for collision detection
            body.updateBoundingRadius();
        }
    });

    dynamicMeshes.forEach((mesh, i) => {
        const type = OBJECT_TYPES[i];
        const body = dynamicBodies[i];
        const newRadius = baseObjectSize / 2;
        let newPhysicsRadius = newRadius;
        // Update Three.js Mesh
        const newGeo = getGeometryForType(type, newRadius);
        mesh.geometry.dispose();
        mesh.geometry = newGeo;
        const wireframeMesh = mesh.children.find(child => child.isMesh && child.material.wireframe);
        if (wireframeMesh) {
            wireframeMesh.geometry.dispose();
            wireframeMesh.geometry = newGeo.clone();
        }
        while(body.shapes.length > 0) {
            body.removeShape(body.shapes[0]);
        }
        body.addShape(new CANNON.Sphere(newPhysicsRadius));
        body.updateMassProperties();
        
        if (body.position.y < newPhysicsRadius + 0.05) { // if close to ground
             body.position.y = 0.01 + newPhysicsRadius; // place it back on ground
             mesh.position.y = body.position.y;
        }
        if (initialPlacementData[i]) {
            initialPlacementData[i].halfExtent = newPhysicsRadius;
        }
    });
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    window.addEventListener('resize', updateSceneAndObjectDimensions);
    // 데스크톱 마우스 이동 리스너
    window.addEventListener('mousemove', onPointerMove); // 이름 변경: onMouseMove -> onPointerMove
    // 모바일 터치 시작 리스너
    window.addEventListener('touchstart', onTouchStart, { passive: false }); // passive:false는 preventDefault를 위함 (필요시)
}

// 이름 변경: onMouseMove -> onPointerMove
function onPointerMove(event) {
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onTouchStart(event) {
    // 기본 스크롤 동작 등을 막고 싶을 때 (선택적)
    // event.preventDefault(); 

    if (event.touches.length > 0) {
        const touch = event.touches[0];
        mousePosition.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mousePosition.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        // 터치 시 즉시 푸시 로직 실행
        applyPointerPush(); // 이름 변경: applyMousePush -> applyPointerPush
    }
}

// --- INTERACTION ---
// 이름 변경: applyMousePush -> applyPointerPush
function applyPointerPush() { 
    const now = performance.now();
    // 탭 기반에서는 쿨다운이 덜 중요할 수 있지만, 원한다면 유지 가능
    if (now - lastPushTime < PUSH_COOLDOWN_MS) return; 

    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(dynamicMeshes, true);

    if (intersects.length > 0) {
        // ... (기존 로직 동일) ...
        let intersectedMesh = intersects[0].object;
        while (intersectedMesh.parent && intersectedMesh.parent !== scene) {
            if (dynamicMeshes.includes(intersectedMesh.parent)) {
                intersectedMesh = intersectedMesh.parent;
                break;
            }
            intersectedMesh = intersectedMesh.parent;
        }
        const index = dynamicMeshes.indexOf(intersectedMesh);
        if (index !== -1) {
            lastPushTime = now; // 쿨다운을 사용한다면 시간 업데이트
            const body = dynamicBodies[index];
            const pushStrength = baseObjectSize * MOUSE_PUSH_STRENGTH_SCALE;
            const verticalStrength = baseObjectSize * MOUSE_VERTICAL_STRENGTH_SCALE;

            const force = new CANNON.Vec3(
                (Math.random() - 0.5) * 2 * pushStrength,
                Math.random() * verticalStrength + baseObjectSize * 0.5, // Ensure some upward push, scaled
                (Math.random() - 0.5) * 2 * pushStrength
            );
            // Apply force at a slightly offset point to induce torque (rotation)
            const worldPoint = new CANNON.Vec3(
                body.position.x + (Math.random() - 0.5) * 0.2 * body.shapes[0].radius, // Offset relative to object size
                body.position.y + (Math.random() - 0.5) * 0.2 * body.shapes[0].radius,
                body.position.z + (Math.random() - 0.5) * 0.2 * body.shapes[0].radius
            );
            body.applyImpulse(force, worldPoint);
        }
    }
}

   
    

// --- ANIMATION LOOP ---


function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.elapsedTime;
    world.step(PHYSICS_TIMESTEP, deltaTime, PHYSICS_MAX_SUBSTEPS);

    const lightAnimationTime = elapsedTime * 0.1;
    animatedDirectionalLights.forEach(lightData => {
        lightData.light.position.x = Math.sin(lightAnimationTime + lightData.initialAngle) * 15;
        lightData.light.position.z = Math.cos(lightAnimationTime + lightData.initialAngle) * 15;
        if (lightData.light.target) {
             lightData.light.target.updateMatrixWorld();
        }
    });
    
    
    dynamicMeshes.forEach((mesh, i) => {
        if (dynamicBodies[i] && mesh) {
            mesh.position.copy(dynamicBodies[i].position);
            mesh.quaternion.copy(dynamicBodies[i].quaternion);
        }
    });

    applyPointerPush(); // 탭 인터랙션으로 변경했다면 여기서 호출 안 함
    renderer.render(scene, camera);
}
// --- START ---
init();