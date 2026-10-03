const BUDDY_COLORS = {
  mouse: { coat: '#d9e8e8', inner: '#efaaa0', muzzle: '#f6d4ca' },
  monkey: { coat: '#c98a59', inner: '#7b4d38', muzzle: '#f3d8b5' },
  hippo: { coat: '#bacbc7', inner: '#91aaa7', muzzle: '#dce8e3' },
};

const MOUTHS = {
  curious: 'M49 75 Q60 81 71 75',
  focused: 'M51 77 Q60 74 69 77',
  determined: 'M50 76 Q60 82 70 76',
  joyful: 'M46 73 Q60 91 74 73',
};

export function ReadingBuddy({ variant = 'mouse', mood = 'curious', progress = 0, className = '' }) {
  const colors = BUDDY_COLORS[variant] || BUDDY_COLORS.mouse;
  const mouth = MOUTHS[mood] || MOUTHS.curious;

  return (
    <svg
      viewBox="0 0 112 112"
      role="img"
      aria-label={`${variant} reading buddy, ${mood}`}
      className={`h-24 w-24 overflow-visible animate-bob ${className}`}
    >
      <circle cx="56" cy="56" r="51" fill="white" stroke="#e7e4d8" strokeWidth="2" />
      <circle
        cx="56"
        cy="56"
        r="51"
        fill="none"
        stroke="#16a34a"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - Math.min(100, Math.max(0, progress))}
        transform="rotate(-90 56 56)"
        className="transition-[stroke-dashoffset] duration-500"
      />

      {variant === 'mouse' && (
        <g stroke="#1a2118" strokeWidth="2.5" strokeLinejoin="round">
          <circle cx="35" cy="35" r="18" fill={colors.coat} />
          <circle cx="77" cy="35" r="18" fill={colors.coat} />
          <circle cx="35" cy="35" r="10" fill={colors.inner} stroke="none" />
          <circle cx="77" cy="35" r="10" fill={colors.inner} stroke="none" />
          <ellipse cx="56" cy="59" rx="31" ry="29" fill={colors.coat} />
          <ellipse cx="56" cy="69" rx="18" ry="12" fill={colors.muzzle} stroke="none" />
          <circle cx="46" cy="58" r="2.3" fill="#1a2118" stroke="none" />
          <circle cx="66" cy="58" r="2.3" fill="#1a2118" stroke="none" />
          <path d="M53 66 Q56 63 59 66 Q56 70 53 66Z" fill="#1a2118" stroke="none" />
          <path d={mouth} fill="none" stroke="#1a2118" strokeLinecap="round" />
          {mood === 'joyful' && <path d="M38 64 Q43 67 46 64 M66 64 Q70 67 74 64" fill="none" stroke="#df897d" strokeWidth="3" strokeLinecap="round" />}
        </g>
      )}

      {variant === 'monkey' && (
        <g stroke="#1a2118" strokeWidth="2.5" strokeLinejoin="round">
          <circle cx="31" cy="55" r="15" fill={colors.coat} />
          <circle cx="81" cy="55" r="15" fill={colors.coat} />
          <circle cx="31" cy="55" r="7" fill={colors.muzzle} stroke="none" />
          <circle cx="81" cy="55" r="7" fill={colors.muzzle} stroke="none" />
          <path d="M56 28 C37 28 30 44 33 64 C35 80 44 88 56 88 C68 88 77 80 79 64 C82 44 75 28 56 28Z" fill={colors.coat} />
          <ellipse cx="56" cy="63" rx="19" ry="20" fill={colors.muzzle} stroke="none" />
          <circle cx="48" cy="53" r="2.3" fill="#1a2118" stroke="none" />
          <circle cx="64" cy="53" r="2.3" fill="#1a2118" stroke="none" />
          <ellipse cx="56" cy="62" rx="4" ry="3" fill="#1a2118" stroke="none" />
          <path d={mouth} fill="none" stroke="#1a2118" strokeLinecap="round" />
          {mood === 'joyful' && <path d="M38 67 Q43 70 46 67 M66 67 Q70 70 74 67" fill="none" stroke="#df897d" strokeWidth="3" strokeLinecap="round" />}
        </g>
      )}

      {variant === 'hippo' && (
        <g stroke="#1a2118" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M34 42 Q30 28 41 30 Q48 31 46 43 M66 43 Q64 31 72 30 Q83 28 78 43" fill={colors.coat} />
          <path d="M31 54 C31 39 42 32 56 32 C70 32 81 39 81 54 L79 70 Q76 85 56 85 Q36 85 33 70Z" fill={colors.coat} />
          <ellipse cx="56" cy="68" rx="25" ry="15" fill={colors.muzzle} />
          <circle cx="46" cy="53" r="2.3" fill="#1a2118" stroke="none" />
          <circle cx="66" cy="53" r="2.3" fill="#1a2118" stroke="none" />
          <ellipse cx="47" cy="67" rx="2" ry="3" fill="#536964" stroke="none" />
          <ellipse cx="65" cy="67" rx="2" ry="3" fill="#536964" stroke="none" />
          <path d={mouth} fill="none" stroke="#1a2118" strokeLinecap="round" />
          {mood === 'joyful' && <path d="M38 61 Q42 64 45 61 M67 61 Q71 64 74 61" fill="none" stroke="#df897d" strokeWidth="3" strokeLinecap="round" />}
        </g>
      )}

      {mood === 'joyful' && (
        <g fill="#16a34a">
          <path d="M18 34 L20 29 L22 34 L27 36 L22 38 L20 43 L18 38 L13 36Z" />
          <path d="M89 40 L91 36 L93 40 L97 42 L93 44 L91 48 L89 44 L85 42Z" />
        </g>
      )}
    </svg>
  );
}