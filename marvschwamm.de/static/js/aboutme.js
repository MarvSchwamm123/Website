import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

console.log("aboutme.js gestartet");

// ---------------- SCENE ----------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 2.5;

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("globe-container").appendChild(renderer.domElement);

// light
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 3, 5);
scene.add(light);

// ---------------- GLOBE ----------------
const globeGroup = new THREE.Group();
scene.add(globeGroup);

const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);

const texture = new THREE.TextureLoader().load(
    "https://unpkg.com/three-globe/example/img/earth-night.jpg"
);

const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 1,
    metalness: 0
});

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

globeGroup.add(sphere);

// ---------------- LÄNDER ----------------
fetch("/static/js/countries.geojson")
    .then(res => res.json())
    .then(data => {

        data.features.forEach(country => {

        const geometry = country.geometry;

        const polygons =
            geometry.type === "Polygon"
            ? [geometry.coordinates]
            : geometry.coordinates;

        polygons.forEach(polygon => {

            polygon.forEach(ring => {

                const points = [];

                ring.forEach(([lon, lat]) => {

                    const radius = 1.001;

                    const phi = (90 - lat) * Math.PI / 180;
                    const theta = (lon + 180) * Math.PI / 180;

                    points.push(
                    -radius * Math.sin(phi) * Math.cos(theta),
                    radius * Math.cos(phi),
                    radius * Math.sin(phi) * Math.sin(theta)
                    );
                });

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(points, 3)
                );

                const material = new THREE.LineBasicMaterial({
                    color: 0xffffff
                });

                const line = new THREE.LineLoop(geometry, material);

                globeGroup.add(line);
            });
        });
    });
});

// ---------------- ANIMATION ----------------
function animate() {
  requestAnimationFrame(animate);

  globeGroup.rotation.y += 0.002;
  globeGroup.rotation.x = 0.4;

  renderer.render(scene, camera);
}

animate();

const homeBtn = document.getElementById("home-btn");

if (homeBtn) {
    homeBtn.addEventListener("click", () => {
        window.location.href = "/";
    });
}