/**
 * 3D Avatar Rendering Engine (Powered by Three.js)
 * 支援呼吸、眨眼、視線追蹤、口型即時同步 (Viseme Lip-sync) 與情緒肢體動態
 */

export class Avatar3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.isSpeaking = false;
    this.mood = 'neutral';
    this.audioVolume = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    this.initScene();
    this.createLights();
    this.createAvatarModel();
    this.createBackgroundParticles();
    this.setupEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.05);

    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 1.45, 2.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  createLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    // 主光 (Key Light)
    this.keyLight = new THREE.DirectionalLight(0xe0e7ff, 1.2);
    this.keyLight.position.set(2, 4, 3);
    this.scene.add(this.keyLight);

    // 輪廓邊緣光 (Rim Light - 賽博紫藍色)
    this.rimLight = new THREE.PointLight(0x8b5cf6, 2.5, 10);
    this.rimLight.position.set(-2, 2.5, -1.5);
    this.scene.add(this.rimLight);

    // 補光 (Fill Light)
    this.fillLight = new THREE.PointLight(0x38bdf8, 1.5, 10);
    this.fillLight.position.set(2, 0.5, 1.5);
    this.scene.add(this.fillLight);
  }

  createAvatarModel() {
    this.avatarGroup = new THREE.Group();
    this.avatarGroup.position.set(0, 0, 0);

    // 材質庫
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfd3,
      roughness: 0.45,
      metalness: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.1,
    });

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2,
    });

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
      roughness: 0.1,
    });

    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.3,
    });

    // 1. 軀幹與衣服 (Torso / Suit)
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.46, 1.1, 32);
    this.torso = new THREE.Mesh(torsoGeo, suitMat);
    this.torso.position.y = 0.55;
    this.avatarGroup.add(this.torso);

    // 領帶 / 飾品
    const tieGeo = new THREE.ConeGeometry(0.08, 0.5, 4);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3 });
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.8, 0.36);
    tie.rotation.x = Math.PI;
    this.avatarGroup.add(tie);

    // 2. 頸部 (Neck)
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.3, 24);
    this.neck = new THREE.Mesh(neckGeo, skinMat);
    this.neck.position.y = 1.15;
    this.avatarGroup.add(this.neck);

    // 3. 頭部群組 (Head Group - 用於旋轉與點頭)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.4, 0);

    // 頭部主體 (Head Mesh)
    const headGeo = new THREE.SphereGeometry(0.28, 32, 32);
    headGeo.scale(1, 1.18, 1);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(this.headMesh);

    // 4. 頭髮 (Stylized Hair)
    const hairGeo = new THREE.SphereGeometry(0.31, 24, 24);
    hairGeo.scale(1.02, 1.15, 1.05);
    const hairTop = new THREE.Mesh(hairGeo, hairMat);
    hairTop.position.set(0, 0.08, -0.03);
    this.headGroup.add(hairTop);

    // 瀏海
    const bangsGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
    const bangs = new THREE.Mesh(bangsGeo, hairMat);
    bangs.position.set(0, 0.22, 0.23);
    bangs.rotation.x = -0.5;
    this.headGroup.add(bangs);

    // 5. 眼睛 (Left & Right Eyes)
    this.leftEye = this.createEye(eyeWhiteMat, irisMat, -0.1, 0.04, 0.25);
    this.rightEye = this.createEye(eyeWhiteMat, irisMat, 0.1, 0.04, 0.25);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // 6. 鼻子 (Subtle Stylized Nose)
    const noseGeo = new THREE.ConeGeometry(0.025, 0.08, 12);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, -0.03, 0.29);
    nose.rotation.x = 0.2;
    this.headGroup.add(nose);

    // 7. 嘴巴 (Mouth - 用於講話 Viseme 縮放)
    const mouthGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
    mouthGeo.scale(1.3, 0.6, 1);
    this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouth.position.set(0, -0.15, 0.26);
    this.mouth.rotation.x = Math.PI / 2;
    this.headGroup.add(this.mouth);

    this.avatarGroup.add(this.headGroup);
    this.scene.add(this.avatarGroup);

    // 眨眼計時
    this.lastBlinkTime = 0;
    this.blinkDuration = 0.15;
  }

  createEye(whiteMat, irisMat, x, y, z) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(x, y, z);

    // 眼白
    const whiteGeo = new THREE.SphereGeometry(0.045, 16, 16);
    whiteGeo.scale(1.2, 0.8, 0.4);
    const whiteMesh = new THREE.Mesh(whiteGeo, whiteMat);
    eyeGroup.add(whiteMesh);

    // 虹膜 / 瞳孔 (發光科技感)
    const irisGeo = new THREE.CircleGeometry(0.025, 16);
    const irisMesh = new THREE.Mesh(irisGeo, irisMat);
    irisMesh.position.set(0, 0, 0.02);
    eyeGroup.add(irisMesh);

    return eyeGroup;
  }

  createBackgroundParticles() {
    const particleCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = Math.random() * 5;
      positions[i + 2] = (Math.random() - 0.5) * 5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onResize());

    // 視線跟隨滑鼠游標
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    });
  }

  onResize() {
    if (!this.canvas.parentElement) return;
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setSpeaking(isSpeaking) {
    this.isSpeaking = isSpeaking;
    if (!isSpeaking) {
      this.mouth.scale.set(1, 1, 1);
    }
  }

  setMood(mood) {
    this.mood = mood;
    if (mood === 'joy') {
      this.rimLight.color.setHex(0x10b981);
    } else if (mood === 'excited') {
      this.rimLight.color.setHex(0xf59e0b);
    } else {
      this.rimLight.color.setHex(0x8b5cf6);
    }
  }

  setBackgroundTheme(theme) {
    if (theme === 'cyber') {
      this.scene.fog.color.setHex(0x090d16);
      this.rimLight.color.setHex(0x8b5cf6);
      this.fillLight.color.setHex(0x38bdf8);
    } else if (theme === 'studio') {
      this.scene.fog.color.setHex(0x1e1b4b);
      this.rimLight.color.setHex(0xf43f5e);
      this.fillLight.color.setHex(0xfbbf24);
    } else if (theme === 'office') {
      this.scene.fog.color.setHex(0x0f172a);
      this.rimLight.color.setHex(0x3b82f6);
      this.fillLight.color.setHex(0x10b981);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. 視線平滑過渡
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 2. 呼吸運動 (Idle Breathing)
    const breath = Math.sin(elapsedTime * 2.2) * 0.015;
    this.headGroup.position.y = 1.4 + breath;
    this.torso.scale.y = 1 + breath * 0.8;

    // 3. 自然頭部轉動 (Head Tilt + Mouse Tracking)
    this.headGroup.rotation.y = this.mouse.x * 0.6 + Math.sin(elapsedTime * 0.8) * 0.03;
    this.headGroup.rotation.x = -this.mouse.y * 0.4 + Math.sin(elapsedTime * 1.2) * 0.02;

    // 4. 自然眨眼 (Eye Blinking)
    if (elapsedTime - this.lastBlinkTime > 3.5 + Math.random() * 2) {
      this.lastBlinkTime = elapsedTime;
    }
    const timeSinceBlink = elapsedTime - this.lastBlinkTime;
    let blinkScaleY = 1;
    if (timeSinceBlink < this.blinkDuration) {
      blinkScaleY = Math.sin((timeSinceBlink / this.blinkDuration) * Math.PI) * -0.9 + 1;
      blinkScaleY = Math.max(0.1, blinkScaleY);
    }
    this.leftEye.scale.y = blinkScaleY;
    this.rightEye.scale.y = blinkScaleY;

    // 5. 說話即時口型同步 (Lip-sync Viseme Animation)
    if (this.isSpeaking) {
      const mouthOpen = (Math.sin(elapsedTime * 18) * 0.5 + 0.5) * (0.8 + Math.random() * 0.8);
      this.mouth.scale.set(1.1 + Math.sin(elapsedTime * 12) * 0.2, 1 + mouthOpen * 3.2, 1);
      
      // 說話時頭部自然輕微點頭
      this.headGroup.rotation.x += Math.sin(elapsedTime * 9) * 0.02;
    }

    // 6. 背景粒子漂浮
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
