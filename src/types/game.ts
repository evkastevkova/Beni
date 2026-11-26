export type DifficultyTier = 'zaklad' | 'silnejsia' | 'majster';

export type GameScreenState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER'
  | 'CAMPAIGN_VICTORY';

export type CompanionId = 'bystrik' | 'bylinka' | 'bubi' | 'sovicka';

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'grass' | 'stone' | 'wood' | 'branch';
  moving?: {
    axis: 'x' | 'y';
    range: number;
    speed: number;
  };
}

export interface StreamDef {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface HerbPatchDef {
  x: number;
  y: number;
  species: 'materina_duska' | 'rumanček' | 'paprad' | 'zvonček';
}

export interface MushroomBounceDef {
  x: number;
  y: number;
  power: number;
}

export interface CattleScenicDef {
  x: number;
  y: number;
  animal: 'byk' | 'kobyla' | 'byvol' | 'teliatko';
}

export interface EnemyDef {
  id: string;
  kind: 'skriatok' | 'chrobak' | 'havran';
  name: string;
  x: number;
  y: number;
  minX: number;
  maxX: number;
  speed: number;
  amplitudeY?: number;
}

export interface LetterItemDef {
  id: string;
  char: string;
  x: number;
  y: number;
  wordIndex: number;
  letterIndex: number;
}

export interface MultiplicationQuestion {
  id: string;
  prompt: string;
  expressionDisplay: string; // e.g., "3 × 7 = ?" or "27 : 3 = ?"
  operation: 'mul' | 'div';
  factorA: number;
  factorB: number;
  visualGroupLabel: string;
  inputMode: 'choice' | 'keypad';
  options?: number[];
  correctAnswer: number;
  hint: string;
}

export interface SpellingBlank {
  before: string; // e.g., "b"
  middle?: string; // optional text between 1st and 2nd blank in same word
  after: string; // e.g., "lina"
  correctChars: Array<'y' | 'ý' | 'i' | 'í'>;
}

export interface WordSpellingQuestion {
  id: string;
  instruction: string;
  /** Text segments interleaving the target words (segments.length === words.length + 1) */
  segments: string[];
  words: SpellingBlank[];
  explanation: string;
}

export interface ComprehensionQuestion {
  id: string;
  mode: 'choice' | 'text_input';
  question: string;
  options?: string[];
  correctIndex?: number;
  correctTextAnswers?: string[];
  inputHintLetters?: string[];
  clue: string;
}

export interface ReadingComprehensionBlock {
  title: string;
  storyParagraphs: string[];
  focusWords: string[];
  questions: ComprehensionQuestion[];
}

export interface RewardBadgeDef {
  id: string;
  title: string;
  subtitle: string;
  wordCard: {
    word: string;
    syllables: string;
    meaning: string;
    example: string;
    category: 'byliny' | 'bystrina' | 'dobytok' | 'obydlie';
  };
}

export interface LevelDef {
  id: number;
  tier: DifficultyTier;
  title: string;
  subtitle: string;
  themeColor: string;
  skyTop: string;
  skyBottom: string;
  worldWidth: number;
  targetWords: string[];
  companion: CompanionId;
  introMessage: string;
  checkpointX: number;
  checkpointY: number;
  gateX: number;
  gateY: number;
  portalX: number;
  portalY: number;
  platforms: PlatformDef[];
  streams: StreamDef[];
  herbs: HerbPatchDef[];
  mushrooms: MushroomBounceDef[];
  cattle: CattleScenicDef[];
  enemies: EnemyDef[];
  letters: LetterItemDef[];
  mathChallenge: MultiplicationQuestion;
  spellingChallenge?: WordSpellingQuestion;
  readingBlock: ReadingComprehensionBlock;
  reward: RewardBadgeDef;
}

export interface LevelProgressRecord {
  completed: boolean;
  stars: number;
  bestScore: number;
  fewestMistakes: number | null;
  lastMistakes: number;
}

export interface SavedProgress {
  unlockedMaxLevel: number; // 1..15
  totalPoints: number;
  earnedBadges: string[];
  levels: Record<number, LevelProgressRecord>;
}
