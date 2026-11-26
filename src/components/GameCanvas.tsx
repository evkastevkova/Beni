import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, ArrowUp, Compass, Heart, Pause, Volume2, VolumeX} from 'lucide-react';
import {sound} from '../game/sound';
import {LevelDef} from '../types/game';
import {CompanionAvatarSvg} from './AnimatedCompanion';

interface GameCanvasProps {
  level: LevelDef;
  lives: number;
  score: number;
  isPaused: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onAddScore: (points: number) => void;
  onLoseLife: () => void;
  onOpenMathGate: () => void;
  mathGateSolved: boolean;
  onOpenPortal: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface EnemyRuntime {
  id: string;
  kind: 'skriatok' | 'chrobak' | 'havran';
  name: string;
  x: number;
  y: number;
  baseY: number;
  minX: number;
  maxX: number;
  speed: number;
  dir: number;
  amplitudeY: number;
  stunnedUntil: number;
}

const VIEW_W = 960;
const VIEW_H = 540;
const GRAVITY = 1480;
const MOVE_SPEED = 305;
const JUMP_VEL = -610;
const DOUBLE_JUMP_VEL = -540;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  lives,
  score,
  isPaused,
  muted,
  onToggleMute,
  onPause,
  onAddScore,
  onLoseLife,
  onOpenMathGate,
  mathGateSolved,
  onOpenPortal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [checkpointReached, setCheckpointReached] = useState(false);
  const [toast, setToast] = useState<string | null>(level.introMessage);

  // Refs synced with latest props so animation loop stays clean
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;
  const gateSolvedRef = useRef(mathGateSolved);
  gateSolvedRef.current = mathGateSolved;
  const livesRef = useRef(lives);
  livesRef.current = lives;

  const callbacksRef = useRef({
    onAddScore,
    onLoseLife,
    onOpenMathGate,
    onOpenPortal,
  });
  callbacksRef.current = {
    onAddScore,
    onLoseLife,
    onOpenMathGate,
    onOpenPortal,
  };

  // Input state ref (keyboard + multi-touch pointers)
  const inputRef = useRef({
    left: false,
    right: false,
    jumpPressed: false,
    jumpQueued: false,
  });

  // Mutable simulation state
  const simRef = useRef({
    time: 0,
    playerX: 90,
    playerY: 400,
    vx: 0,
    vy: 0,
    w: 36,
    h: 48,
    facing: 1,
    onGround: false,
    jumpsRemaining: 2,
    coyoteTimer: 0,
    invincibleUntil: 0,
    safeX: 90,
    safeY: 400,
    checkpointLit: false,
    gateTriggered: false,
    portalTriggered: false,
    portalWarnCooldownUntil: 0,
    cameraX: 0,
    companionX: 45,
    companionY: 360,
    collectedSet: new Set<string>(),
    herbTriggered: new Set<number>(),
    mushroomBounceTimers: new Map<number, number>(),
    particles: [] as Particle[],
    enemies: [] as EnemyRuntime[],
  });

  // Reset simulation whenever level changes
  useEffect(() => {
    const s = simRef.current;
    s.time = 0;
    s.playerX = 90;
    s.playerY = 400;
    s.vx = 0;
    s.vy = 0;
    s.facing = 1;
    s.onGround = false;
    s.jumpsRemaining = 2;
    s.coyoteTimer = 0;
    s.invincibleUntil = 0;
    s.safeX = 90;
    s.safeY = 400;
    s.checkpointLit = false;
    s.gateTriggered = false;
    s.portalTriggered = false;
    s.portalWarnCooldownUntil = 0;
    s.cameraX = 0;
    s.companionX = 45;
    s.companionY = 360;
    s.collectedSet = new Set();
    s.herbTriggered = new Set();
    s.mushroomBounceTimers = new Map();
    s.particles = [];
    s.enemies = level.enemies.map((e) => ({
      id: e.id,
      kind: e.kind,
      name: e.name,
      x: e.x,
      y: e.y,
      baseY: e.y,
      minX: e.minX,
      maxX: e.maxX,
      speed: e.speed,
      dir: 1,
      amplitudeY: e.amplitudeY ?? 0,
      stunnedUntil: 0,
    }));
    setCollectedIds([]);
    setCheckpointReached(false);
    setToast(level.introMessage);
  }, [level]);

  // Auto-hide toast after 4.2s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset portal/gate re-trigger guard when modal closes
  useEffect(() => {
    if (!isPaused) {
      if (mathGateSolved) {
        simRef.current.gateTriggered = true;
      } else {
        // If player closed or lost life, allow re-entering after stepping away slightly
        const s = simRef.current;
        if (Math.abs(s.playerX - level.gateX) > 40) {
          s.gateTriggered = false;
        }
      }
      if (Math.abs(simRef.current.playerX - level.portalX) > 45) {
        simRef.current.portalTriggered = false;
      }
    }
  }, [isPaused, mathGateSolved, level.gateX, level.portalX]);

  const triggerJump = useCallback(() => {
    inputRef.current.jumpQueued = true;
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (!e.repeat) {
          triggerJump();
        }
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerJump]);

  // Main 60fps Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const spawnParticles = (x: number, y: number, color: string, count = 10) => {
      const s = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const spd = 60 + Math.random() * 140;
        s.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 40,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          color,
          size: 3 + Math.random() * 3.5,
        });
      }
    };

    const hurtPlayer = (reasonText: string, respawnAtCheckpoint = false) => {
      const s = simRef.current;
      if (s.time < s.invincibleUntil) return;
      s.invincibleUntil = s.time + 1.5;
      sound.playHurt();
      spawnParticles(s.playerX + s.w / 2, s.playerY + s.h / 2, '#FB7185', 14);
      setToast(reasonText);
      callbacksRef.current.onLoseLife();

      if (respawnAtCheckpoint) {
        s.playerX = s.safeX;
        s.playerY = s.safeY - 12;
        s.vx = 0;
        s.vy = -120;
      } else {
        s.vy = -340;
        s.vx = -s.facing * 180;
      }
    };

    const getPlatformRect = (p: LevelDef['platforms'][number], t: number) => {
      let x = p.x;
      let y = p.y;
      let dx = 0;
      if (p.moving) {
        const offset = Math.sin(t * p.moving.speed) * p.moving.range;
        const prevOffset = Math.sin((t - 0.016) * p.moving.speed) * p.moving.range;
        if (p.moving.axis === 'x') {
          x += offset;
          dx = offset - prevOffset;
        } else {
          y += offset;
        }
      }
      return {x, y, w: p.w, h: p.h, dx, kind: p.kind};
    };

    const step = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.035);

      const s = simRef.current;

      if (!pausedRef.current && livesRef.current > 0) {
        s.time += dt;

        // Horizontal movement
        const moveDir = (inputRef.current.right ? 1 : 0) - (inputRef.current.left ? 1 : 0);
        if (moveDir !== 0) {
          s.vx = moveDir * MOVE_SPEED;
          s.facing = moveDir;
        } else {
          s.vx *= Math.pow(0.001, dt);
          if (Math.abs(s.vx) < 8) s.vx = 0;
        }

        // Coyote time
        if (s.onGround) {
          s.coyoteTimer = 0.11;
          s.jumpsRemaining = 2;
        } else {
          s.coyoteTimer = Math.max(0, s.coyoteTimer - dt);
        }

        // Jump handling (coyote + double jump)
        if (inputRef.current.jumpQueued) {
          inputRef.current.jumpQueued = false;
          if (s.coyoteTimer > 0) {
            s.vy = JUMP_VEL;
            s.onGround = false;
            s.coyoteTimer = 0;
            s.jumpsRemaining = 1;
            sound.playJump();
            spawnParticles(s.playerX + s.w / 2, s.playerY + s.h, '#BBF7D0', 6);
          } else if (s.jumpsRemaining > 0) {
            s.vy = DOUBLE_JUMP_VEL;
            s.jumpsRemaining = 0;
            sound.playJump();
            spawnParticles(s.playerX + s.w / 2, s.playerY + s.h, '#FDE68A', 8);
          }
        }

        const prevBottom = s.playerY + s.h;
        s.vy = Math.min(s.vy + GRAVITY * dt, 920);
        s.playerX += s.vx * dt;
        s.playerY += s.vy * dt;

        // World bounds & gate barrier
        if (s.playerX < 12) s.playerX = 12;
        if (s.playerX > level.worldWidth - s.w - 12) {
          s.playerX = level.worldWidth - s.w - 12;
        }

        // Check Math Gate trigger if not solved yet
        if (!gateSolvedRef.current && s.playerX + s.w >= level.gateX - 18) {
          s.playerX = level.gateX - s.w - 22;
          if (!s.gateTriggered) {
            s.gateTriggered = true;
            inputRef.current.left = false;
            inputRef.current.right = false;
            callbacksRef.current.onOpenMathGate();
          }
        }

        // Platform collisions
        s.onGround = false;
        for (const p of level.platforms) {
          const rect = getPlatformRect(p, s.time);
          const overlapX = s.playerX + s.w - 6 > rect.x && s.playerX + 6 < rect.x + rect.w;
          if (!overlapX) continue;

          if (rect.kind === 'grass') {
            // Solid top surface
            if (s.vy >= 0 && prevBottom <= rect.y + 18 && s.playerY + s.h >= rect.y) {
              s.playerY = rect.y - s.h;
              s.vy = 0;
              s.onGround = true;
            }
          } else {
            // Smooth one-way jump-through wooden/branch/stone platforms
            if (s.vy >= 0 && prevBottom <= rect.y + 16 && s.playerY + s.h >= rect.y) {
              s.playerY = rect.y - s.h;
              s.vy = 0;
              s.onGround = true;
              s.playerX += rect.dx;
            }
          }
        }

        // Bouncy mushrooms
        level.mushrooms.forEach((m, idx) => {
          const distX = Math.abs(s.playerX + s.w / 2 - m.x);
          const distY = Math.abs(s.playerY + s.h - (m.y - 16));
          if (s.vy >= 0 && distX < 30 && distY < 26) {
            s.vy = m.power;
            s.onGround = false;
            s.jumpsRemaining = 1;
            s.mushroomBounceTimers.set(idx, s.time + 0.35);
            sound.playBounce();
            spawnParticles(m.x, m.y - 16, '#FDE047', 12);
          }
        });

        // Interactive herbs (pollen sparkle!)
        level.herbs.forEach((h, idx) => {
          if (!s.herbTriggered.has(idx)) {
            if (Math.abs(s.playerX + s.w / 2 - h.x) < 28 && Math.abs(s.playerY + s.h - h.y) < 34) {
              s.herbTriggered.add(idx);
              sound.playHerbSparkle();
              spawnParticles(h.x, h.y - 16, '#86EFAC', 8);
              callbacksRef.current.onAddScore(5);
            }
          }
        });

        // Stream fall hazard
        for (const st of level.streams) {
          if (
            s.playerX + s.w / 2 > st.x + 8 &&
            s.playerX + s.w / 2 < st.x + st.w - 8 &&
            s.playerY + s.h > st.y + 8
          ) {
            hurtPlayer('Žblnk! Spadol si do horskej bystriny (−1 život).', true);
            break;
          }
        }

        // Pit safety net
        if (s.playerY > VIEW_H + 40) {
          hurtPlayer('Pozor na krok! (−1 život)', true);
        }

        // Checkpoint lantern
        if (!s.checkpointLit && Math.abs(s.playerX + s.w / 2 - level.checkpointX) < 38) {
          s.checkpointLit = true;
          s.safeX = level.checkpointX - 18;
          s.safeY = level.checkpointY - s.h;
          setCheckpointReached(true);
          sound.playCheckpoint();
          spawnParticles(level.checkpointX, level.checkpointY - 46, '#FBBF24', 18);
          setToast('Lesný lampášik zažatý! Checkpoint uložený.');
        }

        // Collectible Letters
        for (const l of level.letters) {
          if (s.collectedSet.has(l.id)) continue;
          const dx = s.playerX + s.w / 2 - l.x;
          const dy = s.playerY + s.h / 2 - l.y;
          if (Math.hypot(dx, dy) < 34) {
            s.collectedSet.add(l.id);
            const count = s.collectedSet.size;
            setCollectedIds(Array.from(s.collectedSet));
            sound.playLetterCollect(count);
            spawnParticles(l.x, l.y, l.char === 'Y' || l.char === 'Ý' ? '#F59E0B' : '#34D399', 14);
            callbacksRef.current.onAddScore(l.char === 'Y' || l.char === 'Ý' ? 40 : 25);
            if (count === level.letters.length) {
              s.portalTriggered = false;
              setToast('Skvelé! Máš všetky písmená. Vstúp do portálu PRÍBEH na konci lesa!');
            }
          }
        }

        // Enemies update & collision
        for (const e of s.enemies) {
          if (e.kind === 'havran') {
            e.x += e.speed * e.dir * dt;
            if (e.x > e.maxX) {
              e.x = e.maxX;
              e.dir = -1;
            } else if (e.x < e.minX) {
              e.x = e.minX;
              e.dir = 1;
            }
            e.y = e.baseY + Math.sin(s.time * 3.2 + e.x * 0.02) * e.amplitudeY;
          } else {
            if (s.time >= e.stunnedUntil) {
              e.x += e.speed * e.dir * dt;
              if (e.x > e.maxX) {
                e.x = e.maxX;
                e.dir = -1;
              } else if (e.x < e.minX) {
                e.x = e.minX;
                e.dir = 1;
              }
            }
          }

          if (s.time < e.stunnedUntil) continue;

          const ex = e.x;
          const ey = e.kind === 'havran' ? e.y : e.y - 34;
          const ew = 36;
          const eh = 34;

          const hit =
            s.playerX + s.w - 6 > ex - ew / 2 &&
            s.playerX + 6 < ex + ew / 2 &&
            s.playerY + s.h - 4 > ey &&
            s.playerY + 6 < ey + eh;

          if (hit) {
            // Stomp if falling onto grounded enemy
            if (e.kind !== 'havran' && s.vy > 40 && s.playerY + s.h - 14 < ey + 14) {
              e.stunnedUntil = s.time + 3.5;
              s.vy = -450;
              s.jumpsRemaining = 1;
              sound.playStomp();
              spawnParticles(ex, ey + 10, '#A3E635', 12);
              callbacksRef.current.onAddScore(30);
            } else {
              hurtPlayer(`Au! Zrazil si sa s bytosťou (${e.name}) (−1 život).`, false);
            }
          }
        }

        // End Portal check
        const nearPortal =
          Math.abs(s.playerX + s.w / 2 - level.portalX) < 48 &&
          Math.abs(s.playerY + s.h - level.portalY) < 65;

        if (!nearPortal) {
          s.portalTriggered = false;
        }

        if (gateSolvedRef.current && nearPortal) {
          if (s.collectedSet.size < level.letters.length) {
            if (s.time >= s.portalWarnCooldownUntil) {
              const missing = level.letters.length - s.collectedSet.size;
              s.portalWarnCooldownUntil = s.time + 2.6;
              setToast(`Ešte ti chýba ${missing} písmen! Vráť sa po ne a potom vstúp do portálu.`);
            }
          } else if (!s.portalTriggered) {
            s.portalTriggered = true;
            inputRef.current.left = false;
            inputRef.current.right = false;
            callbacksRef.current.onOpenPortal();
          }
        }

        // Camera smooth follow
        const targetCam = Math.max(0, Math.min(level.worldWidth - VIEW_W, s.playerX - VIEW_W * 0.36));
        s.cameraX += (targetCam - s.cameraX) * Math.min(1, dt * 8);

        // Companion follow
        const targetCompX = s.playerX - s.facing * 48;
        const targetCompY = s.playerY - 22 + Math.sin(s.time * 4) * 8;
        s.companionX += (targetCompX - s.companionX) * Math.min(1, dt * 5);
        s.companionY += (targetCompY - s.companionY) * Math.min(1, dt * 5);

        // Particles update
        s.particles = s.particles.filter((pt) => {
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 420 * dt;
          pt.life -= dt;
          return pt.life > 0;
        });
      }

      // ================= RENDER =================
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const targetW = Math.round(VIEW_W * dpr);
          const targetH = Math.round(VIEW_H * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          // 1. Sky Gradient
          const skyGrad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
          skyGrad.addColorStop(0, level.skyTop);
          skyGrad.addColorStop(1, level.skyBottom);
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, VIEW_W, VIEW_H);

          // Sun & soft sunbeams
          ctx.save();
          ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
          ctx.beginPath();
          ctx.arc(820 - s.cameraX * 0.05, 85, 58, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(820 - s.cameraX * 0.05, 85, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 2. Parallax Distant Forest Hills
          ctx.fillStyle = '#A7F3D0';
          ctx.beginPath();
          ctx.moveTo(0, VIEW_H);
          for (let x = 0; x <= VIEW_W + 40; x += 40) {
            const wx = x + s.cameraX * 0.18;
            const y = 315 + Math.sin(wx * 0.004) * 38 + Math.cos(wx * 0.009) * 18;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(VIEW_W, VIEW_H);
          ctx.closePath();
          ctx.fill();

          // Mid-ground rolling forest meadow
          ctx.fillStyle = '#6EE7B7';
          ctx.beginPath();
          ctx.moveTo(0, VIEW_H);
          for (let x = 0; x <= VIEW_W + 40; x += 40) {
            const wx = x + s.cameraX * 0.35;
            const y = 365 + Math.sin(wx * 0.006 + 1.4) * 28;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(VIEW_W, VIEW_H);
          ctx.closePath();
          ctx.fill();

          // Parallax Background Beech & Birch Trees
          for (let tx = 80; tx < level.worldWidth; tx += 220) {
            const sx = tx - s.cameraX * 0.55;
            if (sx < -120 || sx > VIEW_W + 120) continue;
            const isBirch = (tx / 220) % 2 === 0;
            ctx.fillStyle = isBirch ? '#F5F5F4' : '#78350F';
            ctx.fillRect(sx - 10, 210, 20, 260);
            if (isBirch) {
              ctx.fillStyle = '#44403C';
              ctx.fillRect(sx - 10, 260, 10, 4);
              ctx.fillRect(sx, 310, 10, 4);
              ctx.fillRect(sx - 8, 360, 12, 4);
            }
            ctx.fillStyle = isBirch ? 'rgba(34, 197, 94, 0.72)' : 'rgba(21, 128, 61, 0.75)';
            ctx.beginPath();
            ctx.arc(sx, 195, 58, 0, Math.PI * 2);
            ctx.arc(sx - 34, 218, 38, 0, Math.PI * 2);
            ctx.arc(sx + 34, 218, 38, 0, Math.PI * 2);
            ctx.fill();
          }

          // World-space transform
          ctx.save();
          ctx.translate(-s.cameraX, 0);

          // 3. Scenic Cattle (Dobytok: býk, kobyla, byvol, teliatko)
          for (const c of level.cattle) {
            const bob = Math.sin(s.time * 2 + c.x * 0.01) * 1.8;
            ctx.save();
            ctx.translate(c.x, c.y + bob);
            // Body
            const bodyColor =
              c.animal === 'byvol' ? '#3F3F46' : c.animal === 'kobyla' ? '#92400E' : c.animal === 'byk' ? '#78350F' : '#FEF3C7';
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.roundRect(-24, -14, 48, 26, 10);
            ctx.fill();
            // Spots for teliatko
            if (c.animal === 'teliatko') {
              ctx.fillStyle = '#B45309';
              ctx.beginPath();
              ctx.arc(-6, -4, 7, 0, Math.PI * 2);
              ctx.arc(10, 2, 5, 0, Math.PI * 2);
              ctx.fill();
            }
            // Legs
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-18, 10, 6, 18);
            ctx.fillRect(-6, 10, 6, 18);
            ctx.fillRect(6, 10, 6, 18);
            ctx.fillRect(14, 10, 6, 18);
            // Head
            ctx.beginPath();
            ctx.arc(26, -10, 12, 0, Math.PI * 2);
            ctx.fill();
            // Horns or mane
            if (c.animal === 'byk' || c.animal === 'byvol') {
              ctx.strokeStyle = '#FDE68A';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(22, -20);
              ctx.quadraticCurveTo(15, -28, 20, -30);
              ctx.moveTo(30, -20);
              ctx.quadraticCurveTo(37, -28, 32, -30);
              ctx.stroke();
            } else if (c.animal === 'kobyla') {
              ctx.fillStyle = '#451A03';
              ctx.fillRect(14, -22, 6, 16);
            }
            // Eye
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.arc(30, -12, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 4. Streams (Bystriny)
          for (const st of level.streams) {
            const waterGrad = ctx.createLinearGradient(0, st.y, 0, st.y + st.h);
            waterGrad.addColorStop(0, '#38BDF8');
            waterGrad.addColorStop(1, '#0284C7');
            ctx.fillStyle = waterGrad;
            ctx.fillRect(st.x, st.y, st.w, st.h);

            // Animated foaming ripples
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let wx = st.x; wx <= st.x + st.w; wx += 12) {
              const wy = st.y + 8 + Math.sin(wx * 0.12 + s.time * 6) * 3;
              if (wx === st.x) ctx.moveTo(wx, wy);
              else ctx.lineTo(wx, wy);
            }
            ctx.stroke();
          }

          // 5. Platforms
          for (const p of level.platforms) {
            const r = getPlatformRect(p, s.time);
            if (r.kind === 'grass') {
              ctx.fillStyle = '#78350F';
              ctx.fillRect(r.x, r.y + 12, r.w, r.h - 12);
              ctx.fillStyle = '#16A34A';
              ctx.beginPath();
              ctx.roundRect(r.x, r.y, r.w, 20, [10, 10, 4, 4]);
              ctx.fill();
              ctx.fillStyle = '#22C55E';
              ctx.fillRect(r.x + 4, r.y, r.w - 8, 6);
            } else if (r.kind === 'stone') {
              ctx.fillStyle = '#64748B';
              ctx.beginPath();
              ctx.roundRect(r.x, r.y, r.w, r.h, 10);
              ctx.fill();
              ctx.fillStyle = '#94A3B8';
              ctx.beginPath();
              ctx.roundRect(r.x + 6, r.y + 3, r.w - 12, 6, 4);
              ctx.fill();
            } else if (r.kind === 'wood') {
              ctx.fillStyle = '#92400E';
              ctx.beginPath();
              ctx.roundRect(r.x, r.y, r.w, r.h, 8);
              ctx.fill();
              ctx.fillStyle = '#B45309';
              ctx.fillRect(r.x + 6, r.y + 4, r.w - 12, 5);
            } else {
              // Branch
              ctx.fillStyle = '#78350F';
              ctx.beginPath();
              ctx.roundRect(r.x, r.y + 6, r.w, r.h - 6, 8);
              ctx.fill();
              ctx.fillStyle = '#15803D';
              ctx.beginPath();
              ctx.roundRect(r.x, r.y, r.w, 12, 6);
              ctx.fill();
            }
          }

          // 6. Herbs (Byliny)
          for (const h of level.herbs) {
            const sway = Math.sin(s.time * 2.5 + h.x * 0.04) * 3;
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.strokeStyle = '#15803D';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(sway, -14, sway * 1.5, -24);
            ctx.moveTo(-7, 0);
            ctx.quadraticCurveTo(-8 + sway, -10, -11 + sway, -19);
            ctx.moveTo(7, 0);
            ctx.quadraticCurveTo(8 + sway, -10, 11 + sway, -19);
            ctx.stroke();

            const flowerColor =
              h.species === 'materina_duska'
                ? '#C084FC'
                : h.species === 'rumanček'
                  ? '#FFFFFF'
                  : h.species === 'zvonček'
                    ? '#60A5FA'
                    : '#4ADE80';
            ctx.fillStyle = flowerColor;
            ctx.beginPath();
            ctx.arc(sway * 1.5, -26, 5.5, 0, Math.PI * 2);
            ctx.arc(-11 + sway, -20, 4, 0, Math.PI * 2);
            ctx.arc(11 + sway, -20, 4, 0, Math.PI * 2);
            ctx.fill();
            if (h.species === 'rumanček') {
              ctx.fillStyle = '#FACC15';
              ctx.beginPath();
              ctx.arc(sway * 1.5, -26, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 7. Bouncy Mushrooms
          level.mushrooms.forEach((m, idx) => {
            const activeUntil = s.mushroomBounceTimers.get(idx) ?? 0;
            const squish = s.time < activeUntil ? 0.72 : 1;
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.scale(1 / squish, squish);
            ctx.fillStyle = '#FEF3C7';
            ctx.fillRect(-8, -18, 16, 18);
            ctx.fillStyle = '#DC2626';
            ctx.beginPath();
            ctx.arc(0, -18, 22, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-9, -27, 3.5, 0, Math.PI * 2);
            ctx.arc(6, -30, 4, 0, Math.PI * 2);
            ctx.arc(12, -22, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          // 8. Checkpoint Lantern
          {
            const cx = level.checkpointX;
            const cy = level.checkpointY;
            ctx.fillStyle = '#57534E';
            ctx.fillRect(cx - 5, cy - 62, 10, 62);
            ctx.fillRect(cx - 12, cy - 62, 24, 6);
            ctx.fillStyle = s.checkpointLit ? '#FBBF24' : '#CBD5E1';
            ctx.beginPath();
            ctx.arc(cx, cy - 46, 10, 0, Math.PI * 2);
            ctx.fill();
            if (s.checkpointLit) {
              ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
              ctx.beginPath();
              ctx.arc(cx, cy - 46, 24 + Math.sin(s.time * 6) * 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // 9. Multiplication Magic Gate
          {
            const gx = level.gateX;
            const gy = level.gateY;
            ctx.save();
            ctx.fillStyle = gateSolvedRef.current ? '#15803D' : '#78350F';
            ctx.fillRect(gx - 26, gy - 110, 14, 110);
            ctx.fillRect(gx + 12, gy - 110, 14, 110);
            ctx.beginPath();
            ctx.roundRect(gx - 32, gy - 124, 64, 24, 10);
            ctx.fill();
            if (!gateSolvedRef.current) {
              // Shimmering barrier
              ctx.fillStyle = 'rgba(245, 158, 11, 0.38)';
              ctx.fillRect(gx - 12, gy - 100, 24, 100);
              ctx.fillStyle = '#FEF3C7';
              ctx.font = 'bold 18px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('×', gx, gy - 106);
            } else {
              ctx.fillStyle = '#BBF7D0';
              ctx.font = 'bold 14px "Outfit", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('✓', gx, gy - 107);
            }
            ctx.restore();
          }

          // 10. End Story Portal
          {
            const px = level.portalX;
            const py = level.portalY;
            const ready = s.collectedSet.size >= level.letters.length;
            ctx.save();
            ctx.fillStyle = ready ? '#15803D' : '#6D28D9';
            ctx.beginPath();
            ctx.arc(px, py - 48, 38, Math.PI, 0);
            ctx.lineTo(px + 38, py);
            ctx.lineTo(px - 38, py);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = ready ? '#FBBF24' : '#A78BFA';
            ctx.beginPath();
            ctx.arc(px, py - 46, 26 + Math.sin(s.time * 4) * 2, Math.PI, 0);
            ctx.lineTo(px + 26, py);
            ctx.lineTo(px - 26, py);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = ready ? '#14532D' : '#FEF3C7';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PRÍBEH', px, py - 52);

            ctx.fillStyle = ready ? '#FEF08A' : '#E9D5FF';
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.fillText(
              ready ? 'OTVORENÉ!' : `${s.collectedSet.size}/${level.letters.length}`,
              px,
              py - 95,
            );
            ctx.restore();
          }

          // 11. Collectible Letters
          for (const l of level.letters) {
            if (s.collectedSet.has(l.id)) continue;
            const bobY = l.y + Math.sin(s.time * 3.5 + l.x * 0.02) * 5;
            const isY = l.char === 'Y' || l.char === 'Ý';

            ctx.save();
            ctx.fillStyle = isY ? 'rgba(245, 158, 11, 0.28)' : 'rgba(52, 211, 153, 0.25)';
            ctx.beginPath();
            ctx.arc(l.x, bobY, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isY ? '#F59E0B' : '#FFFBEB';
            ctx.strokeStyle = isY ? '#78350F' : '#15803D';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(l.x, bobY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isY ? '#FFFFFF' : '#14532D';
            ctx.font = '800 18px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(l.char, l.x, bobY + 1);
            ctx.restore();
          }

          // 12. Evil Forest Creatures (Zlé bytosti v lese)
          for (const e of s.enemies) {
            const stunned = s.time < e.stunnedUntil;
            ctx.save();
            ctx.translate(e.x, e.kind === 'havran' ? e.y : e.y - 18);
            if (stunned) ctx.globalAlpha = 0.4;
            if (e.dir < 0) ctx.scale(-1, 1);

            if (e.kind === 'skriatok') {
              // Moss Goblin
              ctx.fillStyle = '#365314';
              ctx.beginPath();
              ctx.arc(0, 0, 17, 0, Math.PI * 2);
              ctx.fill();
              // Pointy ears
              ctx.beginPath();
              ctx.moveTo(-14, -6);
              ctx.lineTo(-24, -14);
              ctx.lineTo(-10, -14);
              ctx.fill();
              // Grumpy eyes
              ctx.fillStyle = '#FACC15';
              ctx.beginPath();
              ctx.arc(-5, -3, 3.5, 0, Math.PI * 2);
              ctx.arc(6, -3, 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#1C1917';
              ctx.fillRect(-6, 5, 12, 3);
            } else if (e.kind === 'chrobak') {
              // Thistle Beetle
              ctx.fillStyle = '#581C87';
              ctx.beginPath();
              ctx.arc(0, 4, 18, Math.PI, 0);
              ctx.fill();
              // Spikes
              ctx.fillStyle = '#A855F7';
              ctx.beginPath();
              ctx.moveTo(-10, -10);
              ctx.lineTo(-5, -20);
              ctx.lineTo(0, -12);
              ctx.lineTo(6, -20);
              ctx.lineTo(10, -10);
              ctx.fill();
              // Eyes
              ctx.fillStyle = '#FEF08A';
              ctx.beginPath();
              ctx.arc(9, -1, 3, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Swooping Shadow Raven
              const flap = Math.sin(s.time * 14) * 10;
              ctx.fillStyle = '#1E1B4B';
              ctx.beginPath();
              ctx.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2);
              ctx.fill();
              // Wings
              ctx.beginPath();
              ctx.moveTo(-4, -4);
              ctx.lineTo(-14, -18 + flap);
              ctx.lineTo(6, -4);
              ctx.fill();
              // Beak & eye
              ctx.fillStyle = '#F59E0B';
              ctx.beginPath();
              ctx.moveTo(16, -2);
              ctx.lineTo(26, 2);
              ctx.lineTo(16, 5);
              ctx.fill();
              ctx.fillStyle = '#FB7185';
              ctx.beginPath();
              ctx.arc(10, -3, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 13. Floating Animated Companion Sprite
          {
            ctx.save();
            ctx.translate(s.companionX, s.companionY);
            ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = level.companion === 'sovicka' ? '#92400E' : level.companion === 'bubi' ? '#D97706' : '#22C55E';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-3.5, -2, 2, 0, Math.PI * 2);
            ctx.arc(3.5, -2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 14. Playable Animated Hero (Bystrík)
          {
            const blink = s.time < s.invincibleUntil && Math.floor(s.time * 14) % 2 === 0;
            if (!blink) {
              ctx.save();
              ctx.translate(s.playerX + s.w / 2, s.playerY + s.h / 2);
              if (s.facing < 0) ctx.scale(-1, 1);

              const running = Math.abs(s.vx) > 25 && s.onGround;
              const stride = running ? Math.sin(s.time * 16) * 7 : 0;

              // Boots / legs
              ctx.fillStyle = '#78350F';
              ctx.fillRect(-9 + stride, 13, 7, 11);
              ctx.fillRect(2 - stride, 13, 7, 11);

              // Fluttering leaf cape
              ctx.fillStyle = '#15803D';
              ctx.beginPath();
              ctx.moveTo(-6, -6);
              ctx.quadraticCurveTo(-20 - Math.abs(s.vx) * 0.02, 8, -14, 16);
              ctx.lineTo(-4, 12);
              ctx.closePath();
              ctx.fill();

              // Tunic body
              ctx.fillStyle = '#16A34A';
              ctx.beginPath();
              ctx.roundRect(-12, -8, 24, 24, 6);
              ctx.fill();

              // Glowing lantern in front hand
              ctx.fillStyle = '#FBBF24';
              ctx.beginPath();
              ctx.arc(14, 6, 5, 0, Math.PI * 2);
              ctx.fill();

              // Head
              ctx.fillStyle = '#FDE68A';
              ctx.beginPath();
              ctx.arc(0, -14, 12, 0, Math.PI * 2);
              ctx.fill();

              // Explorer Hat
              ctx.fillStyle = '#14532D';
              ctx.beginPath();
              ctx.moveTo(-14, -18);
              ctx.lineTo(0, -31);
              ctx.lineTo(14, -18);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#D97706';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(-14, -18);
              ctx.lineTo(14, -18);
              ctx.stroke();

              // Eye
              ctx.fillStyle = '#1E293B';
              ctx.beginPath();
              ctx.arc(5, -14, 2.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // 15. Particles
          for (const pt of s.particles) {
            ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [level]);

  // Build collected letter slots per target word
  const collectedSet = new Set(collectedIds);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-emerald-950 select-none">
      {/* Compact Top HUD (<= 12% height) */}
      <header className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-emerald-900/20 bg-[#FAF7F0]/95 px-3 py-2 backdrop-blur-md sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lives (3 Hearts + numeric count) */}
          <div className="flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1.5 ring-1 ring-rose-200">
            {[1, 2, 3].map((idx) => (
              <Heart
                key={idx}
                className={`h-5 w-5 transition-transform ${
                  idx <= lives ? 'scale-100 fill-rose-600 text-rose-600' : 'scale-90 fill-rose-200 text-rose-300'
                }`}
              />
            ))}
            <span className="ml-1 font-mono text-xs font-bold text-rose-900 tabular-nums">
              {lives}/3
            </span>
          </div>

          <div className="hidden items-center gap-1.5 text-xs font-bold text-emerald-900 md:flex">
            <span>{level.title}</span>
            {checkpointReached && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <Compass className="h-3.5 w-3.5" />
                  Checkpoint
                </span>
              </>
            )}
          </div>
        </div>

        {/* Target Vybrané slová po B Letter Progress */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {level.targetWords.map((word, wIdx) => (
            <div key={word} className="flex items-center gap-0.5 rounded-xl bg-emerald-900/10 px-2 py-1">
              {word.split('').map((ch, lIdx) => {
                const match = level.letters.find(
                  (ltr) => ltr.wordIndex === wIdx && ltr.letterIndex === lIdx,
                );
                const got = match ? collectedSet.has(match.id) : false;
                const isY = ch === 'Y' || ch === 'Ý';
                return (
                  <span
                    key={`${wIdx}-${lIdx}`}
                    className={`flex h-7 w-6 items-center justify-center rounded-md font-display text-sm font-extrabold transition ${
                      got
                        ? isY
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-white/70 text-emerald-900/40'
                    }`}
                  >
                    {got ? ch : '·'}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* Score + Audio + Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="rounded-xl bg-amber-100/80 px-2.5 py-1.5 font-mono text-xs font-bold text-amber-950 tabular-nums sm:text-sm">
            {score} b
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-900/15 bg-white text-emerald-900 hover:bg-emerald-50"
            aria-label={muted ? 'Zapnúť zvuk' : 'Stlmiť zvuk'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-900/15 bg-white text-emerald-900 hover:bg-emerald-50"
            aria-label="Pozastaviť hru"
          >
            <Pause className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Responsive Canvas Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0F2A22]">
        <canvas
          ref={canvasRef}
          className="h-full w-full max-w-[1440px] object-contain"
        />

        {/* Animated Companion Toast Banner */}
        {toast && (
          <div className="pointer-events-none absolute top-3 left-1/2 z-20 flex w-[92%] max-w-xl -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-500/30 bg-[#FAF7F0]/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm">
            <CompanionAvatarSvg companion={level.companion} className="h-10 w-10 shrink-0" />
            <p className="text-xs font-semibold leading-snug text-emerald-950 sm:text-sm">{toast}</p>
          </div>
        )}

        {/* Ergonomic Tablet / Android Multi-Touch Controls */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-4 sm:bottom-5 sm:px-7">
          {/* Left Thumb Zone: Left / Right */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                inputRef.current.left = true;
              }}
              onPointerUp={() => {
                inputRef.current.left = false;
              }}
              onPointerLeave={() => {
                inputRef.current.left = false;
              }}
              onPointerCancel={() => {
                inputRef.current.left = false;
              }}
              className="game-touch-control flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/70 bg-emerald-900/70 text-white shadow-lg backdrop-blur-sm active:scale-95 active:bg-amber-600/85 sm:h-18 sm:w-18"
              aria-label="Ísť doľava"
            >
              <ArrowLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                inputRef.current.right = true;
              }}
              onPointerUp={() => {
                inputRef.current.right = false;
              }}
              onPointerLeave={() => {
                inputRef.current.right = false;
              }}
              onPointerCancel={() => {
                inputRef.current.right = false;
              }}
              className="game-touch-control flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/70 bg-emerald-900/70 text-white shadow-lg backdrop-blur-sm active:scale-95 active:bg-amber-600/85 sm:h-18 sm:w-18"
              aria-label="Ísť doprava"
            >
              <ArrowRight className="h-8 w-8" />
            </button>
          </div>

          {/* Right Thumb Zone: Jump */}
          <div className="pointer-events-auto">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                triggerJump();
              }}
              className="game-touch-control flex h-18 w-20 flex-col items-center justify-center rounded-2xl border-2 border-amber-200/80 bg-amber-600/85 text-white shadow-lg backdrop-blur-sm active:scale-95 active:bg-amber-700 sm:h-20 sm:w-24"
              aria-label="Skočiť"
            >
              <ArrowUp className="h-8 w-8" />
              <span className="font-display text-xs font-extrabold tracking-wide">SKOK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
