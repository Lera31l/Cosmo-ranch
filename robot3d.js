/**
 * Lumen Robots — procedural Three.js models
 * Stage 0–3 changes silhouette, armor, glow
 */
(function (global) {
  const COLORS = {
    lumen: [
      { body: 0x5eead4, plate: 0x99f6e4, accent: 0xfbbf24, eye: 0x0f766e },
      { body: 0x2dd4bf, plate: 0x5eead4, accent: 0xf59e0b, eye: 0x115e59 },
      { body: 0x14b8a6, plate: 0x2dd4bf, accent: 0xe8a15a, eye: 0x042f2e },
      { body: 0x0d9488, plate: 0x14b8a6, accent: 0xfbbf24, eye: 0x021c1b },
    ],
    scout: [
      { body: 0x93c5fd, plate: 0xbfdbfe, accent: 0xfbbf24, eye: 0x1e3a8a },
      { body: 0x60a5fa, plate: 0x93c5fd, accent: 0xf59e0b, eye: 0x1e40af },
      { body: 0x3b82f6, plate: 0x60a5fa, accent: 0xe8a15a, eye: 0x172554 },
      { body: 0x2563eb, plate: 0x3b82f6, accent: 0xfbbf24, eye: 0x0c1a40 },
    ],
    tank: [
      { body: 0xc4b5fd, plate: 0xddd6fe, accent: 0xfbbf24, eye: 0x4c1d95 },
      { body: 0xa78bfa, plate: 0xc4b5fd, accent: 0xf59e0b, eye: 0x5b21b6 },
      { body: 0x8b5cf6, plate: 0xa78bfa, accent: 0xe8a15a, eye: 0x2e1065 },
      { body: 0x7c3aed, plate: 0x8b5cf6, accent: 0xfbbf24, eye: 0x1e0a4a },
    ],
    miner: [
      { body: 0xfcd34d, plate: 0xfde68a, accent: 0x2ee6c7, eye: 0x78350f },
      { body: 0xfbbf24, plate: 0xfcd34d, accent: 0x14b8a6, eye: 0x92400e },
      { body: 0xf59e0b, plate: 0xfbbf24, accent: 0x0d9488, eye: 0x451a03 },
      { body: 0xd97706, plate: 0xf59e0b, accent: 0x2ee6c7, eye: 0x1c0a00 },
    ],
    guardian: [
      { body: 0xfda4af, plate: 0xfecdd3, accent: 0x2ee6c7, eye: 0x9f1239 },
      { body: 0xfb7185, plate: 0xfda4af, accent: 0x14b8a6, eye: 0xbe123c },
      { body: 0xf43f5e, plate: 0xfb7185, accent: 0xe8a15a, eye: 0x4c0519 },
      { body: 0xe11d48, plate: 0xf43f5e, accent: 0xfbbf24, eye: 0x2a0610 },
    ],
    apex: [
      { body: 0xfde68a, plate: 0xfef3c7, accent: 0x2ee6c7, eye: 0x422006 },
      { body: 0xfcd34d, plate: 0xfde68a, accent: 0x14b8a6, eye: 0x451a03 },
      { body: 0xfbbf24, plate: 0xfcd34d, accent: 0x0d9488, eye: 0x1c0a00 },
      { body: 0xf59e0b, plate: 0xfbbf24, accent: 0x2ee6c7, eye: 0x0c0500 },
    ],
  };

  function mat(color, metal = 0.35, rough = 0.45, emissive = 0x000000, emInt = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: metal,
      roughness: rough,
      emissive,
      emissiveIntensity: emInt,
    });
  }

  function buildRobot(species, stage) {
    const st = Math.min(3, Math.max(0, stage | 0));
    const pal = (COLORS[species] || COLORS.lumen)[st];
    const root = new THREE.Group();
    root.name = "robot";

    const bodyMat = mat(pal.body, 0.4, 0.4, pal.accent, 0.08 + st * 0.06);
    const plateMat = mat(pal.plate, 0.55, 0.35);
    const accentMat = mat(pal.accent, 0.6, 0.3, pal.accent, 0.35 + st * 0.15);
    const eyeMat = mat(0xffffff, 0.1, 0.2, pal.eye, 0.8);

    // Shadow disc
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55 + st * 0.08, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.95;
    root.add(shadow);

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.12 + st * 0.02, 0.28 + st * 0.04, 4, 8);
    [-0.22, 0.22].forEach((x) => {
      const leg = new THREE.Mesh(legGeo, plateMat);
      leg.position.set(x, -0.72, 0);
      root.add(leg);
    });

    // Torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.7 + st * 0.08, 0.55 + st * 0.06, 0.45 + st * 0.04),
      bodyMat
    );
    torso.position.y = -0.25;
    torso.castShadow = true;
    root.add(torso);

    // Chest core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.12 + st * 0.02, 16, 16), accentMat);
    core.position.set(0, -0.2, 0.24);
    root.add(core);

    // Head
    const headR = 0.32 + st * 0.03;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 24, 24), bodyMat);
    head.position.y = 0.28 + st * 0.02;
    root.add(head);

    // Visor / eyes
    const eyeGeo = new THREE.SphereGeometry(0.07 + st * 0.01, 12, 12);
    [-0.12, 0.12].forEach((x) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x, 0.3, headR * 0.85);
      root.add(eye);
    });

    // Mouth plate
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04 + st * 0.01, 0.04),
      accentMat
    );
    mouth.position.set(0, 0.18, headR * 0.9);
    root.add(mouth);

    // Antenna (stage >= 1)
    if (st >= 1) {
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.025, 0.28, 8),
        plateMat
      );
      ant.position.y = 0.55;
      root.add(ant);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), accentMat);
      tip.position.y = 0.72;
      root.add(tip);
    }

    // Side fins / arms (stage >= 1)
    if (st >= 1) {
      const armGeo = new THREE.BoxGeometry(0.14, 0.35, 0.14);
      [-1, 1].forEach((side) => {
        const arm = new THREE.Mesh(armGeo, plateMat);
        arm.position.set(side * (0.48 + st * 0.03), -0.2, 0);
        arm.rotation.z = side * 0.25;
        root.add(arm);
      });
    }

    // Wings (stage >= 2)
    if (st >= 2) {
      const wingGeo = new THREE.BoxGeometry(0.55, 0.08, 0.28);
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(wingGeo, accentMat);
        wing.position.set(side * 0.55, 0.05, -0.05);
        wing.rotation.z = side * -0.35;
        wing.rotation.y = side * 0.2;
        root.add(wing);
      });
    }

    // Shoulder pads (stage >= 2)
    if (st >= 2) {
      const padGeo = new THREE.BoxGeometry(0.22, 0.12, 0.22);
      [-1, 1].forEach((side) => {
        const pad = new THREE.Mesh(padGeo, plateMat);
        pad.position.set(side * 0.38, 0.05, 0);
        root.add(pad);
      });
    }

    // Crown / halo (stage >= 3)
    if (st >= 3) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.03, 8, 32),
        accentMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.72;
      root.add(ring);
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.2, 6),
        accentMat
      );
      spike.position.y = 0.88;
      root.add(spike);
    }

    // Floating particles near core for high stages
    if (st >= 2) {
      for (let i = 0; i < 4; i++) {
        const p = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 8, 8),
          mat(pal.accent, 0.2, 0.4, pal.accent, 0.9)
        );
        const a = (i / 4) * Math.PI * 2;
        p.position.set(Math.cos(a) * 0.45, -0.15 + Math.sin(a) * 0.1, Math.sin(a) * 0.45);
        p.userData.orbit = { a, r: 0.45, speed: 0.8 + i * 0.1 };
        root.add(p);
      }
    }

    root.userData.stage = st;
    root.userData.species = species;
    return root;
  }

  class RobotViewer {
    constructor(canvas) {
      this.canvas = canvas;
      this.species = "lumen";
      this.stage = 0;
      this.hitPulse = 0;
      this.robot = null;

      const w = canvas.clientWidth || 280;
      const h = canvas.clientHeight || 240;

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      this.renderer.setSize(w, h, false);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50);
      this.camera.position.set(0, 0.15, 3.2);
      this.camera.lookAt(0, -0.05, 0);

      const amb = new THREE.AmbientLight(0x6688aa, 0.55);
      this.scene.add(amb);
      const key = new THREE.DirectionalLight(0xffffff, 1.15);
      key.position.set(2.5, 4, 3);
      this.scene.add(key);
      const fill = new THREE.DirectionalLight(0x2ee6c7, 0.45);
      fill.position.set(-2, 1, -1);
      this.scene.add(fill);
      const rim = new THREE.PointLight(0xe8a15a, 0.6, 8);
      rim.position.set(0, 1.5, -2);
      this.scene.add(rim);

      // Soft ground glow
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 32),
        new THREE.MeshBasicMaterial({
          color: 0x2ee6c7,
          transparent: true,
          opacity: 0.06,
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.96;
      this.scene.add(floor);

      this.setRobot("lumen", 0);
      this._running = true;
      this._last = performance.now();
      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);

      window.addEventListener("resize", () => this.resize());
    }

    resize() {
      const w = this.canvas.clientWidth || 280;
      const h = this.canvas.clientHeight || 240;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    setRobot(species, stage) {
      if (this.robot && this.robot.userData.species === species && this.robot.userData.stage === stage) {
        return;
      }
      if (this.robot) {
        this.scene.remove(this.robot);
        this.robot.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
            else o.material.dispose();
          }
        });
      }
      this.species = species;
      this.stage = stage;
      this.robot = buildRobot(species, stage);
      this.scene.add(this.robot);
    }

    pulse() {
      this.hitPulse = 1;
    }

    _loop(now) {
      if (!this._running) return;
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;

      if (this.robot) {
        this.robot.rotation.y += dt * 0.55;
        const bob = Math.sin(now * 0.0025) * 0.04;
        this.robot.position.y = bob;
        if (this.hitPulse > 0) {
          this.hitPulse = Math.max(0, this.hitPulse - dt * 4);
          const s = 1 + this.hitPulse * 0.12;
          this.robot.scale.setScalar(s);
        } else {
          this.robot.scale.setScalar(1);
        }
        this.robot.traverse((o) => {
          if (o.userData.orbit) {
            const orb = o.userData.orbit;
            orb.a += dt * orb.speed;
            o.position.x = Math.cos(orb.a) * orb.r;
            o.position.z = Math.sin(orb.a) * orb.r;
          }
        });
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._loop);
    }

    dispose() {
      this._running = false;
    }
  }

  global.LumenRobot3D = { RobotViewer, buildRobot };
})(window);
