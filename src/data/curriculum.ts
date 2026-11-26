import {
  CattleScenicDef,
  EnemyDef,
  HerbPatchDef,
  LetterItemDef,
  LevelDef,
  MushroomBounceDef,
  PlatformDef,
  StreamDef,
} from '../types/game';

interface LayoutSeed {
  variant: number;
  targetWords: string[];
}

/**
 * Generates varied, 100%-reachable forest terrain (streams, stepping stones,
 * wooden bridges, branches, herbs, cattle, bouncy mushrooms, calm-speed creatures,
 * and evenly spaced collectible letter medallions for any vybrané slová po B).
 */
function buildForestGeometry(seed: LayoutSeed): {
  worldWidth: number;
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
} {
  const v = seed.variant;
  const worldWidth = 2750 + (v % 3) * 180;

  const stream1Start = 560 + (v % 2) * 40;
  const stream1Width = 170 + (v % 3) * 35;
  const midStart = stream1Start + stream1Width;
  const midWidth = 640 + (v % 2) * 80;
  const stream2Start = midStart + midWidth;
  const stream2Width = 170 + ((v + 1) % 3) * 35;
  const endStart = stream2Start + stream2Width;

  const checkpointX = Math.round(midStart + midWidth * 0.72);
  const gateX = endStart + 260;
  const portalX = worldWidth - 150;

  const platforms: PlatformDef[] = [
    // Section 1: starting meadow
    {x: 0, y: 460, w: stream1Start, h: 90, kind: 'grass'},
    {x: 210, y: 365, w: 145, h: 22, kind: 'branch'},
    {x: 400, y: 300, w: 145, h: 22, kind: 'wood'},
    // Stepping stone over stream 1
    {
      x: stream1Start + 38,
      y: 410,
      w: Math.max(85, stream1Width - 76),
      h: 22,
      kind: 'stone',
      moving: v % 4 === 2 ? {axis: 'x', range: 26, speed: 1.3} : undefined,
    },
    // Section 2: central forest clearing
    {x: midStart, y: 460, w: midWidth, h: 90, kind: 'grass'},
    {x: midStart + 130, y: 350, w: 165, h: 22, kind: 'wood'},
    {x: midStart + 350, y: 280, w: 165, h: 22, kind: 'branch'},
    // Stepping stone over stream 2
    {
      x: stream2Start + 38,
      y: 405,
      w: Math.max(85, stream2Width - 76),
      h: 22,
      kind: 'stone',
      moving: v % 4 === 3 ? {axis: 'y', range: 28, speed: 1.4} : undefined,
    },
    // Section 3: gate & story portal meadow
    {x: endStart, y: 460, w: worldWidth - endStart, h: 90, kind: 'grass'},
    {x: gateX + 140, y: 355, w: 165, h: 22, kind: 'branch'},
    {x: gateX + 355, y: 285, w: 170, h: 22, kind: 'wood'},
    {x: Math.min(portalX - 240, gateX + 585), y: 370, w: 135, h: 22, kind: 'stone'},
  ];

  const streams: StreamDef[] = [
    {x: stream1Start, y: 472, w: stream1Width, h: 78, label: 'bystrina'},
    {x: stream2Start, y: 472, w: stream2Width, h: 78, label: 'bystrinka'},
  ];

  const speciesCycle: HerbPatchDef['species'][] = ['materina_duska', 'rumanček', 'zvonček', 'paprad'];
  const herbs: HerbPatchDef[] = [
    {x: 150, y: 460, species: speciesCycle[v % 4]},
    {x: 450, y: 460, species: speciesCycle[(v + 1) % 4]},
    {x: midStart + 90, y: 460, species: speciesCycle[(v + 2) % 4]},
    {x: midStart + 440, y: 460, species: speciesCycle[(v + 3) % 4]},
    {x: endStart + 120, y: 460, species: speciesCycle[v % 4]},
    {x: gateX + 260, y: 460, species: speciesCycle[(v + 1) % 4]},
    {x: portalX - 220, y: 460, species: speciesCycle[(v + 2) % 4]},
  ];

  const mushrooms: MushroomBounceDef[] = [
    {x: midStart + 70, y: 460, power: -780},
    {x: gateX + 95, y: 460, power: -780},
  ];

  const animalCycle: CattleScenicDef['animal'][] = ['teliatko', 'kobyla', 'byk', 'byvol'];
  const cattle: CattleScenicDef[] = [
    {x: 320, y: 430, animal: animalCycle[v % 4]},
    {x: midStart + 280, y: 430, animal: animalCycle[(v + 1) % 4]},
    {x: portalX - 180, y: 430, animal: animalCycle[(v + 2) % 4]},
  ];

  // Calm, fair creature speeds across ALL 15 levels (never sped up!)
  const enemies: EnemyDef[] = [
    {
      id: `e-${v}-1`,
      kind: v % 2 === 0 ? 'chrobak' : 'skriatok',
      name: v % 2 === 0 ? 'Bodliakový chrobák' : 'Machový škriatok',
      x: 360,
      y: 460,
      minX: 220,
      maxX: stream1Start - 45,
      speed: 82,
    },
    {
      id: `e-${v}-2`,
      kind: v % 2 === 0 ? 'skriatok' : 'chrobak',
      name: v % 2 === 0 ? 'Machový škriatok' : 'Bodliakový chrobák',
      x: midStart + 260,
      y: 460,
      minX: midStart + 130,
      maxX: checkpointX - 65,
      speed: 90,
    },
    {
      id: `e-${v}-3`,
      kind: 'havran',
      name: 'Tieňový havran',
      x: midStart + 320,
      y: 205,
      minX: midStart + 110,
      maxX: stream2Start - 60,
      speed: 95,
      amplitudeY: 22,
    },
    {
      id: `e-${v}-4`,
      kind: 'skriatok',
      name: 'Machový škriatok',
      x: gateX + 340,
      y: 460,
      minX: gateX + 180,
      maxX: portalX - 120,
      speed: 92,
    },
  ];

  // Place all collectible letters on comfortable reachable anchors
  const anchors: Array<{x: number; y: number}> = [
    {x: 165, y: 410},
    {x: 260, y: 310},
    {x: 325, y: 310},
    {x: 445, y: 245},
    {x: 515, y: 245},
    {x: stream1Start + stream1Width / 2, y: 350},
    {x: midStart + 175, y: 295},
    {x: midStart + 250, y: 295},
    {x: midStart + 395, y: 225},
    {x: midStart + 475, y: 225},
    {x: stream2Start + stream2Width / 2, y: 340},
    {x: endStart + 140, y: 405},
    {x: gateX + 185, y: 300},
    {x: gateX + 260, y: 300},
    {x: gateX + 405, y: 230},
    {x: gateX + 485, y: 230},
    {x: Math.min(portalX - 180, gateX + 645), y: 315},
    {x: portalX - 95, y: 405},
  ];

  const letters: LetterItemDef[] = [];
  let cursor = 0;
  seed.targetWords.forEach((word, wordIndex) => {
    word.split('').forEach((char, letterIndex) => {
      const pos = anchors[cursor % anchors.length];
      letters.push({
        id: `l-${v}-${wordIndex}-${letterIndex}`,
        char,
        x: pos.x,
        y: pos.y,
        wordIndex,
        letterIndex,
      });
      cursor++;
    });
  });

  return {
    worldWidth,
    checkpointX,
    checkpointY: 460,
    gateX,
    gateY: 460,
    portalX,
    portalY: 460,
    platforms,
    streams,
    herbs,
    mushrooms,
    cattle,
    enemies,
    letters,
  };
}

export const LEVELS: LevelDef[] = [
  // =========================================================================
  // STUPEŇ 1 — ZÁKLADNÁ VÝPRAVA (ÚROVNE 1–5)
  // =========================================================================
  {
    id: 1,
    tier: 'zaklad',
    title: 'Úroveň 1: Lúka liečivých bylín',
    subtitle: 'BYLINA, BYLINKA · Násobilka 2 × 4',
    themeColor: '#15803D',
    skyTop: '#DBEAFE',
    skyBottom: '#FEF9C3',
    targetWords: ['BYLINA', 'BYLINKA'],
    companion: 'bylinka',
    introMessage:
      'Vitaj na lúke! Zbieraj písmená slov BYLINA a BYLINKA. Dávaj pozor na škriatkov a otvor bránu násobilkou!',
    ...buildForestGeometry({variant: 1, targetWords: ['BYLINA', 'BYLINKA']}),
    mathChallenge: {
      id: 'm1',
      prompt: 'Víla Bylinka natrhala 2 košíky liečivých bylín. V každom košíku sú 4 bylinky. Koľko bylín má spolu?',
      expressionDisplay: '2 × 4 = ?',
      operation: 'mul',
      factorA: 2,
      factorB: 4,
      visualGroupLabel: 'bylín v košíku',
      inputMode: 'choice',
      options: [6, 8, 10, 12],
      correctAnswer: 8,
      hint: 'Dva košíky po 4 bylinky: 4 + 4.',
    },
    readingBlock: {
      title: 'Príbeh: Lúka liečivých bylín',
      focusWords: ['bylina', 'bylinky', 'bystrina', 'bývať'],
      storyParagraphs: [
        'Na okraji lesa, kde tečie čistá horská bystrina, rastie voňavá bylina materina dúška. Víla Bylinka každé ráno zbiera liečivé bylinky do košíka.',
        'Z týchto bylín varí teplý čaj pre zvieratká, ktoré bývajú v lese.',
      ],
      questions: [
        {
          id: 'q1-1',
          mode: 'choice',
          question: 'Čo varí víla Bylinka z voňavých bylín pre zvieratká?',
          options: ['Teplý bylinkový čaj', 'Studenú limonádu z kameňov', 'Polievku zo šišiek'],
          correctIndex: 0,
          clue: 'Pozri sa na začiatok druhého odseku.',
        },
      ],
    },
    reward: {
      id: 'badge_1',
      title: 'Strážca byliniek',
      subtitle: 'Ovládaš slová BYLINA a BYLINKA!',
      wordCard: {
        word: 'bylina',
        syllables: 'by · li · na',
        meaning: 'Zelená rastlina s mäkkou stonkou, často liečivá.',
        example: 'Na slnečnej čistinke rozvoniava liečivá bylina.',
        category: 'byliny',
      },
    },
  },

  {
    id: 2,
    tier: 'zaklad',
    title: 'Úroveň 2: Spevavá bystrina',
    subtitle: 'BYSTRINA, BYSTRÝ · Násobilka 3 × 2',
    themeColor: '#0369A1',
    skyTop: '#BAE6FD',
    skyBottom: '#ECFDF5',
    targetWords: ['BYSTRINA', 'BYSTRÝ'],
    companion: 'sovicka',
    introMessage:
      'Preskoč horské bystriny po kameňoch! Nazbieraj slová BYSTRINA a BYSTRÝ a pomôž sovičke s násobilkou s 3.',
    ...buildForestGeometry({variant: 2, targetWords: ['BYSTRINA', 'BYSTRÝ']}),
    mathChallenge: {
      id: 'm2',
      prompt: 'Cez bystrinu vedú 3 drevené lávky. Na každej lávke sedia 2 bystré žabky. Koľko žabiek je na lávkach?',
      expressionDisplay: '3 × 2 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 2,
      visualGroupLabel: 'žabiek na lávke',
      inputMode: 'choice',
      options: [5, 6, 8, 9],
      correctAnswer: 6,
      hint: 'Tri lávky po 2 žabky: 2 + 2 + 2.',
    },
    readingBlock: {
      title: 'Príbeh: Spevavá bystrina',
      focusWords: ['bystrina', 'bystrý', 'byliny', 'byvol'],
      storyParagraphs: [
        'Horská bystrina veselo žblnkoce pomedzi kamene. Bystrý jelenček sa pri nej zastaví vždy napoludnie, aby sa napil studenej vody.',
        'Okolo bystriny rastú zelené byliny a v tieni stromov oddychuje aj mladý byvol.',
      ],
      questions: [
        {
          id: 'q2-1',
          mode: 'choice',
          question: 'Prečo sa bystrý jelenček zastaví pri horskej bystrine?',
          options: ['Aby sa napil studenej vody', 'Aby hľadal stratený nábytok', 'Aby spočítal oblaky'],
          correctIndex: 0,
          clue: 'Prečítaj si druhú vetu prvého odseku.',
        },
      ],
    },
    reward: {
      id: 'badge_2',
      title: 'Krotiteľ bystriny',
      subtitle: 'Ovládaš slová BYSTRINA a BYSTRÝ aj násobok 3 × 2!',
      wordCard: {
        word: 'bystrina',
        syllables: 'bys · tri · na',
        meaning: 'Rýchly horský potok s čistou vodou.',
        example: 'Studená bystrina tečie pomedzi machové skaly.',
        category: 'bystrina',
      },
    },
  },

  {
    id: 3,
    tier: 'zaklad',
    title: 'Úroveň 3: Pastvina dobytka',
    subtitle: 'DOBYTOK, KOBYLA · Doplň sám 3 × 3',
    themeColor: '#B45309',
    skyTop: '#FEF3C7',
    skyBottom: '#DCFCE7',
    targetWords: ['DOBYTOK', 'KOBYLA'],
    companion: 'bubi',
    introMessage:
      'Býček Bubi pasie dobytok na lúke! Pozbieraj slová DOBYTOK a KOBYLA a výsledok príkladu doplň sám na klávesnici.',
    ...buildForestGeometry({variant: 3, targetWords: ['DOBYTOK', 'KOBYLA']}),
    mathChallenge: {
      id: 'm3',
      prompt: 'Na pastvine sú 3 stáda dobytka. V každom stáde sú 3 kobyly. Koľko kobýl je spolu? Napíš výsledok:',
      expressionDisplay: '3 × 3 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 3,
      visualGroupLabel: 'kobýl v stáde',
      inputMode: 'keypad',
      correctAnswer: 9,
      hint: 'Tri stáda po 3 kobyly: 3 + 3 + 3.',
    },
    spellingChallenge: {
      id: 's3',
      instruction: 'Doplň správne tvrdé y/ý alebo mäkké i/í do vybraných slov:',
      segments: ['Na lúke sa pasie ', ' a hnedá ', '.'],
      words: [
        {before: 'dob', after: 'tok', correctChars: ['y']},
        {before: 'kob', after: 'la', correctChars: ['y']},
      ],
      explanation: 'Dobytok aj kobyla sú vybrané slová po B — píšeme v nich tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Pastvina pri potoku',
      focusWords: ['dobytok', 'kobyla', 'bystrina', 'bylina'],
      storyParagraphs: [
        'Na slnečnej pastvine sa pokojne pasie domáci dobytok. Hnedá kobyla sa napije z čistej bystriny a potom si pochutná na čerstvej tráve.',
        'Pastier dbá na to, aby zvieratá mali dosť vody aj tieňa.',
      ],
      questions: [
        {
          id: 'q3-1',
          mode: 'choice',
          question: 'Z čoho sa napila hnedá kobyla na pastvine?',
          options: ['Z čistej bystriny', 'Z prázdneho vedra', 'Zo snehového záveja'],
          correctIndex: 0,
          clue: 'Pozri sa na druhú vetu prvého odseku.',
        },
      ],
    },
    reward: {
      id: 'badge_3',
      title: 'Priateľ dobytka',
      subtitle: 'Sám si vypočítal 3 × 3 a doplnil y v slovách DOBYTOK a KOBYLA!',
      wordCard: {
        word: 'dobytok',
        syllables: 'do · by · tok',
        meaning: 'Hospodárske zvieratá chované na statku (kravy, býky, kone, kobyly).',
        example: 'Na podhorskej lúke sa pasie spokojný dobytok.',
        category: 'dobytok',
      },
    },
  },

  {
    id: 4,
    tier: 'zaklad',
    title: 'Úroveň 4: Silný býk a byvol',
    subtitle: 'BÝK, BYVOL · Násobilka 3 × 4',
    themeColor: '#92400E',
    skyTop: '#FDE68A',
    skyBottom: '#D1FAE5',
    targetWords: ['BÝK', 'BYVOL'],
    companion: 'bubi',
    introMessage:
      'Spoznaj silného býka a byvola! Dávaj pozor na bodliakových chrobákov a nezabudni na dĺžeň v slove BÝK.',
    ...buildForestGeometry({variant: 4, targetWords: ['BÝK', 'BYVOL']}),
    mathChallenge: {
      id: 'm4',
      prompt: 'Každý z troch silných byvolov nesie 4 zväzky sena. Koľko zväzkov sena nesú spolu?',
      expressionDisplay: '3 × 4 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 4,
      visualGroupLabel: 'zväzkov sena',
      inputMode: 'choice',
      options: [9, 12, 15, 16],
      correctAnswer: 12,
      hint: 'Spočítaj 3 krát 4: 4 + 4 + 4.',
    },
    spellingChallenge: {
      id: 's4',
      instruction: 'Pozor na krátke y a dlhé ý! Doplň chýbajúce písmená:',
      segments: ['Na lúke stojí silný ', ' a mohutný ', '.'],
      words: [
        {before: 'b', after: 'k', correctChars: ['ý']},
        {before: 'b', after: 'vol', correctChars: ['y']},
      ],
      explanation: 'V slove býk píšeme dlhé ý, v slove byvol krátke y.',
    },
    readingBlock: {
      title: 'Príbeh: Býk a byvol pri bystrine',
      focusWords: ['býk', 'byvol', 'bystrina', 'bylina'],
      storyParagraphs: [
        'Mladý býk a rohatý byvol sú najlepší kamaráti z horskej lúky. Spolu chodia k bystrine a chránia menšie teliatka.',
        'Večer si vždy ľahnú do mäkkej trávy plnej voňavých bylín.',
      ],
      questions: [
        {
          id: 'q4-1',
          mode: 'choice',
          question: 'Koho chránia býk a byvol pri bystrine?',
          options: ['Menšie teliatka', 'Tieňových havranov', 'Machových škriatkov'],
          correctIndex: 0,
          clue: 'Dočítaj druhú vetu prvého odseku.',
        },
      ],
    },
    reward: {
      id: 'badge_4',
      title: 'Ochranca lúky',
      subtitle: 'Rozlišuješ krátke y v slove BYVOL a dlhé ý v slove BÝK!',
      wordCard: {
        word: 'byvol',
        syllables: 'by · vol',
        meaning: 'Veľké silné rohaté zviera príbuzné býkovi.',
        example: 'Mohutný byvol sa napil z horskej bystriny.',
        category: 'dobytok',
      },
    },
  },

  {
    id: 5,
    tier: 'zaklad',
    title: 'Úroveň 5: Byt a bývanie v lese',
    subtitle: 'BYŤ, BÝVAŤ, BYT · Doplň sám 3 × 5',
    themeColor: '#047857',
    skyTop: '#CCFBF1',
    skyBottom: '#FEF9C3',
    targetWords: ['BYŤ', 'BÝVAŤ', 'BYT'],
    companion: 'bystrik',
    introMessage:
      'Pozbieraj základné slová BYŤ, BÝVAŤ a BYT! V úlohe z násobilky 3 × 5 napíš výsledok sám.',
    ...buildForestGeometry({variant: 5, targetWords: ['BYŤ', 'BÝVAŤ', 'BYT']}),
    mathChallenge: {
      id: 'm5',
      prompt: 'V starom strome sú 3 lesné byty. V každom byte svieti 5 malých okienok. Koľko okienok svieti spolu?',
      expressionDisplay: '3 × 5 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 5,
      visualGroupLabel: 'okienok v byte',
      inputMode: 'keypad',
      correctAnswer: 15,
      hint: 'Tri krát päť: 5 + 5 + 5.',
    },
    spellingChallenge: {
      id: 's5',
      instruction: 'Doplň správne y alebo ý do slov:',
      segments: ['V teplom lese je krásne ', ' a v domčeku ', ' veverička.'],
      words: [
        {before: 'b', after: 'ť', correctChars: ['y']},
        {before: 'b', after: 'va', correctChars: ['ý']},
      ],
      explanation: 'Slovo byť píšeme s krátkym y, slovo býva s dlhým ý.',
    },
    readingBlock: {
      title: 'Príbeh: Kto rád býva v lese',
      focusWords: ['byť', 'bývať', 'byt', 'byliny'],
      storyParagraphs: [
        'V dutine starého buka má veverička svoj malý lesný byt. Je rada, že môže byť priateľkou víly Bylinky.',
        'Ráno sa spolu pozerajú na lúku, kde rastú liečivé byliny a žblnkoce bystrina.',
      ],
      questions: [
        {
          id: 'q5-1',
          mode: 'choice',
          question: 'Kde má veverička svoj malý lesný byt?',
          options: ['V dutine starého buka', 'Pod studeným kameňom v bystrine', 'V prázdnom košíku'],
          correctIndex: 0,
          clue: 'Pozri sa na prvú vetu príbehu.',
        },
      ],
    },
    reward: {
      id: 'badge_5',
      title: 'Lesný prieskumník',
      subtitle: 'Dokončil si 1. etapu a otváraš silnejšiu obtiažnosť s delením a doplňovačkou!',
      wordCard: {
        word: 'bývať',
        syllables: 'bý · vať',
        meaning: 'Mať niekde svoj domov, byt alebo obydlie.',
        example: 'Sovička Bystruška rada býva vysoko v korune duba.',
        category: 'obydlie',
      },
    },
  },

  // =========================================================================
  // STUPEŇ 2 — SILNEJŠIA OBTIAŽNOSŤ (ÚROVNE 6–10: DELENIE & DOPLŇOVAČKA i/y)
  // =========================================================================
  {
    id: 6,
    tier: 'silnejsia',
    title: 'Úroveň 6: Bydlisko lesných priateľov',
    subtitle: 'BYDLISKO, BÝVALÝ · Doplň sám 3 × 6 + doplňovačka i/y',
    themeColor: '#0F766E',
    skyTop: '#A7F3D0',
    skyBottom: '#FEF3C7',
    targetWords: ['BYDLISKO', 'BÝVALÝ'],
    companion: 'bylinka',
    introMessage:
      'Vitaj v silnejšej obtiažnosti! Zlé bytosti nebežia rýchlejšie, ale čaká ťa ťažšia doplňovačka i/y a vlastný výpočet 3 × 6.',
    ...buildForestGeometry({variant: 6, targetWords: ['BYDLISKO', 'BÝVALÝ']}),
    mathChallenge: {
      id: 'm6',
      prompt: 'Na troch stromoch je označené bydlisko pre sovy. Na každom strome je 6 šišiek. Koľko šišiek je spolu?',
      expressionDisplay: '3 × 6 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 6,
      visualGroupLabel: 'šišiek na strome',
      inputMode: 'keypad',
      correctAnswer: 18,
      hint: 'Tri krát šesť: 6 + 6 + 6.',
    },
    spellingChallenge: {
      id: 's6',
      instruction: 'Pozor! V jednom slove dopĺňaš tvrdé y/ý aj mäkké i/í:',
      segments: ['Lesné ', ' si obľúbil aj ', ' pastier dobytka.'],
      words: [
        {before: 'b', middle: 'dl', after: 'sko', correctChars: ['y', 'i']},
        {before: 'b', after: 'valý', correctChars: ['ý']},
      ],
      explanation: 'Bydlisko má po b tvrdé y a po l mäkké i. Bývalý má po b dlhé ý.',
    },
    readingBlock: {
      title: 'Príbeh: Nové bydlisko v hore',
      focusWords: ['bydlisko', 'bývalý', 'dobytok', 'bystrina'],
      storyParagraphs: [
        'Bývalý pastier Jozef si našiel tiché bydlisko na okraji hory, hneď vedľa čistej bystriny. Každý deň sa stará o dobytok na zelenej čistinke.',
        'Keď slnko zapadá, zvieratá sa vrátia k chalúpke a oddychujú.',
      ],
      questions: [
        {
          id: 'q6-1',
          mode: 'choice',
          question: 'Kde si našiel bývalý pastier Jozef svoje bydlisko?',
          options: ['Na okraji hory vedľa čistej bystriny', 'Uprostred rušného námestia', 'Na vrchole ľadovca'],
          correctIndex: 0,
          clue: 'Pozri sa na prvú vetu príbehu.',
        },
        {
          id: 'q6-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo z príbehu, ktoré znamená miesto, kde niekto býva:',
          correctTextAnswers: ['bydlisko'],
          inputHintLetters: ['B', 'Y', 'D', 'L', 'I', 'S', 'K', 'O'],
          clue: 'Začína na b a má 8 písmen (nájdeš ho v prvej vete).',
        },
      ],
    },
    reward: {
      id: 'badge_6',
      title: 'Znalec bydliska',
      subtitle: 'Zvládol si obe písmená v slove BYDLISKO aj násobilku 3 × 6!',
      wordCard: {
        word: 'bydlisko',
        syllables: 'byd · lis · ko',
        meaning: 'Adresa alebo miesto, kde človek alebo zviera trvalo býva.',
        example: 'Naše lesné bydlisko je pri čistej bystrine.',
        category: 'obydlie',
      },
    },
  },

  {
    id: 7,
    tier: 'silnejsia',
    title: 'Úroveň 7: Obydlie lesnej bytosti',
    subtitle: 'OBYDLIE, BYTOSŤ · Delenie 18 : 3',
    themeColor: '#6D28D9',
    skyTop: '#E0E7FF',
    skyBottom: '#FEF9C3',
    targetWords: ['OBYDLIE', 'BYTOSŤ'],
    companion: 'sovicka',
    introMessage:
      'Prichádza prvé delenie s 3! Pozbieraj slová OBYDLIE a BYTOSŤ a rozdeľ 18 žaluďov medzi 3 lesné bytosti.',
    ...buildForestGeometry({variant: 7, targetWords: ['OBYDLIE', 'BYTOSŤ']}),
    mathChallenge: {
      id: 'm7',
      prompt: 'Bystrík našiel 18 zlatých žaluďov a spravodlivo ich rozdelil medzi 3 lesné bytosti. Koľko žaluďov dostala každá bytosť?',
      expressionDisplay: '18 : 3 = ?',
      operation: 'div',
      factorA: 3,
      factorB: 6,
      visualGroupLabel: 'žaluďov pre bytosť',
      inputMode: 'choice',
      options: [4, 5, 6, 7],
      correctAnswer: 6,
      hint: 'Koľko krát 3 sa rovná 18? (3 × 6 = 18)',
    },
    spellingChallenge: {
      id: 's7',
      instruction: 'Doplň chýbajúce tvrdé y do vybraných slov:',
      segments: ['V útulnom ', ' žije múdra lesná ', '.'],
      words: [
        {before: 'ob', after: 'dlí', correctChars: ['y']},
        {before: 'b', after: 'tosť', correctChars: ['y']},
      ],
      explanation: 'V tvare obydlí (od slova obydlie) píšeme po b tvrdé y. Slovo bytosť má tiež po b tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Obydlie dobrej bytosti',
      focusWords: ['obydlie', 'bytosť', 'bylina', 'bystrina'],
      storyParagraphs: [
        'Pod koreňmi starej jedle stojí malé drevené obydlie. Býva v ňom dobrá lesná bytosť, ktorá stráži horské byliny pred mrazom.',
        'Keď pocestný zablúdi, rozsvieti mu lampášik a ukáže mu cestu popri bystrine.',
      ],
      questions: [
        {
          id: 'q7-1',
          mode: 'choice',
          question: 'Pred čím chráni dobrá lesná bytosť horské byliny?',
          options: ['Pred mrazom', 'Pred čistou vodou', 'Pred slnečným svetlom'],
          correctIndex: 0,
          clue: 'Pozri sa na druhú vetu prvého odseku.',
        },
        {
          id: 'q7-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo z príbehu, ktoré označuje domček alebo príbytok pod jedľou:',
          correctTextAnswers: ['obydlie'],
          inputHintLetters: ['O', 'B', 'Y', 'D', 'L', 'I', 'E'],
          clue: 'Začína na o a končí na ie (prvá veta príbehu).',
        },
      ],
    },
    reward: {
      id: 'badge_7',
      title: 'Strážca obydlia',
      subtitle: 'Ovládaš delenie 18 : 3 aj slová OBYDLIE a BYTOSŤ!',
      wordCard: {
        word: 'obydlie',
        syllables: 'o · byd · lie',
        meaning: 'Miesto na bývanie, domček alebo útulný príbytok.',
        example: 'Pod starou jedľou stojí teplé obydlie lesnej víly.',
        category: 'obydlie',
      },
    },
  },

  {
    id: 8,
    tier: 'silnejsia',
    title: 'Úroveň 8: Príbytok a drevený nábytok',
    subtitle: 'PRÍBYTOK, NÁBYTOK · Doplň sám 3 × 7',
    themeColor: '#7C2D12',
    skyTop: '#FDE68A',
    skyBottom: '#DCFCE7',
    targetWords: ['PRÍBYTOK', 'NÁBYTOK'],
    companion: 'bystrik',
    introMessage:
      'Pozbieraj písmená slov PRÍBYTOK a NÁBYTOK. V doplňovačke si daj pozor na dlhé í a tvrdé y!',
    ...buildForestGeometry({variant: 8, targetWords: ['PRÍBYTOK', 'NÁBYTOK']}),
    mathChallenge: {
      id: 'm8',
      prompt: 'Do troch lesných príbytkov vyrobili dubový nábytok. V každom príbytku je 7 drevených stoličiek. Koľko stoličiek vyrobili spolu?',
      expressionDisplay: '3 × 7 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 7,
      visualGroupLabel: 'stoličiek v príbytku',
      inputMode: 'keypad',
      correctAnswer: 21,
      hint: 'Tri krát sedem: 7 + 7 + 7.',
    },
    spellingChallenge: {
      id: 's8',
      instruction: 'Doplň správne í alebo y do vybraných slov:',
      segments: ['V drevenom ', ' stojí pekný dubový ', '.'],
      words: [
        {before: 'pr', middle: 'b', after: 'tku', correctChars: ['í', 'y']},
        {before: 'náb', after: 'tok', correctChars: ['y']},
      ],
      explanation: 'Príbytok má po r mäkké dlhé í a po b tvrdé y. Nábytok má po b tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Príbytok s dubovým nábytkom',
      focusWords: ['príbytok', 'nábytok', 'byliny', 'bystrina'],
      storyParagraphs: [
        'Bystrík si postavil pevný drevený príbytok na brehu čistej bystriny. Vnútri vonia nový dubový nábytok — stôl, dve lavice a polička na byliny.',
        'Keď prší, zvieratká sa uňho schovajú a popíjajú teplý čaj.',
      ],
      questions: [
        {
          id: 'q8-1',
          mode: 'choice',
          question: 'Z akého dreva je vyrobený nábytok v Bystríkovom príbytku?',
          options: ['Z dubového dreva', 'Z kovu a plastu', 'Z ľadových kociek'],
          correctIndex: 0,
          clue: 'Prečítaj si druhú vetu prvého odseku.',
        },
        {
          id: 'q8-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo, ktoré pomenúva stôl, lavice a poličku v príbytku:',
          correctTextAnswers: ['nábytok', 'nabytok'],
          inputHintLetters: ['N', 'Á', 'B', 'Y', 'T', 'O', 'K'],
          clue: 'Začína na ná- a končí na -tok.',
        },
      ],
    },
    reward: {
      id: 'badge_8',
      title: 'Lesný stolár',
      subtitle: 'Ovládaš PRÍBYTOK, NÁBYTOK aj násobilku 3 × 7!',
      wordCard: {
        word: 'nábytok',
        syllables: 'ná · by · tok',
        meaning: 'Zariadenie príbytku ako stoly, stoličky, lavice a skrine.',
        example: 'V drevenom príbytku vonia pevný dubový nábytok.',
        category: 'obydlie',
      },
    },
  },

  {
    id: 9,
    tier: 'silnejsia',
    title: 'Úroveň 9: Obyčaj a obyvateľ lesa',
    subtitle: 'OBYČAJ, OBYVATEĽ · Delenie 24 : 3 (sám!)',
    themeColor: '#0E7490',
    skyTop: '#BAE6FD',
    skyBottom: '#FEF08A',
    targetWords: ['OBYČAJ', 'OBYVATEĽ'],
    companion: 'bylinka',
    introMessage:
      'Pozbieraj slová OBYČAJ a OBYVATEĽ! Pri bráne vypočítaj delenie 24 : 3 bez nápovedy možností.',
    ...buildForestGeometry({variant: 9, targetWords: ['OBYČAJ', 'OBYVATEĽ']}),
    mathChallenge: {
      id: 'm9',
      prompt: 'Medzi 3 usilovných obyvateľov lesa rozdelíme 24 zväzkov byliniek. Koľko zväzkov dostane každý obyvateľ?',
      expressionDisplay: '24 : 3 = ?',
      operation: 'div',
      factorA: 3,
      factorB: 8,
      visualGroupLabel: 'zväzkov pre obyvateľa',
      inputMode: 'keypad',
      correctAnswer: 8,
      hint: 'Koľko krát 3 je 24? (3 × 8 = 24)',
    },
    spellingChallenge: {
      id: 's9',
      instruction: 'Doplň chýbajúce tvrdé y do oboch vybraných slov:',
      segments: ['Každý ', ' lesa dodržiava dobrý ', ' pomáhať si.'],
      words: [
        {before: 'ob', after: 'vateľ', correctChars: ['y']},
        {before: 'ob', after: 'čaj', correctChars: ['y']},
      ],
      explanation: 'Aj obyvateľ, aj obyčaj sú vybrané slová po B — píšeme v nich tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Pekný lesný obyčaj',
      focusWords: ['obyčaj', 'obyvateľ', 'bylina', 'dobytok'],
      storyParagraphs: [
        'V Čarovnom lese platí starý dobrý obyčaj: každý obyvateľ lesa vždy na jar vyčistí breh bystriny od suchých konárov.',
        'Vďaka tomu môže dobytok bezpečne piť vodu a pri brehu kvitnú čerstvé byliny.',
      ],
      questions: [
        {
          id: 'q9-1',
          mode: 'choice',
          question: 'Kedy čistí každý obyvateľ lesa breh bystriny od suchých konárov?',
          options: ['Vždy na jar', 'Iba uprostred zimy', 'Nikdy'],
          correctIndex: 0,
          clue: 'Pozri sa na prvú vetu príbehu.',
        },
        {
          id: 'q9-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo z príbehu, ktoré znamená zvyk alebo tradícia:',
          correctTextAnswers: ['obyčaj', 'obycaj'],
          inputHintLetters: ['O', 'B', 'Y', 'Č', 'A', 'J'],
          clue: 'Začína na o a končí na -čaj.',
        },
      ],
    },
    reward: {
      id: 'badge_9',
      title: 'Dobrý obyvateľ lesa',
      subtitle: 'Vypočítal si 24 : 3 sám a ovládaš OBYČAJ a OBYVATEĽ!',
      wordCard: {
        word: 'obyčaj',
        syllables: 'o · by · čaj',
        meaning: 'Zaužívaný dobrý zvyk alebo tradícia.',
        example: 'V lese je pekný obyčaj pomáhať zvieratkám.',
        category: 'obydlie',
      },
    },
  },

  {
    id: 10,
    tier: 'silnejsia',
    title: 'Úroveň 10: Bystrík a spojky ABY, BY',
    subtitle: 'ABY, BY, BYSTRÍK · Doplň sám 3 × 8',
    themeColor: '#1D4ED8',
    skyTop: '#DBEAFE',
    skyBottom: '#DCFCE7',
    targetWords: ['ABY', 'BY', 'BYSTRÍK'],
    companion: 'bystrik',
    introMessage:
      'Aj krátke slová ABY a BY patria medzi vybrané slová po B! Nazbieraj ich spolu s menom BYSTRÍK a vypočítaj 3 × 8.',
    ...buildForestGeometry({variant: 10, targetWords: ['ABY', 'BY', 'BYSTRÍK']}),
    mathChallenge: {
      id: 'm10',
      prompt: 'Bystrík nasadil 3 rady stromčekov. V každom rade je 8 mladých bukov. Koľko stromčekov nasadil spolu?',
      expressionDisplay: '3 × 8 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 8,
      visualGroupLabel: 'stromčekov v rade',
      inputMode: 'keypad',
      correctAnswer: 24,
      hint: 'Tri krát osem: 8 + 8 + 8.',
    },
    spellingChallenge: {
      id: 's10',
      instruction: 'Doplň tvrdé y/ý alebo mäkké i/í:',
      segments: ['Prieskumník ', ' sa ponáhľa, ', ' zachránil bylinky.'],
      words: [
        {before: 'B', middle: 'str', after: 'k', correctChars: ['y', 'í']},
        {before: 'ab', after: '', correctChars: ['y']},
      ],
      explanation: 'Bystrík má po b tvrdé y a po r dlhé mäkké í. V slovách aby a by píšeme vždy tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Aby bol les zdravý',
      focusWords: ['aby', 'by', 'Bystrík', 'bylina', 'bystrina'],
      storyParagraphs: [
        'Bystrík nosí vodu v krhličke, aby každá mladá bylina mohla zdravo rásť. Rád by videl rozkvitnutú celú lúku pri bystrine.',
        'Sovička Bystruška mu vždy poďakuje za usilovnú prácu.',
      ],
      questions: [
        {
          id: 'q10-1',
          mode: 'choice',
          question: 'Prečo nosí Bystrík vodu v krhličke?',
          options: ['Aby každá mladá bylina mohla zdravo rásť', 'Aby polial skaly v potoku', 'Aby umyl stoličky'],
          correctIndex: 0,
          clue: 'Pozri sa na prvú vetu príbehu.',
        },
        {
          id: 'q10-2',
          mode: 'text_input',
          question: 'Napíš krátke vybrané slovo po B (spojku), ktoré v príbehu vysvetľuje dôvod (3 písmená):',
          correctTextAnswers: ['aby'],
          inputHintLetters: ['A', 'B', 'Y'],
          clue: 'Má tri písmená a začína na a.',
        },
      ],
    },
    reward: {
      id: 'badge_10',
      title: 'Bystrý pomocník',
      subtitle: 'Ovládaš ABY, BY, BYSTRÍK aj násobilku 3 × 8! Otváraš posledných 5 majstrovských úrovní.',
      wordCard: {
        word: 'aby',
        syllables: 'a · by',
        meaning: 'Spojka, v ktorej píšeme vždy tvrdé y (rovnako ako v slove by).',
        example: 'Polievame bylinky, aby krásne voňali.',
        category: 'byliny',
      },
    },
  },

  // =========================================================================
  // STUPEŇ 3 — MAJSTER LESA (ÚROVNE 11–15: 27:3, VLASTNÉ DOPĹŇANIE & VŠETKY SLOVÁ)
  // =========================================================================
  {
    id: 11,
    tier: 'majster',
    title: 'Úroveň 11: Cesta do Bystrice a Bytče',
    subtitle: 'BYSTRICA, BYTČA · Doplň sám 3 × 9 + 3-medzerová doplňovačka',
    themeColor: '#0369A1',
    skyTop: '#BAE6FD',
    skyBottom: '#FDE68A',
    targetWords: ['BYSTRICA', 'BYTČA'],
    companion: 'sovicka',
    introMessage:
      'Vitaj v majstrovskom stupni! Spoznaj mestá BYSTRICA a BYTČA, doplň tri písmená v doplňovačke a vypočítaj 3 × 9.',
    ...buildForestGeometry({variant: 11, targetWords: ['BYSTRICA', 'BYTČA']}),
    mathChallenge: {
      id: 'm11',
      prompt: 'Z Bytče do Bystrice letia 3 kŕdle sov. V každom kŕdli letí 9 múdrych sov. Koľko sov letí spolu?',
      expressionDisplay: '3 × 9 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 9,
      visualGroupLabel: 'sov v kŕdli',
      inputMode: 'keypad',
      correctAnswer: 27,
      hint: 'Tri krát deväť: 9 + 9 + 9.',
    },
    spellingChallenge: {
      id: 's11',
      instruction: 'Doplň tvrdé y alebo mäkké i do názvov slovenských miest:',
      segments: ['Rýchly vlak ide z mesta ', ' až do Banskej ', '.'],
      words: [
        {before: 'B', after: 'tča', correctChars: ['y']},
        {before: 'B', middle: 'str', after: 'ce', correctChars: ['y', 'i']},
      ],
      explanation: 'Bytča má po B tvrdé y. Bystrica má po B tvrdé y a po r mäkké i.',
    },
    readingBlock: {
      title: 'Príbeh: Let z Bytče do Bystrice',
      focusWords: ['Bytča', 'Bystrica', 'bystrina', 'bystrý'],
      storyParagraphs: [
        'Sovička Bystruška vzlietla z lesa nad mestom Bytča a letela horami smerom na Banskú Bystricu. Pod sebou videla, ako sa lesom vinie studená bystrina.',
        'Pri rieke sa pásol dobytok a deti z tábora tam spoznávali liečivé byliny.',
      ],
      questions: [
        {
          id: 'q11-1',
          mode: 'choice',
          question: 'Čo spoznávali deti z tábora pri rieke?',
          options: ['Liečivé byliny', 'Starý nábytok', 'Divokých havranov'],
          correctIndex: 0,
          clue: 'Pozri sa na poslednú vetu príbehu.',
        },
        {
          id: 'q11-2',
          mode: 'text_input',
          question: 'Napíš názov mesta na B, odkiaľ sovička vzlietla (5 písmen):',
          correctTextAnswers: ['bytča', 'bytca'],
          inputHintLetters: ['B', 'Y', 'T', 'Č', 'A'],
          clue: 'Nájdeš ho hneď v prvej vete príbehu.',
        },
      ],
    },
    reward: {
      id: 'badge_11',
      title: 'Cestovateľ z Bytče',
      subtitle: 'Ovládaš BYTČA, BYSTRICA aj násobilku 3 × 9 = 27!',
      wordCard: {
        word: 'Bystrica',
        syllables: 'Bys · tri · ca',
        meaning: 'Názov rieky aj slovenských miest (Banská Bystrica, Považská Bystrica).',
        example: 'Sovička letela z Bytče do Banskej Bystrice.',
        category: 'bystrina',
      },
    },
  },

  {
    id: 12,
    tier: 'majster',
    title: 'Úroveň 12: Prebytok a úbytok vody',
    subtitle: 'PREBYTOK, ÚBYTOK · Delenie 27 : 3 (sám!)',
    themeColor: '#0F766E',
    skyTop: '#99F6E4',
    skyBottom: '#E0F2FE',
    targetWords: ['PREBYTOK', 'ÚBYTOK'],
    companion: 'bubi',
    introMessage:
      'Pozbieraj slová PREBYTOK a ÚBYTOK! Pri bráne vypočítaj delenie 27 : 3 úplne sám.',
    ...buildForestGeometry({variant: 12, targetWords: ['PREBYTOK', 'ÚBYTOK']}),
    mathChallenge: {
      id: 'm12',
      prompt: 'Pastier má 27 košov čerstvej trávy pre 3 stáda dobytka. Koľko košov dostane každé stádo?',
      expressionDisplay: '27 : 3 = ?',
      operation: 'div',
      factorA: 3,
      factorB: 9,
      visualGroupLabel: 'košov pre stádo',
      inputMode: 'keypad',
      correctAnswer: 9,
      hint: 'Koľko krát 3 je 27? (3 × 9 = 27)',
    },
    spellingChallenge: {
      id: 's12',
      instruction: 'Doplň chýbajúce tvrdé y a mäkké i/í:',
      segments: ['V lete má horská riečka ', ' vlahy, ale v suchu nastáva ', ' vody v ', '.'],
      words: [
        {before: 'preb', after: 'tok', correctChars: ['y']},
        {before: 'úb', after: 'tok', correctChars: ['y']},
        {before: 'b', middle: 'str', after: 'ne', correctChars: ['y', 'i']},
      ],
      explanation: 'Prebytok, úbytok aj bystrina sú vybrané slová po B — po b píšeme tvrdé y, po r v bystrine mäkké i.',
    },
    readingBlock: {
      title: 'Príbeh: Prebytok aj úbytok v prírode',
      focusWords: ['prebytok', 'úbytok', 'bystrina', 'dobytok'],
      storyParagraphs: [
        'Na jar, keď sa topí sneh, má horská bystrina prebytok čistej vody. V horúcom lete však niekedy nastáva úbytok vody v potoku.',
        'Preto obyvatelia lesa chránia mach okolo brehov, aby zostala vlaha pre byliny aj dobytok.',
      ],
      questions: [
        {
          id: 'q12-1',
          mode: 'choice',
          question: 'Prečo chránia obyvatelia lesa mach okolo brehov bystriny?',
          options: [
            'Aby zostala vlaha pre byliny aj dobytok',
            'Aby sa v ňom schovali havrany',
            'Aby z neho vyrobili nábytok',
          ],
          correctIndex: 0,
          clue: 'Pozri sa na poslednú vetu príbehu.',
        },
        {
          id: 'q12-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo, ktoré je opakom slova prebytok:',
          correctTextAnswers: ['úbytok', 'ubytok'],
          inputHintLetters: ['Ú', 'B', 'Y', 'T', 'O', 'K'],
          clue: 'Začína na ú- a končí na -bytok.',
        },
      ],
    },
    reward: {
      id: 'badge_12',
      title: 'Majster delenia 27 : 3',
      subtitle: 'Vypočítal si 27 : 3 sám a ovládaš PREBYTOK aj ÚBYTOK!',
      wordCard: {
        word: 'prebytok',
        syllables: 'pre · by · tok',
        meaning: 'Keď je niečoho viac, než potrebujeme (opak slova úbytok).',
        example: 'Na lúke má dobytok prebytok šťavnatých bylín.',
        category: 'bystrina',
      },
    },
  },

  {
    id: 13,
    tier: 'majster',
    title: 'Úroveň 13: Zbytočný strach a tenká byľ',
    subtitle: 'ZBYTOČNÝ, BYĽ · Delenie 21 : 3 (sám!)',
    themeColor: '#15803D',
    skyTop: '#FEF08A',
    skyBottom: '#BBF7D0',
    targetWords: ['ZBYTOČNÝ', 'BYĽ'],
    companion: 'bylinka',
    introMessage:
      'V prírode nie je žiadna byľ zbytočná! Nazbieraj ZBYTOČNÝ a BYĽ, vyrieš doplňovačku a vypočítaj delenie 21 : 3.',
    ...buildForestGeometry({variant: 13, targetWords: ['ZBYTOČNÝ', 'BYĽ']}),
    mathChallenge: {
      id: 'm13',
      prompt: 'Víla Bylinka rozdelila 21 tenkých bylí materinej dúšky rovnako do 3 kytičiek. Koľko bylí je v jednej kytičke?',
      expressionDisplay: '21 : 3 = ?',
      operation: 'div',
      factorA: 3,
      factorB: 7,
      visualGroupLabel: 'bylí v kytičke',
      inputMode: 'keypad',
      correctAnswer: 7,
      hint: 'Koľko krát 3 je 21? (3 × 7 = 21)',
    },
    spellingChallenge: {
      id: 's13',
      instruction: 'Doplň správne tvrdé y/ý alebo mäkké i/í:',
      segments: ['Zelená ', ' lieči les a ', ' čaj nikdy nie je ', '.'],
      words: [
        {before: 'b', after: 'ľ', correctChars: ['y']},
        {before: 'b', middle: 'l', after: 'nkový', correctChars: ['y', 'i']},
        {before: 'zb', after: 'točný', correctChars: ['y']},
      ],
      explanation: 'Byľ, bylinkový aj zbytočný majú po b tvrdé y; v slove bylinkový je po l mäkké i.',
    },
    readingBlock: {
      title: 'Príbeh: Ani jedna byľ nie je zbytočná',
      focusWords: ['zbytočný', 'byľ', 'bylina', 'bylinkový'],
      storyParagraphs: [
        'Malý chrobáčik sa bál, že jeho tenká byľ trávy je pre veľký les maličká. Víla Bylinka mu vysvetlila, že strach je celkom zbytočný.',
        'Každá byľ drží pôdu pri bystrine a každá liečivá bylina pomáha obyvateľom hory.',
      ],
      questions: [
        {
          id: 'q13-1',
          mode: 'choice',
          question: 'Akú úlohu má každá tenká byľ trávy pri bystrine?',
          options: ['Drží pôdu pri bystrine', 'Slúži ako nábytok pre sovy', 'Zakrýva slnko'],
          correctIndex: 0,
          clue: 'Pozri sa na druhý odsek príbehu.',
        },
        {
          id: 'q13-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo z príbehu, ktoré znamená nepotrebný (8 písmen):',
          correctTextAnswers: ['zbytočný', 'zbytocny'],
          inputHintLetters: ['Z', 'B', 'Y', 'T', 'O', 'Č', 'N', 'Ý'],
          clue: 'Začína na zb- a končí na -čný.',
        },
      ],
    },
    reward: {
      id: 'badge_13',
      title: 'Znalec byliek',
      subtitle: 'Ovládaš ZBYTOČNÝ, BYĽ aj delenie 21 : 3!',
      wordCard: {
        word: 'byľ',
        syllables: 'byľ',
        meaning: 'Tenká zelená stonka byliny alebo trávy.',
        example: 'Ani jedna zelená byľ nie je v prírode zbytočná.',
        category: 'byliny',
      },
    },
  },

  {
    id: 14,
    tier: 'majster',
    title: 'Úroveň 14: Dobyť vrchol a býčí krok',
    subtitle: 'DOBYŤ, BÝČÍ · Doplň sám 3 × 10',
    themeColor: '#9A3412',
    skyTop: '#FDE68A',
    skyBottom: '#FED7AA',
    targetWords: ['DOBYŤ', 'BÝČÍ'],
    companion: 'bubi',
    introMessage:
      'Pozor na príbuzné slová DOBYŤ a BÝČÍ! Nazbieraj písmená, doplň y/ý/i/í a vypočítaj 3 × 10.',
    ...buildForestGeometry({variant: 14, targetWords: ['DOBYŤ', 'BÝČÍ']}),
    mathChallenge: {
      id: 'm14',
      prompt: 'Každý z troch statočných tímov zvierat zdolal 10 kamenných schodov, aby dobyli horský vrchol. Koľko schodov zdolali spolu?',
      expressionDisplay: '3 × 10 = ?',
      operation: 'mul',
      factorA: 3,
      factorB: 10,
      visualGroupLabel: 'schodov na vrchol',
      inputMode: 'keypad',
      correctAnswer: 30,
      hint: 'Tri krát desať: 10 + 10 + 10.',
    },
    spellingChallenge: {
      id: 's14',
      instruction: 'Daj pozor na dĺžne aj tvrdé/mäkké písmená:',
      segments: ['Pevný ', ' krok pomohol ', ' vrchol a zachrániť ', '.'],
      words: [
        {before: 'b', middle: 'č', after: '', correctChars: ['ý', 'í']},
        {before: 'dob', after: 'ť', correctChars: ['y']},
        {before: 'dob', after: 'tok', correctChars: ['y']},
      ],
      explanation: 'Býčí má po b tvrdé ý a po č mäkké í. Dobyť a dobytok majú po b tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Ako dobyť horský hrebeň',
      focusWords: ['dobyť', 'býčí', 'býk', 'dobytok'],
      storyParagraphs: [
        'Mladý býk si zaumienil dobyť najvyššiu vyhliadku nad lúkou. Jeho pevný býčí krok sa nepošmykol ani na klzkých kameňoch.',
        'Z vrcholu videl celý pasúci sa dobytok aj kľukatú bystrinu v údolí.',
      ],
      questions: [
        {
          id: 'q14-1',
          mode: 'choice',
          question: 'Čo si zaumienil mladý býk v príbehu?',
          options: [
            'Dobyť najvyššiu vyhliadku nad lúkou',
            'Postaviť nábytok z vody',
            'Spať celý deň v byte',
          ],
          correctIndex: 0,
          clue: 'Pozri sa na prvú vetu príbehu.',
        },
        {
          id: 'q14-2',
          mode: 'text_input',
          question: 'Napíš vybrané slovo z príbehu, ktoré znamená zvíťaziť alebo získať vrchol (5 písmen):',
          correctTextAnswers: ['dobyť', 'dobyt'],
          inputHintLetters: ['D', 'O', 'B', 'Y', 'Ť'],
          clue: 'Začína na do- a končí na -ť.',
        },
      ],
    },
    reward: {
      id: 'badge_14',
      title: 'Dobyvateľ vyhliadky',
      subtitle: 'Ovládaš DOBYŤ, BÝČÍ (ý aj í!) a násobilku 3 × 10!',
      wordCard: {
        word: 'dobyť',
        syllables: 'do · byť',
        meaning: 'Získať alebo zdolať (napr. vrchol hory či hrad). Pozor: píšeme s y!',
        example: 'Podarilo sa nám dobyť skalnatú vyhliadku nad lesom.',
        category: 'dobytok',
      },
    },
  },

  {
    id: 15,
    tier: 'majster',
    title: 'Úroveň 15: Veľká slávnosť v Čarovnom lese',
    subtitle: 'BYLINKOVÝ, BYSTRINKA · Finálne delenie 30 : 3',
    themeColor: '#5B21B6',
    skyTop: '#DDD6FE',
    skyBottom: '#FEF3C7',
    targetWords: ['BYLINKOVÝ', 'BYSTRINKA'],
    companion: 'bystrik',
    introMessage:
      'Veľké finále 15. úrovne! Pozbieraj slová BYLINKOVÝ a BYSTRINKA, doplň všetky medzery y/ý/i/í a vypočítaj 30 : 3!',
    ...buildForestGeometry({variant: 15, targetWords: ['BYLINKOVÝ', 'BYSTRINKA']}),
    mathChallenge: {
      id: 'm15',
      prompt: 'Na veľkej lesnej slávnosti je 30 zlatých medovníkov pre 3 stoly priateľov (byliny, bystrina, dobytok). Koľko medovníkov dostane každý stôl?',
      expressionDisplay: '30 : 3 = ?',
      operation: 'div',
      factorA: 3,
      factorB: 10,
      visualGroupLabel: 'medovníkov na stole',
      inputMode: 'keypad',
      correctAnswer: 10,
      hint: 'Koľko krát 3 sa rovná 30? (3 × 10 = 30)',
    },
    spellingChallenge: {
      id: 's15',
      instruction: 'Finálna skúška tvrdého y/ý a mäkkého i/í:',
      segments: ['Pri spevavej ', ' rozvoniava ', ' čaj pre každú dobrú ', '.'],
      words: [
        {before: 'b', middle: 'str', after: 'nke', correctChars: ['y', 'i']},
        {before: 'b', middle: 'l', after: 'nkový', correctChars: ['y', 'i']},
        {before: 'b', after: 'tosť', correctChars: ['y']},
      ],
      explanation: 'Bystrinka a bylinkový majú po b tvrdé y a v strede mäkké i. Bytosť má tvrdé y.',
    },
    readingBlock: {
      title: 'Príbeh: Slávnosť pri bystrinke',
      focusWords: ['bylinkový', 'bystrinka', 'dobytok', 'obydlie', 'nábytok', 'obyčaj', 'byť'],
      storyParagraphs: [
        'Všetci obyvatelia lesa — víla Bylinka, sovička Bystruška, býček Bubi aj Bystrík — oslavujú pri spevavej bystrinke. Na dubovom nábytku vonia teplý bylinkový čaj a pokojný dobytok oddychuje na lúke.',
        'Každý vie, že bystrý priateľ, ktorý chráni byliny, bystriny a zvieratá, môže byť navždy hrdým strážcom tohto lesného obydlia.',
      ],
      questions: [
        {
          id: 'q15-1',
          mode: 'choice',
          question: 'Čo vonia na dubovom nábytku počas veľkej lesnej slávnosti?',
          options: ['Teplý bylinkový čaj', 'Studená morská soľ', 'Suché ihličie'],
          correctIndex: 0,
          clue: 'Pozri sa na druhú vetu prvého odseku.',
        },
        {
          id: 'q15-2',
          mode: 'text_input',
          question: 'Napíš zdrobneninu od slova bystrina z prvej vety príbehu (9 písmen):',
          correctTextAnswers: ['bystrinka', 'bystrinke'],
          inputHintLetters: ['B', 'Y', 'S', 'T', 'R', 'I', 'N', 'K', 'A'],
          clue: 'Začína na bystr- a končí na -inka.',
        },
      ],
    },
    reward: {
      id: 'badge_15',
      title: 'Veľmajster vybraných slov po B',
      subtitle: 'Prešiel si všetkých 15 úrovní, všetky vybrané slová po B aj násobilku a delenie s 3!',
      wordCard: {
        word: 'bystrinka',
        syllables: 'bys · trin · ka',
        meaning: 'Malá čistá horská bystrina, pri ktorej rastú voňavé byliny.',
        example: 'Pri spevavej bystrinke sa zišli všetci obyvatelia lesa.',
        category: 'bystrina',
      },
    },
  },
];

export const EXTRA_VYBRANE_SLOVA_PO_B = [
  {word: 'byť', note: 'existovať, nachádzať sa — vždy y'},
  {word: 'aby', note: 'spojka — vždy y'},
  {word: 'by', note: 'častica — vždy y'},
  {word: 'bývať', note: 'mať domov, obydlie — vždy ý'},
  {word: 'byt', note: 'obydlie v dome — vždy y'},
  {word: 'bydlisko', note: 'miesto, kde niekto býva — vždy y, po l i'},
  {word: 'bytosť', note: 'živý alebo rozprávkový tvor — vždy y'},
  {word: 'bývalý', note: 'predchádzajúci — vždy ý'},
  {word: 'býk', note: 'silný samec hovädzieho dobytka — vždy ý'},
  {word: 'býčí', note: 'patriaci býkovi — po b ý, po č í'},
  {word: 'byvol', note: 'veľké rohaté zviera — vždy y'},
  {word: 'kobyla', note: 'samica koňa — vždy y'},
  {word: 'dobytok', note: 'hospodárske zvieratá — vždy y'},
  {word: 'dobyť', note: 'získať, zdolať vrchol — vždy y'},
  {word: 'bylina', note: 'liečivá alebo lúčna rastlina — po b y, po l i'},
  {word: 'bylinka', note: 'malá liečivá bylina — po b y, po l i'},
  {word: 'bylinkový', note: 'z bylín — po b y, po l i'},
  {word: 'byľ', note: 'tenká stonka rastliny — vždy y'},
  {word: 'bystrina', note: 'rýchly horský potok — po b y, po r i'},
  {word: 'bystrinka', note: 'malá bystrina — po b y, po r i'},
  {word: 'bystrý', note: 'rýchly, šikovný, chápavý — y, ý'},
  {word: 'Bystrík', note: 'chlapčenské meno — po b y, po r í'},
  {word: 'Bystrica', note: 'rieka a mestá — po b y, po r i'},
  {word: 'Bytča', note: 'slovenské mesto — vždy y'},
  {word: 'obyčaj', note: 'zvyk, tradícia — vždy y'},
  {word: 'obydlie', note: 'domov, príbytok — po b y, po l i'},
  {word: 'obyvateľ', note: 'človek žijúci na mieste — vždy y'},
  {word: 'nábytok', note: 'stoly, stoličky, skrine — vždy y'},
  {word: 'príbytok', note: 'miesto na bývanie — po r í, po b y'},
  {word: 'prebytok', note: 'keď je niečoho viac než dosť — vždy y'},
  {word: 'úbytok', note: 'keď niečoho ubúda — vždy y'},
  {word: 'zbytočný', note: 'nepotrebný — vždy y'},
];
