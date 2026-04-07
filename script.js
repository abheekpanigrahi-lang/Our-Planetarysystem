// 1. Scene & Loading Manager
const scene = new THREE.Scene();
const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    if (loadingBar) loadingBar.style.width = progress + '%';
    if (loadingPercentage) loadingPercentage.innerText = Math.round(progress) + '%';
};

loadingManager.onLoad = function () {
    const loadingScreen = document.getElementById('loading-screen');
    const homeScreen = document.getElementById('home-screen');
    
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.visibility = 'hidden';
            
            // Show the branded Home Screen after loading finishes
            if (homeScreen) {
                homeScreen.classList.remove('hidden');
            }
        }, 800);
    }
};

const textureLoader = new THREE.TextureLoader(loadingManager);

// Content for Info Modals
const modalContentMap = {
    'howto': {
        title: 'How to Navigate',
        body: `
            <div class="modal-text">
                <p>Welcome to <span class="highlight">Our Planetary System</span>. Use these controls to explore our cosmic neighborhood:</p>
                <h3>🖱️ CAMERA CONTROLS</h3>
                <ul>
                    <li><span class="highlight">Orbit:</span> Left-click and drag to rotate around the sun or a locked planet.</li>
                    <li><span class="highlight">Zoom:</span> Use your mouse wheel (or pinch on trackpads) to move closer or further away.</li>
                    <li><span class="highlight">Pan:</span> Right-click and drag to shift your field of view.</li>
                </ul>
                <h3>🪐 INTERACTION</h3>
                <ul>
                    <li><span class="highlight">Click a Planet:</span> Instantly zoom into that planet to see its detailed stats and track its orbit.</li>
                    <li><span class="highlight">Sidebar:</span> Use the list on the left to quickly jump between destinations.</li>
                    <li><span class="highlight">Reset:</span> Click the "Return to POV" button or click empty space to return to the system overview.</li>
                </ul>
            </div>
        `
    },
    'about': {
        title: 'About the Project',
        body: `
            <div class="modal-text">
                <p><span class="highlight">Our Planetary System</span> is an advanced, interactive WebGL visualization designed to bring the scale and beauty of the solar system to your browser.</p>
                <p>Built using <span class="highlight">Three.js</span> and <span class="highlight">GSAP</span>, this simulation uses high-resolution NASA planetary textures and realistic lighting to create a cinematic exploration experience.</p>
                <h3>CREDITS & DATA</h3>
                <ul>
                    <li><span class="highlight">Visuals:</span> Procedurally generated Saturn rings and custom-mapped starfields.</li>
                    <li><span class="highlight">Data:</span> Scientific facts sourced from NASA\'s planetary fact sheets.</li>
                    <li><span class="highlight">Engine:</span> Powered by the latest WebGL 3D rendering technology.</li>
                </ul>
                <p>Created with a passion for space, physics, and modern web design.</p>
            </div>
        `
    }
};

function openModal(type) {
    const modal = document.getElementById('info-modal');
    const container = document.getElementById('modal-content');
    if (modal && container && modalContentMap[type]) {
        container.innerHTML = `
            <h2 class="modal-title">${modalContentMap[type].title}</h2>
            ${modalContentMap[type].body}
        `;
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('info-modal');
    if (modal) modal.classList.add('hidden');
}

// 2. Camera (your eyes)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let lockedPlanet = null;

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.3; // Balanced exposure
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false; // Disable until intro finishes

// Move camera far away initially for the intro sweep
camera.position.set(0, 200, 300);

// 4. Post-Processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0, // Bloom strength (more subtle)
    0.4, // Radius
    0.4  // Threshold (higher so only bright things glow)
);
composer.addPass(bloomPass);

function cinematicIntro() {
    gsap.to(camera.position, {
        x: 0,
        y: 10,
        z: 56,
        duration: 3.5,
        ease: "expo.inOut",
        onComplete: () => {
            controls.enabled = true;
        }
    });
}

// 5. Track Sun Video in LoadingManager
loadingManager.itemStart('sun2.mp4');
const video = document.createElement('video');
video.src = 'sun2.mp4';
video.loop = true;
video.muted = true;
video.crossOrigin = 'anonymous';

video.oncanplaythrough = () => {
    loadingManager.itemEnd('sun2.mp4');
    video.play();
};
video.load();

const videoTexture = new THREE.VideoTexture(video);

const starGeometry = new THREE.SphereGeometry(500, 64, 64);

const starMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('starmap.jpg'),
  side: THREE.BackSide,
  color: 0x444444 // Dim the background texture
});

const starMesh = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starMesh);

// Create Sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);

const sunMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);

// Add to scene
scene.add(sun);



const sunLight = new THREE.PointLight(0xffffff, 2.5, 400);
scene.add(sunLight);

// Add a soft glow "halo" to the Sun for bloom to catch
const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(5.4, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.1 })
);
scene.add(sunGlow);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Create Earth
const earthGeometry = new THREE.SphereGeometry(1, 32, 32);

const earthTexture = textureLoader.load("earth.jpg");
const earthMaterial = new THREE.MeshStandardMaterial({
  map: earthTexture
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);

// Position it away from Sun
earth.position.x = 12;

// Add to scene

// Beautiful procedural Saturn ring texture generator
function createSaturnRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');

  const centerX = 512;
  const centerY = 512;

  context.clearRect(0, 0, 1024, 1024);

  function drawBand(r1, r2, r, g, b, opacity) {
    context.beginPath();
    context.arc(centerX, centerY, r2, 0, Math.PI * 2);
    context.arc(centerX, centerY, r1, 0, Math.PI * 2, true);
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    context.fill();
  }

  // Scale: 512 is max radius (outer edge). Inner radius is 512 * (1.2/2.4) = 256.

  // C Ring (inner, faint, grayish)
  drawBand(256, 320, 120, 115, 110, 0.4);
  // B Ring (Main brightest, dense, creamy tan)
  drawBand(320, 360, 220, 210, 190, 0.9);
  drawBand(360, 420, 190, 180, 160, 0.8);
  drawBand(420, 440, 230, 220, 200, 0.95); // Bright edge
  // Cassini Division (dark gap but not totally empty)
  drawBand(440, 455, 30, 30, 30, 0.15);
  // A Ring (outer, grayish tan)
  drawBand(455, 490, 170, 160, 150, 0.7);
  // Encke Gap
  drawBand(490, 495, 20, 20, 20, 0.05);
  // F Ring edge
  drawBand(495, 508, 150, 140, 130, 0.5);

  return new THREE.CanvasTexture(canvas);
}

function createPlanet(size, texture, distance, speed) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    map: textureLoader.load(texture)
  });

  const planet = new THREE.Mesh(geometry, material);
  planet.name = texture.split('.')[0]; // "mercury", "venus", etc.

  // If this is Saturn, add the gorgeous detailed rings!
  if (planet.name.toLowerCase() === 'saturn') {
    // Ring from 1.2x to 2.4x the planet's radius
    const ringGeometry = new THREE.RingGeometry(size * 1.2, size * 2.4, 128);

    const ringMaterial = new THREE.MeshBasicMaterial({
      map: createSaturnRingTexture(), // Apply our procedural high-res texture!
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);

    // Rotate the plane to lay flat horizontally
    rings.rotation.x = Math.PI / 2;

    // Tilt it slightly so it looks incredibly cinematic from the top
    rings.rotation.y = 0.3;

    // Add rings as a child to the planet so they move and rotate with it
    planet.add(rings);
  }

  // position will be updated dynamically (orbit)
  planet.position.x = distance;

  scene.add(planet);

  return {
    mesh: planet,   // the actual THREE.Mesh
    distance: distance,
    speed: speed,
    angle: Math.random() * Math.PI * 2
  };
}

const planetData = [
  { size: 0.8, texture: 'mercury.jpg', distance: 7, speed: 0.012 },
  { size: 0.9, texture: 'venus.jpg', distance: 10, speed: 0.01 },
  { size: 1, texture: 'earth.jpg', distance: 14, speed: 0.008 },
  { size: 0.9, texture: 'Mars.jpg', distance: 19, speed: 0.005 },
  { size: 2, texture: 'jupiter.jpg', distance: 29, speed: 0.003 },     // Moved jupiter out to make room for asteroid belt
  { size: 1.6, texture: 'saturn.jpg', distance: 36, speed: 0.002 },    // Adjusted distances slightly
  { size: 1.4, texture: 'uranus.png', distance: 42, speed: 0.001 },
  { size: 1.2, texture: 'neptune.jpg', distance: 48, speed: 0.00098 },
];
//  Create planets
const planet = planetData.map(p => createPlanet(p.size, p.texture, p.distance, p.speed));

// Create Asteroid Belt using InstancedMesh for high performance
function createAsteroidBelt() {
  const asteroidCount = 3000;
  // Dodecahedron provides an excellent low-poly rock shape
  const geometry = new THREE.DodecahedronGeometry(0.15, 0);
  const material = new THREE.MeshStandardMaterial({
    map: textureLoader.load('mercury.jpg'), // Reuse mercury texture for realistic rock look
    roughness: 0.8
  });

  // InstancedMesh lets us render 3000 asteroids efficiently
  const belt = new THREE.InstancedMesh(geometry, material, asteroidCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < asteroidCount; i++) {
    // Position them randomly between Mars (19) and Jupiter (29) -> approx 21.5 to 26.5
    const distance = 21.5 + Math.random() * 5;
    const angle = Math.random() * Math.PI * 2;

    // Give the belt some thickness
    const yOffset = (Math.random() - 0.5) * 1.8;

    dummy.position.set(
      distance * Math.cos(angle),
      yOffset,
      distance * Math.sin(angle)
    );

    // Random rotations
    dummy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    // Minor size variations
    const scale = 0.3 + Math.random() * 0.9;
    dummy.scale.set(scale, scale, scale);

    dummy.updateMatrix();
    belt.setMatrixAt(i, dummy.matrix);
  }

  scene.add(belt);
  return belt;
}

const asteroidBelt = createAsteroidBelt();

// 2. Extract meshes for clicking
const planetMeshes = planet.map(p => p.mesh);

// 3. Raycaster & click event
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planetInfoData = {
  'mercury': { name: 'Mercury', info: 'Mercury is the closest planet to the Sun and the most cratered planet in the Solar System. Despite being closest to the Sun, it is not the hottest planet. It has no significant atmosphere to retain heat, causing extreme temperature swings from 430°C during the day to -180°C at night. A year on Mercury is just 88 Earth days long. It has no moons and no rings.' },
  'venus': { name: 'Venus', info: 'Venus is the second planet from the Sun and Earth\'s closest planetary neighbor. It possesses a thick, toxic atmosphere heavily composed of carbon dioxide. The atmospheric pressure at its surface is 92 times that of Earth. Clouds of sulfuric acid trap intense heat, making it the hottest planet in our solar system with surface temperatures of 475°C. Venus famously rotates backwards compared to most other planets.' },
  'earth': { name: 'Earth', info: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. Approximately 71% of its surface is covered in liquid ocean water. Earth\'s atmosphere is exactly 78% nitrogen and 21% oxygen, which protects us from incoming meteoroids. It has a powerful magnetic field generated by its molten core. Earth has a single natural satellite, the Moon.' },
  'Mars': { name: 'Mars', info: 'Mars is the fourth planet from the Sun and is often called the Red Planet due to the iron oxide prevalent on its surface. It hosts Olympus Mons, the largest volcano and highest known mountain in the Solar System. Valles Marineris is a gigantic canyon stretching thousands of miles across its surface. Mars has a very thin atmosphere and two small, irregularly shaped moons: Phobos and Deimos.' },
  'jupiter': { name: 'Jupiter', info: 'Jupiter is the largest and fifth planet from the Sun. It is composed primarily of hydrogen and helium and has a mass more than two and a half times that of all the other planets combined. The Great Red Spot is a colossal storm that has been raging continuously for at least 400 years. Jupiter has an incredibly strong magnetic field and at least 95 known moons, including the Galilean moons: Io, Europa, Ganymede, and Callisto.' },
  'saturn': { name: 'Saturn', info: 'Saturn is the sixth planet from the Sun, mostly famous for its absolutely stunning and extensive ring system. The rings are predominantly composed of glittering ice particles, rocky debris, and cosmic dust. It is a massive gas giant with an average radius about nine and a half times that of Earth. Saturn has 285 confirmed moons, with Titan being the largest and the only moon in the solar system with a substantial atmosphere.' },
  'uranus': { name: 'Uranus', info: 'Uranus is the seventh planet from the Sun and the first planet discovered using a telescope. It is classified as an ice giant because it contains a higher proportion of "ices" such as water, ammonia, and methane. Its unique feature is its severe axial tilt of 97.7 degrees, meaning it basically rotates on its side, resulting in extreme 21-year seasons. Uranus has faint planetary rings and 29 known moons.' },
  'neptune': { name: 'Neptune', info: 'Neptune is the eighth and farthest officially recognized planet in the Solar System. It is the densest giant planet, known for its deep, rich blue coloration caused by methane in its atmosphere. Neptune is whipped by supersonic winds reaching speeds of over 2,000 kilometers per hour. It has a faint, fragmented ring system and 16 known moons, the largest of which is Triton, which uniquely orbits the planet backwards.' }
};

let isFollowing = false;
let currentZoomAnim = null;

const handleSelection = (clientX, clientY, target) => {
  // If the interaction is on the UI panel, ignore it for raycasting
  if (target?.closest('#planet-info') || target?.closest('.sidebar') || target?.closest('#reset-pov') || target?.closest('#sim-help') || target?.closest('#menu-toggle')) return;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const clickedPlanet = intersects[0].object;
    zoomToPlanet(clickedPlanet);
  } else {
    // If the info panel is open and we click empty space, reset the POV as requested!
    if (lockedPlanet) {
        resetPOV();
    } else {
        // Just a normal click in space while navigating
        unlockCamera();
    }
  }
};

window.addEventListener('click', (event) => {
    handleSelection(event.clientX, event.clientY, event.target);
});

// Task 3: Dedicated touchstart listener for 100% selection rate on mobile
window.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        handleSelection(event.touches[0].clientX, event.touches[0].clientY, event.target);
    }
}, { passive: false });

// Change cursor to hand pointer when hovering over planets
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
});

function resetPOV() {
  unlockCamera();
  controls.enabled = false;

  if (currentZoomAnim) currentZoomAnim.kill();

  const startCamPos = camera.position.clone();
  const endCamPos = new THREE.Vector3(0, 10, 45);
  const startTarget = controls.target.clone();
  const endTarget = new THREE.Vector3(0, 0, 0);
  const proxy = { t: 0 };

  currentZoomAnim = gsap.to(proxy, {
    t: 1,
    duration: 2.0,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.position.lerpVectors(startCamPos, endCamPos, proxy.t);
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, proxy.t);
      camera.lookAt(currentTarget);
    },
    onComplete: () => {
      controls.target.copy(endTarget);
      controls.enabled = true;
      controls.update();
    }
  });
}

function unlockCamera() {
  lockedPlanet = null;
  isFollowing = false;
  controls.enabled = true;

  if (currentZoomAnim) currentZoomAnim.kill();

  const infoDiv = document.getElementById('planet-info');
  if (infoDiv) infoDiv.classList.add('hidden');
  const svgOverlay = document.getElementById('svg-overlay');
  if (svgOverlay) svgOverlay.classList.add('hidden');
}

// Set up UI button listeners
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-info');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      resetPOV();
    });
  }

  const resetBtn = document.getElementById('reset-pov');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent raycaster click event
      resetPOV();
    });
  }

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menu-toggle');
  const planetNav = document.getElementById('planet-nav');
  if (menuToggle && planetNav) {
      menuToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          planetNav.classList.toggle('active');
          menuToggle.classList.toggle('active');
      });
  }

  // Close mobile menu if user clicks elsewhere
  document.addEventListener('click', (e) => {
      if (planetNav && planetNav.classList.contains('active') && !planetNav.contains(e.target) && e.target !== menuToggle) {
          planetNav.classList.remove('active');
          menuToggle.classList.remove('active');
      }
  });

  // Home Screen "Start Exploration" listener
  const startBtn = document.getElementById('start-exploration');
  const homeScreen = document.getElementById('home-screen');
  if (startBtn && homeScreen) {
    startBtn.addEventListener('click', () => {
      homeScreen.classList.add('hidden');
      
      // Reveal the persistent help icons in sim view
      const simHelp = document.getElementById('sim-help');
      if (simHelp) simHelp.classList.remove('hidden');
      
      cinematicIntro(); // Now we trigger the cinematic swoop!
    });
  }

  // Info Modal Listeners
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  
  // Home Screen Links
  document.getElementById('open-howto')?.addEventListener('click', (e) => { e.preventDefault(); openModal('howto'); });
  document.getElementById('open-about')?.addEventListener('click', (e) => { e.preventDefault(); openModal('about'); });
  
  // Sim View Help Buttons
  document.getElementById('sim-open-howto')?.addEventListener('click', () => openModal('howto'));
  document.getElementById('sim-open-about')?.addEventListener('click', () => openModal('about'));

  // Close modal on background click
  document.getElementById('info-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'info-modal') closeModal();
  });

  // Populate Side Navigation List dynamically
  const planetListEl = document.getElementById('planet-list');
  if (planetListEl) {
    planetMeshes.forEach(mesh => {
      const li = document.createElement('li');
      li.innerText = mesh.name.charAt(0).toUpperCase() + mesh.name.slice(1);
      li.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent raycaster from clicking empty space behind ui
        
        // Close mobile menu when a destination is chosen
        if (planetNav) {
            planetNav.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        }
        
        zoomToPlanet(mesh);
      });
      planetListEl.appendChild(li);
    });
  }
});

function zoomToPlanet(planetMesh) {
  lockedPlanet = planetMesh;
  isFollowing = false; // Temporarily stop direct following during GSAP animation
  controls.enabled = false; // Disable OrbitControls fighting the animation

  // Choose an offset relative to camera and target
  const radius = planetMesh.geometry.parameters.radius;
  const distanceOffset = radius * 4 + 3; // scale distance by planet size

  // We animate a proxy value so the camera can dynamically track the moving planet
  const proxy = { t: 0 };
  const startPos = camera.position.clone();

  if (currentZoomAnim) currentZoomAnim.kill();

  currentZoomAnim = gsap.to(proxy, {
    t: 1,
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      // Recalculate target position constantly because the planet orbits!
      const targetPos = new THREE.Vector3(
        planetMesh.position.x + distanceOffset,
        planetMesh.position.y + distanceOffset * 0.5,
        planetMesh.position.z + distanceOffset
      );
      camera.position.lerpVectors(startPos, targetPos, proxy.t);
      camera.lookAt(planetMesh.position);
    },
    onComplete: () => {
      controls.target.copy(planetMesh.position);
      controls.enabled = true;
      controls.update();
      isFollowing = true;
    }
  });

  // Show planet info
  showPlanetInfo(planetMesh.name);
}

function showPlanetInfo(name) {
  if (!name) name = 'Unknown';
  const info = planetInfoData[name] || { name: name.toUpperCase(), info: 'Unknown celestial body.' };
  const titleEl = document.getElementById('info-title');
  const descEl = document.getElementById('info-desc');

  if (titleEl) titleEl.innerText = info.name;
  if (descEl) {
    // Break sentences into bullet points
    const sentences = info.info.split('. ').filter(s => s.trim().length > 0);
    descEl.innerHTML = sentences.map(s => `<li>${s.trim()}${s.trim().endsWith('.') ? '' : '.'}</li>`).join('');
  }

  const infoDiv = document.getElementById('planet-info');
  if (infoDiv) infoDiv.classList.remove('hidden');
  const svgOverlay = document.getElementById('svg-overlay');
  if (svgOverlay) svgOverlay.classList.remove('hidden');
}

function createOrbit(distance) {
  const segments = 100;

  const geometry = new THREE.BufferGeometry();
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(points, 3)
  );

  const material = new THREE.LineBasicMaterial({
    color: 0x8be9fd,
    opacity: 0.15,
    transparent: true
  });

  const orbit = new THREE.LineLoop(geometry, material);
  scene.add(orbit);
}

planetData.forEach(p => {
  createOrbit(p.distance);
});

// ===== STAR FIELD =====
const starCount = 3000;
const starPositions = [];

for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 1500;
  const y = (Math.random() - 0.5) * 1500;
  const z = (Math.random() - 0.5) * 1500;

  starPositions.push(x, y, z);
}

const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
);

// Generate a circular texture programmatically
const starCanvas = document.createElement('canvas');
starCanvas.width = 16;
starCanvas.height = 16;
const starContext = starCanvas.getContext('2d');
starContext.beginPath();
starContext.arc(8, 8, 8, 0, Math.PI * 2);
starContext.fillStyle = '#ffffff';
starContext.fill();
const starTexture = new THREE.CanvasTexture(starCanvas);

const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 3,
  sizeAttenuation: true,
  map: starTexture, // Apply the circular texture
  transparent: true,
  alphaTest: 0.5 // Cuts off the square transparent corners
});

const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

function animate() {
  requestAnimationFrame(animate);

  planet.forEach(planetObj => {
    const oldPos = planetObj.mesh.position.clone();

    planetObj.mesh.position.x = Math.cos(planetObj.angle) * planetObj.distance;
    planetObj.mesh.position.z = Math.sin(planetObj.angle) * planetObj.distance;
    planetObj.angle += planetObj.speed;
    planetObj.mesh.rotation.y += 0.01; // Rotate planet on its own axis

    // Stick to the planet!
    if (isFollowing && lockedPlanet === planetObj.mesh) {
      const delta = planetObj.mesh.position.clone().sub(oldPos);
      camera.position.add(delta); // Move camera exact same amount as planet
      controls.target.copy(planetObj.mesh.position); // Keep orbit controls center on planet
    }
    // Rotate planet mesh
    planetObj.mesh.rotation.y += 0.01;
  });

  // Slowly rotate the entire asteroid belt
  if (typeof asteroidBelt !== 'undefined' && asteroidBelt) {
    asteroidBelt.rotation.y += 0.0005; // Slightly slower for realism
  }

  // Rotate starfield slowly
  if (stars) {
      stars.rotation.y += 0.0001;
  }

  composer.render(); // Use composer for bloom effect
  controls.update();

  // Draw the tracking line from the locked planet to the UI panel
  if (lockedPlanet) {
    const svgOverlay = document.getElementById('svg-overlay');
    const infoBox = document.getElementById('planet-info');

    if (svgOverlay && !svgOverlay.classList.contains('hidden')) {
      // Convert 3D position to 2D screen coordinates
      const objectPos = lockedPlanet.position.clone();
      objectPos.project(camera);

      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;

      const x2d = (objectPos.x * windowHalfX) + windowHalfX;
      const y2d = -(objectPos.y * windowHalfY) + windowHalfY;

      // Get info box bounding rect for the endpoint
      const rect = infoBox.getBoundingClientRect();
      const targetX = rect.left - 5;
      const targetY = rect.top + 60; // Approximate align with the yellow line

      // Calculate an elbow point to make the line look geometric/modern
      const elbowX = x2d + (targetX - x2d) * 0.4;
      const path = `M ${x2d} ${y2d} L ${elbowX} ${targetY} L ${targetX} ${targetY}`;

      const linePoint = document.getElementById('line-point');
      const linePath = document.getElementById('line-path');

      if (linePoint) {
        linePoint.setAttribute('cx', x2d);
        linePoint.setAttribute('cy', y2d);
      }
      if (linePath) {
        linePath.setAttribute('d', path);
      }
    }
  }
}

animate();

// Handle window resizing (Fixes Task 1: Portrait Stretching)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Task 4: Improve touch-target precision for mobile
raycaster.params.Points.threshold = 0.5;
raycaster.params.Mesh.threshold = 0.5;
