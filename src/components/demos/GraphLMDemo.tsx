import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettledInView } from './useSettledInView';
import {
  ANSWERS, EDGES, NODES, SOURCE, answerById, routeQuestion,
  type Answer, type GraphNode, type QuestionId,
} from './graphlmData';
import './graphlm.css';

// A static replica of GraphLM's chat + graph workspace, grounded in my resume.
// Nothing is generated: answers are prewritten, and the "retrieval" replays
// the traversal each answer depends on.

// Seconds between lit edges while the graph is traversed
const HOP_S = 0.26;
const SEARCH_MS = 450;
const WORD_MS = 26;
const TYPE_MS = 32;
// Below this the panes stack and the graph switches to its compact layout
const COMPACT_PX = 400;

type Reply = 'answer' | 'nosource' | 'unknown';
type Status = 'searching' | 'traversing' | 'streaming' | 'done';

interface Turn {
  question: string;
  reply: Reply;
  answerId: QuestionId | null;
  status: Status;
  /** Words of the answer shown so far, while streaming */
  shown: number;
}

const wordCount = (a: Answer) => a.paragraphs.join(' ').split(' ').length;

// ── Timers ────────────────────────────────────────────────────

// A bucket of timeouts that can be cancelled together
function useTimers() {
  const ids = useRef<number[]>([]);
  const clear = useCallback(() => {
    ids.current.forEach(window.clearTimeout);
    ids.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    ids.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => clear, [clear]);
  return { after, clear };
}

// ── Graph ─────────────────────────────────────────────────────

interface Box { x: number; y: number; hw: number; hh: number }

const PILL_H = { wide: 24, compact: 22 };
const CHAR_W = { wide: 7.3, compact: 6.7 };
const DOT_R = 4.5;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentBoxSize[0];
      setSize({ w: Math.round(box.inlineSize), h: Math.round(box.blockSize) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

// Where an edge leaves a box: the point on its border along (dx, dy)
function borderPoint(b: Box, dx: number, dy: number, sign: 1 | -1, gap = 0) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const t = Math.min(ux ? b.hw / Math.abs(ux) : Infinity, uy ? b.hh / Math.abs(uy) : Infinity) + gap;
  return { x: b.x + sign * ux * t, y: b.y + sign * uy * t };
}

interface GraphProps {
  indexed: boolean;
  enabled: boolean;
  lit: Answer | null;
  selected: string | null;
  onSelect: (id: string | null) => void;
  reduced: boolean;
}

function Graph({ indexed, enabled, lit, selected, onSelect, reduced }: GraphProps) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [hovered, setHovered] = useState<string | null>(null);
  const compact = w > 0 && w < COMPACT_PX;
  const mode = compact ? 'compact' : 'wide';

  // When each lit edge and node lights up, in traversal order
  const edgeDelay = new Map<number, number>();
  const nodeDelay = new Map<string, number>();
  lit?.path.forEach((e, i) => {
    edgeDelay.set(e, i * HOP_S);
    const { from, to } = EDGES[e];
    if (!nodeDelay.has(from)) nodeDelay.set(from, i * HOP_S);
    if (!nodeDelay.has(to)) nodeDelay.set(to, i * HOP_S + 0.22);
  });

  // Not on hover: reshaping the node under the pointer would swap the element
  // between mousedown and mouseup, and the click would never land
  const isPill = (n: GraphNode) =>
    !compact || n.id === 'tabish' || nodeDelay.has(n.id) || n.id === selected;

  const boxes = new Map<string, Box>();
  for (const n of NODES) {
    const [nx, ny] = n[mode];
    if (!isPill(n)) {
      boxes.set(n.id, { x: nx * w, y: ny * h, hw: DOT_R, hh: DOT_R });
      continue;
    }
    const hw = ((compact ? n.short : n.label).length * CHAR_W[mode]) / 2 + 9;
    const hh = PILL_H[mode] / 2;
    // Keep pills whole inside the pane, however narrow it gets
    const x = Math.min(Math.max(nx * w, hw + 3), w - hw - 3);
    const y = Math.min(Math.max(ny * h, hh + 3), h - hh - 3);
    boxes.set(n.id, { x, y, hw, hh });
  }

  const touchesHover = (e: number) => hovered !== null && (EDGES[e].from === hovered || EDGES[e].to === hovered);

  return (
    <div
      ref={ref}
      className={`glm-graph${enabled ? '' : ' is-disabled'}${lit ? ' has-lit' : ''}`}
      data-mode={mode}
    >
      {w > 0 && indexed && (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="group"
          aria-label={`Knowledge graph of ${SOURCE}: ${NODES.length} entities`}
          onClick={e => { if (e.target === e.currentTarget) onSelect(null); }}
        >
          <defs>
            <marker id="glm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="glm-arrow" />
            </marker>
            <marker id="glm-arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="glm-arrow is-lit" />
            </marker>
          </defs>

          {EDGES.map((edge, i) => {
            const a = boxes.get(edge.from)!;
            const b = boxes.get(edge.to)!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const p1 = borderPoint(a, dx, dy, 1, 1);
            const p2 = borderPoint(b, dx, dy, -1, 2);
            const isLit = edgeDelay.has(i);
            const delay = edgeDelay.get(i) ?? 0;
            let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            if (angle > 90) angle -= 180;
            if (angle < -90) angle += 180;
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            return (
              <g key={`${edge.from}-${edge.to}`} className={`glm-edge${isLit ? ' is-lit' : ''}${touchesHover(i) ? ' is-near' : ''}`} data-lit={isLit || undefined}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} markerEnd="url(#glm-arrow)" />
                {isLit && (
                  <motion.line
                    className="glm-edge-trace"
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    markerEnd="url(#glm-arrow-lit)"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : delay, ease: 'easeOut' }}
                  />
                )}
                {!compact && (isLit || touchesHover(i)) && (
                  <motion.text
                    className="glm-rel"
                    x={mx} y={my - 4}
                    textAnchor="middle"
                    transform={`rotate(${angle} ${mx} ${my - 4})`}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: reduced || !isLit ? 0 : delay + 0.15 }}
                  >
                    {edge.rel}
                  </motion.text>
                )}
              </g>
            );
          })}

          {NODES.map((n, i) => {
            const b = boxes.get(n.id)!;
            const pill = isPill(n);
            const isLit = nodeDelay.has(n.id);
            const label = compact ? n.short : n.label;
            return (
              <g key={n.id} transform={`translate(${b.x} ${b.y})`}>
                <motion.g
                  className={`glm-node${pill ? '' : ' is-dot'}${isLit ? ' is-lit' : ''}${n.id === selected ? ' is-selected' : ''}`}
                  data-node={n.id}
                  data-lit={isLit || undefined}
                  role="button"
                  tabIndex={enabled ? 0 : -1}
                  aria-label={`${n.label}: ${n.detail}`}
                  aria-pressed={n.id === selected}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={reduced ? false : { opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.5, delay: reduced ? 0 : i * 0.035 }}
                  onClick={() => onSelect(n.id === selected ? null : n.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(n.id === selected ? null : n.id);
                    }
                  }}
                  onPointerEnter={e => { if (e.pointerType === 'mouse') setHovered(n.id); }}
                  onPointerLeave={() => setHovered(null)}
                >
                  {/* Generous invisible hit area, so dots and pills are easy to tap */}
                  <rect className="glm-hit" x={-Math.max(b.hw, 16)} y={-18} width={Math.max(b.hw, 16) * 2} height={36} />
                  {pill ? (
                    <>
                      <rect className="glm-pill" x={-b.hw} y={-b.hh} width={b.hw * 2} height={b.hh * 2} rx={6} />
                      {isLit && !reduced && (
                        <motion.rect
                          className="glm-pill-flash"
                          x={-b.hw} y={-b.hh} width={b.hw * 2} height={b.hh * 2} rx={6}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.9, 0] }}
                          transition={{ duration: 0.6, delay: nodeDelay.get(n.id) }}
                        />
                      )}
                      <text className="glm-label" textAnchor="middle" dy="0.35em">{label}</text>
                    </>
                  ) : (
                    <circle className="glm-dot" r={DOT_R} />
                  )}
                </motion.g>
              </g>
            );
          })}
        </svg>
      )}

      {!indexed && (
        <p className="glm-graph-empty">
          <span className="glm-spinner" aria-hidden="true" /> Building graph…
        </p>
      )}
      {indexed && !enabled && (
        <p className="glm-graph-empty is-warning">Select a source to enable the graph</p>
      )}
    </div>
  );
}

// ── Demo ──────────────────────────────────────────────────────

export default function GraphLMDemo() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useSettledInView(rootRef);

  const [indexed, setIndexed] = useState(false);
  const [toast, setToast] = useState(false);
  const [sourceOn, setSourceOn] = useState(true);
  const [draft, setDraft] = useState('');
  const [turn, setTurn] = useState<Turn | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const auto = useTimers();
  const run = useTimers();
  // Set by the visitor's first touch, key or click; the demo then stops
  // driving itself and never starts again
  const tookOver = useRef(false);
  const autoTyping = useRef(false);

  const ask = useCallback((question: string, id: QuestionId | null) => {
    run.clear();
    setSelected(null);
    if (!sourceOn || id === null) {
      setTurn({ question, reply: sourceOn ? 'unknown' : 'nosource', answerId: null, status: 'done', shown: 0 });
      return;
    }
    const answer = answerById(id);
    const total = wordCount(answer);
    if (reduced) {
      setTurn({ question, reply: 'answer', answerId: id, status: 'done', shown: total });
      return;
    }
    setTurn({ question, reply: 'answer', answerId: id, status: 'searching', shown: 0 });
    run.after(SEARCH_MS, () => setTurn(t => t && { ...t, status: 'traversing' }));
    const streamAt = SEARCH_MS + (answer.path.length * HOP_S + 0.35) * 1000;
    for (let n = 1; n <= total; n++) {
      run.after(streamAt + n * WORD_MS, () =>
        setTurn(t => t && { ...t, status: n === total ? 'done' : 'streaming', shown: n }),
      );
    }
  }, [reduced, run, sourceOn]);

  // First sight: index the source, then ask the first question by itself
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      // No build-up and no typing: arrive with the first answer in place
      auto.after(0, () => {
        setIndexed(true);
        if (!tookOver.current) ask(ANSWERS[0].question, ANSWERS[0].id);
      });
      return;
    }
    auto.after(250, () => {
      setIndexed(true);
      setToast(true);
    });
    auto.after(2600, () => setToast(false));
    if (tookOver.current) return;
    const q = ANSWERS[0].question;
    const typeFrom = 1400;
    auto.after(typeFrom, () => { autoTyping.current = true; });
    for (let i = 1; i <= q.length; i++) {
      auto.after(typeFrom + i * TYPE_MS, () => setDraft(q.slice(0, i)));
    }
    auto.after(typeFrom + q.length * TYPE_MS + 350, () => {
      autoTyping.current = false;
      setDraft('');
      ask(q, ANSWERS[0].id);
    });
    // ask is stable for the life of this effect's single run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const takeOver = () => {
    if (tookOver.current) return;
    tookOver.current = true;
    // Stop the self-typing mid-word; keep the index toast and any answer
    // already on its way
    if (autoTyping.current) {
      auto.clear();
      autoTyping.current = false;
      setDraft('');
      setIndexed(true);
      setToast(false);
    } else if (!indexed) {
      auto.clear();
      setIndexed(true);
    } else {
      auto.clear();
      setToast(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    ask(text, routeQuestion(text));
  };

  const toggleSource = () => {
    run.clear();
    setSourceOn(on => !on);
    setSelected(null);
    setTurn(null);
  };

  const answer = turn?.answerId ? answerById(turn.answerId) : null;
  const lit = sourceOn && answer && turn && turn.status !== 'searching' ? answer : null;
  const selectedNode = NODES.find(n => n.id === selected) ?? null;
  const state = !indexed ? 'indexing' : !turn ? 'ready' : turn.status;

  // The answer, cut to the words streamed so far
  let budget = turn?.shown ?? 0;
  const visibleParagraphs = answer
    ? answer.paragraphs.map(p => {
        const words = p.split(' ');
        const part = words.slice(0, Math.max(0, budget)).join(' ');
        budget -= words.length;
        return part;
      }).filter(Boolean)
    : [];

  return (
    <div
      ref={rootRef}
      className="glm"
      data-state={state}
      onPointerDownCapture={takeOver}
      onKeyDownCapture={takeOver}
    >
      <div className="glm-bar">
        <span className="glm-logo" aria-hidden="true" />
        <span className="glm-brand">Graph<b>LM</b></span>
        <span className="glm-crumb">Resume chat · 1 source</span>
        <span className="glm-badge"><span className="glm-badge-long">Live demo · prewritten answers</span><span className="glm-badge-short">Live demo</span></span>
      </div>

      <div className="glm-body">
        <aside className="glm-pane glm-sources" aria-label="Sources">
          <p className="glm-pane-title">Sources</p>
          <button
            type="button"
            role="switch"
            aria-checked={sourceOn}
            className={`glm-source${sourceOn ? ' is-on' : ''}`}
            onClick={toggleSource}
          >
            <span className="glm-file" aria-hidden="true">PDF</span>
            <span className="glm-source-name">{SOURCE}</span>
            <span className="glm-check" aria-hidden="true" />
          </button>
          <p className="glm-hint">Answers only use selected sources. Untick it and see.</p>
        </aside>

        <section className="glm-pane glm-canvas" aria-label="Graph view">
          <p className="glm-pane-title">Canvas · <span>Graph view</span></p>
          <Graph
            indexed={indexed}
            enabled={sourceOn}
            lit={lit}
            selected={selected}
            onSelect={setSelected}
            reduced={reduced}
          />
          {toast && (
            <motion.p
              className="glm-toast"
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span aria-hidden="true">✓</span> “{SOURCE}” graph indexed
            </motion.p>
          )}
          {selectedNode && sourceOn && (
            <motion.div
              className="glm-detail"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            >
              <p className="glm-detail-kind">Entity · {selectedNode.kind}</p>
              <p className="glm-detail-name">{selectedNode.label}</p>
              <p className="glm-detail-text">{selectedNode.detail}</p>
              <div className="glm-detail-actions">
                {selectedNode.q && (
                  <button
                    type="button"
                    className="glm-detail-ask"
                    onClick={() => {
                      const a = answerById(selectedNode.q!);
                      ask(a.question, a.id);
                    }}
                  >
                    Ask about {selectedNode.label} →
                  </button>
                )}
                <button type="button" className="glm-detail-close" onClick={() => setSelected(null)} aria-label="Close entity details">
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </section>

        <section className="glm-pane glm-chat" aria-label="Chat">
          <p className="glm-pane-title">Chat</p>
          <div className="glm-messages">
            {!turn && (
              <div className="glm-empty">
                <span className="glm-empty-icon" aria-hidden="true">✦</span>
                <p className="glm-empty-title">Ask about Tabish's resume</p>
                <p className="glm-empty-sub">Answers come from the knowledge graph and cite the section they came from.</p>
              </div>
            )}
            {turn && (
              <>
                <p className="glm-q">{turn.question}</p>
                <div className="glm-a">
                  {turn.reply === 'nosource' && (
                    <p className="glm-a-text is-warning">No sources selected. Tick {SOURCE} in Sources so I have something to ground the answer in.</p>
                  )}
                  {turn.reply === 'unknown' && (
                    <p className="glm-a-text">This demo has three answers, each written from {SOURCE}. Try one of the questions below, or ask about graphs, production work or machine learning.</p>
                  )}
                  {answer && (
                    <>
                      <p className="glm-status" data-status={turn.status}>
                        {turn.status === 'searching' && <>Searching vectors…</>}
                        {turn.status !== 'searching' && (
                          <>Graph path: {answer.hops.join(' → ')}</>
                        )}
                      </p>
                      {visibleParagraphs.map((p, i) => (
                        <p key={i} className="glm-a-text">{p}</p>
                      ))}
                      {turn.status === 'done' && (
                        <p className="glm-cites">
                          {answer.citations.map(c => (
                            <a key={c} className="glm-cite" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                              {SOURCE} · {c}
                            </a>
                          ))}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
            {/* Screen readers hear each answer once, whole, not word by word */}
            <p className="glm-sr" aria-live="polite">
              {turn?.status === 'done' && (answer ? answer.paragraphs.join(' ') : '')}
            </p>
          </div>

          <div className="glm-suggest" aria-label="Suggested questions">
            {ANSWERS.map(a => (
              <button
                key={a.id}
                type="button"
                className={`glm-chip${turn?.answerId === a.id ? ' is-active' : ''}`}
                aria-label={a.question}
                onClick={() => ask(a.question, a.id)}
              >
                {a.chip}
              </button>
            ))}
          </div>

          <form className="glm-input" onSubmit={submit}>
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Ask about Tabish's resume…"
              aria-label="Ask GraphLM a question"
              enterKeyHint="send"
            />
            <button type="submit" aria-label="Send" disabled={!draft.trim()}>↑</button>
          </form>
        </section>
      </div>
    </div>
  );
}
