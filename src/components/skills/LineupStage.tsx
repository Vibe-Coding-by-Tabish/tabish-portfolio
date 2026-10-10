import { type PointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

// The three live demos as a product lineup: each card is a little screen in
// its product's own colours, tilting toward the pointer and standing on a
// mirrored floor. Picking one goes to its demo on the home page.

interface Product {
  id: 'graphlm' | 'adapt' | 'metaboliq';
  name: string;
  line: string;
  stat: string;
}

const PRODUCTS: Product[] = [
  { id: 'graphlm', name: 'GraphLM', line: 'Ask a question, watch the graph answer.', stat: 'Neo4j + Qdrant' },
  { id: 'adapt', name: 'ADAPT', line: 'MRI in. Stage and Grad-CAM out.', stat: '~92% test accuracy' },
  { id: 'metaboliq', name: 'MetaboliQ AI', line: 'Four predictors for diabetes risk.', stat: 'Top 10, Intel AI Hackathon' },
];

function Screen({ id }: { id: Product['id'] }) {
  if (id === 'graphlm') {
    return (
      <svg className="ln-art" viewBox="0 0 160 100" aria-hidden="true">
        <g stroke="#22e3a2" strokeOpacity="0.55" strokeWidth="1.4">
          <path d="M80 50L40 28M80 50L122 26M80 50L44 76M80 50L118 74M40 28L22 52M122 26L140 50" />
        </g>
        <g fill="#22e3a2">
          <rect x="62" y="43" width="36" height="14" rx="4" />
          <rect x="24" y="21" width="32" height="13" rx="4" opacity="0.85" />
          <rect x="106" y="19" width="32" height="13" rx="4" opacity="0.85" />
          <circle cx="44" cy="76" r="4" opacity="0.7" />
          <circle cx="118" cy="74" r="4" opacity="0.7" />
          <circle cx="22" cy="52" r="3" opacity="0.6" />
          <circle cx="140" cy="50" r="3" opacity="0.6" />
        </g>
      </svg>
    );
  }
  if (id === 'adapt') {
    return (
      <div className="ln-adapt" aria-hidden="true">
        <img src="/projects/adapt/mri.webp" alt="" loading="lazy" decoding="async" />
        <img src="/projects/adapt/gradcam.webp" alt="" loading="lazy" decoding="async" className="ln-adapt-heat" />
      </div>
    );
  }
  return (
    <div className="ln-mq" aria-hidden="true">
      <span className="ln-mq-head">MetaboliQ AI</span>
      <span className="ln-mq-row"><i /><i /><i /></span>
      <span className="ln-mq-row"><i /><i /><i /></span>
      <span className="ln-mq-btn">Predict</span>
    </div>
  );
}

function Card({ product, onOpen, reduced }: { product: Product; onOpen: () => void; reduced: boolean }) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), { stiffness: 220, damping: 20 });

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { px.set(0); py.set(0); };

  return (
    <motion.button
      type="button"
      className={`ln-card ln-card--${product.id}`}
      style={{ rotateX: rx, rotateY: ry }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onOpen}
      whileTap={{ scale: 0.97 }}
      aria-label={`${product.name}: ${product.line} Open the live demo`}
    >
      <span className="ln-screen"><Screen id={product.id} /></span>
      <span className="ln-name">{product.name}</span>
      <span className="ln-line">{product.line}</span>
      <span className="ln-stat">{product.stat}</span>
      <span className="ln-open">Try the live demo →</span>
    </motion.button>
  );
}

export default function LineupStage({ onOpen }: { onOpen: (section: string) => void }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="ln">
      <div className="ln-row">
        {PRODUCTS.map(p => (
          <Card key={p.id} product={p} reduced={reduced} onOpen={() => onOpen(`#${p.id}`)} />
        ))}
      </div>
    </div>
  );
}
