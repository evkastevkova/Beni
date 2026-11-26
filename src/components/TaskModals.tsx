import React, {useEffect, useMemo, useState} from 'react';
import {
  BookOpen,
  CheckCircle2,
  Delete,
  Heart,
  HelpCircle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  CompanionId,
  MultiplicationQuestion,
  ReadingComprehensionBlock,
  WordSpellingQuestion,
} from '../types/game';
import {AnimatedCompanion} from './AnimatedCompanion';

interface MathGateModalProps {
  question: MultiplicationQuestion;
  spelling?: WordSpellingQuestion;
  companion: CompanionId;
  lives: number;
  onSuccess: (bonusScore: number) => void;
  onMistake: () => void;
}

export const MathGateModal: React.FC<MathGateModalProps> = ({
  question,
  spelling,
  companion,
  lives,
  onSuccess,
  onMistake,
}) => {
  const [step, setStep] = useState<'math' | 'spelling'>('math');
  const [typedValue, setTypedValue] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ok: boolean; text: string} | null>(null);
  const [spellingDone, setSpellingDone] = useState(false);

  // Flatten all blanks for multi-word y/ý/i/í doplňovačka
  const flatBlanks = useMemo(() => {
    if (!spelling) return [];
    const list: Array<{wordIdx: number; blankIdx: number; correct: 'y' | 'ý' | 'i' | 'í'}> = [];
    spelling.words.forEach((w, wordIdx) => {
      w.correctChars.forEach((ch, blankIdx) => {
        list.push({wordIdx, blankIdx, correct: ch});
      });
    });
    return list;
  }, [spelling]);

  const [blankValues, setBlankValues] = useState<Array<string>>([]);
  const [activeBlankFlatIdx, setActiveBlankFlatIdx] = useState<number>(0);

  useEffect(() => {
    setBlankValues(Array(flatBlanks.length).fill(''));
    setActiveBlankFlatIdx(0);
  }, [flatBlanks.length]);

  const submitMathAnswer = (val: number) => {
    if (feedback?.ok) return;
    if (val === question.correctAnswer) {
      if (spelling && !spellingDone) {
        setFeedback({
          ok: true,
          text: `Výborne! ${question.expressionDisplay.replace('?', String(val))}. Teraz doplň tvrdé y/ý alebo mäkké i/í!`,
        });
        setTimeout(() => {
          setFeedback(null);
          setStep('spelling');
        }, 900);
      } else {
        setFeedback({
          ok: true,
          text: `Správne! ${question.expressionDisplay.replace('?', String(val))}. Brána sa otvára!`,
        });
        setTimeout(() => {
          onSuccess(question.inputMode === 'keypad' ? 130 : 100);
        }, 800);
      }
    } else {
      setFeedback({
        ok: false,
        text: `Skús znova! Stratil si 1 život. Pomôcka: ${question.hint}`,
      });
      setTypedValue('');
      setShowHint(true);
      onMistake();
    }
  };

  // Keyboard support for keypad mode
  useEffect(() => {
    if (step !== 'math' || question.inputMode !== 'keypad') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setTypedValue((prev) => (prev.length < 3 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        setTypedValue((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter' && typedValue.length > 0) {
        submitMathAnswer(Number(typedValue));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleSelectVowel = (ch: 'y' | 'ý' | 'i' | 'í') => {
    if (feedback?.ok) return;
    setBlankValues((prev) => {
      const next = [...prev];
      next[activeBlankFlatIdx] = ch;
      const nextEmpty = next.findIndex((v, i) => i > activeBlankFlatIdx && v === '');
      const fallbackEmpty = next.findIndex((v) => v === '');
      if (nextEmpty !== -1) setActiveBlankFlatIdx(nextEmpty);
      else if (fallbackEmpty !== -1) setActiveBlankFlatIdx(fallbackEmpty);
      return next;
    });
  };

  const handleCheckSpelling = () => {
    if (!spelling || feedback?.ok) return;
    if (blankValues.some((v) => v === '')) {
      setFeedback({ok: false, text: 'Doplň najskôr všetky prázdne políčka (y, ý, i alebo í).'});
      return;
    }

    const allCorrect = flatBlanks.every((b, idx) => blankValues[idx] === b.correct);
    if (allCorrect) {
      setSpellingDone(true);
      setFeedback({ok: true, text: `Skvelé! ${spelling.explanation}`});
      setTimeout(() => {
        onSuccess(170);
      }, 1000);
    } else {
      setFeedback({
        ok: false,
        text: 'Niektoré písmená i/y nesedia (−1 život). Skús opraviť označené políčka!',
      });
      setBlankValues((prev) =>
        prev.map((val, idx) => (val === flatBlanks[idx].correct ? val : '')),
      );
      const firstWrong = flatBlanks.findIndex((b, idx) => blankValues[idx] !== b.correct);
      if (firstWrong !== -1) setActiveBlankFlatIdx(firstWrong);
      onMistake();
    }
  };

  // Compute flat index offset for each word
  let runningOffset = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/65 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-emerald-900/20 bg-[#FAF7F0] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-semibold tracking-wide text-amber-800">
            {step === 'math'
              ? question.operation === 'div'
                ? 'ČAROVNÁ BRÁNA · DELENIE S 3'
                : 'ČAROVNÁ BRÁNA · NÁSOBILKA 2 A 3'
              : 'DOPLŇOVAČKA · TVRDÉ Y/Ý A MÄKKÉ I/Í'}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-rose-700 tabular-nums">
            <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
            <span>{lives}/3</span>
          </div>
        </div>

        <div className="mt-3">
          <AnimatedCompanion
            companion={companion}
            mood={feedback?.ok ? 'celebrate' : 'encourage'}
            size="sm"
            message={
              step === 'math'
                ? question.inputMode === 'keypad'
                  ? 'Tentoraz nemáš možnosti na výber — vypočítaj výsledok sám!'
                  : 'Vyrieš príklad a otvoríme prechod cez les!'
                : 'Pozorne doplň tvrdé y/ý alebo mäkké i/í do vybraných slov po B!'
            }
          />
        </div>

        {step === 'math' ? (
          <div className="mt-4">
            <p className="text-base font-semibold leading-relaxed text-emerald-950">
              {question.prompt}
            </p>

            {/* Math equation + optional visual groups */}
            <div className="mt-3 rounded-2xl border border-emerald-900/10 bg-white/90 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono text-2xl font-bold text-emerald-950 tabular-nums sm:text-3xl">
                  {question.inputMode === 'keypad'
                    ? question.expressionDisplay.replace('?', typedValue || '_')
                    : question.expressionDisplay}
                </div>
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-700/20 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <HelpCircle className="h-4 w-4" />
                  {showHint ? 'Skryť pomôcku' : 'Ukázať pomôcku'}
                </button>
              </div>

              {showHint && (
                <div className="mt-3 space-y-2 border-t border-emerald-900/10 pt-3">
                  <p className="text-xs font-medium text-emerald-800">{question.hint}</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({length: question.factorA}).map((_, gIdx) => (
                      <div
                        key={gIdx}
                        className="flex items-center gap-1 rounded-xl border border-emerald-700/20 bg-emerald-50 px-2.5 py-1.5"
                      >
                        {Array.from({length: question.factorB}).map((__, iIdx) => (
                          <span key={iIdx} className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {question.inputMode === 'choice' && question.options ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => submitMathAnswer(opt)}
                    className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-emerald-800/20 bg-white font-mono text-2xl font-bold text-emerald-950 shadow-sm transition hover:border-amber-500 hover:bg-amber-50 active:scale-[0.97] tabular-nums"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() =>
                        setTypedValue((prev) => (prev.length < 3 ? prev + String(digit) : prev))
                      }
                      className="flex min-h-[50px] items-center justify-center rounded-xl border border-emerald-900/20 bg-white font-mono text-xl font-bold text-emerald-950 shadow-sm transition hover:bg-amber-50 active:scale-95 tabular-nums"
                    >
                      {digit}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTypedValue((prev) => prev.slice(0, -1))}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-900/20 bg-white px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
                  >
                    <Delete className="h-4 w-4" />
                    Zmazať
                  </button>
                  <button
                    type="button"
                    disabled={typedValue.length === 0}
                    onClick={() => submitMathAnswer(Number(typedValue))}
                    className="flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-800 px-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-45"
                  >
                    Potvrdiť výsledok
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          spelling && (
            <div className="mt-4 space-y-4">
              <p className="text-sm font-bold text-emerald-900">{spelling.instruction}</p>

              {/* Inline sentence with interactive blank slots */}
              <div className="rounded-2xl border border-emerald-900/15 bg-white p-4 text-lg font-semibold leading-loose text-emerald-950">
                {spelling.segments.map((seg, sIdx) => {
                  const word = spelling.words[sIdx];
                  if (!word) return <span key={sIdx}>{seg}</span>;

                  const firstFlatIdx = runningOffset;
                  runningOffset += word.correctChars.length;

                  return (
                    <React.Fragment key={sIdx}>
                      <span>{seg}</span>
                      <span className="inline-flex items-baseline whitespace-nowrap font-bold text-emerald-900">
                        <span>{word.before}</span>
                        <button
                          type="button"
                          onClick={() => setActiveBlankFlatIdx(firstFlatIdx)}
                          className={`mx-0.5 inline-flex h-9 min-w-[34px] items-center justify-center rounded-lg border-2 px-2 font-display text-lg font-extrabold transition ${
                            activeBlankFlatIdx === firstFlatIdx
                              ? 'border-amber-500 bg-amber-100 text-amber-950'
                              : blankValues[firstFlatIdx]
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                : 'border-emerald-900/25 bg-emerald-50/50 text-emerald-900/40'
                          }`}
                        >
                          {blankValues[firstFlatIdx] || '?'}
                        </button>
                        {word.middle !== undefined && <span>{word.middle}</span>}
                        {word.correctChars.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setActiveBlankFlatIdx(firstFlatIdx + 1)}
                            className={`mx-0.5 inline-flex h-9 min-w-[34px] items-center justify-center rounded-lg border-2 px-2 font-display text-lg font-extrabold transition ${
                              activeBlankFlatIdx === firstFlatIdx + 1
                                ? 'border-amber-500 bg-amber-100 text-amber-950'
                                : blankValues[firstFlatIdx + 1]
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                  : 'border-emerald-900/25 bg-emerald-50/50 text-emerald-900/40'
                            }`}
                          >
                            {blankValues[firstFlatIdx + 1] || '?'}
                          </button>
                        )}
                        <span>{word.after}</span>
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* 4 Slovak i/y vowel buttons */}
              <div className="grid grid-cols-4 gap-2.5">
                {(['y', 'ý', 'i', 'í'] as const).map((vowel) => (
                  <button
                    key={vowel}
                    type="button"
                    onClick={() => handleSelectVowel(vowel)}
                    className="flex min-h-[54px] items-center justify-center rounded-2xl border-2 border-emerald-900/20 bg-white font-display text-2xl font-extrabold text-emerald-950 shadow-sm transition hover:border-amber-500 hover:bg-amber-50 active:scale-95"
                  >
                    {vowel}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCheckSpelling}
                className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-900"
              >
                Skontrolovať doplňovačku
              </button>
            </div>
          )
        )}

        {feedback && (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-2xl p-3.5 text-sm font-semibold ${
              feedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-rose-700" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReadingPortalModalProps {
  reading: ReadingComprehensionBlock;
  companion: CompanionId;
  lives: number;
  onComplete: () => void;
  onMistake: () => void;
}

export const ReadingPortalModal: React.FC<ReadingPortalModalProps> = ({
  reading,
  companion,
  lives,
  onComplete,
  onMistake,
}) => {
  const [qIndex, setQIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ok: boolean; text: string} | null>(null);

  const currentQuestion = reading.questions[qIndex];

  // Build deterministic letter tiles (plus 2 extra decoy vowels y/i so child thinks!)
  const letterTiles = useMemo(() => {
    if (currentQuestion.mode !== 'text_input') return [];
    const base = [...(currentQuestion.inputHintLetters ?? [])];
    const extras = ['I', 'Í', 'Y', 'Ý'].filter((e) => !base.includes(e)).slice(0, 2);
    const combined = [...base, ...extras];
    // Deterministic shuffle
    return combined.sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));
  }, [currentQuestion]);

  const highlightFocusWords = (text: string) => {
    const pattern = new RegExp(
      `\\b(${reading.focusWords.join('|')}[a-záäčďéíĺľňóôŕšťúýž]*)\\b`,
      'gi',
    );
    const parts = text.split(pattern);
    return parts.map((part, i) => {
      const isMatch = reading.focusWords.some((fw) =>
        part.toLowerCase().startsWith(fw.toLowerCase().slice(0, Math.min(fw.length, 4))),
      );
      if (isMatch && /b[yý]/i.test(part.toLowerCase())) {
        return (
          <strong
            key={i}
            className="font-bold text-emerald-800 underline decoration-amber-400 decoration-2 underline-offset-2"
          >
            {part}
          </strong>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const advanceOrFinish = (successMsg: string) => {
    if (qIndex + 1 < reading.questions.length) {
      setFeedback({ok: true, text: successMsg});
      setTimeout(() => {
        setFeedback(null);
        setTextAnswer('');
        setQIndex((prev) => prev + 1);
      }, 900);
    } else {
      setFeedback({ok: true, text: 'Výborne! Porozumel si celému lesnému príbehu!'});
      setTimeout(() => {
        onComplete();
      }, 900);
    }
  };

  const handleSelectAnswer = (idx: number) => {
    if (feedback?.ok) return;
    if (idx === currentQuestion.correctIndex) {
      advanceOrFinish('Správna odpoveď! Poďme na ďalšiu otázku z príbehu.');
    } else {
      setFeedback({
        ok: false,
        text: `Nesprávna odpoveď (−1 život). Pomôcka: ${currentQuestion.clue}`,
      });
      onMistake();
    }
  };

  const handleSubmitTextAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (feedback?.ok) return;
    const normalized = textAnswer.trim().toLowerCase();
    const valid = (currentQuestion.correctTextAnswers ?? []).some(
      (ans) => ans.toLowerCase() === normalized,
    );
    if (valid) {
      advanceOrFinish('Skvelé! Napísal si správne vybrané slovo po B!');
    } else {
      setFeedback({
        ok: false,
        text: `To nie je hľadané slovo (−1 život). Pomôcka: ${currentQuestion.clue}`,
      });
      onMistake();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-emerald-900/20 bg-[#FAF7F0] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-800">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <span>
              ČÍTANIE S POROZUMENÍM · OTÁZKA {qIndex + 1}/{reading.questions.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-rose-700 tabular-nums">
            <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
            <span>{lives}/3</span>
          </div>
        </div>

        <h2 className="mt-2 font-display text-2xl font-bold text-emerald-950">
          {reading.title}
        </h2>

        <div className="mt-3 space-y-2.5 rounded-2xl border border-emerald-900/10 bg-white p-4 text-base leading-relaxed text-emerald-950">
          {reading.storyParagraphs.map((p, idx) => (
            <p key={idx}>{highlightFocusWords(p)}</p>
          ))}
        </div>

        <div className="mt-4">
          <AnimatedCompanion
            companion={companion}
            size="sm"
            mood={feedback?.ok ? 'celebrate' : 'happy'}
            message={
              currentQuestion.mode === 'text_input'
                ? 'Nájdi odpoveď v texte a doplň správne slovo sám!'
                : 'Prečítaj si príbeh pozorne a vyber správnu odpoveď!'
            }
          />
        </div>

        <div className="mt-4">
          <p className="text-base font-bold text-emerald-950 sm:text-lg">
            {currentQuestion.question}
          </p>

          {currentQuestion.mode === 'choice' && currentQuestion.options ? (
            <div className="mt-3 space-y-2.5">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 border-emerald-900/15 bg-white px-4 py-3 text-left text-sm font-semibold text-emerald-950 transition hover:border-amber-500 hover:bg-amber-50 active:scale-[0.99] sm:text-base"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 font-display text-xs font-bold text-emerald-900">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmitTextAnswer} className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Napíš alebo poskladaj slovo..."
                  className="min-h-[50px] flex-1 rounded-2xl border-2 border-emerald-900/20 bg-white px-4 font-display text-lg font-bold text-emerald-950 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setTextAnswer((prev) => prev.slice(0, -1))}
                  className="flex min-h-[50px] min-w-[50px] items-center justify-center rounded-2xl border border-emerald-900/20 bg-white text-emerald-900 hover:bg-emerald-50"
                  aria-label="Zmazať písmeno"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>

              {/* Tappable Slovak letter helper tiles for tablets */}
              <div className="flex flex-wrap gap-2">
                {letterTiles.map((ltr, i) => (
                  <button
                    key={`${ltr}-${i}`}
                    type="button"
                    onClick={() => setTextAnswer((prev) => prev + ltr.toLowerCase())}
                    className="flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-emerald-900/20 bg-white px-3 font-display text-base font-extrabold text-emerald-950 shadow-sm hover:bg-amber-50 active:scale-95"
                  >
                    {ltr}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={textAnswer.trim().length === 0}
                className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-45"
              >
                Potvrdiť odpoveď
              </button>
            </form>
          )}
        </div>

        {feedback && (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-2xl p-3.5 text-sm font-semibold ${
              feedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
            }`}
          >
            {feedback.ok ? (
              <Sparkles className="h-5 w-5 shrink-0 text-emerald-700" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-rose-700" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
