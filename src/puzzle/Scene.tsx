export function SceneDefs() {
  return (
    <>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#071833" />
        <stop offset="38%" stopColor="#0a4d86" />
        <stop offset="62%" stopColor="#e7c27a" />
        <stop offset="78%" stopColor="#f6edd9" />
        <stop offset="100%" stopColor="#efe3cc" />
      </linearGradient>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff6d4" />
        <stop offset="42%" stopColor="#f0c14b" />
        <stop offset="100%" stopColor="#f0c14b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbf6ec" />
        <stop offset="100%" stopColor="#d9c49a" />
      </linearGradient>
    </>
  );
}

const SKY_MARKS = [
  [70, 48],
  [120, 90],
  [40, 130],
  [180, 36],
  [860, 40],
  [930, 88],
  [800, 70],
];

export function SceneArt() {
  return (
    <g id="scene">
      <rect width="1000" height="750" fill="url(#sky)" />
      <circle cx="640" cy="150" r="180" fill="url(#sunGlow)" />
      <circle cx="640" cy="150" r="62" fill="#ffe7a8" />
      <circle cx="640" cy="150" r="40" fill="#fff9e8" />
      <circle cx="640" cy="150" r="98" fill="none" stroke="#f6d78a" strokeWidth="2" opacity="0.8" />
      <circle cx="640" cy="150" r="138" fill="none" stroke="#f6d78a" strokeWidth="1.2" opacity="0.5" />
      {SKY_MARKS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#f6d78a" opacity="0.85" />
      ))}
      <path d="M0 400 C 180 350, 300 460, 480 410 C 660 360, 780 340, 1000 400 L 1000 750 L 0 750 Z" fill="#0c335f" opacity="0.22" />
      <path d="M30 214 L250 42 L470 214 Z" fill="#f4e7cf" />
      <rect x="40" y="214" width="420" height="22" fill="#e7d3a4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={58 + i * 66} y="236" width="30" height="230" rx="3" fill="url(#stone)" />
          <rect x={66 + i * 66} y="236" width="6" height="230" fill="#fff" opacity="0.35" />
        </g>
      ))}
      <rect x="36" y="466" width="430" height="16" fill="#c6a15b" />
      <rect x="22" y="482" width="458" height="14" fill="#8d6b2f" />
      <path d="M0 470 C 220 430, 400 520, 620 478 C 800 444, 900 470, 1000 450 L 1000 750 L 0 750 Z" fill="#08243f" opacity="0.35" />
      <path d="M24 590 H976" stroke="#e8c878" strokeWidth="14" strokeLinecap="round" />
      <path d="M24 608 H976" stroke="#8d6b2f" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      <path d="M120 590 Q230 690 340 590" fill="none" stroke="#f7f1e4" strokeWidth="8" />
      <path d="M340 590 Q470 705 600 590" fill="none" stroke="#f7f1e4" strokeWidth="8" />
      <path d="M600 590 Q720 688 840 590" fill="none" stroke="#f7f1e4" strokeWidth="8" />
      <path d="M0 690 H1000 V750 H0 Z" fill="#071a33" opacity="0.4" />
      <path d="M0 708 H1000" stroke="#f6d78a" strokeWidth="1.5" opacity="0.4" />
    </g>
  );
}
