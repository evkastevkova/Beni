import React from 'react';
import {motion} from 'motion/react';
import {CompanionId} from '../types/game';

interface AnimatedCompanionProps {
  companion: CompanionId;
  message?: string;
  mood?: 'happy' | 'encourage' | 'celebrate';
  size?: 'sm' | 'md' | 'lg';
}

const COMPANION_NAMES: Record<CompanionId, string> = {
  bystrik: 'Prieskumník Bystrík',
  bylinka: 'Víla Bylinka',
  bubi: 'Býček Bubi',
  sovicka: 'Sovička Bystruška',
};

export const CompanionAvatarSvg: React.FC<{companion: CompanionId; mood?: 'happy' | 'encourage' | 'celebrate'; className?: string}> = ({
  companion,
  mood = 'happy',
  className = 'w-16 h-16',
}) => {
  const bounceY = mood === 'celebrate' ? [0, -8, 0] : [0, -4, 0];

  return (
    <motion.div
      animate={{y: bounceY}}
      transition={{repeat: Infinity, duration: mood === 'celebrate' ? 0.9 : 2.2, ease: 'easeInOut'}}
      className={className}
    >
      {companion === 'bylinka' && (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          {/* Animated translucent fairy wings */}
          <motion.ellipse
            cx="24"
            cy="52"
            rx="16"
            ry="24"
            fill="#BBF7D0"
            stroke="#15803D"
            strokeWidth="2.5"
            animate={{rotate: [-12, -2, -12]}}
            transition={{repeat: Infinity, duration: 0.7, ease: 'easeInOut'}}
            style={{transformOrigin: '38px 56px'}}
          />
          <motion.ellipse
            cx="76"
            cy="52"
            rx="16"
            ry="24"
            fill="#BBF7D0"
            stroke="#15803D"
            strokeWidth="2.5"
            animate={{rotate: [12, 2, 12]}}
            transition={{repeat: Infinity, duration: 0.7, ease: 'easeInOut'}}
            style={{transformOrigin: '62px 56px'}}
          />
          {/* Leaf dress */}
          <path d="M35 64 Q50 56 65 64 L70 90 Q50 96 30 90 Z" fill="#16A34A" stroke="#14532D" strokeWidth="2.5" />
          {/* Head */}
          <circle cx="50" cy="44" r="21" fill="#FDE68A" stroke="#78350F" strokeWidth="2.5" />
          {/* Green leaf hair */}
          <path d="M29 41 Q36 19 50 21 Q64 19 71 41 Q60 32 50 35 Q40 32 29 41 Z" fill="#22C55E" stroke="#14532D" strokeWidth="2.2" />
          {/* Flower crown */}
          <circle cx="38" cy="24" r="5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="38" cy="24" r="2" fill="#F59E0B" />
          <circle cx="50" cy="20" r="6" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="50" cy="20" r="2.4" fill="#F59E0B" />
          <circle cx="62" cy="24" r="5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="62" cy="24" r="2" fill="#F59E0B" />
          {/* Eyes */}
          <circle cx="43" cy="45" r="2.8" fill="#1E293B" />
          <circle cx="57" cy="45" r="2.8" fill="#1E293B" />
          <circle cx="42" cy="44" r="1" fill="#FFFFFF" />
          <circle cx="56" cy="44" r="1" fill="#FFFFFF" />
          {/* Rosy cheeks & smile */}
          <circle cx="37" cy="50" r="3" fill="#FCA5A5" opacity="0.7" />
          <circle cx="63" cy="50" r="3" fill="#FCA5A5" opacity="0.7" />
          <path d="M44 52 Q50 58 56 52" fill="none" stroke="#78350F" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )}

      {companion === 'sovicka' && (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          {/* Body */}
          <ellipse cx="50" cy="58" rx="28" ry="30" fill="#92400E" stroke="#451A03" strokeWidth="2.5" />
          <ellipse cx="50" cy="66" rx="18" ry="20" fill="#FEF3C7" />
          {/* Wings */}
          <motion.ellipse
            cx="22"
            cy="58"
            rx="8"
            ry="17"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="2.2"
            animate={{rotate: [8, -10, 8]}}
            transition={{repeat: Infinity, duration: 1.6, ease: 'easeInOut'}}
            style={{transformOrigin: '26px 46px'}}
          />
          <motion.ellipse
            cx="78"
            cy="58"
            rx="8"
            ry="17"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="2.2"
            animate={{rotate: [-8, 10, -8]}}
            transition={{repeat: Infinity, duration: 1.6, ease: 'easeInOut'}}
            style={{transformOrigin: '74px 46px'}}
          />
          {/* Ear tufts */}
          <polygon points="27,32 36,20 42,33" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          <polygon points="73,32 64,20 58,33" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          {/* Big wise owl eyes */}
          <circle cx="40" cy="44" r="10" fill="#FFFBEB" stroke="#451A03" strokeWidth="2" />
          <circle cx="60" cy="44" r="10" fill="#FFFBEB" stroke="#451A03" strokeWidth="2" />
          <circle cx="41" cy="44" r="4.5" fill="#1E293B" />
          <circle cx="59" cy="44" r="4.5" fill="#1E293B" />
          <circle cx="42.5" cy="42.5" r="1.5" fill="#FFFFFF" />
          <circle cx="60.5" cy="42.5" r="1.5" fill="#FFFFFF" />
          {/* Beak */}
          <polygon points="46,49 54,49 50,57" fill="#F59E0B" stroke="#78350F" strokeWidth="1.8" />
          {/* Feather spots */}
          <path d="M43 66 Q50 70 57 66" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M40 74 Q50 78 60 74" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {companion === 'bubi' && (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          {/* Ears */}
          <ellipse cx="22" cy="42" rx="11" ry="6" fill="#D97706" stroke="#78350F" strokeWidth="2.2" transform="rotate(-18 22 42)" />
          <ellipse cx="78" cy="42" rx="11" ry="6" fill="#D97706" stroke="#78350F" strokeWidth="2.2" transform="rotate(18 78 42)" />
          {/* Little golden horns */}
          <path d="M33 28 Q26 16 35 14 Q39 20 40 26" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
          <path d="M67 28 Q74 16 65 14 Q61 20 60 26" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
          {/* Body / shoulders */}
          <path d="M30 68 Q50 62 70 68 L74 92 Q50 96 26 92 Z" fill="#FFFBEB" stroke="#78350F" strokeWidth="2.4" />
          {/* Flower garland */}
          <circle cx="38" cy="74" r="4" fill="#F59E0B" />
          <circle cx="50" cy="76" r="4.5" fill="#22C55E" />
          <circle cx="62" cy="74" r="4" fill="#F59E0B" />
          {/* Head */}
          <rect x="26" y="26" width="48" height="44" rx="20" fill="#FFFBEB" stroke="#78350F" strokeWidth="2.5" />
          {/* Brown spot */}
          <circle cx="38" cy="36" r="9" fill="#B45309" opacity="0.85" />
          {/* Eyes */}
          <circle cx="40" cy="44" r="3.2" fill="#1E293B" />
          <circle cx="60" cy="44" r="3.2" fill="#1E293B" />
          <circle cx="39" cy="42.8" r="1.1" fill="#FFFFFF" />
          <circle cx="59" cy="42.8" r="1.1" fill="#FFFFFF" />
          {/* Snout */}
          <ellipse cx="50" cy="59" rx="18" ry="11" fill="#FECACA" stroke="#78350F" strokeWidth="2" />
          <circle cx="43" cy="57" r="2.2" fill="#78350F" />
          <circle cx="57" cy="57" r="2.2" fill="#78350F" />
          <path d="M44 63 Q50 67 56 63" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {companion === 'bystrik' && (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          {/* Tunic */}
          <path d="M33 65 Q50 58 67 65 L73 92 Q50 96 27 92 Z" fill="#15803D" stroke="#052E16" strokeWidth="2.5" />
          {/* Head */}
          <circle cx="50" cy="44" r="20" fill="#FDE68A" stroke="#78350F" strokeWidth="2.5" />
          {/* Hair & Explorer Leaf Hat */}
          <path d="M26 37 Q50 14 74 37 Z" fill="#166534" stroke="#052E16" strokeWidth="2.5" />
          <path d="M23 38 Q50 31 77 38" fill="none" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
          {/* Acorn badge on hat */}
          <circle cx="65" cy="28" r="4" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
          {/* Eyes */}
          <circle cx="43" cy="45" r="2.8" fill="#1E293B" />
          <circle cx="57" cy="45" r="2.8" fill="#1E293B" />
          <circle cx="42" cy="43.8" r="1" fill="#FFFFFF" />
          <circle cx="56" cy="43.8" r="1" fill="#FFFFFF" />
          {/* Smile */}
          <path d="M44 52 Q50 58 56 52" fill="none" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}
    </motion.div>
  );
};

export const AnimatedCompanion: React.FC<AnimatedCompanionProps> = ({
  companion,
  message,
  mood = 'happy',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-900/15 bg-[#FAF7F0] p-3.5 shadow-sm">
      <div className="shrink-0 rounded-xl bg-emerald-100/80 p-1.5">
        <CompanionAvatarSvg companion={companion} mood={mood} className={sizeClass} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-emerald-950">{COMPANION_NAMES[companion]}</p>
        {message && <p className="mt-0.5 text-sm leading-snug text-emerald-900">{message}</p>}
      </div>
    </div>
  );
};
