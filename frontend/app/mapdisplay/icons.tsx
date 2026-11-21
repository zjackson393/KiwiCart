export function Arrow() {
  return (
    <svg
      width="16"
      height="40"
      viewBox="0 0 16 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="8"
        y1="8"
        x2="8"
        y2="72"
        stroke="var(--kcGreenLight)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M3 67 L8 76 L13 67"
        stroke="var(--kcGreenLight)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Clock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0}}>
      <circle cx="12" cy="12" r="9" stroke="#203A14" strokeWidth="2"/>
      <line x1="12" y1="12" x2="12" y2="7"
        stroke="#203A14" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="16" y2="14"
        stroke="#203A14" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
