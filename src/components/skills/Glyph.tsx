import type { OptionId } from './data';

// White line art for each option's icon, drawn on a 64-unit grid
export default function Glyph({ id }: { id: OptionId | 'overview' }) {
  const common = {
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (id) {
    // A double helix: two strands and their base pairs
    case 'bioinformatics-pipelines':
      return (
        <svg {...common}>
          <path d="M22 8c0 12 20 12 20 24S22 44 22 56" />
          <path d="M42 8c0 12-20 12-20 24s20 12 20 24" />
          <path d="M25 16h14M27 25.5h10M27 38.5h10M25 48h14" strokeWidth={3} />
        </svg>
      );
    // A terminal prompt
    case 'software-engineering':
      return (
        <svg {...common}>
          <rect x="8" y="12" width="48" height="40" rx="7" strokeWidth={3.5} />
          <path d="M18 27l8 6-8 6M31 40h13" />
        </svg>
      );
    // A small network: inputs, a hidden layer, one output
    case 'ai-data-engineering':
      return (
        <svg {...common} strokeWidth={2.6}>
          <path d="M14 18l18 6M14 18l18 22M14 46l18-22M14 46l18-6M32 24l18 8M32 40l18-8" opacity={0.75} />
          <circle cx="14" cy="18" r="5" fill="currentColor" stroke="none" />
          <circle cx="14" cy="46" r="5" fill="currentColor" stroke="none" />
          <circle cx="32" cy="24" r="5" fill="currentColor" stroke="none" />
          <circle cx="32" cy="40" r="5" fill="currentColor" stroke="none" />
          <circle cx="50" cy="32" r="6.5" fill="currentColor" stroke="none" />
        </svg>
      );
    // A heartbeat running between a message's braces
    case 'health-data-integration':
      return (
        <svg {...common}>
          <path d="M16 12c-5 0-6 3-6 7v6c0 3-2 5-5 7 3 2 5 4 5 7v6c0 4 1 7 6 7M48 12c5 0 6 3 6 7v6c0 3 2 5 5 7-3 2-5 4-5 7v6c0 4-1 7-6 7" strokeWidth={3.2} />
          <path d="M17 33h7l4-10 6 20 4-10h9" />
        </svg>
      );
    // Four squares: everything at once
    case 'overview':
      return (
        <svg {...common} strokeWidth={3.5}>
          <rect x="10" y="10" width="18" height="18" rx="5" />
          <rect x="36" y="10" width="18" height="18" rx="5" />
          <rect x="10" y="36" width="18" height="18" rx="5" />
          <rect x="36" y="36" width="18" height="18" rx="5" />
        </svg>
      );
  }
}
