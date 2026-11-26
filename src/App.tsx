import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Award,
  BookOpen,
  Compass,
  Heart,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {AnimatedCompanion, CompanionAvatarSvg} from './components/AnimatedCompanion';
import {GameCanvas} from './components/GameCanvas';
import {OfflineIndicator, PWAInstallButton} from './components/PWAComponents';
import {GameOverModal, HerbariumModal, RoundSummaryModal} from './components/RewardModals';
import {MathGateModal, ReadingPortalModal} from './components/TaskModals';
import {LEVELS} from './data/curriculum';
import {sound} from './game/sound';
import {DifficultyTier, GameScreenState, LevelDef, SavedProgress} from './types/game';

const STORAGE_KEY = 'bystrik_carovny_les_progress_v2';

const DEFAULT_PROGRESS: SavedProgress = {
  unlockedMaxLevel: 1,
  totalPoints: 0,
  earnedBadges: [],
  levels: {},
};

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('bystrik_carovny_les_progress_v1');
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<SavedProgress> & {unlockedNormalMax?: number};
    return {
      unlockedMaxLevel: Math.max(1, Math.min(15, parsed.unlockedMaxLevel ?? parsed.unlockedNormalMax ?? 1)),
      totalPoints: parsed.totalPoints ?? 0,
      earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      levels: parsed.levels ?? {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel: string;
}

const ResilientImage: React.FC<ResilientImageProps> = ({src, alt, className = '', fallbackLabel}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 text-center text-amber-100 ${className}`}
      >
        <CompanionAvatarSvg companion="bystrik" className="h-14 w-14" />
        <span className="mt-2 font-display text-sm font-bold">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [screen, setScreen] = useState<GameScreenState>('TITLE_MENU');
  const [selectedTier, setSelectedTier] = useState<DifficultyTier>('zaklad');
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const [runKey, setRunKey] = useState<number>(1);

  const [lives, setLives] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [levelMistakes, setLevelMistakes] = useState<number>(0);
  const [mathGateSolved, setMathGateSolved] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'none' | 'math' | 'reading'>('none');
  const [showHerbarium, setShowHerbarium] = useState<boolean>(false);
  const [unlockedStageBanner, setUnlockedStageBanner] = useState<'silnejsia' | 'majster' | null>(null);
  const [muted, setMuted] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  const activeLevel: LevelDef = useMemo(
    () => LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0],
    [activeLevelId],
  );

  // Determine the checkpoint level where the player made the FEWEST mistakes
  const bestCheckpoint = useMemo(() => {
    const candidates = LEVELS.filter((lvl) => lvl.id <= progress.unlockedMaxLevel);

    let chosen = candidates[0] ?? LEVELS[0];
    let minMistakes = Infinity;

    for (const lvl of candidates) {
      const rec = progress.levels[lvl.id];
      const m =
        lvl.id === activeLevelId
          ? rec?.fewestMistakes !== null && rec?.fewestMistakes !== undefined
            ? Math.min(rec.fewestMistakes, levelMistakes)
            : levelMistakes
          : rec?.fewestMistakes ?? 999;

      if (m < minMistakes || (m === minMistakes && lvl.id > chosen.id)) {
        minMistakes = m;
        chosen = lvl;
      }
    }

    return {
      level: chosen,
      mistakes: minMistakes === Infinity || minMistakes === 999 ? levelMistakes : minMistakes,
    };
  }, [progress, activeLevelId, levelMistakes]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sound.setMuted(next);
      return next;
    });
  }, []);

  const startLevel = useCallback((levelId: number, resetLives = true) => {
    const target = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
    setActiveLevelId(target.id);
    setSelectedTier(target.tier);
    if (resetLives) {
      setLives(3);
    }
    setScore(0);
    setLevelMistakes(0);
    setMathGateSolved(false);
    setActiveModal('none');
    setUnlockedStageBanner(null);
    setRunKey((k) => k + 1);
    setScreen('PLAYING');
  }, []);

  const handleAddScore = useCallback((pts: number) => {
    setScore((s) => s + pts);
  }, []);

  const handleLoseLife = useCallback(() => {
    setLevelMistakes((m) => m + 1);
    setLives((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        sound.playGameOver();
        setActiveModal('none');
        setScreen('GAME_OVER');
      }
      return next;
    });
  }, []);

  const handleCompleteLevel = useCallback(() => {
    sound.playLevelVictory();
    setActiveModal('none');

    const stars = levelMistakes === 0 ? 3 : levelMistakes === 1 ? 2 : 1;
    const bonusPoints = lives * 50 + stars * 100;
    const finalScore = score + bonusPoints;
    setScore(finalScore);

    let stageUnlock: 'silnejsia' | 'majster' | null = null;

    setProgress((prev) => {
      const existing = prev.levels[activeLevel.id];
      const prevBestMistakes = existing?.fewestMistakes;
      const newFewestMistakes =
        prevBestMistakes === null || prevBestMistakes === undefined
          ? levelMistakes
          : Math.min(prevBestMistakes, levelMistakes);

      const nextUnlockedMax = Math.max(prev.unlockedMaxLevel, Math.min(15, activeLevel.id + 1));
      if (activeLevel.id === 5 && prev.unlockedMaxLevel < 6) {
        stageUnlock = 'silnejsia';
      } else if (activeLevel.id === 10 && prev.unlockedMaxLevel < 11) {
        stageUnlock = 'majster';
      }

      const nextBadges = prev.earnedBadges.includes(activeLevel.reward.id)
        ? prev.earnedBadges
        : [...prev.earnedBadges, activeLevel.reward.id];

      return {
        unlockedMaxLevel: nextUnlockedMax,
        totalPoints: prev.totalPoints + finalScore,
        earnedBadges: nextBadges,
        levels: {
          ...prev.levels,
          [activeLevel.id]: {
            completed: true,
            stars: Math.max(existing?.stars ?? 0, stars),
            bestScore: Math.max(existing?.bestScore ?? 0, finalScore),
            fewestMistakes: newFewestMistakes,
            lastMistakes: levelMistakes,
          },
        },
      };
    });

    setUnlockedStageBanner(stageUnlock);
    setScreen(activeLevel.id === 15 ? 'CAMPAIGN_VICTORY' : 'ROUND_SUMMARY');
  }, [activeLevel, levelMistakes, lives, score]);

  const tierLevels = useMemo(
    () => LEVELS.filter((l) => l.tier === selectedTier),
    [selectedTier],
  );

  // =========================================================================
  // TITLE / FOREST MAP SCREEN
  // =========================================================================
  if (screen === 'TITLE_MENU') {
    const resumeId = progress.unlockedMaxLevel;
    const silnejsiaUnlocked = progress.unlockedMaxLevel >= 6;
    const majsterUnlocked = progress.unlockedMaxLevel >= 11;

    return (
      <div className="min-h-[100dvh] bg-[#FAF7F0] text-emerald-950">
        {/* 3-Zone Top Bar */}
        <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#FAF7F0]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <a
              href="#top"
              className="font-display text-lg font-extrabold tracking-tight text-emerald-950 whitespace-nowrap shrink-0 sm:text-xl"
            >
              Bystrík a Čarovný Les
            </a>

            <nav className="hidden items-center gap-6 text-sm font-semibold text-emerald-900 md:flex">
              <a href="#mapa" className="hover:text-amber-700 whitespace-nowrap shrink-0">
                15 úrovní
              </a>
              <a href="#pravidla" className="hover:text-amber-700 whitespace-nowrap shrink-0">
                Čo sa naučíš
              </a>
              <button
                type="button"
                onClick={() => setShowHerbarium(true)}
                className="hover:text-amber-700 whitespace-nowrap shrink-0"
              >
                Herbár a odznaky
              </button>
            </nav>

            <div className="flex items-center gap-2.5 shrink-0">
              <PWAInstallButton />
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-900/15 bg-white text-emerald-900 hover:bg-emerald-50"
                aria-label={muted ? 'Zapnúť zvuk' : 'Stlmiť zvuk'}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        <main id="top" className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
          {/* Hero Storybook Banner */}
          <section className="relative overflow-hidden rounded-3xl border border-emerald-900/15 bg-emerald-950 shadow-xl">
            <ResilientImage
              src="/src/assets/images/forest_title_backdrop_1795600171445.jpg"
              alt="Čarovný les s bystrinou, liečivými bylinami a pasúcim sa dobytkom"
              className="h-[340px] w-full object-cover opacity-85 sm:h-[420px]"
              fallbackLabel="Bystrík a Čarovný Les"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/55 to-emerald-950/15" />

            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 lg:p-10">
              <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold tracking-wide text-amber-300 sm:text-sm">
                    15 ÚROVNÍ · VYBRANÉ SLOVÁ PO B · NÁSOBILKA A DELENIE S 3
                  </p>
                  <h1 className="mt-1.5 font-display text-3xl font-extrabold leading-tight text-white [text-wrap:balance] sm:text-5xl">
                    Lesná výprava za všetkými vybranými slovami po B
                  </h1>
                  <p className="mt-2.5 text-sm leading-relaxed text-emerald-50/95 sm:text-base">
                    Preveď Bystríka cez 15 lesných úrovní pomedzi byliny, bystriny a dobytok. Postupne pribúdajú doplňovačky tvrdého y/ý a mäkkého i/í, delenie s 3 (napr. 27 : 3), vlastné dopĺňanie výsledkov bez výberu a čítanie s porozumením!
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startLevel(resumeId, true)}
                      className="inline-flex min-h-[52px] items-center gap-2.5 rounded-2xl bg-amber-500 px-6 py-3 font-display text-base font-extrabold text-emerald-950 shadow-md transition hover:bg-amber-400 active:scale-[0.98] whitespace-nowrap"
                    >
                      <Play className="h-5 w-5 fill-emerald-950" />
                      Spustiť hru (Úroveň {resumeId}/15)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHerbarium(true)}
                      className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/25 whitespace-nowrap"
                    >
                      <Award className="h-5 w-5 text-amber-300" />
                      Herbár a odznaky ({progress.earnedBadges.length}/15)
                    </button>
                  </div>
                </div>

                <div className="hidden items-end gap-3 lg:flex">
                  <div className="overflow-hidden rounded-2xl border-2 border-amber-300/70 bg-[#FAF7F0] shadow-lg">
                    <ResilientImage
                      src="/src/assets/images/hero_bystrik_portrait_1795600171710.jpg"
                      alt="Hrdina Bystrík so zlatým lampášom"
                      className="h-28 w-28 object-cover"
                      fallbackLabel="Bystrík"
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl border-2 border-emerald-300/70 bg-[#FAF7F0] shadow-lg">
                    <ResilientImage
                      src="/src/assets/images/companion_bylinka_portrait_1795600172777.jpg"
                      alt="Víla Bylinka, teliatko a sovička Bystruška pri bystrine"
                      className="h-28 w-28 object-cover"
                      fallbackLabel="Bylinka"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Animated Guide Welcome Strip */}
          <section className="grid gap-4 md:grid-cols-2">
            <AnimatedCompanion
              companion="bylinka"
              mood="happy"
              message="V 15 úrovniach precvičíš všetky vybrané slová po B aj doplňovačku tvrdého y/ý a mäkkého i/í — bez zbytočného zrýchľovania príšeriek!"
            />
            <AnimatedCompanion
              companion="bubi"
              mood="encourage"
              message={`Máš 3 životy. Ak prídeš o všetky, checkpoint ťa vráti do úrovne ${bestCheckpoint.level.id}, kde si urobil najmenej chýb!`}
            />
          </section>

          {/* Level Selection & 3-Stage Tabs */}
          <section id="mapa" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-emerald-950">
                  Mapa Čarovného Lesa (15 úrovní)
                </h2>
                <p className="text-sm text-emerald-800">
                  Celkové skóre: <span className="font-mono font-bold tabular-nums">{progress.totalPoints} b</span> · Checkpoint s najmenej chybami: Úroveň {bestCheckpoint.level.id}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-emerald-900/15 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setSelectedTier('zaklad')}
                  className={`min-h-[42px] rounded-lg px-3.5 py-2 text-xs font-bold transition whitespace-nowrap sm:text-sm ${
                    selectedTier === 'zaklad'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  1.–5. Základný les
                </button>
                <button
                  type="button"
                  onClick={() => silnejsiaUnlocked && setSelectedTier('silnejsia')}
                  disabled={!silnejsiaUnlocked}
                  className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition whitespace-nowrap sm:text-sm ${
                    selectedTier === 'silnejsia'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : silnejsiaUnlocked
                        ? 'text-teal-900 hover:bg-teal-50'
                        : 'cursor-not-allowed text-emerald-900/40'
                  }`}
                >
                  {!silnejsiaUnlocked && <Lock className="h-3.5 w-3.5" />}
                  6.–10. Silnejšia
                </button>
                <button
                  type="button"
                  onClick={() => majsterUnlocked && setSelectedTier('majster')}
                  disabled={!majsterUnlocked}
                  className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition whitespace-nowrap sm:text-sm ${
                    selectedTier === 'majster'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : majsterUnlocked
                        ? 'text-purple-900 hover:bg-purple-50'
                        : 'cursor-not-allowed text-emerald-900/40'
                  }`}
                >
                  {!majsterUnlocked && <Lock className="h-3.5 w-3.5" />}
                  11.–15. Majster
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {tierLevels.map((lvl) => {
                const unlocked = lvl.id <= progress.unlockedMaxLevel;
                const rec = progress.levels[lvl.id];
                const stars = rec?.stars ?? 0;

                return (
                  <div
                    key={lvl.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                      unlocked
                        ? 'border-emerald-900/15 bg-white shadow-sm'
                        : 'border-emerald-900/10 bg-emerald-950/5 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800">
                          ÚROVEŇ {lvl.id}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${
                                s <= stars
                                  ? 'fill-amber-400 text-amber-600'
                                  : 'fill-emerald-900/10 text-emerald-900/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <h3 className="mt-2 font-display text-base font-bold text-emerald-950">
                        {lvl.title.replace(/^Úroveň \d+: /, '')}
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                        <strong>{lvl.targetWords.join(', ')}</strong>
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-amber-900">
                        {lvl.mathChallenge.expressionDisplay.replace('?', '')}
                        {lvl.mathChallenge.inputMode === 'keypad' ? ' · vlastný výpočet' : ''}
                      </p>

                      {rec?.completed && (
                        <p className="mt-1.5 text-[11px] font-medium text-emerald-700 tabular-nums">
                          Min. chýb: {rec.fewestMistakes ?? 0} · {rec.bestScore} b
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => startLevel(lvl.id, true)}
                      className={`mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm ${
                        unlocked
                          ? lvl.tier === 'majster'
                            ? 'bg-purple-700 text-white hover:bg-purple-800'
                            : lvl.tier === 'silnejsia'
                              ? 'bg-teal-700 text-white hover:bg-teal-800'
                              : 'bg-emerald-800 text-white hover:bg-emerald-900'
                          : 'cursor-not-allowed bg-emerald-900/10 text-emerald-900/45'
                      }`}
                    >
                      {unlocked ? (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          {rec?.completed ? 'Zopakovať' : 'Hrať'}
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          Zamknuté
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pedagogical Features Overview */}
          <section id="pravidla" className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-900/15 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-emerald-950">
                Všetky vybrané slová po B + i/y
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                Od bylín, bystriny a dobytka až po Bytču, Bystricu, prebytok a úbytok — vrátane doplňovačiek tvrdého y/ý a mäkkého i/í.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-900/15 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-emerald-950">
                Násobilka s 3, delenie a vlastné písanie
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                Celá násobilka s 3 aj delenie ako 18 : 3, 24 : 3 či 27 : 3, kde deti výsledky aj slová dopĺňajú samy bez výberu možností.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-900/15 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-emerald-950">
                3 životy a šikovný checkpoint
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                Rýchlosť príšeriek zostáva férová. Pri strate 3 životov ťa checkpoint vráti do úrovne, v ktorej si urobil najmenej chýb.
              </p>
            </div>
          </section>
        </main>

        {showHerbarium && (
          <HerbariumModal progress={progress} onClose={() => setShowHerbarium(false)} />
        )}
        <OfflineIndicator />
      </div>
    );
  }

  // =========================================================================
  // ACTIVE PLATFORMER GAME + OVERLAYS
  // =========================================================================
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <GameCanvas
        key={`${activeLevel.id}-${runKey}`}
        level={activeLevel}
        lives={lives}
        score={score}
        isPaused={screen !== 'PLAYING' || activeModal !== 'none' || showHerbarium}
        muted={muted}
        onToggleMute={toggleMute}
        onPause={() => setScreen('PAUSED')}
        onAddScore={handleAddScore}
        onLoseLife={handleLoseLife}
        onOpenMathGate={() => setActiveModal('math')}
        mathGateSolved={mathGateSolved}
        onOpenPortal={() => setActiveModal('reading')}
      />

      {/* Multiplication / Division + Spelling Gate Modal */}
      {activeModal === 'math' && lives > 0 && (
        <MathGateModal
          question={activeLevel.mathChallenge}
          spelling={activeLevel.spellingChallenge}
          companion={activeLevel.companion}
          lives={lives}
          onSuccess={(bonus) => {
            sound.playTaskSuccess();
            setScore((s) => s + bonus);
            setMathGateSolved(true);
            setActiveModal('none');
          }}
          onMistake={() => {
            sound.playHurt();
            handleLoseLife();
          }}
        />
      )}

      {/* Reading Comprehension End-of-Level Modal */}
      {activeModal === 'reading' && lives > 0 && (
        <ReadingPortalModal
          reading={activeLevel.readingBlock}
          companion={activeLevel.companion}
          lives={lives}
          onComplete={handleCompleteLevel}
          onMistake={() => {
            sound.playHurt();
            handleLoseLife();
          }}
        />
      )}

      {/* Pause Modal */}
      {screen === 'PAUSED' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-emerald-900/20 bg-[#FAF7F0] p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-extrabold text-emerald-950">
              Hra je pozastavená
            </h2>
            <p className="mt-1 text-sm text-emerald-800">{activeLevel.title}</p>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3.5 text-sm font-semibold text-emerald-950">
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
                Životy: {lives}/3
              </span>
              <span className="font-mono tabular-nums">Body: {score}</span>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => setScreen('PLAYING')}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-900"
              >
                <Play className="h-5 w-5 fill-current" />
                Pokračovať v hre
              </button>
              <button
                type="button"
                onClick={() => startLevel(activeLevel.id, false)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-emerald-900/15 bg-white px-5 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reštartovať úroveň
              </button>
              <button
                type="button"
                onClick={() => setShowHerbarium(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-emerald-900/15 bg-white px-5 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
              >
                <Award className="h-4 w-4 text-amber-600" />
                Herbár a odznaky
              </button>
              <button
                type="button"
                onClick={() => setScreen('TITLE_MENU')}
                className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-emerald-900/15 bg-white px-5 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
              >
                Späť na mapu lesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End-of-Level Reward Modal */}
      {screen === 'ROUND_SUMMARY' && (
        <RoundSummaryModal
          level={activeLevel}
          score={score}
          mistakes={levelMistakes}
          stars={levelMistakes === 0 ? 3 : levelMistakes === 1 ? 2 : 1}
          unlockedStageBanner={unlockedStageBanner}
          hasNextLevel={activeLevel.id < LEVELS.length}
          onNextLevel={() => startLevel(activeLevel.id + 1, true)}
          onReturnToMenu={() => setScreen('TITLE_MENU')}
        />
      )}

      {/* Campaign Grand Victory (Level 15 Completed!) */}
      {screen === 'CAMPAIGN_VICTORY' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-amber-400/50 bg-[#FAF7F0] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
              <Trophy className="h-9 w-9" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-emerald-950">
              Si Veľmajster všetkých 15 úrovní!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">
              Úspešne si zvládol všetkých 15 lesných úrovní, všetky vybrané slová po B, doplňovačky y/ý/i/í, násobilku a delenie s 3 aj čítanie s porozumením!
            </p>

            <div className="mt-4 text-left">
              <AnimatedCompanion
                companion="bystrik"
                mood="celebrate"
                message="Všetky bylinky, bystriny aj stáda dobytka sú v bezpečí. Pozri si svoj kompletný Herbár a odznaky!"
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowHerbarium(true)}
                className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-bold text-emerald-950 hover:bg-amber-400"
              >
                <Award className="h-5 w-5" />
                Otvoriť Herbár
              </button>
              <button
                type="button"
                onClick={() => setScreen('TITLE_MENU')}
                className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-900"
              >
                <Compass className="h-5 w-5" />
                Mapa lesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over + Smart Least-Mistakes Checkpoint */}
      {screen === 'GAME_OVER' && (
        <GameOverModal
          bestCheckpointLevel={bestCheckpoint.level}
          bestCheckpointMistakes={bestCheckpoint.mistakes}
          onContinueFromCheckpoint={(lvlId) => startLevel(lvlId, true)}
          onRestartFromBeginning={() => startLevel(1, true)}
          onReturnToMenu={() => setScreen('TITLE_MENU')}
        />
      )}

      {showHerbarium && (
        <HerbariumModal progress={progress} onClose={() => setShowHerbarium(false)} />
      )}
      <OfflineIndicator />
    </div>
  );
}
