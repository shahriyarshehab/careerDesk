/* ==========================================================================
   CareerDesk — 3D Nature Sanctuary Focus Desk (Three.js Engine)
   Ultra-realistic 3D study desk with Rose Garden Sanctuary, ambient weather,
   interactive 3D books & notebook, real-time celestial lighting, and audio soundscapes.
   ========================================================================== */

(function () {
  'use strict';

  // State Management
  const state3D = {
    initialized: false,
    autoTime: true,
    timeHours: 14.5,
    isNight: false,
    isRain: true,
    isLampOn: false,
    zenMode: false,
    lang: 'EN',
    activeCamMode: 'overview',
    pomo: {
      timeLeft: 25 * 60,
      totalTime: 25 * 60,
      isRunning: false,
      mode: 'focus'
    },
    tasks: []
  };

  function getDeskQuotePool() {
    if (typeof CURATED_QUOTES !== 'undefined' && Array.isArray(CURATED_QUOTES) && CURATED_QUOTES.length > 0) {
      return CURATED_QUOTES;
    }
    return [
      { en: "Where flowers bloom so does hope.", bn: "যেখানে ফুল ফোটে সেখানেই আশার আলো জ্বেলে ওঠে।", author: "Lady Bird Johnson" },
      { en: "Deep work is the superpower of the 21st century.", bn: "গভীর মনোযোগ হলো একুশ শতকের সবচেয়ে বড় সুপারপাওয়ার।", author: "Cal Newport" },
      { en: "Focus is a muscle. The more you practice, the stronger it gets.", bn: "মনোযোগ একটি পেশীর মতো; যত চর্চা করবেন, ততই শক্তিশালী হবে।", author: "CareerDesk" }
    ];
  }

  let scene, camera, renderer, canvas;
  let greenSanctuaryGroup, patioGroup, deskGroup;
  let ambientLight, sunLight, lampLight, lampSpotLight;
  let sunMesh, moonMesh, sunHalo, moonHalo, starPoints;
  let raycaster, mouse;
  const animatedTrees = [];
  const butterflies = [];
  const fireflies = [];
  const steamParticles = [];
  let notebookMesh = null;
  let mainBookMeshGroup = null;
  let lampBulbMesh = null;
  let updateClockTexture = null;
  let handleResize = null;

  let targetCamPos, targetCamLook, currentCamLook;
  let mouseX = 0, mouseY = 0;
  let animFrameId = null;
  let clock = null;

  // Audio Synthesizer (Web Audio API)
  let audioCtx = null;
  let rainGain, windGain, noiseGain, lofiGain;
  let lofiInterval = null;

  // Pomodoro Interval
  let pomoInterval = null;
  let quoteIdx = 0;

  function init3DDeskEngine() {
    canvas = document.getElementById('nature-desk-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    if (state3D.initialized) return;
    state3D.initialized = true;

    // 1. Scene, Camera, Renderer
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a140f, 0.01);

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;

    // Groups
    greenSanctuaryGroup = new THREE.Group();
    patioGroup = new THREE.Group();
    deskGroup = new THREE.Group();
    scene.add(greenSanctuaryGroup);
    scene.add(patioGroup);
    scene.add(deskGroup);

    // 2. Lighting System
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    lampLight = new THREE.PointLight(0xffb74d, 0, 20, 1.5);
    lampLight.castShadow = true;
    scene.add(lampLight);

    lampSpotLight = new THREE.SpotLight(0xffcb74, 0, 18, Math.PI / 5.5, 0.65, 1.2);
    lampSpotLight.castShadow = true;
    scene.add(lampSpotLight);

    // Sun — bright disc with additive corona halo
    sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfffde7 })
    );
    scene.add(sunMesh);
    sunHalo = new THREE.Mesh(
      new THREE.CircleGeometry(5.2, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffe066,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(sunHalo);

    // Moon — cool pearlescent disc with soft blue halo
    moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xe8f4fd })
    );
    scene.add(moonMesh);
    moonHalo = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 32),
      new THREE.MeshBasicMaterial({
        color: 0x90cdf4,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(moonHalo);
    // Twinkling Night Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 160;
      starPos[i + 1] = 15 + Math.random() * 50;
      starPos[i + 2] = -40 - Math.random() * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starPoints = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0 })
    );
    scene.add(starPoints);

    // 3. Build Sanctuary & Desk
    createRoseGardenSanctuary();
    createPatioAndDeskObjects();
    initCoffeeSteam();

    // 4. Raycaster & Camera Setup
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    targetCamPos = new THREE.Vector3(0, 3.2, 7.5);
    targetCamLook = new THREE.Vector3(0, 1.6, 0);
    currentCamLook = new THREE.Vector3(0, 1.6, 0);
    camera.position.copy(targetCamPos);

    clock = new THREE.Clock();

    // Event Bindings
    bind3DInteractions();
    bindHUDWidgetEvents();
    syncCareerDeskRoutineTasks();
    renderCalendar();
    renderTasks();
    updatePomoUI();

    // Start Animation Loop
    startAnimationLoop();
  }

  // --- ROSE GARDEN SANCTUARY GEOMETRY ---
  function createRoseGardenSanctuary() {
    // Distant Mountains
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x1b2e2b, roughness: 0.95 });
    for (let i = 0; i < 7; i++) {
      const height = 18 + Math.random() * 12;
      const radius = 16 + Math.random() * 10;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 7), mountMat);
      mountain.position.set(-50 + i * 16 + (Math.random() - 0.5) * 6, -2 + height / 2, -55 - Math.random() * 15);
      greenSanctuaryGroup.add(mountain);
    }

    // Terrain Base
    const terrainGeo = new THREE.PlaneGeometry(120, 120, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = Math.sin(x * 0.07) * Math.cos(z * 0.07) * 3 - 2;
      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x19431e, roughness: 0.9 });
    const terrain = new THREE.Mesh(terrainGeo, grassMat);
    terrain.position.set(0, -3.5, -30);
    terrain.receiveShadow = true;
    greenSanctuaryGroup.add(terrain);

    // Reflecting Lake Water
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0f383e, roughness: 0.1, metalness: 0.85 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(110, 35), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -3.2, -40);
    greenSanctuaryGroup.add(water);

    // ── Rich 3D Forest: Nordic Alpine Pines & Low-Poly Deciduous Oaks ───────────
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x24180d, roughness: 0.9, flatShading: true });
    const pineMats = [
      new THREE.MeshStandardMaterial({ color: 0x113b19, roughness: 0.8, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x174d22, roughness: 0.8, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x1f5f2b, roughness: 0.8, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x287536, roughness: 0.8, flatShading: true })
    ];
    const oakMats = [
      new THREE.MeshStandardMaterial({ color: 0x1b5e22, roughness: 0.85, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x23752c, roughness: 0.85, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x2e8b38, roughness: 0.85, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x164c1c, roughness: 0.85, flatShading: true })
    ];

    for (let i = 0; i < 55; i++) {
      const tree = new THREE.Group();
      const h = 0.95 + Math.random() * 0.85;
      const isPine = i % 3 !== 0; // ~67% pines, ~33% leafy broadleaf trees

      if (isPine) {
        // Alpine Pine: faceted trunk + 3-4 tiered cone canopy
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * h, 0.45 * h, 3.8 * h, 7), trunkMat);
        trunk.position.y = 1.9 * h;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);

        const tiers = 3 + Math.floor(Math.random() * 2);
        const folMat = pineMats[i % pineMats.length];
        for (let tier = 0; tier < tiers; tier++) {
          const coneRadius = (2.3 - tier * 0.42) * h;
          const coneHeight = (2.2 - tier * 0.2) * h;
          const cone = new THREE.Mesh(new THREE.ConeGeometry(coneRadius, coneHeight, 7), folMat);
          cone.position.y = (3.0 + tier * 1.25) * h;
          cone.rotation.y = Math.random() * Math.PI;
          cone.castShadow = true;
          cone.receiveShadow = true;
          tree.add(cone);
        }
      } else {
        // Deciduous Oak: trunk + organic cluster of faceted icosahedrons
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * h, 0.42 * h, 3.0 * h, 6), trunkMat);
        trunk.position.y = 1.5 * h;
        trunk.rotation.z = (Math.random() - 0.5) * 0.12;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);

        const folMat = oakMats[i % oakMats.length];
        const clusterOffsets = [
          [0, 3.2 * h, 0, 1.4 * h],
          [-0.7 * h, 2.7 * h, 0.2 * h, 1.05 * h],
          [0.7 * h, 2.8 * h, -0.2 * h, 1.1 * h],
          [-0.2 * h, 3.8 * h, 0.3 * h, 0.95 * h],
          [0.3 * h, 2.5 * h, 0.6 * h, 0.9 * h]
        ];
        clusterOffsets.forEach(([ox, oy, oz, rad]) => {
          const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), folMat);
          blob.position.set(ox, oy, oz);
          blob.castShadow = true;
          blob.receiveShadow = true;
          tree.add(blob);
        });
      }

      const posX = (Math.random() - 0.5) * 88;
      const posZ = -11 - Math.random() * 32;
      const groundY = -3.5 + Math.sin(posX * 0.07) * 2;
      tree.position.set(posX, groundY, posZ);
      greenSanctuaryGroup.add(tree);

      animatedTrees.push({
        mesh: tree,
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.4
      });
    }

    // Lush Rose Garden Bushes
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x164e23, roughness: 0.7 });
    const roseColors = [0xf43f5e, 0xf472b6, 0xfacc15, 0xf87171];

    for (let b = 0; b < 24; b++) {
      const roseBush = new THREE.Group();
      const bushBase = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.4, 8, 8), bushMat);
      bushBase.scale.set(1.4, 0.8, 1.2);
      roseBush.add(bushBase);

      const roseColor = roseColors[Math.floor(Math.random() * roseColors.length)];
      const rosePetalMat = new THREE.MeshStandardMaterial({ color: roseColor, roughness: 0.3 });
      for (let r = 0; r < 7; r++) {
        const rose = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), rosePetalMat);
        rose.position.set(
          (Math.random() - 0.5) * 1.4,
          0.3 + Math.random() * 0.4,
          (Math.random() - 0.5) * 1.2
        );
        roseBush.add(rose);
      }

      const bX = (Math.random() - 0.5) * 35;
      const bZ = -6.8 - Math.random() * 12;
      roseBush.position.set(bX, -2.5, bZ);
      greenSanctuaryGroup.add(roseBush);
    }

    // Animated 3D Butterflies — fluttering above the rose garden (Day only)
    const butterflyColors = [0xfbbf24, 0xf472b6, 0xa78bfa, 0x38bdf8, 0xfb923c];
    for (let bf = 0; bf < 6; bf++) {
      const butterfly = new THREE.Group();

      const wingMat = new THREE.MeshStandardMaterial({
        color: butterflyColors[bf % butterflyColors.length],
        roughness: 0.3,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const wingGeo = new THREE.CircleGeometry(0.15, 7);
      wingGeo.scale(0.85, 1.4, 1);

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.x = -0.11;
      butterfly.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
      rightWing.position.x = 0.11;
      butterfly.add(rightWing);

      // Fluttering over rose garden bushes outside balcony glass
      butterfly.position.set(
        (Math.random() - 0.5) * 16,
        -1.0 + Math.random() * 1.6,
        -6.5 - Math.random() * 4.5
      );
      greenSanctuaryGroup.add(butterfly);

      butterflies.push({
        group: butterfly,
        leftWing,
        rightWing,
        basePos: butterfly.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 2.2 + Math.random() * 1.5
      });
    }

    // Animated Fireflies (night insects — visible only at dusk / night)
    for (let ff = 0; ff < 28; ff++) {
      const ffMat = new THREE.MeshBasicMaterial({
        color: ff % 3 === 0 ? 0xfacc15 : 0xa3e635,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ffMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), ffMat);
      // Scatter along garden near / mid distance
      ffMesh.position.set(
        (Math.random() - 0.5) * 18,
        -2.5 + Math.random() * 3.5,
        -5.0 - Math.random() * 14
      );
      greenSanctuaryGroup.add(ffMesh);
      fireflies.push({
        mesh: ffMesh,
        basePos: ffMesh.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        driftX: (Math.random() - 0.5) * 0.9,
        driftZ: (Math.random() - 0.5) * 0.5
      });
    }
  }

  // --- PROCEDURAL TEXTURES & PURE 3D MESH HELPERS ---

  function createWoodDeskTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Warm natural walnut base tone
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#382215');
    grad.addColorStop(0.25, '#4a2c1a');
    grad.addColorStop(0.5, '#3b2316');
    grad.addColorStop(0.75, '#4c2e1c');
    grad.addColorStop(1, '#362013');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Fine wood grain fibers
    ctx.fillStyle = 'rgba(22, 12, 6, 0.12)';
    for (let i = 0; i < 350; i++) {
      const y = Math.random() * 512;
      const h = 0.5 + Math.random() * 2.2;
      ctx.fillRect(0, y, 1024, h);
    }

    // Natural undulating wood rings & pores
    for (let line = 0; line < 48; line++) {
      ctx.strokeStyle = line % 2 === 0 ? 'rgba(74, 42, 22, 0.32)' : 'rgba(18, 9, 4, 0.28)';
      ctx.lineWidth = 1 + Math.random() * 2.2;
      ctx.beginPath();
      const baseY = (line / 48) * 512;
      const freq = 0.005 + Math.random() * 0.007;
      const amp = 6 + Math.random() * 12;
      ctx.moveTo(0, baseY + Math.sin(0) * amp);
      for (let x = 0; x <= 1024; x += 16) {
        const y = baseY + Math.sin(x * freq) * amp + Math.cos(x * freq * 0.6) * 3;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Subtle natural wood knot
    const knotX = 760;
    const knotY = 260;
    for (let r = 6; r < 36; r += 5) {
      ctx.strokeStyle = 'rgba(20, 10, 4, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, r * 1.7, r, 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    tex.anisotropy = 4;
    return tex;
  }

  function createLatteArtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Rich dark espresso crema base
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, '#582f14');
    grad.addColorStop(0.7, '#381e0d');
    grad.addColorStop(1, '#241307');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Cream foam concentric ring
    ctx.strokeStyle = 'rgba(235, 218, 190, 0.65)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 92, 0, Math.PI * 2);
    ctx.stroke();

    // Delicate latte art heart / leaf rosette
    ctx.fillStyle = 'rgba(248, 238, 222, 0.88)';
    const leaves = [
      { x: 128, y: 168, rx: 14, ry: 9 },
      { x: 128, y: 144, rx: 20, ry: 13 },
      { x: 128, y: 118, rx: 25, ry: 16 },
      { x: 128, y: 92,  rx: 28, ry: 18 },
      { x: 128, y: 68,  rx: 22, ry: 15 }
    ];
    leaves.forEach(l => {
      ctx.beginPath();
      ctx.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stem line through center
    ctx.strokeStyle = '#582f14';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(128, 55);
    ctx.lineTo(128, 190);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }

  function createNotebookPageTexture(isLeft) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Ivory Paper
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 512, 720);

    // Subtle paper grain shading
    ctx.fillStyle = 'rgba(15, 23, 42, 0.02)';
    for (let i = 0; i < 120; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 720, 2, 2);
    }

    // Subtle ruled horizontal lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.8;
    for (let y = 84; y < 680; y += 32) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(477, y);
      ctx.stroke();
    }

    // Red Study Margin Line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
    ctx.lineWidth = 2.2;
    const marginX = isLeft ? 105 : 65;
    ctx.beginPath();
    ctx.moveTo(marginX, 35);
    ctx.lineTo(marginX, 690);
    ctx.stroke();

    // Study notes & checkboxes
    if (isLeft) {
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('TODAY\'S STUDY TARGETS', 120, 74);

      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('☑ BCS Bangla Literature (Modern Age)', 120, 114);
      ctx.fillText('☐ English Vocabulary & Grammar Set', 120, 146);
      ctx.fillText('☑ Mathematical Logic & Series Puzzles', 120, 178);
      ctx.fillText('☐ Bangladesh Affairs: Liberation War', 120, 210);
      ctx.fillText('☐ International Organizations & Treaties', 120, 242);
      ctx.fillText('☑ Daily Goal: 240m Deep Work', 120, 274);
    } else {
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('KEY REVISION POINTS', 85, 74);

      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('• 7th March Speech: Historical Value', 85, 114);
      ctx.fillText('• River Systems: Confluence & Origins', 85, 146);
      ctx.fillText('• Subject-Verb Agreement Rules', 85, 178);
      ctx.fillText('• Quadratic equations fast shortcuts', 85, 210);
      ctx.fillText('• Mistakes Bank: Review 15 missed MCQs', 85, 242);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }

  function createBookCoverTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Deep Navy Leather Cloth
    ctx.fillStyle = '#172554';
    ctx.fillRect(0, 0, 512, 700);

    // Gold Foil Double Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 456, 644);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, 440, 628);

    // Gold Foil Crest
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 195, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = '36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 256, 208);

    // Title
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 25px "Times New Roman", serif';
    ctx.fillText('BANGLADESH CIVIL SERVICE', 256, 305);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 21px system-ui, sans-serif';
    ctx.fillText('PRELIMINARY COMPREHENSIVE', 256, 345);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('STUDY DIGEST & QUESTION BANK', 256, 385);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('CAREERDESK EDITION • 2026', 256, 590);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }

  // --- 1. SLEEK ULTRABOOK LAPTOP WITH BACKLIT KEYBOARD ---
  function createLaptopMesh() {
    const laptopGroup = new THREE.Group();
    laptopGroup.name = 'deskLaptop';

    const aluMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.22,
      metalness: 0.88
    });

    const keyboardMat = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.5,
      metalness: 0.2
    });

    const keyCapMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3
    });

    const trackpadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.15,
      metalness: 0.45
    });

    // Base Unibody Wedge Chassis
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.045, 1.45), aluMat);
    base.position.y = 0.0225;
    base.castShadow = true;
    base.receiveShadow = true;
    laptopGroup.add(base);

    // Keyboard Well
    const kbWell = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.006, 0.74), keyboardMat);
    kbWell.position.set(0, 0.046, -0.2);
    laptopGroup.add(kbWell);

    // Tactile Keycaps Grid (6 rows of discrete 3D keys)
    const keyRows = 5;
    const keyCols = 13;
    const kw = 0.12;
    const kh = 0.10;
    const gapX = 0.018;
    const gapZ = 0.022;
    const startX = -((keyCols - 1) * (kw + gapX)) / 2;
    const startZ = -0.2 - ((keyRows - 1) * (kh + gapZ)) / 2;

    for (let r = 0; r < keyRows; r++) {
      for (let c = 0; c < keyCols; c++) {
        // Skip spacebar area for single wide bar
        if (r === keyRows - 1 && (c >= 4 && c <= 8)) continue;
        const key = new THREE.Mesh(new THREE.BoxGeometry(kw, 0.012, kh), keyCapMat);
        key.position.set(startX + c * (kw + gapX), 0.052, startZ + r * (kh + gapZ));
        laptopGroup.add(key);
      }
    }
    // Spacebar
    const spacebar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.012, kh), keyCapMat);
    spacebar.position.set(0, 0.052, startZ + (keyRows - 1) * (kh + gapZ));
    laptopGroup.add(spacebar);

    // Trackpad with subtle border bevel
    const trackpad = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.006, 0.46), trackpadMat);
    trackpad.position.set(0, 0.046, 0.42);
    laptopGroup.add(trackpad);

    // Open Display Lid (106 degrees open)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.04, -0.72);
    lidGroup.rotation.x = -0.26;

    const lidBack = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 0.035), aluMat);
    lidBack.position.y = 0.7;
    lidBack.castShadow = true;
    lidGroup.add(lidBack);

    // Glowing CareerDesk / Apple emblem on back of lid
    const logoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const logoMesh = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), logoMat);
    logoMesh.position.set(0, 0.7, -0.019);
    logoMesh.rotation.y = Math.PI;
    lidGroup.add(logoMesh);

    // Bezel
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 1.35, 0.005),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.1 })
    );
    bezel.position.set(0, 0.7, 0.02);
    lidGroup.add(bezel);

    // HD Webcam indicator dot
    const camDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.01, 12),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    camDot.position.set(0, 1.34, 0.024);
    lidGroup.add(camDot);

    // CareerDesk Live Workspace Screen Texture
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 512;
    sCanvas.height = 320;
    const sCtx = sCanvas.getContext('2d');

    if (sCtx) {
      sCtx.fillStyle = '#0b0f19';
      sCtx.fillRect(0, 0, 512, 320);

      // Top bar
      sCtx.fillStyle = '#1e1b4b';
      sCtx.fillRect(0, 0, 512, 36);
      sCtx.fillStyle = '#38bdf8';
      sCtx.font = 'bold 15px system-ui, sans-serif';
      sCtx.fillText('CareerDesk Workspace', 16, 24);
      sCtx.fillStyle = '#10b981';
      sCtx.fillText('● Sync Active', 408, 24);

      // Card 1: Today's Routine
      sCtx.fillStyle = '#131b2e';
      sCtx.fillRect(16, 48, 230, 256);
      sCtx.strokeStyle = '#1e293b';
      sCtx.lineWidth = 1;
      sCtx.strokeRect(16, 48, 230, 256);

      sCtx.fillStyle = '#e2e8f0';
      sCtx.font = 'bold 14px system-ui, sans-serif';
      sCtx.fillText('Today\'s Routine', 28, 72);

      sCtx.fillStyle = '#94a3b8';
      sCtx.font = '12px system-ui, sans-serif';
      sCtx.fillText('• 09:00 - Bangla Literature', 28, 102);
      sCtx.fillText('• 11:30 - English Grammar', 28, 128);
      sCtx.fillText('• 14:00 - Math & Logic Test', 28, 154);
      sCtx.fillText('• 16:30 - General Knowledge', 28, 180);
      sCtx.fillText('• 19:00 - Mistake Review (MCQ)', 28, 206);

      // Card 2: Study Analytics & Goal
      sCtx.fillStyle = '#131b2e';
      sCtx.fillRect(262, 48, 234, 256);
      sCtx.strokeRect(262, 48, 234, 256);

      sCtx.fillStyle = '#e2e8f0';
      sCtx.font = 'bold 14px system-ui, sans-serif';
      sCtx.fillText('Study Analytics', 276, 72);

      // Arc ring
      sCtx.strokeStyle = '#312e81';
      sCtx.lineWidth = 12;
      sCtx.beginPath();
      sCtx.arc(379, 160, 48, 0, Math.PI * 2);
      sCtx.stroke();

      sCtx.strokeStyle = '#6366f1';
      sCtx.beginPath();
      sCtx.arc(379, 160, 48, -Math.PI / 2, Math.PI * 0.8);
      sCtx.stroke();

      sCtx.fillStyle = '#67e8f9';
      sCtx.font = 'bold 22px monospace';
      sCtx.textAlign = 'center';
      sCtx.fillText('75%', 379, 166);
      sCtx.textAlign = 'left';

      sCtx.fillStyle = '#34d399';
      sCtx.font = '12px system-ui, sans-serif';
      sCtx.fillText('180 / 240 mins completed', 300, 240);
    }

    const sTex = new THREE.CanvasTexture(sCanvas);
    sTex.anisotropy = 4;

    const displayScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.98, 1.28),
      new THREE.MeshBasicMaterial({ map: sTex })
    );
    displayScreen.position.set(0, 0.7, 0.024);
    lidGroup.add(displayScreen);

    laptopGroup.add(lidGroup);
    return laptopGroup;
  }

  // --- 2. PURE 3D POTTED JADE SUCCULENT PLANT ---
  function createPottedSucculentPlant() {
    const plantGroup = new THREE.Group();
    plantGroup.name = 'deskPlant';

    // Terracotta Ceramic Pot
    const potMat = new THREE.MeshStandardMaterial({
      color: 0xc86438,
      roughness: 0.65,
      metalness: 0.05
    });
    const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.30, 0.62, 28), potMat);
    potBody.castShadow = true;
    potBody.receiveShadow = true;
    plantGroup.add(potBody);

    // Raised Terracotta Lip Rim
    const potLip = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.44, 0.12, 28), potMat);
    potLip.position.y = 0.31;
    potLip.castShadow = true;
    plantGroup.add(potLip);

    // Dark Organic Potting Soil
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.95
    });
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.03, 28), soilMat);
    soil.position.y = 0.33;
    plantGroup.add(soil);

    // Smooth Decorative River Pebbles on Soil
    const pebbleMats = [
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
    ];
    for (let p = 0; p < 7; p++) {
      const angle = (p / 7) * Math.PI * 2;
      const dist = 0.22 + (p % 2) * 0.10;
      const pebble = new THREE.Mesh(
        new THREE.SphereGeometry(0.045 + (p % 3) * 0.015, 8, 8),
        pebbleMats[p % pebbleMats.length]
      );
      pebble.scale.set(1.4, 0.6, 1.0);
      pebble.position.set(Math.cos(angle) * dist, 0.35, Math.sin(angle) * dist);
      pebble.rotation.y = p;
      plantGroup.add(pebble);
    }

    // Fleshy 3D Jade Succulent Rosette
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x228b48,
      roughness: 0.28,
      metalness: 0.08
    });
    const innerLeafMat = new THREE.MeshStandardMaterial({
      color: 0x3cb371,
      roughness: 0.24,
      metalness: 0.05
    });

    // Tier 1: Outer wide leaves (8 leaves)
    const t1Count = 8;
    for (let i = 0; i < t1Count; i++) {
      const ang = (i / t1Count) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), leafMat);
      leaf.scale.set(1.9, 0.48, 0.95);
      leaf.position.set(Math.cos(ang) * 0.25, 0.38, Math.sin(ang) * 0.25);
      leaf.rotation.y = -ang + Math.PI / 2;
      leaf.rotation.z = -0.32;
      leaf.castShadow = true;
      plantGroup.add(leaf);
    }

    // Tier 2: Mid leaves (6 leaves, slightly elevated)
    const t2Count = 6;
    for (let i = 0; i < t2Count; i++) {
      const ang = (i / t2Count) * Math.PI * 2 + 0.3;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), innerLeafMat);
      leaf.scale.set(1.7, 0.46, 0.88);
      leaf.position.set(Math.cos(ang) * 0.17, 0.45, Math.sin(ang) * 0.17);
      leaf.rotation.y = -ang + Math.PI / 2;
      leaf.rotation.z = -0.42;
      leaf.castShadow = true;
      plantGroup.add(leaf);
    }

    // Tier 3: Center tight bud (4 leaves + center tip)
    const t3Count = 4;
    for (let i = 0; i < t3Count; i++) {
      const ang = (i / t3Count) * Math.PI * 2 + 0.6;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), innerLeafMat);
      leaf.scale.set(1.4, 0.44, 0.8);
      leaf.position.set(Math.cos(ang) * 0.08, 0.52, Math.sin(ang) * 0.08);
      leaf.rotation.y = -ang + Math.PI / 2;
      leaf.rotation.z = -0.65;
      plantGroup.add(leaf);
    }

    // Center emerging sprout
    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x48bb78, roughness: 0.2 })
    );
    bud.position.set(0, 0.57, 0);
    plantGroup.add(bud);

    return plantGroup;
  }

  // --- 3. PURE 3D WIREFRAME READING GLASSES ---
  function createReadingGlassesMesh() {
    const glassesGroup = new THREE.Group();
    glassesGroup.name = 'readingGlasses';

    const goldWireMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.95
    });

    const glassLensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      transmission: 0.92,
      reflectivity: 0.8
    });

    // Left Rim & Lens
    const rimRadius = 0.16;
    const rimTube = 0.016;
    const rimL = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, rimTube, 16, 32), goldWireMat);
    rimL.position.set(-0.24, 0, 0);
    rimL.castShadow = true;
    glassesGroup.add(rimL);

    const lensL = new THREE.Mesh(new THREE.CircleGeometry(rimRadius - 0.005, 24), glassLensMat);
    lensL.position.set(-0.24, 0, 0);
    glassesGroup.add(lensL);

    // Right Rim & Lens
    const rimR = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, rimTube, 16, 32), goldWireMat);
    rimR.position.set(0.24, 0, 0);
    rimR.castShadow = true;
    glassesGroup.add(rimR);

    const lensR = new THREE.Mesh(new THREE.CircleGeometry(rimRadius - 0.005, 24), glassLensMat);
    lensR.position.set(0.24, 0, 0);
    glassesGroup.add(lensR);

    // Arched Nose Bridge
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 12), goldWireMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.04, 0);
    glassesGroup.add(bridge);

    // Left & Right Temples (Folded along desk)
    const templeLen = 0.72;
    const templeL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, templeLen, 12), goldWireMat);
    templeL.position.set(-0.41, -0.01, -0.34);
    templeL.rotation.x = Math.PI / 2;
    templeL.rotation.y = 0.12;
    glassesGroup.add(templeL);

    const templeR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, templeLen, 12), goldWireMat);
    templeR.position.set(0.41, -0.01, -0.34);
    templeR.rotation.x = Math.PI / 2;
    templeR.rotation.y = -0.12;
    glassesGroup.add(templeR);

    // Tortoiseshell Earpieces (Curved tips)
    const earMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.35 });
    const earTipL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.16, 12), earMat);
    earTipL.position.set(-0.37, -0.06, -0.68);
    earTipL.rotation.x = Math.PI / 3;
    glassesGroup.add(earTipL);

    const earTipR = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.16, 12), earMat);
    earTipR.position.set(0.37, -0.06, -0.68);
    earTipR.rotation.x = Math.PI / 3;
    glassesGroup.add(earTipR);

    // Lay flat on desk
    glassesGroup.rotation.x = -Math.PI / 2;
    return glassesGroup;
  }

  // --- 4. STATIONERY PEN CUP WITH MULTIPLE STUDY INSTRUMENTS ---
  function createStationeryPenCup() {
    const cupGroup = new THREE.Group();
    cupGroup.name = 'penCup';

    const brassCupMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.28,
      metalness: 0.92
    });

    // Fluted Brass Cup Body
    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.85, 24, 1, true), brassCupMat);
    cupBody.position.y = 0.425;
    cupBody.castShadow = true;
    cupGroup.add(cupBody);

    // Heavy Weighted Base
    const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.32, 0.06, 24), brassCupMat);
    cupBase.position.y = 0.03;
    cupGroup.add(cupBase);

    // Decorative Beveled Rim
    const cupRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.022, 16, 24), brassCupMat);
    cupRim.position.y = 0.85;
    cupRim.rotation.x = Math.PI / 2;
    cupGroup.add(cupRim);

    // Inside bottom plug
    const insideBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.02, 20),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 })
    );
    insideBottom.position.y = 0.08;
    cupGroup.add(insideBottom);

    // Instrument 1: Classic Fountain Pen (Midnight Blue + Gold)
    const fountainPen = new THREE.Group();
    const fpBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 1.1, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.25, metalness: 0.5 })
    );
    fpBody.castShadow = true;
    fountainPen.add(fpBody);

    const fpClip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.35, 0.03), brassCupMat);
    fpClip.position.set(0, 0.28, 0.035);
    fountainPen.add(fpClip);

    const fpNib = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.12, 14), brassCupMat);
    fpNib.position.y = 0.60;
    fountainPen.add(fpNib);

    fountainPen.position.set(-0.08, 0.62, 0.04);
    fountainPen.rotation.z = -0.16;
    fountainPen.rotation.x = 0.12;
    cupGroup.add(fountainPen);

    // Instrument 2: Sharpened Wooden HB Pencil
    const pencil1 = new THREE.Group();
    const p1Body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 1.15, 6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 })
    );
    pencil1.add(p1Body);

    const p1Ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.08, 12), brassCupMat);
    p1Ferrule.position.y = -0.56;
    pencil1.add(p1Ferrule);

    const p1Eraser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 })
    );
    p1Eraser.position.y = -0.63;
    pencil1.add(p1Eraser);

    const p1WoodCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.024, 0.10, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 })
    );
    p1WoodCone.position.y = 0.62;
    pencil1.add(p1WoodCone);

    const p1Lead = new THREE.Mesh(
      new THREE.ConeGeometry(0.009, 0.035, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    p1Lead.position.y = 0.67;
    pencil1.add(p1Lead);

    pencil1.position.set(0.08, 0.68, -0.06);
    pencil1.rotation.z = 0.22;
    pencil1.rotation.x = -0.15;
    cupGroup.add(pencil1);

    // Instrument 3: Neon Pastel Highlighter
    const highlighter = new THREE.Group();
    const hlBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.95, 14),
      new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.35 })
    );
    highlighter.add(hlBody);

    const hlCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.26, 14),
      new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.3 })
    );
    hlCap.position.y = 0.40;
    highlighter.add(hlCap);

    highlighter.position.set(0.12, 0.56, 0.08);
    highlighter.rotation.z = 0.18;
    highlighter.rotation.x = 0.14;
    cupGroup.add(highlighter);

    // Instrument 4: Wooden Study Ruler (15cm)
    const ruler = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.25, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 })
    );
    ruler.position.set(-0.06, 0.70, -0.08);
    ruler.rotation.z = -0.12;
    ruler.rotation.y = 0.25;
    cupGroup.add(ruler);

    return cupGroup;
  }

  // --- 5. STICKY NOTES PAD WITH CURLED TOP SHEET ---
  function createStickyNotePad() {
    const padGroup = new THREE.Group();
    padGroup.name = 'stickyNotes';

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.75
    });

    // Pad Stack Block
    const padBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.05, 0.68), yellowMat);
    padBase.position.y = 0.025;
    padBase.castShadow = true;
    padBase.receiveShadow = true;
    padGroup.add(padBase);

    // Top Sheet with Handwritten Study Formula Note
    const noteCanvas = document.createElement('canvas');
    noteCanvas.width = 256;
    noteCanvas.height = 256;
    const nCtx = noteCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#fef9c3';
      nCtx.fillRect(0, 0, 256, 256);

      nCtx.fillStyle = '#1e3a8a';
      nCtx.font = 'bold 22px system-ui, sans-serif';
      nCtx.fillText('Daily Goal: 240m', 24, 52);

      nCtx.font = '18px system-ui, sans-serif';
      nCtx.fillStyle = '#0f172a';
      nCtx.fillText('★ 75% Target Done', 24, 95);
      nCtx.fillText('• 15 Missed MCQs', 24, 135);
      nCtx.fillText('• Deep Focus Only', 24, 175);

      nCtx.fillStyle = '#dc2626';
      nCtx.font = 'bold 20px system-ui, sans-serif';
      nCtx.fillText('Keep Pushing! ✓', 24, 222);
    }

    const noteTex = new THREE.CanvasTexture(noteCanvas);
    const topSheetMat = new THREE.MeshStandardMaterial({ map: noteTex, roughness: 0.65 });
    const topSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), topSheetMat);
    topSheet.rotation.x = -Math.PI / 2;
    topSheet.position.set(0, 0.052, 0);
    // Slight organic curl at bottom edge
    topSheet.rotation.z = 0.06;
    padGroup.add(topSheet);

    return padGroup;
  }

  // --- 6. CERAMIC COFFEE MUG WITH SAUCER & LATTE ART ---
  function createCoffeeMugAndSaucer() {
    const mugGroup = new THREE.Group();
    mugGroup.name = 'coffeeMug';

    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.12,
      metalness: 0.05
    });

    // Shallow Concave Porcelain Saucer Plate
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.46, 0.055, 32), ceramicMat);
    saucer.position.y = 0.0275;
    saucer.castShadow = true;
    saucer.receiveShadow = true;
    mugGroup.add(saucer);

    const saucerLip = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.022, 16, 32), ceramicMat);
    saucerLip.position.y = 0.055;
    saucerLip.rotation.x = Math.PI / 2;
    mugGroup.add(saucerLip);

    // Mug Body (Slightly tapered cylinder with smooth beveled rim)
    const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.26, 0.64, 32), ceramicMat);
    mugBody.position.y = 0.37;
    mugBody.castShadow = true;
    mugBody.receiveShadow = true;
    mugGroup.add(mugBody);

    const mugRim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.016, 16, 32), ceramicMat);
    mugRim.position.y = 0.69;
    mugRim.rotation.x = Math.PI / 2;
    mugGroup.add(mugRim);

    // Ergonomic 3D Curved Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.042, 16, 24, Math.PI * 1.05), ceramicMat);
    handle.position.set(-0.31, 0.36, 0);
    handle.rotation.z = Math.PI / 2;
    handle.rotation.y = Math.PI / 2;
    mugGroup.add(handle);

    // Hot Coffee Liquid with Latte Art Crema
    const latteArtTex = createLatteArtTexture();
    const coffeeMat = new THREE.MeshStandardMaterial({
      map: latteArtTex,
      roughness: 0.18,
      metalness: 0.15
    });
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 32), coffeeMat);
    coffee.position.set(0, 0.64, 0);
    mugGroup.add(coffee);

    return mugGroup;
  }

  // --- MAIN PATIO AND 3D STUDY DESK OBJECTS ---
  function createPatioAndDeskObjects() {
    // Patio Floor
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x17120e, roughness: 0.5 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 14), deckMat);
    floor.position.set(0, -2.2, -1);
    floor.receiveShadow = true;
    patioGroup.add(floor);

    // Frame Pillars
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.8 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 0.5), frameMat);
    pillarL.position.set(-9.5, 3.5, -6);
    patioGroup.add(pillarL);

    const pillarR = pillarL.clone();
    pillarR.position.set(9.5, 3.5, -6);
    patioGroup.add(pillarR);

    // Glass Balcony Railing with Midnight Aluminum Handrail
    const railMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.85 });
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.14, 0.25), railMat);
    handrail.position.set(0, 0.6, -5.9);
    patioGroup.add(handrail);

    const glassBalconyMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      transmission: 0.88
    });
    const balconyGlass = new THREE.Mesh(new THREE.PlaneGeometry(18.5, 3.2), glassBalconyMat);
    balconyGlass.position.set(0, -0.9, -5.9);
    balconyGlass.name = 'glassPatioWindow';
    patioGroup.add(balconyGlass);

    // --- 1. NATURAL WOOD STUDY TABLE TOP & DRAWERS ---
    const woodTexture = createWoodDeskTexture();
    const tableTopMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.38,
      metalness: 0.04
    });

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(11, 0.36, 4.8), tableTopMat);
    tableTop.position.set(0, 0, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    deskGroup.add(tableTop);

    // Beveled Edge Perimeter Trim (Catches ambient light highlights)
    const bevelTrimMat = new THREE.MeshStandardMaterial({ color: 0x2e190e, roughness: 0.4 });
    const bevelFront = new THREE.Mesh(new THREE.BoxGeometry(11.02, 0.05, 0.06), bevelTrimMat);
    bevelFront.position.set(0, 0.18, 2.4);
    deskGroup.add(bevelFront);

    // Under-Desk Dual Drawer Unit (Right Side)
    const drawerMat = new THREE.MeshStandardMaterial({ color: 0x2a170d, roughness: 0.45 });
    const drawerCasing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.25, 3.8), drawerMat);
    drawerCasing.position.set(3.8, -0.72, 0.1);
    drawerCasing.castShadow = true;
    drawerCasing.receiveShadow = true;
    deskGroup.add(drawerCasing);

    // Brass Drawer Pull Handles
    const brassHandleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.95 });
    for (let d = 0; d < 2; d++) {
      const handleY = -0.45 - d * 0.55;
      const dHandle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 12, 20, Math.PI), brassHandleMat);
      dHandle.position.set(3.8, handleY, 2.02);
      dHandle.rotation.x = Math.PI / 2;
      deskGroup.add(dHandle);
    }

    // Desk Legs (Matte Midnight Metal with Brass Foot Caps)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.85 });
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.1, 4.2), legMat);
    leg1.position.set(-4.8, -1.15, 0);
    leg1.castShadow = true;
    deskGroup.add(leg1);

    const leg2 = leg1.clone();
    leg2.position.set(4.8, -1.15, 0);
    deskGroup.add(leg2);

    // Luxury Leather Desk Mat / Blotter
    const padMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.60, metalness: 0.1 });
    const deskPad = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.02, 3.2), padMat);
    deskPad.position.set(0.1, 0.19, 0.5);
    deskPad.receiveShadow = true;
    deskGroup.add(deskPad);

    const stitchMat = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const stitchBorder = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.022, 3.0), stitchMat);
    stitchBorder.position.set(0.1, 0.19, 0.5);
    deskGroup.add(stitchBorder);

    const padInner = new THREE.Mesh(new THREE.BoxGeometry(7.34, 0.024, 2.94), padMat);
    padInner.position.set(0.1, 0.19, 0.5);
    deskGroup.add(padInner);

    // --- 2. THREE STACKED STUDY BOOKS WITH 3D CURVED SPINES ---
    const pagesTextureMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.85 });

    // Book 1 (Bottom: Rich Burgundy Textured Leather)
    const b1Group = new THREE.Group();
    const b1CoverMat = new THREE.MeshStandardMaterial({ color: 0x4a1118, roughness: 0.45 });
    const b1Pages = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.20, 2.06), pagesTextureMat);
    b1Group.add(b1Pages);
    const b1Spine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.12, 16, 1, false, 0, Math.PI), b1CoverMat);
    b1Spine.position.set(-0.74, 0, 0);
    b1Spine.rotation.z = Math.PI / 2;
    b1Group.add(b1Spine);
    b1Group.position.set(-3.2, 0.29, 1.3);
    b1Group.rotation.y = 0.12;
    deskGroup.add(b1Group);

    // Book 2 (Middle: Forest Green Buckram Hardcover)
    const b2Group = new THREE.Group();
    const b2CoverMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.55 });
    const b2Pages = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.18, 2.04), pagesTextureMat);
    b2Group.add(b2Pages);
    const b2Spine = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 2.08, 16, 1, false, 0, Math.PI), b2CoverMat);
    b2Spine.position.set(-0.72, 0, 0);
    b2Spine.rotation.z = Math.PI / 2;
    b2Group.add(b2Spine);
    b2Group.position.set(-3.22, 0.48, 1.32);
    b2Group.rotation.y = -0.05;
    deskGroup.add(b2Group);

    // Book 3 (Top: Midnight Navy BCS Digest with Gold Foil Cover)
    const b3Group = new THREE.Group();
    const bookCoverTexture = createBookCoverTexture();
    const b3Mat = new THREE.MeshStandardMaterial({
      map: bookCoverTexture,
      roughness: 0.42,
      metalness: 0.1
    });
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.18, 2.04), b3Mat);
    b3.castShadow = true;
    b3Group.add(b3);
    b3Group.position.set(-3.21, 0.66, 1.31);
    b3Group.rotation.y = 0.08;
    deskGroup.add(b3Group);

    // Red Silk Bookmark Ribbon Spilling from Top Book
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.28 });
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.46), ribbonMat);
    ribbon.position.set(-3.18, 0.76, 2.40);
    ribbon.rotation.x = 0.22;
    deskGroup.add(ribbon);

    // --- 3. SLEEK ULTRABOOK WORKSPACE LAPTOP ---
    const laptop = createLaptopMesh();
    laptop.position.set(-1.4, 0.20, 0.45);
    laptop.rotation.y = 0.12;
    deskGroup.add(laptop);

    // --- 4. CURVED OPEN STUDY NOTEBOOK WITH GRAPHITE PENCIL ---
    notebookMesh = new THREE.Group();
    notebookMesh.name = 'openNotebook';

    const nbCoverMat = new THREE.MeshStandardMaterial({ color: 0x3b1261, roughness: 0.4 });
    const nbPageTexL = createNotebookPageTexture(true);
    const nbPageTexR = createNotebookPageTexture(false);
    const nbPageMatL = new THREE.MeshStandardMaterial({ map: nbPageTexL, roughness: 0.85 });
    const nbPageMatR = new THREE.MeshStandardMaterial({ map: nbPageTexR, roughness: 0.85 });
    const spiralMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });

    // Curved Pages (Gently arching up from outer edge to center spiral)
    const nbLeft = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 1.72), nbCoverMat);
    nbLeft.position.set(-0.62, 0.2, 0);
    nbLeft.rotation.z = 0.03;
    notebookMesh.add(nbLeft);

    const nbRight = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 1.72), nbCoverMat);
    nbRight.position.set(0.62, 0.2, 0);
    nbRight.rotation.z = -0.03;
    notebookMesh.add(nbRight);

    const nbPagesL = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 1.66), nbPageMatL);
    nbPagesL.position.set(-0.6, 0.24, 0);
    nbPagesL.rotation.z = 0.03;
    notebookMesh.add(nbPagesL);

    const nbPagesR = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 1.66), nbPageMatR);
    nbPagesR.position.set(0.6, 0.24, 0);
    nbPagesR.rotation.z = -0.03;
    notebookMesh.add(nbPagesR);

    // Gold Metal Spiral Rings
    for (let sp = -0.74; sp <= 0.74; sp += 0.14) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 12, 16), spiralMat);
      ring.position.set(0, 0.28, sp);
      ring.rotation.y = Math.PI / 2;
      notebookMesh.add(ring);
    }

    // Wooden Graphite Pencil Resting in Notebook Gutter
    const gutterPencil = new THREE.Group();
    const gpBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.95, 6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 })
    );
    gpBody.rotation.x = Math.PI / 2;
    gutterPencil.add(gpBody);

    const gpFerrule = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 12), spiralMat);
    gpFerrule.position.z = -0.48;
    gpFerrule.rotation.x = Math.PI / 2;
    gutterPencil.add(gpFerrule);

    const gpEraser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.021, 0.021, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 })
    );
    gpEraser.position.z = -0.54;
    gpEraser.rotation.x = Math.PI / 2;
    gutterPencil.add(gpEraser);

    const gpTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.020, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.45 })
    );
    gpTip.position.z = 0.51;
    gpTip.rotation.x = -Math.PI / 2;
    gutterPencil.add(gpTip);

    gutterPencil.position.set(-0.06, 0.29, 0.05);
    notebookMesh.add(gutterPencil);

    notebookMesh.position.set(1.4, 0.0, 0.55);
    notebookMesh.rotation.y = -0.12;
    deskGroup.add(notebookMesh);
    mainBookMeshGroup = notebookMesh;

    // --- 5. WIREFRAME READING GLASSES ---
    const glasses = createReadingGlassesMesh();
    glasses.position.set(0.18, 0.21, 1.72);
    glasses.rotation.z = -0.18;
    deskGroup.add(glasses);

    // --- 6. YELLOW STICKY NOTE PAD ---
    const stickyNotes = createStickyNotePad();
    stickyNotes.position.set(-0.48, 0.20, 1.68);
    stickyNotes.rotation.y = 0.15;
    deskGroup.add(stickyNotes);

    // --- 7. POTTED JADE SUCCULENT PLANT ---
    const succulentPlant = createPottedSucculentPlant();
    succulentPlant.position.set(3.9, 0.20, 0.82);
    deskGroup.add(succulentPlant);

    // --- 8. STATIONERY BRASS PEN CUP ---
    const penCup = createStationeryPenCup();
    penCup.position.set(2.65, 0.20, -0.65);
    deskGroup.add(penCup);

    // --- 9. DIGITAL DESK OLED CLOCK / STUDY TABLET ---
    const clockBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 });
    const clockFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.82, 0.45), clockBodyMat);
    clockFrame.position.set(-3.6, 0.55, -0.6);
    clockFrame.rotation.y = 0.35;
    clockFrame.castShadow = true;
    clockFrame.name = 'digitalClock';
    deskGroup.add(clockFrame);

    const clockFoot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.3), clockBodyMat);
    clockFoot.position.set(-3.6, 0.16, -0.55);
    clockFoot.rotation.y = 0.35;
    deskGroup.add(clockFoot);

    // Dynamic OLED Canvas Display
    const clockCanvas = document.createElement('canvas');
    clockCanvas.width = 512;
    clockCanvas.height = 320;
    const clockCtx = clockCanvas.getContext('2d');
    const clockTexture = new THREE.CanvasTexture(clockCanvas);

    updateClockTexture = function () {
      if (!clockCtx) return;
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
      const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(now);

      clockCtx.fillStyle = '#060d17';
      clockCtx.fillRect(0, 0, 512, 320);

      // Cyan neon border
      clockCtx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      clockCtx.lineWidth = 6;
      clockCtx.strokeRect(4, 4, 504, 312);

      // Status header
      clockCtx.fillStyle = '#38bdf8';
      clockCtx.font = 'bold 22px system-ui, sans-serif';
      clockCtx.fillText('CAREERDESK FOCUS', 36, 48);

      clockCtx.fillStyle = '#10b981';
      clockCtx.font = 'bold 18px system-ui, sans-serif';
      clockCtx.fillText('● LIVE', 410, 48);

      // Glowing Large Time
      clockCtx.fillStyle = '#f8fafc';
      clockCtx.font = 'bold 112px monospace';
      clockCtx.fillText(timeStr, 85, 175);

      // Date
      clockCtx.fillStyle = '#94a3b8';
      clockCtx.font = '600 30px system-ui, sans-serif';
      clockCtx.fillText(dateStr, 88, 230);

      // Target Focus
      const focusMin = typeof deskFocusMinutesToday === 'function' ? Math.round(deskFocusMinutesToday()) : 0;
      clockCtx.fillStyle = '#34d399';
      clockCtx.font = 'bold 24px system-ui, sans-serif';
      clockCtx.fillText(`Today: ${focusMin}m focused`, 88, 276);

      clockTexture.needsUpdate = true;
    };
    updateClockTexture();

    const screenMat = new THREE.MeshBasicMaterial({ map: clockTexture });
    const clockScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.65), screenMat);
    clockScreen.position.set(-3.43, 0.55, -0.37);
    clockScreen.rotation.y = 0.35;
    clockScreen.name = 'digitalClock';
    deskGroup.add(clockScreen);

    // --- 10. REAL NORDIC / ARCHITECT ARTICULATED STUDY LAMP WITH SPRINGS ---
    const lampGroup = new THREE.Group();
    lampGroup.name = 'deskLamp';

    const lampMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.85
    });

    const lampBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.95
    });

    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });

    const lampInteriorMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      roughness: 0.2,
      side: THREE.BackSide
    });

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff7ed,
      emissive: 0xffb74d,
      emissiveIntensity: 0,
      roughness: 0.1
    });

    // Lamp Base
    const baseBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.06, 32), lampMetalMat);
    baseBottom.position.set(3.4, 0.23, -0.2);
    baseBottom.castShadow = true;
    baseBottom.receiveShadow = true;
    lampGroup.add(baseBottom);

    const baseBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.03, 32), lampBrassMat);
    baseBezel.position.set(3.4, 0.27, -0.2);
    lampGroup.add(baseBezel);

    const baseDial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), lampBrassMat);
    baseDial.position.set(3.4, 0.3, -0.02);
    lampGroup.add(baseDial);

    // Base Swivel Joint
    const baseJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16), lampBrassMat);
    baseJoint.position.set(3.4, 0.34, -0.2);
    lampGroup.add(baseJoint);

    const baseHingeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), lampBrassMat);
    baseHingeSphere.position.set(3.4, 0.42, -0.2);
    lampGroup.add(baseHingeSphere);

    // Lower Dual-Arm Rods
    const lowerArmLen = 1.22;
    const lowerAngleZ = Math.atan2(0.25, 1.20);
    const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, lowerArmLen, 12), lampMetalMat);
    rod1.position.set(3.275, 1.02, -0.24);
    rod1.rotation.z = -lowerAngleZ;
    rod1.castShadow = true;
    lampGroup.add(rod1);

    const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, lowerArmLen, 12), lampMetalMat);
    rod2.position.set(3.275, 1.02, -0.16);
    rod2.rotation.z = -lowerAngleZ;
    rod2.castShadow = true;
    lampGroup.add(rod2);

    // Architect Tension Springs on Lower Arm
    const springMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
    for (let s = 0; s < 2; s++) {
      const springZ = s === 0 ? -0.23 : -0.17;
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.55, 12), springMat);
      spring.position.set(3.30, 0.88, springZ);
      spring.rotation.z = -lowerAngleZ;
      lampGroup.add(spring);
    }

    // Center Elbow Hinge
    const elbowHinge = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), lampBrassMat);
    elbowHinge.position.set(3.15, 1.62, -0.2);
    lampGroup.add(elbowHinge);

    const elbowBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16), lampBrassMat);
    elbowBolt.rotation.x = Math.PI / 2;
    elbowBolt.position.set(3.15, 1.62, -0.2);
    lampGroup.add(elbowBolt);

    // Upper Cantilever Arm
    const upperArmLen = 0.98;
    const upperArmMid = new THREE.Vector3(2.70, 1.785, -0.125);
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, upperArmLen, 12), lampMetalMat);
    upperArm.position.copy(upperArmMid);
    const armDir = new THREE.Vector3(2.25 - 3.15, 1.95 - 1.62, -0.05 - (-0.2)).normalize();
    upperArm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir);
    upperArm.castShadow = true;
    lampGroup.add(upperArm);

    // Head Knuckle Joint & Brass Collar
    const headKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), lampBrassMat);
    headKnuckle.position.set(2.25, 1.95, -0.05);
    lampGroup.add(headKnuckle);

    const shadeCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 20), lampBrassMat);
    shadeCollar.position.set(2.21, 1.90, -0.03);
    lampGroup.add(shadeCollar);

    // Iconic Nordic Dome Lampshade
    const shadeGroup = new THREE.Group();
    shadeGroup.position.set(2.12, 1.82, 0.0);
    shadeGroup.rotation.z = -0.75;
    shadeGroup.rotation.y = 0.45;
    shadeGroup.rotation.x = 0.25;

    const outerShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.48, 0.65, 32, 1, true),
      lampShadeMat
    );
    outerShade.position.y = -0.32;
    outerShade.castShadow = true;
    shadeGroup.add(outerShade);

    const innerShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.475, 0.64, 32, 1, true),
      lampInteriorMat
    );
    innerShade.position.y = -0.32;
    shadeGroup.add(innerShade);

    const shadeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32), lampBrassMat);
    shadeCap.position.y = 0.02;
    shadeGroup.add(shadeCap);

    const shadeRim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.018, 16, 32), lampBrassMat);
    shadeRim.position.y = -0.64;
    shadeRim.rotation.x = Math.PI / 2;
    shadeGroup.add(shadeRim);

    // Frosted Lightbulb inside Shade
    lampBulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), bulbMat);
    lampBulbMesh.position.y = -0.28;
    shadeGroup.add(lampBulbMesh);

    lampGroup.add(shadeGroup);
    deskGroup.add(lampGroup);

    // Position light source directly at glowing shade aperture
    lampLight.position.set(1.85, 1.45, 0.15);
    lampSpotLight.position.set(2.05, 1.65, 0.05);
    lampSpotLight.target = mainBookMeshGroup;

    // --- 11. CERAMIC COFFEE MUG WITH SAUCER & LATTE ART ---
    const coffeeMug = createCoffeeMugAndSaucer();
    coffeeMug.position.set(-3.5, 0.18, 0.85);
    deskGroup.add(coffeeMug);

    // --- 12. IMMERSIVE FOREGROUND STUDY CHAIR SILHOUETTE ---
    const chairGroup = new THREE.Group();
    const woodChairMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.35 });
    const leatherBackMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.6 });

    // Curved Bentwood Backrest
    const chairBack = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.5, 32, 1, true, Math.PI * 0.7, Math.PI * 0.6), woodChairMat);
    chairBack.position.set(0, 0.75, 4.4);
    chairBack.rotation.y = Math.PI;
    chairGroup.add(chairBack);

    // Leather Padded Center
    const leatherPad = new THREE.Mesh(new THREE.CylinderGeometry(1.57, 1.57, 0.44, 32, 1, true, Math.PI * 0.75, Math.PI * 0.5), leatherBackMat);
    leatherPad.position.set(0, 0.75, 4.4);
    leatherPad.rotation.y = Math.PI;
    chairGroup.add(leatherPad);

    deskGroup.add(chairGroup);
  }

  function initCoffeeSteam() {
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const pGeo = new THREE.SphereGeometry(0.06, 6, 6);
    for (let i = 0; i < 16; i++) {
      const p = new THREE.Mesh(pGeo, pMat.clone());
      p.position.set(-3.5 + (Math.random() - 0.5) * 0.1, 0.8 + Math.random() * 0.4, 0.8 + (Math.random() - 0.5) * 0.1);
      deskGroup.add(p);
      steamParticles.push({ mesh: p, speed: 0.005 + Math.random() * 0.005, initialY: 0.8 });
    }
  }

  function updateEnvironmentCycle() {
    if (!scene) return;

    if (state3D.autoTime) {
      const now = new Date();
      state3D.timeHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    }

    const hrs = state3D.timeHours;
    // natureSunTimeDisplay was removed; no DOM update needed here.

    let skyColor, sunColor, sunIntensity, ambientIntensity, sunPos, moonPos;
    state3D.isNight = hrs >= 18.0 || hrs < 5.5;

    // ── Camera sits at (0, 3.2, 7.5) looking at (0, 1.6, 0) with FOV 45°.
    // ── Mountains peak at Z ≈ -55, Y ≈ 7–16.
    // ── To appear in the open sky ABOVE mountains: Z = -45, Y = 8.5–15.5.

    if (hrs >= 5.5 && hrs < 9) { // Dawn — sun rises east (left) horizon
      const t = (hrs - 5.5) / 3.5;
      skyColor = new THREE.Color().lerpColors(new THREE.Color(0x2a1b3d), new THREE.Color(0x93c5fd), t);
      sunColor = new THREE.Color(0xfde68a);
      sunIntensity = 1.4;
      ambientIntensity = 0.5;
      sunPos = new THREE.Vector3(-24 + t * 16, 8.5 + t * 5, -45);
      moonPos = new THREE.Vector3(28, -18, -45);
    } else if (hrs >= 9 && hrs < 13) { // Morning — sun climbs to zenith
      const t = (hrs - 9) / 4;
      skyColor = new THREE.Color(0x7dd3fc);
      sunColor = new THREE.Color(0xfffbeb);
      sunIntensity = 2.8;
      ambientIntensity = 1.1;
      sunPos = new THREE.Vector3(-8 + t * 16, 13.5 + t * 2, -45);
      moonPos = new THREE.Vector3(35, -20, -45);
    } else if (hrs >= 13 && hrs < 17) { // Afternoon — sun descends west
      const t = (hrs - 13) / 4;
      skyColor = new THREE.Color(0x7dd3fc);
      sunColor = new THREE.Color(0xfef3c7);
      sunIntensity = 2.6;
      ambientIntensity = 1.0;
      sunPos = new THREE.Vector3(8 + t * 14, 15.5 - t * 5, -45);
      moonPos = new THREE.Vector3(35, -20, -45);
    } else if (hrs >= 17 && hrs < 19.5) { // Sunset — warm orange, sun at right horizon
      const t = (hrs - 17) / 2.5;
      skyColor = new THREE.Color().lerpColors(new THREE.Color(0x38bdf8), new THREE.Color(0x0f172a), t);
      sunColor = new THREE.Color(0xf97316);
      sunIntensity = 1.6 - t * 1.0;
      ambientIntensity = 0.4 - t * 0.2;
      sunPos = new THREE.Vector3(22 + t * 6, 10.5 - t * 10, -45);
      moonPos = new THREE.Vector3(-18 + t * 8, 8.5 + t * 4, -45);
    } else { // Night — moon arcs across the sky
      const nightT = hrs >= 19.5 ? (hrs - 19.5) / 10 : (hrs + 4.5) / 10;
      const moonArcT = Math.min(nightT, 1);
      skyColor = new THREE.Color(0x030712);
      sunColor = new THREE.Color(0x1e3a5f);
      sunIntensity = 0;
      ambientIntensity = 0.18;
      sunPos = new THREE.Vector3(0, -60, -45); // hidden below horizon
      moonPos = new THREE.Vector3(-16 + moonArcT * 32, 10 + Math.sin(moonArcT * Math.PI) * 5, -45);
    }

    scene.background = skyColor;
    if (scene.fog) scene.fog.color = skyColor;
    sunLight.color = sunColor;
    sunLight.intensity = sunIntensity;
    sunLight.position.copy(sunPos);
    sunMesh.position.copy(sunPos);
    sunMesh.visible = !state3D.isNight;
    if (sunHalo) {
      sunHalo.position.copy(sunPos);
      sunHalo.lookAt(camera.position);
      sunHalo.visible = !state3D.isNight;
      // Deepen halo colour at sunset
      const isGoldenHour = hrs >= 17 && hrs < 19.5;
      sunHalo.material.color.setHex(isGoldenHour ? 0xff9944 : 0xffe066);
    }
    moonMesh.position.copy(moonPos);
    moonMesh.visible = state3D.isNight || (hrs >= 17.5 && hrs < 5.5);
    if (moonHalo) {
      moonHalo.position.copy(moonPos);
      moonHalo.lookAt(camera.position);
      moonHalo.visible = moonMesh.visible;
    }
    ambientLight.intensity = ambientIntensity;
    starPoints.material.opacity = state3D.isNight ? 0.85 : 0;

    const shouldLampBeOn = state3D.isLampOn || state3D.isNight;
    lampLight.intensity = shouldLampBeOn ? 4.2 : 0;
    lampSpotLight.intensity = shouldLampBeOn ? 5.5 : 0;
    if (lampBulbMesh && lampBulbMesh.material) {
      lampBulbMesh.material.emissiveIntensity = shouldLampBeOn ? 2.8 : 0;
      lampBulbMesh.material.color.setHex(shouldLampBeOn ? 0xfffaed : 0xd1d5db);
    }
    const lampBtn = document.getElementById('btnNatureToggleLamp');
    if (lampBtn) lampBtn.classList.toggle('active', shouldLampBeOn);

    if (typeof updateClockTexture === 'function') {
      updateClockTexture();
    }
  }

  function updateAnimations(time) {
    animatedTrees.forEach(t => {
      // Gentle natural 3D wind sway for trees
      t.mesh.rotation.z = Math.sin(time * t.speed + t.phase) * 0.015;
      t.mesh.rotation.x = Math.cos(time * t.speed * 0.7 + t.phase) * 0.01;
    });

    // Determine if it is daytime / morning or night time
    const hrs = state3D.timeHours;
    const isDay = hrs >= 5.5 && hrs < 18.0 && !state3D.isNight;
    const isNight = !isDay;

    // Butterflies — morning & daytime only
    butterflies.forEach(bf => {
      bf.group.visible = isDay;
      if (isDay) {
        bf.leftWing.rotation.y = Math.sin(time * bf.speed * 4) * 0.6;
        bf.rightWing.rotation.y = -Math.sin(time * bf.speed * 4) * 0.6;
        bf.group.position.y = bf.basePos.y + Math.sin(time * bf.speed + bf.phase) * 0.4;
        bf.group.position.x = bf.basePos.x + Math.cos(time * bf.speed * 0.5 + bf.phase) * 0.6;
      }
    });

    // Fireflies — night time only (completely hidden during daytime)
    fireflies.forEach(ff => {
      ff.mesh.visible = isNight;
      if (isNight) {
        // Gentle bioluminescent pulse and float in the dark
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * (ff.speed * 2.8) + ff.phase));
        ff.mesh.material.opacity = pulse;
        ff.mesh.position.y = ff.basePos.y + Math.sin(time * ff.speed + ff.phase) * 0.5;
        ff.mesh.position.x = ff.basePos.x + Math.cos(time * ff.speed * 0.6 + ff.phase) * ff.driftX;
        ff.mesh.position.z = ff.basePos.z + Math.sin(time * ff.speed * 0.4 + ff.phase) * ff.driftZ;
      } else {
        ff.mesh.material.opacity = 0;
      }
    });

    steamParticles.forEach(p => {
      p.mesh.position.y += p.speed;
      p.mesh.scale.addScalar(0.01);
      p.mesh.material.opacity -= 0.002;
      if (p.mesh.position.y > 1.8 || p.mesh.material.opacity <= 0) {
        p.mesh.position.y = p.initialY;
        p.mesh.scale.set(1, 1, 1);
        p.mesh.material.opacity = 0.15;
      }
    });
  }

  function updateCamera() {
    if (!camera || !targetCamPos) return;
    const parallaxPos = targetCamPos.clone().add(new THREE.Vector3(mouseX, -mouseY, 0));
    camera.position.lerp(parallaxPos, 0.04);
    currentCamLook.lerp(targetCamLook, 0.04);
    camera.lookAt(currentCamLook);
  }

  function stopAnimationLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function startAnimationLoop() {
    stopAnimationLoop();

    function loop() {
      // Only render if panel-profile is currently active and 3D container is visible
      const panel = document.getElementById('panel-profile');
      const container3D = document.getElementById('natureDesk3DContainer');
      const is3DActive = panel && panel.classList.contains('active') && !document.hidden && (!container3D || container3D.style.display !== 'none');
      if (!is3DActive) {
        animFrameId = null;
        return;
      }

      animFrameId = requestAnimationFrame(loop);

      const elapsedTime = clock ? clock.getElapsedTime() : 0;
      updateEnvironmentCycle();
      updateAnimations(elapsedTime);
      updateCamera();
      renderer.render(scene, camera);
    }

    loop();
  }

  // --- CAMERA MODES & 3D CLICKS ---
  function setCameraMode(mode) {
    state3D.activeCamMode = mode;
    ['camNatureOverview', 'camNatureForest'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    if (mode === 'overview') {
      targetCamPos.set(0, 3.2, 7.5);
      targetCamLook.set(0, 1.6, 0);
      document.getElementById('camNatureOverview')?.classList.add('active');
    } else if (mode === 'forest') {
      targetCamPos.set(0, 3.8, 0.5);
      targetCamLook.set(0, 3.8, -30.0);
      document.getElementById('camNatureForest')?.classList.add('active');
    }
  }

  function bind3DInteractions() {
    // Auto-hide the drag hint after 3 seconds, restore on hover
    const hint = document.getElementById('natureDragHint');
    if (hint) {
      setTimeout(() => hint.classList.add('hint-hidden'), 3000);
      hint.addEventListener('mouseenter', () => hint.classList.remove('hint-hidden'));
      hint.addEventListener('mouseleave', () => {
        setTimeout(() => hint.classList.add('hint-hidden'), 1500);
      });
    }

    window.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 1.2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.6;
      const h = document.getElementById('natureDragHint');
      if (h) h.classList.add('hint-hidden');
    });

    if (canvas) {
      canvas.addEventListener('pointerdown', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        for (let i = 0; i < intersects.length; i++) {
          const obj = intersects[i].object;

          if (obj.name === 'openNotebook' || obj.parent?.name === 'openNotebook' || obj.parent?.parent?.name === 'openNotebook') {
            openWidget('natureTasksDrawer');
            break;
          }
          if (obj.name === 'deskLaptop' || obj.parent?.name === 'deskLaptop' || obj.parent?.parent?.name === 'deskLaptop') {
            toggleWidget('natureTimerWidget');
            break;
          }
          if (obj.name === 'deskLamp' || obj.parent?.name === 'deskLamp' || obj.parent?.parent?.name === 'deskLamp') {
            document.getElementById('btnNatureToggleLamp')?.click();
            break;
          }
          if (obj.name === 'digitalClock' || obj.parent?.name === 'digitalClock') {
            toggleWidget('natureCalendarWidget');
            break;
          }
          if (obj.name === 'deskPlant' || obj.parent?.name === 'deskPlant' || obj.parent?.parent?.name === 'deskPlant') {
            openWidget('natureAudioDrawer');
            if (typeof showToast === 'function') showToast('🌿 Garden Sanctuary soundscape & calming audio opened.');
            break;
          }
          if (obj.name === 'coffeeMug' || obj.parent?.name === 'coffeeMug' || obj.parent?.parent?.name === 'coffeeMug') {
            if (typeof showToast === 'function') showToast('☕ Fresh hot coffee brewed! Stay focused and hydrated.');
            break;
          }
          if (obj.name === 'stickyNotes' || obj.parent?.name === 'stickyNotes') {
            openWidget('natureTasksDrawer');
            break;
          }
          if (obj.name === 'glassPatioWindow') {
            setCameraMode(state3D.activeCamMode === 'overview' ? 'forest' : 'overview');
            break;
          }
        }
      });
    }

    handleResize = function () {
      if (!canvas || !renderer || !camera) return;
      const c = document.getElementById('natureDesk3DContainer');
      const rect = c ? c.getBoundingClientRect() : canvas.getBoundingClientRect();
      const width = Math.max(rect.width || window.innerWidth, 320);
      const height = Math.max(rect.height || window.innerHeight, 240);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
  }

  // --- AUDIO SYNTHESIZER ---
  function initAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();

    const bufferSize = audioCtx.sampleRate * 2;

    // Rain Generator
    const rainBuf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const rData = rainBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) rData[i] = Math.random() * 2 - 1;

    const rainSrc = audioCtx.createBufferSource();
    rainSrc.buffer = rainBuf;
    rainSrc.loop = true;

    const rainFilter = audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);

    rainGain = audioCtx.createGain();
    rainGain.gain.setValueAtTime(0.4, audioCtx.currentTime);

    rainSrc.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(audioCtx.destination);
    rainSrc.start();

    // Garden Breeze & Birds
    const windBuf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const wData = windBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) wData[i] = Math.random() * 2 - 1;

    const windSrc = audioCtx.createBufferSource();
    windSrc.buffer = windBuf;
    windSrc.loop = true;

    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(650, audioCtx.currentTime);

    windGain = audioCtx.createGain();
    windGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audioCtx.destination);
    windSrc.start();

    // Focus Noise & LoFi
    noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0, audioCtx.currentTime);
    noiseGain.connect(audioCtx.destination);

    lofiGain = audioCtx.createGain();
    lofiGain.gain.setValueAtTime(0, audioCtx.currentTime);
    lofiGain.connect(audioCtx.destination);
  }

  function playLofiChord() {
    if (!audioCtx) return;
    const toggle = document.getElementById('natureToggleLofi');
    if (!toggle || !toggle.checked) return;

    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63]  // Fmaj7
    ];
    const chord = chords[Math.floor(Math.random() * chords.length)];
    chord.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.8);
      osc.connect(gain);
      gain.connect(lofiGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 4.0);
    });
  }

  // --- CALENDAR WIDGET ---
  function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthYearEl = document.getElementById('natureCalMonthYear');
    if (monthYearEl) monthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calGrid = document.getElementById('natureCalGrid');
    if (!calGrid) return;
    calGrid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'nature-cal-cell empty';
      calGrid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayEl = document.createElement('div');
      dayEl.className = `nature-cal-cell ${d === todayDate ? 'today' : ''}`;
      dayEl.textContent = d;
      calGrid.appendChild(dayEl);
    }
  }

  function updateLiveClock() {
    const clockEl = document.getElementById('natureCalLiveClock');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
  }
  setInterval(updateLiveClock, 1000);

  // --- POMODORO TIMER ---
  function updatePomoUI() {
    const mins = Math.floor(state3D.pomo.timeLeft / 60).toString().padStart(2, '0');
    const secs = (state3D.pomo.timeLeft % 60).toString().padStart(2, '0');
    const display = document.getElementById('naturePomoTimeDisplay');
    const modeEl = document.getElementById('naturePomoModeDisplay');
    if (display) display.textContent = `${mins}:${secs}`;
    if (modeEl) modeEl.textContent = state3D.pomo.mode === 'focus' ? 'Focus Session' : 'Break Mode';

    const ring = document.getElementById('natureTimerProgressRing');
    if (ring) {
      const circumference = 2 * Math.PI * 62;
      const offset = circumference - (state3D.pomo.timeLeft / state3D.pomo.totalTime) * circumference;
      ring.style.strokeDashoffset = offset;
    }
  }

  // --- TASKS SYNC & PERSISTENCE ---
  function loadDeskTasks() {
    try {
      const raw = localStorage.getItem('careerdesk_desk_tasks');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state3D.tasks = parsed;
          return true;
        }
      }
    } catch (e) { }
    return false;
  }

  function saveDeskTasks() {
    try {
      localStorage.setItem('careerdesk_desk_tasks', JSON.stringify(state3D.tasks));
    } catch (e) { }
  }

  function syncCareerDeskRoutineTasks() {
    if (loadDeskTasks()) return;

    try {
      if (typeof state !== 'undefined' && state && Array.isArray(state.routine)) {
        const today = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
        const routineToday = state.routine.filter(r => r && r.date === today);
        if (routineToday.length > 0) {
          state3D.tasks = routineToday.map(r => ({
            id: r.id || Date.now() + Math.random(),
            text: `${r.subject}: ${r.task || 'Study session'} (${r.startTime || ''}-${r.endTime || ''})`,
            done: false
          }));
          saveDeskTasks();
          return;
        }
      }
    } catch (e) { }

    if (state3D.tasks.length === 0) {
      state3D.tasks = [
        { id: 1, text: 'Read BCS General Knowledge Chapter', done: true },
        { id: 2, text: 'Solve Math & Mental Ability Set', done: false },
        { id: 3, text: 'English Vocabulary & Literature Review', done: false }
      ];
      saveDeskTasks();
    }
  }

  function renderTasks() {
    const list = document.getElementById('natureTaskList');
    if (!list) return;
    list.innerHTML = '';
    let completed = 0;
    state3D.tasks.forEach(t => {
      if (t.done) completed++;
      const div = document.createElement('div');
      div.className = `nature-task-item ${t.done ? 'done' : ''}`;
      div.innerHTML = `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;">
          <input type="checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}" class="nature-task-chk" style="accent-color:#a855f7;cursor:pointer;">
          <span>${escapeHtml(t.text)}</span>
        </label>
        <button type="button" data-id="${t.id}" class="nature-task-del" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:2px 6px;">✕</button>
      `;
      list.appendChild(div);
    });
    const stats = document.getElementById('natureTaskStats');
    if (stats) stats.textContent = `${completed}/${state3D.tasks.length} Completed`;
  }

  function escapeHtml(str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- WIDGET TOGGLES ---
  function toggleWidget(id) {
    const w = document.getElementById(id);
    if (!w) return;
    w.classList.toggle('open');
  }

  function openWidget(id) {
    const w = document.getElementById(id);
    if (!w) return;
    w.classList.add('open');
  }

  function bindHUDWidgetEvents() {
    // Mode Switcher (3D vs Classic Desk)
    const btn3D = document.getElementById('btnModeNature3D');
    const btnClassic = document.getElementById('btnModeClassicDesk');
    const container3D = document.getElementById('natureDesk3DContainer');
    const deskHero = document.getElementById('deskHero');

    function switchViewMode(mode) {
      if (mode === '3d') {
        if (container3D) container3D.style.display = 'flex';
        if (deskHero) {
          deskHero.style.display = 'none';
          deskHero.setAttribute('style', 'display: none !important;');
        }
        btn3D?.classList.add('active');
        btnClassic?.classList.remove('active');
        try { localStorage.setItem('careerdesk_desk_view', '3d'); } catch (e) { }
        startAnimationLoop();
        if (typeof handleResize === 'function') setTimeout(handleResize, 50);
      } else {
        if (typeof exitNatureDeskFullscreen === 'function') exitNatureDeskFullscreen();
        if (container3D) container3D.style.display = 'none';
        if (deskHero) {
          deskHero.style.display = 'flex';
          deskHero.removeAttribute('style');
        }
        btn3D?.classList.remove('active');
        btnClassic?.classList.add('active');
        try { localStorage.setItem('careerdesk_desk_view', 'classic'); } catch (e) { }
        stopAnimationLoop();
      }
    }

    if (btn3D) btn3D.addEventListener('click', () => switchViewMode('3d'));
    if (btnClassic) btnClassic.addEventListener('click', () => switchViewMode('classic'));

    // Check saved view mode preference
    try {
      const saved = localStorage.getItem('careerdesk_desk_view');
      if (saved === 'classic') switchViewMode('classic');
      else switchViewMode('3d');
    } catch (e) {
      switchViewMode('3d');
    }

    // Environment Presets
    const envBtns = [
      { id: 'btnNatureAutoTime', action: () => { state3D.autoTime = true; } },
      { id: 'btnNatureEnvDawn', action: () => { state3D.autoTime = false; state3D.timeHours = 6.5; } },
      { id: 'btnNatureEnvDay', action: () => { state3D.autoTime = false; state3D.timeHours = 12.0; } },
      { id: 'btnNatureEnvSunset', action: () => { state3D.autoTime = false; state3D.timeHours = 18.0; } },
      { id: 'btnNatureEnvNight', action: () => { state3D.autoTime = false; state3D.timeHours = 22.0; } }
    ];

    envBtns.forEach(b => {
      const el = document.getElementById(b.id);
      if (el) {
        el.addEventListener('click', e => {
          envBtns.forEach(x => document.getElementById(x.id)?.classList.remove('active'));
          e.currentTarget.classList.add('active');
          b.action();
        });
      }
    });

    // Camera Presets
    document.getElementById('camNatureOverview')?.addEventListener('click', () => setCameraMode('overview'));
    document.getElementById('camNatureForest')?.addEventListener('click', () => setCameraMode('forest'));

    // Widget Open/Close
    document.getElementById('btnNatureToggleCalendar')?.addEventListener('click', () => toggleWidget('natureCalendarWidget'));
    document.getElementById('btnNatureCloseCalendar')?.addEventListener('click', () => toggleWidget('natureCalendarWidget'));

    document.getElementById('btnNatureToggleTimer')?.addEventListener('click', () => toggleWidget('natureTimerWidget'));
    document.getElementById('btnNatureCloseTimer')?.addEventListener('click', () => toggleWidget('natureTimerWidget'));

    document.getElementById('btnNatureToggleTasks')?.addEventListener('click', () => toggleWidget('natureTasksDrawer'));
    document.getElementById('btnNatureCloseTasks')?.addEventListener('click', () => toggleWidget('natureTasksDrawer'));

    document.getElementById('btnNatureToggleAudio')?.addEventListener('click', () => {
      initAudio();
      toggleWidget('natureAudioDrawer');
    });
    document.getElementById('btnNatureCloseAudio')?.addEventListener('click', () => toggleWidget('natureAudioDrawer'));

    // Weather & Lamp
    document.getElementById('btnNatureToggleRain')?.addEventListener('click', e => {
      state3D.isRain = !state3D.isRain;
      const overlay = document.getElementById('natureRainGlassOverlay');
      if (overlay) overlay.classList.toggle('active', state3D.isRain);
      e.currentTarget.classList.toggle('active', state3D.isRain);
    });

    document.getElementById('btnNatureToggleLamp')?.addEventListener('click', e => {
      state3D.isLampOn = !state3D.isLampOn;
      e.currentTarget.classList.toggle('active', state3D.isLampOn);
    });

    // Zen Mode
    document.getElementById('btnNatureZenMode')?.addEventListener('click', () => {
      state3D.zenMode = !state3D.zenMode;
      const hud = document.getElementById('natureDeskHud');
      if (hud) hud.classList.toggle('ui-hidden', state3D.zenMode);
    });

    // ── Fullscreen Controller for 3D Sanctuary ──
    function isNatureFullscreen() {
      const isNative = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      const isClass = container3D ? container3D.classList.contains('is-fullscreen') : false;
      const isBody = document.body.classList.contains('nature-fullscreen-active');
      return isNative || isClass || isBody;
    }

    function syncNatureFullscreenUI() {
      const btn = document.getElementById('btnNatureFullscreen');
      const active = isNatureFullscreen();
      if (btn) {
        btn.classList.toggle('active', active);
        btn.title = active ? 'Exit Full Screen (Esc)' : 'Full Screen';
        btn.setAttribute('aria-label', active ? 'Exit Full Screen' : 'Full Screen');
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.innerHTML = active
          ? '<i data-lucide="minimize-2"></i>'
          : '<i data-lucide="maximize-2"></i>';
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
          lucide.createIcons({ root: btn });
        }
      }

      if (typeof handleResize === 'function') {
        handleResize();
        setTimeout(handleResize, 50);
        setTimeout(handleResize, 200);
      }
    }

    async function exitNatureDeskFullscreen() {
      if (container3D) container3D.classList.remove('is-fullscreen');
      document.body.classList.remove('nature-fullscreen-active');
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        } catch (e) { }
      }
      syncNatureFullscreenUI();
    }

    async function toggleNatureDeskFullscreen() {
      const active = isNatureFullscreen();
      if (active) {
        await exitNatureDeskFullscreen();
      } else {
        if (container3D) container3D.classList.add('is-fullscreen');
        document.body.classList.add('nature-fullscreen-active');
        try {
          const target = container3D || document.documentElement;
          if (target.requestFullscreen) {
            await target.requestFullscreen();
          } else if (target.webkitRequestFullscreen) {
            await target.webkitRequestFullscreen();
          } else if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (e) {
          // Native fullscreen prevented (e.g. iframe) — CSS fallback is already active
        }
        syncNatureFullscreenUI();
      }
    }

    document.getElementById('btnNatureFullscreen')?.addEventListener('click', toggleNatureDeskFullscreen);

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, () => {
        const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (!isNative) {
          if (container3D) container3D.classList.remove('is-fullscreen');
          document.body.classList.remove('nature-fullscreen-active');
        }
        syncNatureFullscreenUI();
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isNatureFullscreen()) {
        exitNatureDeskFullscreen();
      }
    });

    document.addEventListener('careerdesk:tabchange', event => {
      if (event.detail !== 'profile') {
        exitNatureDeskFullscreen();
      }
    });

    // Quotes Cycle
    document.getElementById('btnNatureNextQuote')?.addEventListener('click', () => {
      const pool = getDeskQuotePool();
      quoteIdx = (quoteIdx + 1) % pool.length;
      updateQuoteDisplay();
    });

    document.getElementById('btnNatureLangToggle')?.addEventListener('click', e => {
      state3D.lang = state3D.lang === 'EN' ? 'BN' : 'EN';
      e.currentTarget.textContent = state3D.lang;
      updateQuoteDisplay();
    });

    function updateQuoteDisplay() {
      const pool = getDeskQuotePool();
      if (!pool.length) return;
      const q = pool[quoteIdx % pool.length];
      const qText = document.getElementById('natureQuoteText');
      const qAuth = document.getElementById('natureQuoteAuthor');
      if (qText) qText.textContent = `"${state3D.lang === 'EN' ? (q.en || q.text) : (q.bn || q.text || q.en)}"`;
      if (qAuth) qAuth.textContent = `— ${q.author || 'CareerDesk'}`;
    }
    updateQuoteDisplay();

    // Pomodoro Controls
    document.getElementById('btnNaturePomoStart')?.addEventListener('click', () => {
      state3D.pomo.isRunning = !state3D.pomo.isRunning;
      const label = document.getElementById('naturePomoBtnLabel');
      if (label) label.textContent = state3D.pomo.isRunning ? 'Pause' : 'Start';

      if (state3D.pomo.isRunning && !pomoInterval) {
        pomoInterval = setInterval(() => {
          if (state3D.pomo.timeLeft > 0) {
            state3D.pomo.timeLeft--;
            updatePomoUI();
          } else {
            clearInterval(pomoInterval);
            pomoInterval = null;
            state3D.pomo.isRunning = false;
            const completedMode = state3D.pomo.mode;
            const lbl = document.getElementById('naturePomoBtnLabel');
            if (lbl) lbl.textContent = 'Start';

            if (completedMode === 'focus') {
              const durationMin = Math.max(1, Math.round(state3D.pomo.totalTime / 60));
              const end = Date.now();
              const start = end - (durationMin * 60000);
              const runningBlock = typeof deskRunningBlock === 'function' ? deskRunningBlock() : null;
              const subj = (runningBlock && runningBlock.subject) || 'Focus Session';

              if (typeof state !== 'undefined' && state && Array.isArray(state.sessions)) {
                state.sessions.push({
                  id: Date.now(),
                  subject: subj,
                  start,
                  end,
                  duration: durationMin
                });
                if (typeof saveState === 'function') saveState();
                if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
                if (typeof renderDeskHero === 'function') renderDeskHero();
                if (typeof renderProgress === 'function') renderProgress();
                if (typeof renderTodaySessions === 'function') renderTodaySessions();
                if (typeof window.syncCareerDeskTimerRings === 'function') window.syncCareerDeskTimerRings();
              }
              if (typeof showToast === 'function') {
                showToast(`🎉 Focus session completed (+${durationMin}m)! Logged to today's study.`);
              }
            } else {
              if (typeof showToast === 'function') {
                showToast('☕ Break ended! Ready for your next focus session?');
              }
            }
          }
        }, 1000);
      } else if (!state3D.pomo.isRunning && pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
    });

    document.getElementById('btnNaturePomoReset')?.addEventListener('click', () => {
      state3D.pomo.isRunning = false;
      if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; }
      state3D.pomo.timeLeft = state3D.pomo.mode === 'focus' ? 25 * 60 : 5 * 60;
      const label = document.getElementById('naturePomoBtnLabel');
      if (label) label.textContent = 'Start';
      updatePomoUI();
    });

    document.getElementById('btnNaturePomoMode')?.addEventListener('click', e => {
      state3D.pomo.mode = state3D.pomo.mode === 'focus' ? 'break' : 'focus';
      e.currentTarget.textContent = state3D.pomo.mode === 'focus' ? 'Break' : 'Focus';
      state3D.pomo.totalTime = state3D.pomo.mode === 'focus' ? 25 * 60 : 5 * 60;
      state3D.pomo.timeLeft = state3D.pomo.totalTime;
      updatePomoUI();
    });

    // To-Do Form
    document.getElementById('natureTaskForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('natureTaskInput');
      if (!input || !input.value.trim()) return;
      state3D.tasks.push({ id: Date.now(), text: input.value.trim(), done: false });
      input.value = '';
      saveDeskTasks();
      renderTasks();
    });

    document.getElementById('natureTaskList')?.addEventListener('click', e => {
      if (e.target.classList.contains('nature-task-chk')) {
        const id = parseInt(e.target.dataset.id);
        const t = state3D.tasks.find(x => x.id === id);
        if (t) t.done = e.target.checked;
        saveDeskTasks();
        renderTasks();
      } else if (e.target.classList.contains('nature-task-del')) {
        const id = parseInt(e.target.dataset.id);
        state3D.tasks = state3D.tasks.filter(x => x.id !== id);
        saveDeskTasks();
        renderTasks();
      }
    });

    document.getElementById('btnNatureClearTasks')?.addEventListener('click', () => {
      state3D.tasks = state3D.tasks.filter(t => !t.done);
      saveDeskTasks();
      renderTasks();
    });

    // Soundscape Volume Controls
    document.getElementById('natureVolRain')?.addEventListener('input', e => {
      initAudio();
      if (rainGain) rainGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
      const val = document.getElementById('natureValRain');
      if (val) val.textContent = Math.round(e.target.value * 100) + '%';
    });

    document.getElementById('natureVolWind')?.addEventListener('input', e => {
      initAudio();
      if (windGain) windGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
      const val = document.getElementById('natureValWind');
      if (val) val.textContent = Math.round(e.target.value * 100) + '%';
    });

    document.getElementById('natureToggleLofi')?.addEventListener('change', e => {
      initAudio();
      if (e.target.checked) {
        const vol = parseFloat(document.getElementById('natureVolLofi')?.value || 0.3);
        if (lofiGain) lofiGain.gain.setValueAtTime(vol, audioCtx.currentTime);
        if (!lofiInterval) lofiInterval = setInterval(playLofiChord, 4200);
      } else {
        if (lofiGain) lofiGain.gain.setValueAtTime(0, audioCtx.currentTime);
        if (lofiInterval) { clearInterval(lofiInterval); lofiInterval = null; }
      }
    });

    document.getElementById('natureVolLofi')?.addEventListener('input', e => {
      initAudio();
      if (lofiGain && document.getElementById('natureToggleLofi')?.checked) {
        lofiGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
      }
    });
  }

  // --- TAB ACTIVATION & VISIBILITY LISTENERS ---
  document.addEventListener('careerdesk:tabchange', e => {
    if (e.detail === 'profile') {
      setTimeout(() => {
        if (!state3D.initialized) init3DDeskEngine();
        else {
          const container3D = document.getElementById('natureDesk3DContainer');
          if (container3D && container3D.style.display !== 'none') {
            startAnimationLoop();
          }
        }
      }, 50);
    } else {
      stopAnimationLoop();
    }
  });

  document.addEventListener('visibilitychange', () => {
    const panel = document.getElementById('panel-profile');
    const container3D = document.getElementById('natureDesk3DContainer');
    if (!document.hidden && panel && panel.classList.contains('active') && container3D && container3D.style.display !== 'none') {
      startAnimationLoop();
    } else if (document.hidden) {
      stopAnimationLoop();
    }
  });

  window.initNatureDesk3D = init3DDeskEngine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init3DDeskEngine, 200));
  } else {
    setTimeout(init3DDeskEngine, 200);
  }
})();
