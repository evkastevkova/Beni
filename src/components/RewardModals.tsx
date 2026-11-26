import React from 'react';
import {
  Award,
  BookMarked,
  ChevronRight,
  Compass,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import {EXTRA_VYBRANE_SLOVA_PO_B, LEVELS} from '../data/curriculum';
import {LevelDef, SavedProgress} from '../types/game';
import {AnimatedCompanion} from './AnimatedCompanion';

interface RoundSummaryModalProps {
  level: LevelDef;
  score: number;
  mistakes: number;
  stars: number;
  unlockedStageBanner: 'silnejsia' | 'majster' | null;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReturnToMenu: () => void;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({
  level,
  score,
  mistakes,
  stars,
  unlockedStageBanner,
  hasNextLevel,
  onNextLevel,
  onReturnToMenu,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#FAF7F0] p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((idx) => (
              <Star
                key={idx}
                className={`h-10 w-10 transition-transform ${
                  idx <= stars
                    ? 'scale-105 fill-amber-400 text-amber-600'
                    : 'fill-emerald-900/10 text-emerald-900/20'
                }`}
              />
            ))}
          </div>

          <h2 className="mt-3 font-display text-2xl font-extrabold text-emerald-950 sm:text-3xl">
            Úroveň {level.id}/15 splnená!
          </h2>
          <p className="mt-1 text-sm font-medium text-emerald-800">
            {level.title} · Body: <span className="font-mono font-bold tabular-nums">{score}</span> · Chyby:{' '}
            <span className="font-mono font-bold tabular-nums">{mistakes}</span>
          </p>
        </div>

        {/* Reward Badge */}
        <div className="mt-5 rounded-2xl border border-amber-600/25 bg-gradient-to-br from-amber-50 to-emerald-50 p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide text-amber-800">
                ZÍSKANÁ ODMENA DO ALBU
              </div>
              <h3 className="font-display text-lg font-bold text-emerald-950">
                {level.reward.title}
              </h3>
              <p className="text-sm text-emerald-900">{level.reward.subtitle}</p>
            </div>
          </div>

          <div className="mt-3.5 rounded-xl border border-emerald-900/10 bg-white p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-lg font-extrabold text-emerald-900">
                {level.reward.wordCard.word.toUpperCase()}
              </span>
              <span className="font-mono text-xs font-semibold text-amber-700">
                {level.reward.wordCard.syllables}
              </span>
            </div>
            <p className="mt-1 text-sm text-emerald-900">{level.reward.wordCard.meaning}</p>
            <p className="mt-1.5 text-xs font-medium text-emerald-700">
              Veta: „{level.reward.wordCard.example}“
            </p>
          </div>
        </div>

        {unlockedStageBanner && (
          <div className="mt-4 rounded-2xl border border-purple-700/25 bg-purple-50 p-4 text-center">
            <div className="inline-flex items-center gap-2 font-display text-base font-bold text-purple-950">
              <Trophy className="h-5 w-5 text-amber-600" />
              <span>
                {unlockedStageBanner === 'silnejsia'
                  ? 'Odomkol si SILNEJŠIU OBTIAŽNOSŤ (6.–10. úroveň)!'
                  : 'Odomkol si MAJSTROVSKÚ VÝZVU (11.–15. úroveň)!'}
              </span>
            </div>
            <p className="mt-1 text-sm text-purple-900">
              {unlockedStageBanner === 'silnejsia'
                ? 'Čaká ťa delenie s 3, doplňovačka tvrdého y/ý a mäkkého i/í aj vlastné dopĺňanie výsledkov!'
                : 'Prichádza delenie 27 : 3, trojmedzerová doplňovačka i/y a písanie vybraných slov po B z príbehov!'}
            </p>
          </div>
        )}

        <div className="mt-4">
          <AnimatedCompanion
            companion={level.companion}
            mood="celebrate"
            size="sm"
            message={
              mistakes === 0
                ? 'Fantastické! Ani jedna chyba — tvoj lesný checkpoint je úplne zlatý!'
                : 'Skvelá práca! Lesný checkpoint uložil tvoj postup.'
            }
          />
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          {hasNextLevel && (
            <button
              type="button"
              onClick={onNextLevel}
              className={`flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-bold text-white shadow-sm transition whitespace-nowrap ${
                unlockedStageBanner
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-emerald-800 hover:bg-emerald-900'
              }`}
            >
              {unlockedStageBanner ? <Sparkles className="h-5 w-5" /> : null}
              <span>Ďalšia úroveň ({level.id + 1}/15)</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToMenu}
            className="flex min-h-[52px] items-center justify-center rounded-2xl border border-emerald-900/20 bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50 whitespace-nowrap"
          >
            Mapa lesa
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  bestCheckpointLevel: LevelDef;
  bestCheckpointMistakes: number;
  onContinueFromCheckpoint: (levelId: number) => void;
  onRestartFromBeginning: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  bestCheckpointLevel,
  bestCheckpointMistakes,
  onContinueFromCheckpoint,
  onRestartFromBeginning,
  onReturnToMenu,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-3xl border border-rose-700/20 bg-[#FAF7F0] p-6 shadow-2xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold text-rose-900 sm:text-3xl">
            Došli ti všetky 3 životy
          </h2>
          <p className="mt-1.5 text-sm text-emerald-900">
            Hra sa skončila, ale nemusíš začínať úplne od začiatku!
          </p>
        </div>

        <div className="mt-4">
          <AnimatedCompanion
            companion="bylinka"
            mood="encourage"
            message={`Našiel som tvoj najistejší checkpoint v úrovni, kde si urobil najmenej chýb (${bestCheckpointMistakes}). Poď späť s novými 3 životmi!`}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-amber-600/25 bg-amber-50/90 p-4">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-amber-800">
            <Compass className="h-4 w-4" />
            <span>LESNÝ CHECKPOINT (NAJMENEJ CHÝB)</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-emerald-950">
            {bestCheckpointLevel.title}
          </p>
          <p className="text-xs font-medium text-emerald-800">
            Najmenej chýb v tejto úrovni: <span className="font-mono font-bold tabular-nums">{bestCheckpointMistakes}</span> · Obnovia sa ti 3 životy
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onContinueFromCheckpoint(bestCheckpointLevel.id)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Compass className="h-5 w-5" />
            Pokračovať z checkpointu (Úroveň {bestCheckpointLevel.id})
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRestartFromBeginning}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-emerald-900/20 bg-white px-4 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
            >
              <RotateCcw className="h-4 w-4" />
              Od 1. úrovne
            </button>
            <button
              type="button"
              onClick={onReturnToMenu}
              className="flex min-h-[48px] items-center justify-center rounded-2xl border border-emerald-900/20 bg-white px-4 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
            >
              Mapa lesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HerbariumModalProps {
  progress: SavedProgress;
  onClose: () => void;
}

export const HerbariumModal: React.FC<HerbariumModalProps> = ({progress, onClose}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-emerald-900/20 bg-[#FAF7F0] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BookMarked className="h-6 w-6 text-amber-600" />
            <h2 className="font-display text-2xl font-bold text-emerald-950">
              Lesný herbár a odznaky vybraných slov po B
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-emerald-900 hover:bg-emerald-900/10"
            aria-label="Zavrieť herbár"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-sm text-emerald-800">
          Získané odznaky: <strong className="font-mono tabular-nums">{progress.earnedBadges.length}/{LEVELS.length}</strong> · Celkové body:{' '}
          <strong className="font-mono tabular-nums">{progress.totalPoints}</strong>
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lvl) => {
            const unlocked = progress.earnedBadges.includes(lvl.reward.id);
            const tierLabel =
              lvl.tier === 'zaklad' ? 'Základný les' : lvl.tier === 'silnejsia' ? 'Silnejšia' : 'Majster';
            return (
              <div
                key={lvl.id}
                className={`rounded-2xl border p-4 transition ${
                  unlocked
                    ? 'border-amber-500/40 bg-white shadow-sm'
                    : 'border-emerald-900/10 bg-emerald-950/5 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-amber-800">
                      Úroveň {lvl.id} · {tierLabel}
                    </div>
                    <h3 className="font-display text-base font-bold text-emerald-950">
                      {unlocked ? lvl.reward.title : 'Zamknutý odznak'}
                    </h3>
                  </div>
                  <Award className={`h-6 w-6 shrink-0 ${unlocked ? 'text-amber-500' : 'text-emerald-900/30'}`} />
                </div>

                {unlocked ? (
                  <div className="mt-2.5 border-t border-emerald-900/10 pt-2.5 text-sm text-emerald-900">
                    <div className="font-bold text-emerald-800">
                      {lvl.reward.wordCard.word.toUpperCase()} ({lvl.reward.wordCard.syllables})
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed">{lvl.reward.wordCard.meaning}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-emerald-800">
                    Splň úroveň {lvl.id} a odomkneš kartičku so slovom {lvl.reward.wordCard.word.toUpperCase()}.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <h3 className="font-display text-lg font-bold text-emerald-950">
            Kompletný zoznam vybraných slov po B
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {EXTRA_VYBRANE_SLOVA_PO_B.map((item) => (
              <div
                key={item.word}
                className="rounded-xl border border-emerald-900/10 bg-white p-2.5"
              >
                <div className="font-display text-base font-bold text-emerald-950">{item.word}</div>
                <div className="text-[11px] leading-snug text-emerald-800">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
