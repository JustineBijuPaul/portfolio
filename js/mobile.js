const particleCount = 5000;
const particleSize = 0.05;

let scene, camera, renderer, particles;
let colorMode = 'single';
let singleColor = new THREE.Color('#ff3366');
let gradientColor1 = new THREE.Color('#ff3366');
let gradientColor2 = new THREE.Color('#3366ff');

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('particleCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    createParticles();
    setupEventListeners();
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * 5;
        positions[i * 3] = Math.cos(theta) * radius;
        positions[i * 3 + 1] = Math.sin(theta) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

        if (colorMode === 'gradient') {
            const mixedColor = gradientColor1.clone().lerp(gradientColor2, Math.random());
            mixedColor.toArray(colors, i * 3);
        } else {
            singleColor.toArray(colors, i * 3);
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: `
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = ${particleSize} * (300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float d = distance(gl_PointCoord, vec2(0.5));
                if(d > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0 - (d * 2.0));
            }
        `
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function animate() {
    requestAnimationFrame(animate);

    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        positions[i3 + 1] += Math.cos(Date.now() * 0.001 + i) * 0.01;
        positions[i3 + 2] += Math.sin(Date.now() * 0.001 + i) * 0.01;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    document.getElementById('particleCanvas').addEventListener('pointerdown', onPointerDown, false);

    document.querySelectorAll('input[name="colorMode"]').forEach(input => {
        input.addEventListener('change', onColorModeChange);
    });

    document.getElementById('singleColor').addEventListener('change', onSingleColorChange);
    document.getElementById('gradientColor1').addEventListener('change', onGradientColorChange);
    document.getElementById('gradientColor2').addEventListener('change', onGradientColorChange);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < 100; i++) {
        const index = Math.floor(Math.random() * particleCount);
        positions[index * 3] = x * 5;
        positions[index * 3 + 1] = y * 5;
        positions[index * 3 + 2] = 0;
    }
    particles.geometry.attributes.position.needsUpdate = true;
}

function onColorModeChange(event) {
    colorMode = event.target.value;
    updateParticleColors();
}
