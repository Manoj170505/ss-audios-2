import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

type RigScale = 'starter' | 'standard' | 'elite';
type LightingMood = 'concert' | 'wedding' | 'club';
type CameraPreset = 'front' | 'booth' | 'aerial';

interface Stage3DExperienceProps {
  onBookStage: (rigLabel: string) => void;
}

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  front: { pos: [0, 4.4, 12.2], target: [0, 2.2, 0] },
  booth: { pos: [2.8, 2.5, 4.4], target: [0, 1.55, 0.2] },
  aerial: { pos: [9.5, 8.2, 10.5], target: [0, 1.8, 0] },
};

const MOOD_COLORS: Record<LightingMood, { beam: number; accent: number; key: number; bg: number }> = {
  concert: { beam: 0xff5a1f, accent: 0xff8c42, key: 0xfff0dd, bg: 0x171717 },
  wedding: { beam: 0xffc857, accent: 0xffe4a1, key: 0xfff6e5, bg: 0x1b1918 },
  club: { beam: 0xff4500, accent: 0x3b82f6, key: 0xdbeafe, bg: 0x11131a },
};

// Scratch objects pre-allocated outside render loop (zero GC)
const _camTargetPos = new THREE.Vector3();
const _camTargetLook = new THREE.Vector3();

function createBrushedStageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#222224';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 64; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, i * 8, 512, 6);
  }
  ctx.strokeStyle = 'rgba(255,90,31,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 488, 488);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 18, 128, 128, 126);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

// Composite 3–12 part procedural Line-Array Speaker Stack (bottom-center pivoted)
function buildSpeakerTower(
  cabinetMat: THREE.MeshStandardMaterial,
  grilleMat: THREE.MeshStandardMaterial,
  metalMat: THREE.MeshStandardMaterial,
  accentMat: THREE.MeshStandardMaterial,
  arrayCount: number,
): THREE.Group {
  const tower = new THREE.Group();

  // 1. Ground Dual-18 Subwoofer Base (matte rugged enclosure)
  const subGeo = new THREE.BoxGeometry(1.35, 1.05, 1.15);
  const sub = new THREE.Mesh(subGeo, cabinetMat);
  sub.position.y = 0.525;
  sub.castShadow = true;
  sub.receiveShadow = true;
  tower.add(sub);

  // 2. Subwoofer perforated front grille (contrast roughness)
  const subGrille = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.9, 0.08), grilleMat);
  subGrille.position.set(0, 0.525, 0.56);
  tower.add(subGrille);

  // 3. Orange SS Audios acoustic badge strip
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.09), accentMat);
  badge.position.set(0, 0.96, 0.56);
  tower.add(badge);

  // 4. Vertical aluminum rigging mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 4.6, 12), metalMat);
  mast.position.set(0, 2.3, -0.35);
  mast.castShadow = true;
  tower.add(mast);

  // 5. Flybar bracket
  const flybar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.85), metalMat);
  flybar.position.set(0, 4.55, 0.02);
  tower.add(flybar);

  // 6. Curved hanging Line-Array elements (variable count by rig scale)
  const cabGeo = new THREE.BoxGeometry(1.18, 0.34, 0.68);
  const faceGeo = new THREE.BoxGeometry(1.08, 0.28, 0.06);
  for (let i = 0; i < arrayCount; i += 1) {
    const unit = new THREE.Group();
    const box = new THREE.Mesh(cabGeo, cabinetMat);
    box.castShadow = true;
    const face = new THREE.Mesh(faceGeo, grilleMat);
    face.position.z = 0.33;
    unit.add(box, face);
    unit.position.set(0, 4.18 - i * 0.4, 0.08 + i * 0.045);
    unit.rotation.x = i * 0.07;
    tower.add(unit);
  }

  return tower;
}

// Composite multi-part DJ & Audio Console Booth (bottom-center pivoted)
function buildDjConsoleBooth(
  frameMat: THREE.MeshStandardMaterial,
  deckMat: THREE.MeshStandardMaterial,
  chromeMat: THREE.MeshStandardMaterial,
  accentMat: THREE.MeshStandardMaterial,
  glowMat: THREE.MeshStandardMaterial,
): THREE.Group {
  const booth = new THREE.Group();

  // 1. Primary sculpted front fascia
  const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.12, 1.05), frameMat);
  frontPanel.position.y = 0.56;
  frontPanel.castShadow = true;
  frontPanel.receiveShadow = true;
  booth.add(frontPanel);

  // 2. Glowing front geometric LED accent strip
  const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.14, 0.05), glowMat);
  ledStrip.position.set(0, 0.62, 0.53);
  booth.add(ledStrip);

  // 3. Beveled tabletop work surface
  const topSlab = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.08, 1.18), deckMat);
  topSlab.position.y = 1.16;
  topSlab.castShadow = true;
  booth.add(topSlab);

  // 4. Center 4-Channel DJ Mixer
  const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.66), deckMat);
  mixer.position.set(0, 1.24, 0.02);
  booth.add(mixer);

  // 5. Dual CDJ Jog-Wheel Decks (left & right)
  const jogGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.07, 24);
  const ringGeo = new THREE.TorusGeometry(0.24, 0.018, 10, 24);
  for (const side of [-0.95, 0.95]) {
    const deckBody = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.09, 0.68), frameMat);
    deckBody.position.set(side, 1.24, 0.02);
    booth.add(deckBody);

    const jog = new THREE.Mesh(jogGeo, chromeMat);
    jog.position.set(side, 1.31, 0.05);
    booth.add(jog);

    const ring = new THREE.Mesh(ringGeo, accentMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(side, 1.345, 0.05);
    booth.add(ring);
  }

  // 6. Twin angled stage monitor wedges
  const wedgeGeo = new THREE.BoxGeometry(0.56, 0.34, 0.44);
  for (const side of [-1.45, 1.45]) {
    const wedge = new THREE.Mesh(wedgeGeo, frameMat);
    wedge.position.set(side, 1.34, -0.2);
    wedge.rotation.x = -0.35;
    wedge.rotation.y = side > 0 ? -0.35 : 0.35;
    booth.add(wedge);
  }

  return booth;
}

export function Stage3DExperience({ onBookStage }: Stage3DExperienceProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [rigScale, setRigScale] = useState<RigScale>('standard');
  const [mood, setMood] = useState<LightingMood>('concert');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
  const [dockOpen, setDockOpen] = useState(true);

  const stateRef = useRef({
    rigScale,
    mood,
    cameraPreset,
    transitionActive: false,
  });

  const sceneHooksRef = useRef<{
    applyRigScale?: (scale: RigScale) => void;
    applyMood?: (nextMood: LightingMood) => void;
    triggerCamera?: (preset: CameraPreset) => void;
  }>({});

  useEffect(() => {
    stateRef.current.rigScale = rigScale;
    sceneHooksRef.current.applyRigScale?.(rigScale);
  }, [rigScale]);

  useEffect(() => {
    stateRef.current.mood = mood;
    sceneHooksRef.current.applyMood?.(mood);
  }, [mood]);

  useEffect(() => {
    stateRef.current.cameraPreset = cameraPreset;
    sceneHooksRef.current.triggerCamera?.(cameraPreset);
  }, [cameraPreset]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 360);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(MOOD_COLORS.concert.bg);
    scene.fog = new THREE.FogExp2(MOOD_COLORS.concert.bg, 0.024);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 120);
    camera.position.set(...CAMERA_PRESETS.front.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Mandatory studio environment reflection via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.front.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 4;
    controls.maxDistance = 24;

    // Warm key directional light + cool sky/ground HemisphereLight fill
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x262626, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.2);
    keyLight.position.set(7, 13, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimPointLeft = new THREE.PointLight(0xff5a1f, 18, 22, 1.8);
    rimPointLeft.position.set(-4.5, 5.2, -2.5);
    scene.add(rimPointLeft);

    const rimPointRight = new THREE.PointLight(0xff8c42, 18, 22, 1.8);
    rimPointRight.position.set(4.5, 5.2, -2.5);
    scene.add(rimPointRight);

    // Shared PBR materials with distinct roughness/metalness contrast
    const stageTex = createBrushedStageTexture();
    stageTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.85, metalness: 0.08 });
    const stageDeckMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: stageTex,
      roughness: 0.42,
      metalness: 0.22,
    });
    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.82, metalness: 0.12 });
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.45, metalness: 0.65 });
    const trussMetalMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.24, metalness: 0.88 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, roughness: 0.15, metalness: 0.94 });
    const accentOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff5a1f,
      emissive: 0xff5a1f,
      emissiveIntensity: 0.65,
      roughness: 0.28,
      metalness: 0.25,
    });
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff5a1f,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Venue floor plane
    const venueFloor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    venueFloor.rotation.x = -Math.PI / 2;
    venueFloor.receiveShadow = true;
    scene.add(venueFloor);

    // Contact shadow plane directly beneath main stage (disjoint Y >= 0.02)
    const shadowTex = createContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 9),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;
    scene.add(contactShadow);

    // Composite Stage Platform Group
    const stageGroup = new THREE.Group();
    const riser = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.72, 6.2), stageDeckMat);
    riser.position.y = 0.36;
    riser.receiveShadow = true;
    riser.castShadow = true;
    stageGroup.add(riser);

    const fascia = new THREE.Mesh(new THREE.BoxGeometry(10.72, 0.12, 6.32), accentOrangeMat);
    fascia.position.y = 0.68;
    stageGroup.add(fascia);

    // Front entry steps
    for (let s = 0; s < 2; s += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.24, 0.45), cabinetMat);
      step.position.set(0, 0.12 + s * 0.24, 3.3 + (1 - s) * 0.45);
      step.receiveShadow = true;
      stageGroup.add(step);
    }

    // Overhead Aluminum Truss Arch (4 pillars + crossbars + LED backdrop frame)
    const pillarGeo = new THREE.BoxGeometry(0.32, 6.2, 0.32);
    const pillarPositions: Array<[number, number]> = [
      [-4.9, -2.6],
      [4.9, -2.6],
      [-4.9, 2.5],
      [4.9, 2.5],
    ];
    for (const [px, pz] of pillarPositions) {
      const pillar = new THREE.Mesh(pillarGeo, trussMetalMat);
      pillar.position.set(px, 3.82, pz);
      pillar.castShadow = true;
      stageGroup.add(pillar);
    }

    const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.32, 0.32), trussMetalMat);
    frontBeam.position.set(0, 6.76, 2.5);
    stageGroup.add(frontBeam);

    const backBeam = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.32, 0.32), trussMetalMat);
    backBeam.position.set(0, 6.76, -2.6);
    stageGroup.add(backBeam);

    for (const sx of [-4.9, 4.9]) {
      const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 5.4), trussMetalMat);
      sideBeam.position.set(sx, 6.76, -0.05);
      stageGroup.add(sideBeam);
    }

    // Rear LED Visual Wall Panel
    const ledWallFrame = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.6, 0.18), cabinetMat);
    ledWallFrame.position.set(0, 2.75, -2.55);
    stageGroup.add(ledWallFrame);

    const ledWallScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 3.25),
      new THREE.MeshStandardMaterial({
        color: 0x2a1812,
        emissive: 0xff5a1f,
        emissiveIntensity: 0.42,
        roughness: 0.25,
        metalness: 0.1,
      }),
    );
    ledWallScreen.position.set(0, 2.75, -2.44);
    stageGroup.add(ledWallScreen);

    // 6 Articulated Moving-Head Stage Lights with Translucent Volumetric Cones
    const movingHeads: THREE.Group[] = [];
    const beamConeGeo = new THREE.ConeGeometry(1.15, 6.2, 20, 1, true);
    beamConeGeo.translate(0, -3.1, 0);

    for (let i = 0; i < 6; i += 1) {
      const lx = -3.75 + i * 1.5;
      const fixture = new THREE.Group();
      fixture.position.set(lx, 6.52, 2.35);

      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.22), cabinetMat);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.32, 16), grilleMat);
      head.position.y = -0.18;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), accentOrangeMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.y = -0.35;
      const cone = new THREE.Mesh(beamConeGeo, beamMat);
      cone.position.y = -0.32;

      fixture.add(yoke, head, lens, cone);
      fixture.rotation.x = -0.28;
      fixture.rotation.z = (i - 2.5) * 0.11;
      stageGroup.add(fixture);
      movingHeads.push(fixture);
    }

    // Center DJ Console Booth seated flush on stage deck (Y = 0.72)
    const djBooth = buildDjConsoleBooth(cabinetMat, stageDeckMat, chromeMat, accentOrangeMat, accentOrangeMat);
    djBooth.position.set(0, 0.72, 0.45);
    stageGroup.add(djBooth);

    // Dynamic Speaker Towers Container (rebuilt when rigScale changes)
    const towersContainer = new THREE.Group();
    stageGroup.add(towersContainer);

    function populateSpeakerTowers(scale: RigScale) {
      while (towersContainer.children.length > 0) {
        towersContainer.remove(towersContainer.children[0]);
      }
      const arrayCount = scale === 'starter' ? 3 : scale === 'standard' ? 5 : 7;
      const leftTower = buildSpeakerTower(cabinetMat, grilleMat, trussMetalMat, accentOrangeMat, arrayCount);
      leftTower.position.set(-4.1, 0.72, 1.3);
      leftTower.rotation.y = 0.18;

      const rightTower = buildSpeakerTower(cabinetMat, grilleMat, trussMetalMat, accentOrangeMat, arrayCount);
      rightTower.position.set(4.1, 0.72, 1.3);
      rightTower.rotation.y = -0.18;

      towersContainer.add(leftTower, rightTower);

      // Elite tier adds front floor sub-bass stacks
      if (scale === 'elite') {
        for (const sx of [-2.85, 2.85]) {
          const extraSub = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.95), cabinetMat);
          extraSub.position.set(sx, 0.36, 3.6);
          extraSub.castShadow = true;
          towersContainer.add(extraSub);
        }
      }
    }

    populateSpeakerTowers(stateRef.current.rigScale);
    scene.add(stageGroup);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function applyCameraTransition(dt: number): boolean {
      if (!stateRef.current.transitionActive) return false;
      const preset = CAMERA_PRESETS[stateRef.current.cameraPreset];
      _camTargetPos.set(...preset.pos);
      _camTargetLook.set(...preset.target);
      const factor = 1 - Math.exp(-5.5 * dt);
      camera.position.lerp(_camTargetPos, factor);
      controls.target.lerp(_camTargetLook, factor);
      if (camera.position.distanceTo(_camTargetPos) < 0.04 && controls.target.distanceTo(_camTargetLook) < 0.04) {
        camera.position.copy(_camTargetPos);
        controls.target.copy(_camTargetLook);
        stateRef.current.transitionActive = false;
        return false;
      }
      return true;
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const stillMoving = applyCameraTransition(dt);
        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (stillMoving || renderDirty) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    // Smooth continuous beam sweep on GPU; on-demand + paced on software WebGL
    function gpuLoop() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now * 0.001;

      for (let i = 0; i < movingHeads.length; i += 1) {
        movingHeads[i].rotation.z = (i - 2.5) * 0.12 + Math.sin(t * 0.85 + i * 0.7) * 0.16;
      }

      applyCameraTransition(dt);
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(gpuLoop);
    }

    const onControlStart = () => {
      stateRef.current.transitionActive = false;
    };
    const onControlChange = () => {
      if (isSoftwareGl) requestRender();
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('change', onControlChange);

    sceneHooksRef.current.applyRigScale = (scale) => {
      populateSpeakerTowers(scale);
      if (isSoftwareGl) requestRender();
    };

    sceneHooksRef.current.applyMood = (nextMood) => {
      const palette = MOOD_COLORS[nextMood];
      scene.background = new THREE.Color(palette.bg);
      scene.fog = new THREE.FogExp2(palette.bg, 0.024);
      keyLight.color.setHex(palette.key);
      rimPointLeft.color.setHex(palette.beam);
      rimPointRight.color.setHex(palette.accent);
      accentOrangeMat.color.setHex(palette.beam);
      accentOrangeMat.emissive.setHex(palette.beam);
      beamMat.color.setHex(palette.beam);
      (ledWallScreen.material as THREE.MeshStandardMaterial).emissive.setHex(palette.beam);
      if (isSoftwareGl) requestRender();
    };

    sceneHooksRef.current.triggerCamera = () => {
      stateRef.current.transitionActive = true;
      if (isSoftwareGl) requestRender();
    };

    const handleResize = () => {
      if (!container || disposed) return;
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 360);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (isSoftwareGl) requestRender();
    };
    window.addEventListener('resize', handleResize);

    if (isSoftwareGl) {
      requestRender();
    } else {
      frameId = requestAnimationFrame(gpuLoop);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      envTex.dispose();
      stageTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  const activeRigLabel =
    rigScale === 'starter'
      ? 'Starter 1,000W Rig'
      : rigScale === 'standard'
        ? 'Standard 5,000W Concert Rig'
        : 'Elite 25,000W+ Arena Rig';

  return (
    <section id="about" className="bg-[#F3F3F3] border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#FF5A1F]">Interactive 3D Stage</p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
              Preview your concert rig in 3D
            </h2>
          </div>
          <p className="text-sm text-neutral-600 max-w-sm">
            Orbit the stage, switch rig power, and test lighting moods live.
          </p>
        </div>

        {/* Full-Width 3D Viewport with Unified Collapsible Bottom Control Dock (no backdrop-filter over WebGL) */}
        <div
          data-testid="stage-3d-viewport"
          className="mt-8 relative w-full h-[460px] sm:h-[540px] lg:h-[600px] rounded-2xl overflow-hidden border border-neutral-300 bg-[#171717]"
        >
          {/* Isolated stable WebGL mount container */}
          <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Minimal top-left spec header (non-occluding, solid rgba surface, zero backdrop-blur) */}
          <div className="pointer-events-none absolute top-4 left-4 bg-[#171717]/90 border border-white/10 rounded-lg px-3.5 py-2 text-white">
            <p className="text-xs font-medium text-neutral-300">Interactive 3D Acoustic Stage</p>
            <p className="text-sm font-display font-semibold">{activeRigLabel} · Drag to Orbit</p>
          </div>

          {/* Collapsible Bottom Control Dock */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(1080px,calc(100%-24px))] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setDockOpen((open) => !open)}
              className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#171717]/95 border border-white/15 text-xs font-medium text-neutral-200 hover:text-white cursor-pointer"
            >
              {dockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {dockOpen ? 'Hide Controls' : 'Show Stage Controls'}
            </button>

            {dockOpen && (
              <div className="w-full bg-[#171717]/95 border border-white/15 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
                {/* Rig Scale */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 mr-1">Rig:</span>
                  {(
                    [
                      ['starter', '1kW'],
                      ['standard', '5kW'],
                      ['elite', '25kW+'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRigScale(val)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        rigScale === val
                          ? 'bg-[#FF5A1F] text-white'
                          : 'bg-white/10 text-neutral-200 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Lighting Mood */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 mr-1">Lighting:</span>
                  {(
                    [
                      ['concert', 'Concert'],
                      ['wedding', 'Wedding Gold'],
                      ['club', 'Club FX'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMood(val)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        mood === val
                          ? 'bg-white text-[#171717]'
                          : 'bg-white/10 text-neutral-200 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Camera Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 mr-1">View:</span>
                  {(
                    [
                      ['front', 'Front'],
                      ['booth', 'DJ Booth'],
                      ['aerial', 'Aerial'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCameraPreset(val)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        cameraPreset === val
                          ? 'bg-white text-[#171717]'
                          : 'bg-white/10 text-neutral-200 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onBookStage(activeRigLabel)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#FF5A1F] hover:bg-[#E04810] text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Book This Stage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
