/* =========================================================
   한글 다마고치 - 3단계 실시간 3D 입체 방 엔진 (Three.js)
========================================================= */

(function () {
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded');
    return;
  }

  let scene, camera, renderer, raycaster, pointer;
  let roomGroup, charGroup, charBodyMesh, charBodyMat, wingLeft, wingRight, eyeLeft, eyeRight, pupilLeft, pupilRight;
  let blushMat, mouthMesh, browLeft, browRight;
  let bedGroup, bowlGroup, washGroup, chestGroup;
  let bowlItemsGroup, washItemsGroup, chestItemsGroup;
  let propGroup, propAppleMesh, propBallMesh, propSoapMesh, propHeadphoneMesh, propBookMesh, propNoteMesh;
  let sunLight, hemiLight, nightLamp;
  let windowSkyMat, windowMoonMesh, windowSunMesh;
  let clockHandHour, clockHandMin;
  let animTime = 0;

  // 13가지 자율 일상 동작 AI 상태 (교감이 없을 때 여유롭고 자연스럽게 실행)
  const IDLE_BEHAVIORS = [
    { id: 'stare_user',  minDur: 4.5, maxDur: 6.5, text: '어? 보고 있구나! 나랑 놀자~ 👀💕' },
    { id: 'stroll',      minDur: 4.0, maxDur: 6.0, text: '어디 보자~ 방 구경 중! 👀' },
    { id: 'roll',        minDur: 3.2, maxDur: 4.4, text: '데굴데굴~ 신나게 굴러가요! 🌀' },
    { id: 'dance',       minDur: 4.0, maxDur: 5.8, text: '룰루랄라~ 엉덩이 춤춰요! 💃' },
    { id: 'music',       minDur: 5.5, maxDur: 7.5, text: '헤드폰 쓰고 동요 듣는 중~ 🎧🎵' },
    { id: 'read',        minDur: 5.5, maxDur: 8.0, text: '가나다라~ 그림책 읽어요 📖' },
    { id: 'ballplay',    minDur: 4.2, maxDur: 5.8, text: '혼자서도 공놀이 잘하죠? ⚽' },
    { id: 'nap_stretch', minDur: 3.4, maxDur: 4.6, text: '으아~ 기지개 쭉쭉 켜요! 🙆' },
    { id: 'spin',        minDur: 3.0, maxDur: 4.2, text: '빙글빙글~ 팽이처럼 돌아요! 💫' },
    { id: 'look_window', minDur: 4.8, maxDur: 6.8, text: '창밖에 구름이 둥실둥실~ ☁️' },
    { id: 'sing',        minDur: 4.2, maxDur: 6.0, text: '아에이오우~ 노래 불러요 🎤🎶' },
    { id: 'peekaboo',    minDur: 3.8, maxDur: 5.0, text: '까꿍! 나 여기 있지롱~ 🙈' },
    { id: 'sit_wiggle',  minDur: 4.5, maxDur: 6.5, text: '포근한 별 카펫이 좋아요~ ⭐' }
  ];

  const idleAI = {
    current: null,       // 현재 진행 중인 동작 객체
    duration: 4.5,       // 이번 동작의 랜덤 지속 시간
    elapsed: 0,
    cooldown: 5.0,       // 행동 사이 여유 텀 (4.5~10.5초 랜덤)
    lastIdx: -1,
    lastInteractAt: 0
  };

  function markUserInteraction() {
    idleAI.lastInteractAt = performance.now();
    if (idleAI.current) {
      idleAI.current = null;
      idleAI.elapsed = 0;
      idleAI.cooldown = 5.5 + Math.random() * 4.5;
      charBodyMesh && (charBodyMesh.rotation.set(0, 0, 0));
    }
  }

  // 캐릭터 3D 이동 및 애니메이션 상태
  const charState = {
    x: 0,
    z: 0.2,
    targetX: 0,
    targetZ: 0.2,
    rotY: 0,
    hopProgress: 1,
    squishTimer: 0,
    actionMode: 'idle', // idle, eat, wash, play, sleep
    actionTimer: 0,
    touchMood: 'none',  // none, tickle, angry
    touchTimer: 0,
    consecutiveTouches: 0,
    lastTouchAt: 0
  };

  // 카메라 오빗(살짝 돌려보기) & 핀치 줌 상태 (최대 멀리서 본 넓은 시점 기준)
  const camOrbit = {
    azimuth: 0.42,      // 양쪽 벽(창문+액자)이 한눈에 보이는 아이소메트릭 코너 각도
    elevation: 0.90,    // 위에서 넓게 내려다보는 각도
    targetAzimuth: 0.42,
    targetElevation: 0.90,
    distance: 15.6,     // 넓은 방 전체가 시원하게 들어오는 기본 거리
    targetDistance: 15.6,
    minDistance: 8.5,
    maxDistance: 21.0,
    isDragging: false,
    isPinching: false,
    pinchStartDist: 0,
    pinchStartCamDist: 15.6,
    startX: 0,
    startY: 0,
    movedDist: 0
  };

  const clickableObjects = [];
  let lastSyncedFood = -1, lastSyncedSoaps = -1, lastSyncedToys = -1;

  // 원목 헤링본 바닥 텍스처 동적 생성
  function createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f6d5a8';
    ctx.fillRect(0, 0, 512, 512);

    const plankW = 64, plankH = 32;
    for (let y = 0; y < 512; y += plankH) {
      for (let x = 0; x < 512; x += plankW) {
        const offset = ((y / plankH) % 2) * (plankW / 2);
        const shade = ((x + y) % 128 === 0) ? '#d69e63' : '#e3b27b';
        ctx.fillStyle = shade;
        ctx.fillRect((x + offset) % 512, y, plankW - 2, plankH - 2);
        ctx.strokeStyle = 'rgba(135, 78, 28, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect((x + offset) % 512, y, plankW - 2, plankH - 2);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.5, 2.5);
    return tex;
  }

  // ㄱ ㄴ ㄷ 액자 텍스처
  function createHangulBoardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 150);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 56px "Jua", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ㄱ ㄴ ㄷ', 128, 74);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px "Jua", "Malgun Gothic", sans-serif';
    ctx.fillText('말랑이의 한글방 ⭐', 128, 126);
    return new THREE.CanvasTexture(canvas);
  }

  function makeRoundedBox(w, h, d, color, roughness = 0.6) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function initThreeRoom() {
    const container = document.getElementById('three-room-container');
    if (!container) return;

    const width = container.clientWidth || 390;
    const height = container.clientHeight || 420;

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // 조명 설정 (눈이 편한 따뜻한 파스텔 톤)
    hemiLight = new THREE.HemisphereLight(0xfef3c7, 0xd97706, 0.48);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfff1d6, 0.62);
    sunLight.position.set(4.5, 7.5, 4.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 20;
    const d = 4.5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    nightLamp = new THREE.PointLight(0xfbbf24, 0, 7);
    nightLamp.position.set(-1.6, 1.5, -1.6);
    scene.add(nightLamp);

    roomGroup = new THREE.Group();
    scene.add(roomGroup);

    buildRoomStructure();
    buildFourFurnitures();
    buildMalrangCharacter();
    buildActionProps();

    setupInteractions(container, renderer.domElement);

    window.addEventListener('resize', () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });

    animate();
  }

  function buildRoomStructure() {
    // 원목 마루 바닥
    const floorGeo = new THREE.BoxGeometry(8.4, 0.25, 8.4);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createWoodFloorTexture(),
      roughness: 0.72,
      metalness: 0.02
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.125;
    floorMesh.receiveShadow = true;
    floorMesh.userData = { type: 'floor' };
    roomGroup.add(floorMesh);
    clickableObjects.push(floorMesh);

    // 중앙 하늘색 별 원형 러그 (넓은 놀이 공간)
    const rugGeo = new THREE.CylinderGeometry(1.6, 1.64, 0.04, 40);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.9 });
    const rugMesh = new THREE.Mesh(rugGeo, rugMat);
    rugMesh.position.set(0, 0.02, 0.15);
    rugMesh.receiveShadow = true;
    rugMesh.userData = { type: 'floor' };
    roomGroup.add(rugMesh);
    clickableObjects.push(rugMesh);

    // 러그 테두리 링
    const rugRingGeo = new THREE.RingGeometry(1.36, 1.48, 40);
    const rugRingMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3, side: THREE.DoubleSide });
    const rugRing = new THREE.Mesh(rugRingGeo, rugRingMat);
    rugRing.rotation.x = -Math.PI / 2;
    rugRing.position.set(0, 0.042, 0.15);
    roomGroup.add(rugRing);

    // 왼쪽 벽면 (따뜻한 오트밀 크림색)
    const wallLeft = makeRoundedBox(0.26, 3.6, 8.4, 0xf3e5c8, 0.88);
    wallLeft.position.set(-4.2, 1.8, 0);
    wallLeft.castShadow = false;
    roomGroup.add(wallLeft);

    // 오른쪽/뒤쪽 벽면 (차분한 파스텔 버터 옐로우)
    const wallBack = makeRoundedBox(8.4, 3.6, 0.26, 0xf6de8a, 0.88);
    wallBack.position.set(0, 1.8, -4.2);
    wallBack.castShadow = false;
    roomGroup.add(wallBack);

    // 걸레받이 (원목 몰딩)
    const trimLeft = makeRoundedBox(0.3, 0.24, 8.42, 0xe7c697, 0.65);
    trimLeft.position.set(-4.18, 0.12, 0);
    roomGroup.add(trimLeft);

    const trimBack = makeRoundedBox(8.42, 0.24, 0.3, 0xe7c697, 0.65);
    trimBack.position.set(0, 0.12, -4.18);
    roomGroup.add(trimBack);

    // 왼쪽 벽 아치형 창문
    const winGroup = new THREE.Group();
    winGroup.position.set(-4.04, 1.95, -0.5);
    winGroup.rotation.y = Math.PI / 2;

    const frameOuter = makeRoundedBox(1.25, 1.45, 0.12, 0xe0a96d, 0.5);
    winGroup.add(frameOuter);

    windowSkyMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const skyPane = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.25), windowSkyMat);
    skyPane.position.z = 0.07;
    winGroup.add(skyPane);

    // 창살
    const barV = makeRoundedBox(0.06, 1.25, 0.04, 0xfef3c7, 0.5);
    barV.position.z = 0.08;
    winGroup.add(barV);
    const barH = makeRoundedBox(1.05, 0.06, 0.04, 0xfef3c7, 0.5);
    barH.position.z = 0.08;
    winGroup.add(barH);

    // 해 / 달 오브젝트
    windowSunMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 20),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    windowSunMesh.position.set(-0.24, 0.3, 0.075);
    winGroup.add(windowSunMesh);

    windowMoonMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 20),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    windowMoonMesh.position.set(0.24, 0.32, 0.075);
    windowMoonMesh.visible = false;
    winGroup.add(windowMoonMesh);

    roomGroup.add(winGroup);

    // 뒤쪽 벽 민트 벽시계
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-1.55, 2.25, -4.04);
    const clockRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.4 })
    );
    clockRim.rotation.x = Math.PI / 2;
    clockGroup.add(clockRim);

    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    clockFace.position.z = 0.045;
    clockGroup.add(clockFace);

    clockHandHour = makeRoundedBox(0.03, 0.16, 0.02, 0x334155);
    clockHandHour.position.set(0, 0.05, 0.055);
    clockGroup.add(clockHandHour);

    clockHandMin = makeRoundedBox(0.025, 0.22, 0.02, 0xf59e0b);
    clockHandMin.position.set(0.05, 0, 0.06);
    clockHandMin.rotation.z = -Math.PI / 3;
    clockGroup.add(clockHandMin);
    roomGroup.add(clockGroup);

    // 뒤쪽 벽 ㄱ ㄴ ㄷ 한글 액자
    const boardMat = new THREE.MeshStandardMaterial({ map: createHangulBoardTexture(), roughness: 0.5 });
    const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.1, 0.08), boardMat);
    boardMesh.position.set(1.45, 2.05, -4.03);
    boardMesh.castShadow = true;
    roomGroup.add(boardMesh);
  }

  function buildFourFurnitures() {
    // 1. 포근한 침대 (좌측 뒤 코너)
    bedGroup = new THREE.Group();
    bedGroup.position.set(-2.85, 0, -2.85);
    const bedFrame = makeRoundedBox(1.5, 0.26, 1.05, 0xdba872, 0.65);
    bedFrame.position.y = 0.13;
    bedFrame.userData = { type: 'bed' };
    bedGroup.add(bedFrame);

    const headboard = makeRoundedBox(0.14, 0.62, 1.05, 0xc89258, 0.65);
    headboard.position.set(-0.68, 0.31, 0);
    headboard.userData = { type: 'bed' };
    bedGroup.add(headboard);

    const mattress = makeRoundedBox(1.36, 0.18, 0.94, 0xffffff, 0.8);
    mattress.position.set(0.04, 0.28, 0);
    mattress.userData = { type: 'bed' };
    bedGroup.add(mattress);

    const blanket = makeRoundedBox(0.95, 0.2, 0.96, 0x7dd3fc, 0.85);
    blanket.position.set(0.25, 0.3, 0);
    blanket.userData = { type: 'bed' };
    bedGroup.add(blanket);

    const pillow = makeRoundedBox(0.32, 0.12, 0.6, 0xf8fafc, 0.9);
    pillow.position.set(-0.42, 0.41, 0);
    pillow.userData = { type: 'bed' };
    bedGroup.add(pillow);

    roomGroup.add(bedGroup);
    clickableObjects.push(bedFrame, blanket, mattress, headboard);

    // 2. 맘마 먹이통 (좌측 앞쪽)
    bowlGroup = new THREE.Group();
    bowlGroup.position.set(-2.85, 0, 2.55);
    const tray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.72, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2b17e, roughness: 0.6 })
    );
    tray.position.y = 0.04;
    tray.receiveShadow = true;
    tray.castShadow = true;
    tray.userData = { type: 'foodbowl' };
    bowlGroup.add(tray);

    const bowlOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.42, 0.28, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.35 })
    );
    bowlOuter.position.y = 0.2;
    bowlOuter.castShadow = true;
    bowlOuter.receiveShadow = true;
    bowlOuter.userData = { type: 'foodbowl' };
    bowlGroup.add(bowlOuter);

    const bowlInside = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.5 })
    );
    bowlInside.position.y = 0.28;
    bowlInside.userData = { type: 'foodbowl' };
    bowlGroup.add(bowlInside);

    bowlItemsGroup = new THREE.Group();
    bowlItemsGroup.position.y = 0.34;
    bowlItemsGroup.userData = { type: 'foodbowl' };
    bowlGroup.add(bowlItemsGroup);

    roomGroup.add(bowlGroup);
    clickableObjects.push(tray, bowlOuter, bowlInside, bowlItemsGroup);

    // 3. 뽀송 세면도구 욕조 (우측 뒤쪽)
    washGroup = new THREE.Group();
    washGroup.position.set(2.85, 0, -2.65);
    const tubOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.54, 0.42, 24),
      new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.35 })
    );
    tubOuter.position.y = 0.23;
    tubOuter.castShadow = true;
    tubOuter.receiveShadow = true;
    tubOuter.userData = { type: 'washstand' };
    washGroup.add(tubOuter);

    const tubWater = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.2, transparent: true, opacity: 0.9 })
    );
    tubWater.position.y = 0.38;
    tubWater.userData = { type: 'washstand' };
    washGroup.add(tubWater);

    washItemsGroup = new THREE.Group();
    washItemsGroup.position.y = 0.43;
    washItemsGroup.userData = { type: 'washstand' };
    washGroup.add(washItemsGroup);

    roomGroup.add(washGroup);
    clickableObjects.push(tubOuter, tubWater, washItemsGroup);

    // 4. 장난감 놀이상자 (우측 앞쪽)
    chestGroup = new THREE.Group();
    chestGroup.position.set(2.85, 0, 2.55);
    const chestBody = makeRoundedBox(1.02, 0.54, 0.82, 0xdba468, 0.65);
    chestBody.position.y = 0.27;
    chestBody.userData = { type: 'toychest' };
    chestGroup.add(chestBody);

    const chestInside = makeRoundedBox(0.86, 0.06, 0.66, 0x925e29, 0.8);
    chestInside.position.y = 0.52;
    chestInside.userData = { type: 'toychest' };
    chestGroup.add(chestInside);

    const chestLid = makeRoundedBox(1.04, 0.1, 0.82, 0xc98d4e, 0.6);
    chestLid.position.set(0, 0.78, -0.42);
    chestLid.rotation.x = -0.85;
    chestLid.userData = { type: 'toychest' };
    chestGroup.add(chestLid);

    chestItemsGroup = new THREE.Group();
    chestItemsGroup.position.y = 0.56;
    chestItemsGroup.userData = { type: 'toychest' };
    chestGroup.add(chestItemsGroup);

    roomGroup.add(chestGroup);
    clickableObjects.push(chestBody, chestInside, chestLid, chestItemsGroup);
  }

  function buildMalrangCharacter() {
    charGroup = new THREE.Group();
    charGroup.position.set(0, 0, 0.2);

    // 몸통 (둥글고 말랑한 클레이 젤리)
    const bodyGeo = new THREE.SphereGeometry(0.54, 32, 28);
    bodyGeo.scale(1.06, 0.96, 1.0);
    charBodyMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.34,
      metalness: 0.04,
      emissive: 0xfde047,
      emissiveIntensity: 0.04
    });
    charBodyMesh = new THREE.Mesh(bodyGeo, charBodyMat);
    charBodyMesh.position.y = 0.5;
    charBodyMesh.castShadow = true;
    charBodyMesh.receiveShadow = true;
    charBodyMesh.userData = { type: 'char' };
    charGroup.add(charBodyMesh);
    clickableObjects.push(charBodyMesh);

    // 머리 위 작은 새싹/유아 벼슬 2개
    const tuftMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
    const tuft1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), tuftMat);
    tuft1.scale.set(0.8, 1.35, 0.8);
    tuft1.position.set(-0.06, 0.55, 0);
    tuft1.rotation.z = 0.25;
    charBodyMesh.add(tuft1);

    const tuft2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), tuftMat);
    tuft2.scale.set(0.8, 1.25, 0.8);
    tuft2.position.set(0.06, 0.53, 0);
    tuft2.rotation.z = -0.3;
    charBodyMesh.add(tuft2);

    // 양쪽 작은 날개
    const wingGeo = new THREE.SphereGeometry(0.16, 16, 16);
    wingGeo.scale(0.65, 1.2, 0.8);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 });
    wingLeft = new THREE.Mesh(wingGeo, wingMat);
    wingLeft.position.set(-0.56, 0.0, 0.05);
    wingLeft.rotation.z = 0.45;
    charBodyMesh.add(wingLeft);

    wingRight = new THREE.Mesh(wingGeo, wingMat);
    wingRight.position.set(0.56, 0.0, 0.05);
    wingRight.rotation.z = -0.45;
    charBodyMesh.add(wingRight);

    // 반짝이는 눈
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), eyeMat);
    eyeLeft.scale.set(1, 1.15, 0.6);
    eyeLeft.position.set(-0.18, 0.08, 0.49);
    charBodyMesh.add(eyeLeft);

    pupilLeft = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), sparkleMat);
    pupilLeft.position.set(-0.02, 0.03, 0.07);
    eyeLeft.add(pupilLeft);

    eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), eyeMat);
    eyeRight.scale.set(1, 1.15, 0.6);
    eyeRight.position.set(0.18, 0.08, 0.49);
    charBodyMesh.add(eyeRight);

    pupilRight = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), sparkleMat);
    pupilRight.position.set(-0.02, 0.03, 0.07);
    eyeRight.add(pupilRight);

    // 핑크 볼터치
    blushMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.68 });
    const blushGeo = new THREE.SphereGeometry(0.09, 14, 14);
    blushGeo.scale(1.2, 0.75, 0.4);
    const blushL = new THREE.Mesh(blushGeo, blushMat);
    blushL.position.set(-0.29, -0.04, 0.44);
    charBodyMesh.add(blushL);

    const blushR = new THREE.Mesh(blushGeo, blushMat);
    blushR.position.set(0.29, -0.04, 0.44);
    charBodyMesh.add(blushR);

    // 화난 눈썹 (기본 숨김)
    const browGeo = new THREE.BoxGeometry(0.16, 0.036, 0.04);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x7c2d12 });
    browLeft = new THREE.Mesh(browGeo, browMat);
    browLeft.position.set(-0.18, 0.21, 0.50);
    browLeft.rotation.z = -0.38;
    browLeft.visible = false;
    charBodyMesh.add(browLeft);

    browRight = new THREE.Mesh(browGeo, browMat);
    browRight.position.set(0.18, 0.21, 0.50);
    browRight.rotation.z = 0.38;
    browRight.visible = false;
    charBodyMesh.add(browRight);

    // 작은 미소 (부리/입)
    mouthMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.016, 8, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x92400e })
    );
    mouthMesh.rotation.z = Math.PI;
    mouthMesh.position.set(0, -0.01, 0.52);
    charBodyMesh.add(mouthMesh);

    roomGroup.add(charGroup);
  }

  function buildActionProps() {
    propGroup = new THREE.Group();

    // 3D 사과 소품
    propAppleMesh = create3DApple();
    propAppleMesh.scale.setScalar(1.4);
    propAppleMesh.visible = false;
    propGroup.add(propAppleMesh);

    // 3D 공 소품
    propBallMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
    );
    propBallMesh.castShadow = true;
    propBallMesh.visible = false;
    propGroup.add(propBallMesh);

    // 3D 비누 소품
    propSoapMesh = makeRoundedBox(0.28, 0.14, 0.18, 0xf472b6, 0.3);
    propSoapMesh.visible = false;
    propGroup.add(propSoapMesh);

    // 3D 파스텔 헤드폰 소품 (음악 듣기용)
    propHeadphoneMesh = new THREE.Group();
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.54, 0.055, 10, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 })
    );
    band.position.y = 0.56;
    propHeadphoneMesh.add(band);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.35 });
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), cupMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.56, 0.54, 0);
    propHeadphoneMesh.add(cupL);
    const cupR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), cupMat);
    cupR.rotation.z = Math.PI / 2;
    cupR.position.set(0.56, 0.54, 0);
    propHeadphoneMesh.add(cupR);
    propHeadphoneMesh.visible = false;
    propGroup.add(propHeadphoneMesh);

    // 3D 펼쳐진 동화책 소품 (책 읽기용)
    propBookMesh = new THREE.Group();
    const coverL = makeRoundedBox(0.32, 0.04, 0.42, 0xf59e0b, 0.5);
    coverL.position.set(-0.16, 0.22, 0.68);
    coverL.rotation.z = 0.22;
    coverL.rotation.x = 0.45;
    propBookMesh.add(coverL);
    const coverR = makeRoundedBox(0.32, 0.04, 0.42, 0xf59e0b, 0.5);
    coverR.position.set(0.16, 0.22, 0.68);
    coverR.rotation.z = -0.22;
    coverR.rotation.x = 0.45;
    propBookMesh.add(coverR);
    const pageL = makeRoundedBox(0.28, 0.03, 0.36, 0xffffff, 0.8);
    pageL.position.set(-0.15, 0.25, 0.68);
    pageL.rotation.z = 0.22;
    pageL.rotation.x = 0.45;
    propBookMesh.add(pageL);
    const pageR = makeRoundedBox(0.28, 0.03, 0.36, 0xffffff, 0.8);
    pageR.position.set(0.15, 0.25, 0.68);
    pageR.rotation.z = -0.22;
    pageR.rotation.x = 0.45;
    propBookMesh.add(pageR);
    propBookMesh.visible = false;
    propGroup.add(propBookMesh);

    // 3D 음표 구슬 (노래 부르기용)
    propNoteMesh = new THREE.Group();
    const noteBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3, emissive: 0xc084fc, emissiveIntensity: 0.25 })
    );
    const noteStem = makeRoundedBox(0.035, 0.24, 0.035, 0xa855f7);
    noteStem.position.set(0.07, 0.12, 0);
    propNoteMesh.add(noteBall, noteStem);
    propNoteMesh.visible = false;
    propGroup.add(propNoteMesh);

    charGroup.add(propGroup);
  }

  function create3DApple() {
    const g = new THREE.Group();
    const apple = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })
    );
    apple.castShadow = true;
    g.add(apple);
    const stem = makeRoundedBox(0.03, 0.08, 0.03, 0x78350f);
    stem.position.y = 0.14;
    g.add(stem);
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 })
    );
    leaf.scale.set(1.4, 0.4, 0.8);
    leaf.position.set(0.05, 0.15, 0);
    g.add(leaf);
    return g;
  }

  function create3DToothbrush() {
    const g = new THREE.Group();
    const handle = makeRoundedBox(0.055, 0.34, 0.04, 0x38bdf8, 0.35);
    handle.position.y = 0.17;
    g.add(handle);
    const head = makeRoundedBox(0.065, 0.1, 0.075, 0xffffff, 0.7);
    head.position.set(0, 0.31, 0.03);
    g.add(head);
    g.rotation.z = -0.35;
    g.rotation.x = 0.2;
    return g;
  }

  // 학습 보상에 따라 3D 가구 내부 아이템 실시간 채우기
  function syncFurnitureRewards() {
    if (typeof gameState === 'undefined') return;

    // 1. 먹이통 3D 사과
    if (gameState.food !== lastSyncedFood) {
      lastSyncedFood = gameState.food;
      while (bowlItemsGroup.children.length > 0) bowlItemsGroup.remove(bowlItemsGroup.children[0]);
      const count = Math.min(6, gameState.food);
      const offsets = [[0, 0, 0], [-0.18, 0, 0.12], [0.18, 0, 0.12], [0, 0, -0.18], [-0.15, 0.16, -0.05], [0.15, 0.16, -0.05]];
      for (let i = 0; i < count; i++) {
        const a = create3DApple();
        a.position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
        a.traverse(child => { child.userData = { type: 'foodbowl_item' }; });
        bowlItemsGroup.add(a);
      }
    }

    // 2. 목욕바구니 3D 비누 & 칫솔
    if (gameState.soaps !== lastSyncedSoaps) {
      lastSyncedSoaps = gameState.soaps;
      while (washItemsGroup.children.length > 0) washItemsGroup.remove(washItemsGroup.children[0]);
      const count = Math.min(6, gameState.soaps);
      for (let i = 0; i < count; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const soap = makeRoundedBox(0.2, 0.1, 0.14, i % 2 === 0 ? 0xf472b6 : 0xfbbf24, 0.3);
        soap.position.set(Math.cos(ang) * 0.24, (i > 2 ? 0.1 : 0), Math.sin(ang) * 0.24);
        soap.rotation.y = ang;
        soap.userData = { type: 'washstand_item' };
        washItemsGroup.add(soap);
      }
      if (count > 0) {
        const brush = create3DToothbrush();
        brush.position.set(0.12, 0.04, 0.08);
        brush.traverse(child => { child.userData = { type: 'washstand_item' }; });
        washItemsGroup.add(brush);
      }
    }

    // 3. 놀이상자 3D 공 & 블록
    if (gameState.toys !== lastSyncedToys) {
      lastSyncedToys = gameState.toys;
      while (chestItemsGroup.children.length > 0) chestItemsGroup.remove(chestItemsGroup.children[0]);
      const count = Math.min(6, gameState.toys);
      const colors = [0x38bdf8, 0xfbbf24, 0xa855f7, 0x34d399, 0xf43f5e, 0xf97316];
      for (let i = 0; i < count; i++) {
        const toy = i % 2 === 0
          ? new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.3 }))
          : makeRoundedBox(0.22, 0.22, 0.22, colors[i], 0.4);
        toy.position.set(((i % 3) - 1) * 0.24, Math.floor(i / 3) * 0.18, (i % 2 === 0 ? 0.1 : -0.1));
        toy.castShadow = true;
        toy.userData = { type: 'toychest_item' };
        chestItemsGroup.add(toy);
      }
    }
  }

  function updateCameraPosition() {
    if (!camera) return;
    const x = Math.sin(camOrbit.azimuth) * camOrbit.distance * Math.cos(camOrbit.elevation);
    const y = Math.sin(camOrbit.elevation) * camOrbit.distance;
    const z = Math.cos(camOrbit.azimuth) * camOrbit.distance * Math.cos(camOrbit.elevation);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0.35, 0);
  }

  function setupInteractions(container, domEl) {
    domEl.style.touchAction = 'none';

    // 문서 내 어떤 버튼/영역이든 사용자가 조작하면 자율 동작을 잠시 멈춤
    document.addEventListener('pointerdown', () => {
      markUserInteraction();
    }, true);

    domEl.addEventListener('pointerdown', (e) => {
      if (camOrbit.isPinching) return;
      markUserInteraction();
      camOrbit.isDragging = true;
      camOrbit.startX = e.clientX;
      camOrbit.startY = e.clientY;
      camOrbit.movedDist = 0;
    });

    window.addEventListener('pointermove', (e) => {
      if (!camOrbit.isDragging || camOrbit.isPinching) return;
      const dx = e.clientX - camOrbit.startX;
      const dy = e.clientY - camOrbit.startY;
      camOrbit.movedDist += Math.hypot(dx, dy);
      camOrbit.startX = e.clientX;
      camOrbit.startY = e.clientY;

      camOrbit.targetAzimuth = Math.max(-0.35, Math.min(0.95, camOrbit.targetAzimuth - dx * 0.0045));
      camOrbit.targetElevation = Math.max(0.45, Math.min(1.18, camOrbit.targetElevation + dy * 0.0035));
    });

    window.addEventListener('pointerup', (e) => {
      if (!camOrbit.isDragging) return;
      camOrbit.isDragging = false;
      if (!camOrbit.isPinching && camOrbit.movedDist < 8) {
        handleTapRayCast(e, domEl);
      }
    });

    // 모바일 두 손가락 핀치 줌 (확대/축소)
    domEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        markUserInteraction();
        camOrbit.isPinching = true;
        camOrbit.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        camOrbit.pinchStartDist = Math.hypot(dx, dy);
        camOrbit.pinchStartCamDist = camOrbit.targetDistance;
      }
    }, { passive: true });

    domEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && camOrbit.isPinching) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (camOrbit.pinchStartDist > 0) {
          const scale = camOrbit.pinchStartDist / Math.max(10, dist);
          camOrbit.targetDistance = Math.max(
            camOrbit.minDistance,
            Math.min(camOrbit.maxDistance, camOrbit.pinchStartCamDist * scale)
          );
        }
      }
    }, { passive: false });

    domEl.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        setTimeout(() => { camOrbit.isPinching = false; }, 60);
      }
    }, { passive: true });

    // PC 마우스 휠 확대/축소 지원
    domEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      markUserInteraction();
      camOrbit.targetDistance = Math.max(
        camOrbit.minDistance,
        Math.min(camOrbit.maxDistance, camOrbit.targetDistance + e.deltaY * 0.006)
      );
    }, { passive: false });
  }

  function handleTapRayCast(e, domEl) {
    const rect = domEl.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickableObjects, true);
    if (hits.length === 0) return;

    const hit = hits[0];
    let targetObj = hit.object;
    while (targetObj && (!targetObj.userData || !targetObj.userData.type)) {
      targetObj = targetObj.parent;
    }
    const type = targetObj ? targetObj.userData.type : null;
    if (!type) return;

    if (type === 'char') {
      markUserInteraction();
      const now = performance.now();
      if (now - charState.lastTouchAt < 2500) {
        charState.consecutiveTouches += 1;
      } else {
        charState.consecutiveTouches = 1;
      }
      charState.lastTouchAt = now;
      charState.squishTimer = 0.45;

      const bubbleTextEl = document.getElementById('bubble-text');

      if (charState.consecutiveTouches >= 4) {
        charState.touchMood = 'angry';
        charState.touchTimer = 2.4;
        if (typeof sfx !== 'undefined' && typeof sfx.playGrumpy === 'function') {
          sfx.playGrumpy();
        } else if (typeof sfx !== 'undefined') {
          sfx.playPop();
        }
        if (typeof spawnParticles === 'function') spawnParticles('💢', 4);
        const angryMsgs = [
          '흥! 너무 많이 만져서 화났어요! 😤',
          '그만! 자꾸 건드리면 삐질 거야! 😠',
          '씩씩... 이제 간지럼 안 탈래요! 💢'
        ];
        const msg = angryMsgs[Math.floor(Math.random() * angryMsgs.length)];
        if (bubbleTextEl) bubbleTextEl.textContent = msg;
        if (typeof showToast === 'function') showToast('말랑이가 계속 만져서 삐졌어요! 😠💢');
      } else {
        charState.touchMood = 'tickle';
        charState.touchTimer = 1.7;
        if (typeof sfx !== 'undefined' && typeof sfx.playTickle === 'function') {
          sfx.playTickle();
        } else if (typeof sfx !== 'undefined') {
          sfx.playBoing();
        }
        if (typeof spawnParticles === 'function') spawnParticles('💖', 4);
        const tickleMsgs = [
          '꺄르륵! 간지러워요! 😆',
          '히히! 거기 간지러워~ 🤭✨',
          '말랑말랑~ 젤리 간지럼 타요! 💖'
        ];
        const msg = tickleMsgs[Math.floor(Math.random() * tickleMsgs.length)];
        if (bubbleTextEl) bubbleTextEl.textContent = msg;
        if (typeof showToast === 'function') showToast('말랑이가 간지럼을 타며 웃어요! 😆✨');
      }
      return;
    }

    if (type === 'bed') {
      moveCharTo(-1.95, -2.1);
      if (typeof toggleSleep === 'function') setTimeout(() => toggleSleep(), 280);
      return;
    }
    if (type === 'foodbowl_item') {
      if (typeof canPerformCareAction === 'function' && !canPerformCareAction('feed')) return;
      moveCharTo(-2.0, 2.05);
      if (typeof feedPet === 'function') setTimeout(() => feedPet(), 280);
      return;
    }
    if (type === 'washstand_item') {
      if (typeof canPerformCareAction === 'function' && !canPerformCareAction('wash')) return;
      moveCharTo(2.0, -1.95);
      if (typeof washPet === 'function') setTimeout(() => washPet(), 280);
      return;
    }
    if (type === 'toychest_item') {
      if (typeof canPerformCareAction === 'function' && !canPerformCareAction('play')) return;
      moveCharTo(2.0, 2.05);
      if (typeof playWithPet === 'function') setTimeout(() => playWithPet(), 280);
      return;
    }

    if (type === 'foodbowl') {
      moveCharTo(-2.0, 2.05);
      if (typeof openQuizModal === 'function') setTimeout(() => openQuizModal('feed'), 220);
      return;
    }
    if (type === 'washstand') {
      moveCharTo(2.0, -1.95);
      if (typeof openQuizModal === 'function') setTimeout(() => openQuizModal('wash'), 220);
      return;
    }
    if (type === 'toychest') {
      moveCharTo(2.0, 2.05);
      if (typeof openQuizModal === 'function') setTimeout(() => openQuizModal('play'), 220);
      return;
    }

    if (type === 'floor') {
      const tx = Math.max(-3.2, Math.min(3.2, hit.point.x));
      const tz = Math.max(-3.1, Math.min(3.2, hit.point.z));
      moveCharTo(tx, tz);
      if (typeof sfx !== 'undefined') sfx.playPop();
    }
  }

  function moveCharTo(tx, tz) {
    charState.targetX = tx;
    charState.targetZ = tz;
    charState.hopProgress = 0;
  }

  // 2D 말풍선(#speech-bubble)과 Lottie(#lottie-care-fx)를 3D 말랑이 머리 위 화면 좌표로 동기화
  function syncOverlayTo3DCharacter() {
    const container = document.getElementById('three-room-container');
    const bubble = document.getElementById('speech-bubble');
    const lottieFx = document.getElementById('lottie-care-fx');
    if (!container || !camera) return;

    const worldPos = new THREE.Vector3(charGroup.position.x, charGroup.position.y + 1.18, charGroup.position.z);
    worldPos.project(camera);

    const sx = (worldPos.x * 0.5 + 0.5) * container.clientWidth;
    const sy = (-worldPos.y * 0.5 + 0.5) * container.clientHeight;

    if (bubble) {
      bubble.style.position = 'absolute';
      bubble.style.left = `${Math.max(85, Math.min(container.clientWidth - 85, sx))}px`;
      bubble.style.top = `${Math.max(36, sy - 18)}px`;
      bubble.style.transform = 'translate(-50%, -100%)';
    }
    if (lottieFx) {
      lottieFx.style.position = 'fixed';
      const rect = container.getBoundingClientRect();
      lottieFx.style.left = `${rect.left + sx}px`;
      lottieFx.style.top = `${rect.top + sy + 28}px`;
      lottieFx.style.transform = 'translate(-50%, -50%)';
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = 0.016;
    animTime += dt;

    // 카메라 부드러운 감속 추적
    camOrbit.azimuth += (camOrbit.targetAzimuth - camOrbit.azimuth) * 0.12;
    camOrbit.elevation += (camOrbit.targetElevation - camOrbit.elevation) * 0.12;
    camOrbit.distance += (camOrbit.targetDistance - camOrbit.distance) * 0.14;
    updateCameraPosition();

    // 시계 바늘 살짝 움직임
    if (clockHandMin) clockHandMin.rotation.z = -animTime * 0.25;

    // 밤/수면 모드 조명 동기화
    const isSleeping = typeof gameState !== 'undefined' && gameState.isSleeping;
    if (sunLight && hemiLight && nightLamp) {
      const targetSun = isSleeping ? 0.14 : 0.62;
      const targetHemi = isSleeping ? 0.24 : 0.48;
      const targetLamp = isSleeping ? 1.25 : 0.0;
      sunLight.intensity += (targetSun - sunLight.intensity) * 0.08;
      hemiLight.intensity += (targetHemi - hemiLight.intensity) * 0.08;
      nightLamp.intensity += (targetLamp - nightLamp.intensity) * 0.08;
      if (windowSkyMat) windowSkyMat.color.setHex(isSleeping ? 0x1e293b : 0x7dd3fc);
      if (windowSunMesh) windowSunMesh.visible = !isSleeping;
      if (windowMoonMesh) windowMoonMesh.visible = isSleeping;
    }

    // 3D 가구 보상 동기화
    syncFurnitureRewards();

    // 캐릭터 이동 & 점프 보간
    const dx = charState.targetX - charState.x;
    const dz = charState.targetZ - charState.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.03) {
      charState.x += dx * 0.08;
      charState.z += dz * 0.08;
      charState.rotY = Math.atan2(dx, dz);
      charGroup.rotation.y += (charState.rotY - charGroup.rotation.y) * 0.15;
    } else if (!idleAI.current || idleAI.current.id !== 'spin') {
      // 정면을 살짝 바라보게 복귀
      charGroup.rotation.y += (0 - charGroup.rotation.y) * 0.05;
    }

    let hopY = 0;
    if (dist > 0.05) {
      hopY = Math.abs(Math.sin(animTime * 11)) * 0.28;
    }
    charGroup.position.set(charState.x, hopY, charState.z);

    // 찌그러짐(Squash & Stretch) & 숨쉬기
    let sx = 1 + Math.sin(animTime * 3.2) * 0.04;
    let sy = 1 - Math.sin(animTime * 3.2) * 0.04;
    if (charState.squishTimer > 0) {
      charState.squishTimer -= dt;
      const p = charState.squishTimer / 0.45;
      sx = 1 + Math.sin(p * Math.PI * 2) * 0.25;
      sy = 1 - Math.sin(p * Math.PI * 2) * 0.22;
      charGroup.position.y += Math.max(0, Math.sin(p * Math.PI) * 0.45);
    }

    // 케어 액션 감지 (app.js 상태 연동)
    const isEating = document.getElementById('slime')?.classList.contains('is-eating-seq');
    const isWashing = document.getElementById('slime')?.classList.contains('is-washing-seq');
    const isPlaying = document.getElementById('slime')?.classList.contains('is-playing-seq');
    const isModalOpen = (document.getElementById('quiz-modal')?.style.display === 'flex') ||
                        (document.getElementById('reward-box-modal')?.style.display === 'flex');

    // 터치 반응 타이머 카운트다운 (간지러움 / 화남)
    if (charState.touchTimer > 0) {
      charState.touchTimer -= dt;
      if (charState.touchTimer <= 0) {
        charState.touchTimer = 0;
        charState.touchMood = 'none';
      }
    }
    if (charState.consecutiveTouches > 0 && performance.now() - charState.lastTouchAt > 3000) {
      charState.consecutiveTouches = 0;
    }

    const isTouchingMood = charState.touchMood !== 'none';
    const canIdleAct = !isSleeping && !isEating && !isWashing && !isPlaying && !isModalOpen && !isTouchingMood &&
                       (performance.now() - idleAI.lastInteractAt > 3800);

    // 13가지 자율 일상 행동 스케줄러 (불규칙하고 여유로운 텀)
    if (!canIdleAct) {
      if (idleAI.current) {
        idleAI.current = null;
        charBodyMesh.rotation.set(0, 0, 0);
      }
    } else if (idleAI.current) {
      idleAI.elapsed += dt;
      if (idleAI.elapsed >= idleAI.duration) {
        idleAI.current = null;
        idleAI.elapsed = 0;
        // 행동 후 4.5초 ~ 10.5초 사이의 자연스러운 휴식 텀
        idleAI.cooldown = 4.5 + Math.random() * 6.0;
        charBodyMesh.rotation.set(0, 0, 0);
      }
    } else {
      idleAI.cooldown -= dt;
      if (idleAI.cooldown <= 0) {
        let nextIdx = Math.floor(Math.random() * IDLE_BEHAVIORS.length);
        if (nextIdx === idleAI.lastIdx) nextIdx = (nextIdx + 1) % IDLE_BEHAVIORS.length;
        idleAI.lastIdx = nextIdx;
        idleAI.current = IDLE_BEHAVIORS[nextIdx];
        idleAI.duration = idleAI.current.minDur + Math.random() * (idleAI.current.maxDur - idleAI.current.minDur);
        idleAI.elapsed = 0;

        const bubbleTextEl = document.getElementById('bubble-text');
        if (bubbleTextEl) bubbleTextEl.textContent = idleAI.current.text;

        // 이동이 필요한 행동 목표 좌표 설정 (넓어진 방 전체 활용)
        if (idleAI.current.id === 'stare_user') {
          // 사용자(카메라) 쪽으로 살짝 다가와 정면 응시
          charState.targetX = 0.35;
          charState.targetZ = 1.65;
        } else if (idleAI.current.id === 'stroll') {
          charState.targetX = -2.2 + Math.random() * 4.4;
          charState.targetZ = -2.0 + Math.random() * 4.2;
        } else if (idleAI.current.id === 'look_window') {
          charState.targetX = -3.1;
          charState.targetZ = -0.45;
        } else if (idleAI.current.id === 'sit_wiggle') {
          charState.targetX = 0;
          charState.targetZ = 0.15;
        } else if (idleAI.current.id === 'roll') {
          charState.targetX = (charState.x > 0 ? -2.0 : 2.0);
          charState.targetZ = 0.3;
        }
      }
    }

    const idleId = idleAI.current ? idleAI.current.id : null;

    propAppleMesh.visible = !!isEating;
    propSoapMesh.visible = !!isWashing;
    propBallMesh.visible = !!isPlaying || idleId === 'ballplay';
    propHeadphoneMesh.visible = idleId === 'music';
    propBookMesh.visible = idleId === 'read';
    propNoteMesh.visible = idleId === 'sing' || idleId === 'music';

    // 기본 몸통 회전 초기화 (특수 모션이 아니면 똑바로)
    if (idleId !== 'roll' && idleId !== 'spin' && idleId !== 'dance' && idleId !== 'stare_user') {
      charBodyMesh.rotation.x += (0 - charBodyMesh.rotation.x) * 0.15;
      charBodyMesh.rotation.z += (0 - charBodyMesh.rotation.z) * 0.15;
    }

    if (isEating) {
      propAppleMesh.position.set(0, 0.5 + Math.sin(animTime * 12) * 0.08, 0.72);
      propAppleMesh.rotation.y += 0.08;
      sx = 1 + Math.sin(animTime * 14) * 0.12;
      sy = 1 - Math.sin(animTime * 14) * 0.1;
    } else if (isWashing) {
      propSoapMesh.position.set(Math.sin(animTime * 9) * 0.45, 0.65, 0.55);
      propSoapMesh.rotation.z = Math.sin(animTime * 9) * 0.5;
    } else if (isPlaying || idleId === 'ballplay') {
      propBallMesh.position.set(0, 0.9 + Math.abs(Math.sin(animTime * 8)) * 0.6, 0.55);
      charGroup.position.y += Math.abs(Math.sin(animTime * 8)) * 0.35;
    } else if (idleId === 'stare_user') {
      // 사용자(카메라 방향)를 향해 고개를 살짝 갸우뚱거리며 쳐다봄
      charGroup.rotation.y += (camOrbit.azimuth - charGroup.rotation.y) * 0.12;
      charBodyMesh.rotation.z = Math.sin(animTime * 1.8) * 0.18;
      charBodyMesh.rotation.x = -0.12;
    } else if (idleId === 'roll') {
      // 데굴데굴 구르기
      charBodyMesh.rotation.z -= 0.14;
      charGroup.position.y += Math.abs(Math.sin(animTime * 6)) * 0.12;
    } else if (idleId === 'dance') {
      // 씰룩씰룩 엉덩이 춤
      charBodyMesh.rotation.z = Math.sin(animTime * 10) * 0.24;
      charGroup.position.y += Math.abs(Math.sin(animTime * 10)) * 0.2;
      sx = 1 + Math.sin(animTime * 10) * 0.09;
      sy = 1 - Math.sin(animTime * 10) * 0.09;
    } else if (idleId === 'music') {
      // 헤드폰 쓰고 리듬 타기
      charBodyMesh.rotation.z = Math.sin(animTime * 6.5) * 0.14;
      charGroup.position.y += Math.abs(Math.sin(animTime * 6.5)) * 0.08;
      propNoteMesh.position.set(0.45, 1.15 + Math.sin(animTime * 4) * 0.18, 0.1);
      propNoteMesh.rotation.y += 0.05;
    } else if (idleId === 'read') {
      // 동화책 읽으며 살짝 앞뒤 끄덕임
      charBodyMesh.rotation.x = 0.16 + Math.sin(animTime * 3) * 0.04;
    } else if (idleId === 'nap_stretch') {
      // 기지개 쭉쭉 켜기
      const st = Math.sin((idleAI.elapsed / idleAI.duration) * Math.PI);
      sy = 1 + st * 0.35;
      sx = 1 - st * 0.16;
    } else if (idleId === 'spin') {
      // 빙그르르 팽이 돌기
      charGroup.rotation.y += 0.22;
      charGroup.position.y += Math.abs(Math.sin(animTime * 9)) * 0.14;
    } else if (idleId === 'sing') {
      // 노래 부르기
      charBodyMesh.rotation.x = -0.1 + Math.sin(animTime * 8) * 0.08;
      sy = 1 + Math.sin(animTime * 8) * 0.08;
      propNoteMesh.position.set(Math.sin(animTime * 3) * 0.35, 1.2 + (idleAI.elapsed % 1.2) * 0.4, 0.25);
      propNoteMesh.rotation.y += 0.08;
    } else if (idleId === 'peekaboo') {
      // 웅크렸다가 까꿍! 점프
      const phase = (idleAI.elapsed % 2.0) / 2.0;
      if (phase < 0.55) {
        sy = 0.68;
        sx = 1.24;
      } else {
        const jp = Math.sin(((phase - 0.55) / 0.45) * Math.PI);
        charGroup.position.y += jp * 0.65;
        sy = 1.15;
        sx = 0.9;
      }
    } else if (idleId === 'sit_wiggle') {
      // 러그 위에서 꼼지락
      charBodyMesh.rotation.z = Math.sin(animTime * 4) * 0.08;
      sy = 0.92 + Math.sin(animTime * 4) * 0.03;
      sx = 1.08;
    }

    // 4가지 상태 표정 + 터치 반응(간지러움/화남) 모션 및 표정 반영
    const isSleepy = isSleeping || document.getElementById('slime')?.classList.contains('state-sleepy');
    if (charState.touchMood === 'tickle') {
      // 간지러움: 몸을 좌우로 배배 꼬며 폴짝폴짝 + 반달 눈웃음 + 큰 미소
      charBodyMesh.rotation.z = Math.sin(animTime * 26) * 0.24;
      charGroup.position.y += Math.abs(Math.sin(animTime * 18)) * 0.22;
      sx = 1 + Math.sin(animTime * 22) * 0.12;
      sy = 1 - Math.sin(animTime * 22) * 0.1;
      if (eyeLeft && eyeRight) {
        eyeLeft.scale.y = 0.32;
        eyeRight.scale.y = 0.32;
      }
      if (browLeft && browRight) {
        browLeft.visible = false;
        browRight.visible = false;
      }
      if (mouthMesh) {
        mouthMesh.rotation.z = Math.PI;
        mouthMesh.position.y = -0.01;
        mouthMesh.scale.set(1.35, 1.35, 1);
      }
      if (charBodyMat) {
        charBodyMat.emissive.setHex(0xfde047);
        charBodyMat.emissiveIntensity = 0.08;
      }
      if (blushMat) {
        blushMat.color.setHex(0xfb7185);
        blushMat.opacity = 0.92;
      }
    } else if (charState.touchMood === 'angry') {
      // 화남: 씩씩거리며 붉어지고 부르르 떨림 + V자 눈썹 + 삐죽 입
      charBodyMesh.rotation.z = Math.sin(animTime * 36) * 0.13;
      charBodyMesh.rotation.x = 0.08;
      sx = 1.12 + Math.sin(animTime * 18) * 0.08;
      sy = 0.9 - Math.sin(animTime * 18) * 0.06;
      if (eyeLeft && eyeRight) {
        eyeLeft.scale.y = 0.85;
        eyeRight.scale.y = 0.85;
      }
      if (browLeft && browRight) {
        browLeft.visible = true;
        browRight.visible = true;
      }
      if (mouthMesh) {
        mouthMesh.rotation.z = 0;
        mouthMesh.position.y = -0.05;
        mouthMesh.scale.set(1.1, 1.1, 1);
      }
      if (charBodyMat) {
        charBodyMat.emissive.setHex(0xef4444);
        charBodyMat.emissiveIntensity = 0.24;
      }
      if (blushMat) {
        blushMat.color.setHex(0xef4444);
        blushMat.opacity = 0.85;
      }
    } else {
      if (eyeLeft && eyeRight) {
        eyeLeft.scale.y = isSleepy ? 0.2 : 1.15;
        eyeRight.scale.y = isSleepy ? 0.2 : 1.15;
      }
      if (browLeft && browRight) {
        browLeft.visible = false;
        browRight.visible = false;
      }
      if (mouthMesh) {
        mouthMesh.rotation.z = Math.PI;
        mouthMesh.position.y = -0.01;
        mouthMesh.scale.set(1, 1, 1);
      }
      if (charBodyMat) {
        charBodyMat.emissive.setHex(0xfde047);
        charBodyMat.emissiveIntensity = 0.04;
      }
      if (blushMat) {
        blushMat.color.setHex(0xfb7185);
        blushMat.opacity = 0.68;
      }
    }

    // 날개 파닥임
    if (wingLeft && wingRight) {
      const flapSpeed = (charState.touchMood === 'tickle' || charState.touchMood === 'angry') ? 22 :
                        (isPlaying || idleId === 'dance' || idleId === 'sing' ? 14 : 5);
      const flap = Math.sin(animTime * flapSpeed) * 0.25;
      wingLeft.rotation.z = 0.45 + flap;
      wingRight.rotation.z = -0.45 - flap;
    }

    charBodyMesh.scale.set(sx * 1.06, sy * 0.96, sx);

    syncOverlayTo3DCharacter();
    renderer.render(scene, camera);
  }

  // DOM 로드 후 3D 방 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeRoom);
  } else {
    initThreeRoom();
  }
})();
