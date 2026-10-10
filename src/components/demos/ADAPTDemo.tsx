import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useSettledInView } from './useSettledInView';
import { useTimers } from './useTimers';
import './adapt.css';

// A static replica of ADAPT's classifier page. The scan, the prediction and
// the Grad-CAM heatmap are one real run of the deployed model, taken from the
// project's demo recording; nothing is inferred in the browser.

const SCAN = { file: 'brain_mri.jpg', src: '/projects/adapt/mri.webp', size: '224 × 224' };
const HEATMAP = '/projects/adapt/gradcam.webp';
const RESULT = { stage: 'LMCI', confidence: 94.68 } as const;

const STAGES = [
  { id: 'CN',   name: 'Cognitively Normal',                  note: 'No signs of cognitive decline.' },
  { id: 'EMCI', name: 'Early Mild Cognitive Impairment',     note: 'Subtle memory changes; daily life largely unaffected.' },
  { id: 'LMCI', name: 'Late Mild Cognitive Impairment',      note: 'Clearer decline, with a higher risk of progressing to Alzheimer\'s.' },
  { id: 'AD',   name: 'Alzheimer\'s Disease',                note: 'Dementia that interferes with daily life.' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

const STEPS = ['Resize to 224 × 224', 'VGG-19 forward pass', 'Softmax over 4 stages', 'Grad-CAM heatmap'];
const STEP_MS = 520;

type Phase = 'empty' | 'loaded' | 'analyzing' | 'done';

// ── Before / after comparison ─────────────────────────────────

interface CompareProps {
  reduced: boolean;
  /** Sweep the handle once to show it can be dragged */
  hint: boolean;
}

function Compare({ reduced, hint }: CompareProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Share of the frame showing the heatmap, from the left, 0..100
  const split = useMotionValue(reduced ? 50 : 100);
  const clip = useTransform(split, v => `inset(0 ${100 - v}% 0 0)`);
  const left = useTransform(split, v => `${v}%`);
  const [value, setValue] = useState(reduced ? 50 : 100);
  const dragging = useRef(false);

  useEffect(() => split.on('change', v => setValue(Math.round(v))), [split]);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(split, hint ? [100, 22, 50] : 50, {
      duration: hint ? 1.6 : 0.6,
      ease: 'easeInOut',
      delay: 0.25,
    });
    return () => controls.stop();
  }, [hint, reduced, split]);

  const moveTo = (clientX: number) => {
    const r = frameRef.current!.getBoundingClientRect();
    split.stop();
    split.set(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 20 : 5;
    const keys: Record<string, number> = {
      ArrowLeft: value - step, ArrowDown: value - step,
      ArrowRight: value + step, ArrowUp: value + step,
      Home: 0, End: 100,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    split.stop();
    split.set(Math.min(100, Math.max(0, keys[e.key])));
  };

  return (
    <div
      ref={frameRef}
      className="adapt-compare"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={SCAN.src} alt="Axial brain MRI scan" draggable={false} />
      <motion.img
        src={HEATMAP}
        alt="Grad-CAM heatmap over the same scan"
        draggable={false}
        className="adapt-heat"
        style={{ clipPath: clip }}
      />
      <span className="adapt-tag adapt-tag--left" aria-hidden="true">Grad-CAM</span>
      <span className="adapt-tag adapt-tag--right" aria-hidden="true">MRI</span>
      <motion.div className="adapt-handle" style={{ left }}>
        <div
          className="adapt-knob"
          role="slider"
          tabIndex={0}
          aria-label="Heatmap coverage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value}% heatmap`}
          onKeyDown={onKeyDown}
        >
          <span aria-hidden="true">‹ ›</span>
        </div>
      </motion.div>
    </div>
  );
}

// ── Demo ──────────────────────────────────────────────────────

export default function ADAPTDemo() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLButtonElement>(null);
  const inView = useSettledInView(rootRef);
  const [finePointer] = useState(() => window.matchMedia('(pointer: fine)').matches);

  const [phase, setPhase] = useState<Phase>('empty');
  const [step, setStep] = useState(-1);
  const [stage, setStage] = useState<StageId>(RESULT.stage);
  const [pressing, setPressing] = useState(false);
  const [overDrop, setOverDrop] = useState(false);
  const [hint, setHint] = useState(false);
  const confidence = useMotionValue(0);
  const confidenceText = useTransform(confidence, v => `${v.toFixed(2)}%`);
  const confidenceWidth = useTransform(confidence, v => `${v}%`);

  const auto = useTimers();
  const run = useTimers();
  const tookOver = useRef(false);

  const analyze = useCallback(() => {
    run.clear();
    setStage(RESULT.stage);
    if (reduced) {
      setStep(STEPS.length);
      confidence.set(RESULT.confidence);
      setPhase('done');
      return;
    }
    confidence.set(0);
    setPhase('analyzing');
    setStep(0);
    STEPS.forEach((_, i) => run.after((i + 1) * STEP_MS, () => setStep(i + 1)));
    run.after(STEPS.length * STEP_MS + 200, () => {
      setPhase('done');
      animate(confidence, RESULT.confidence, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    });
  }, [confidence, reduced, run]);

  const load = useCallback(() => {
    run.clear();
    setStep(-1);
    setPhase('loaded');
  }, [run]);

  const reset = () => {
    run.clear();
    setStep(-1);
    setHint(false);
    setPhase('empty');
  };

  // First sight: load the scan, press Analyze, then show the slider moves
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      auto.after(0, () => {
        if (tookOver.current) return;
        load();
        analyze();
      });
      return;
    }
    auto.after(500, () => load());
    auto.after(1500, () => setPressing(true));
    auto.after(1700, () => {
      setPressing(false);
      setHint(true);
      analyze();
    });
    // load and analyze are stable for the life of this single run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const takeOver = () => {
    if (tookOver.current) return;
    tookOver.current = true;
    auto.clear();
    setPressing(false);
  };

  // The sample scan can be dragged onto the drop zone (or simply tapped)
  const hitsDrop = (x: number, y: number) => {
    const r = dropRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const current = STAGES.find(s => s.id === stage)!;
  const predicted = STAGES.findIndex(s => s.id === RESULT.stage);

  return (
    <div
      ref={rootRef}
      className="adapt"
      data-phase={phase}
      onPointerDownCapture={takeOver}
      onKeyDownCapture={takeOver}
    >
      <div className="adapt-bar">
        <span className="adapt-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="adapt-url">adapt-webapp-007.netlify.app/classifier</span>
        <span className="adapt-badge"><span className="adapt-badge-long">Live demo · recorded run</span><span className="adapt-badge-short">Live demo</span></span>
      </div>

      <div className="adapt-brandbar">
        <span className="adapt-logo" aria-hidden="true" />
        <span className="adapt-brand">ADAPT</span>
        <span className="adapt-brand-sub">Alzheimer&rsquo;s Disease Analysis and Prediction Tool</span>
      </div>

      <div className="adapt-body">
        {/* ── Left: the scan ───────────────────────────────── */}
        <section className="adapt-stage" aria-label="Brain scan">
          {phase === 'empty' && (
            <>
              <button
                ref={dropRef}
                type="button"
                className={`adapt-drop${overDrop ? ' is-over' : ''}`}
                onClick={load}
              >
                <span className="adapt-drop-icon" aria-hidden="true">⇪</span>
                <span className="adapt-drop-title">Upload Brain Scan</span>
                <span className="adapt-drop-sub">Drag the sample scan here, or tap to load it</span>
              </button>
              <div className="adapt-tray">
                <motion.button
                  type="button"
                  className="adapt-sample"
                  aria-label={`Load sample scan ${SCAN.file}`}
                  // Mouse only: on touch a drag here would hijack the page scroll
                  drag={!reduced && finePointer}
                  dragSnapToOrigin
                  dragElastic={0.6}
                  whileDrag={{ scale: 1.08, zIndex: 5 }}
                  onDrag={(_, info) => setOverDrop(hitsDrop(info.point.x - window.scrollX, info.point.y - window.scrollY))}
                  onDragEnd={(_, info) => {
                    setOverDrop(false);
                    if (hitsDrop(info.point.x - window.scrollX, info.point.y - window.scrollY)) load();
                  }}
                  onTap={load}
                >
                  <img src={SCAN.src} alt="" draggable={false} />
                  <span className="adapt-sample-meta">
                    <b>{SCAN.file}</b>
                    <span>{SCAN.size} · MRI</span>
                  </span>
                </motion.button>
              </div>
            </>
          )}

          {phase !== 'empty' && (
            <motion.div
              className="adapt-scan"
              initial={reduced ? false : { opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
            >
              <div className="adapt-scan-head">
                <span>{SCAN.file}</span>
                <button type="button" className="adapt-remove" onClick={reset} aria-label="Remove scan">✕</button>
              </div>

              {phase === 'done' ? (
                <Compare reduced={reduced} hint={hint} />
              ) : (
                <div className="adapt-frame">
                  <img src={SCAN.src} alt="Axial brain MRI scan" draggable={false} />
                  {phase === 'analyzing' && <span className="adapt-beam" aria-hidden="true" />}
                </div>
              )}

              {phase === 'done' ? (
                <p className="adapt-caption">Drag across the scan. Red marks the regions that most influenced the prediction.</p>
              ) : (
                <button
                  type="button"
                  className={`adapt-analyze${pressing ? ' is-pressing' : ''}`}
                  onClick={analyze}
                  disabled={phase === 'analyzing'}
                >
                  {phase === 'analyzing' ? <><span className="adapt-spinner" aria-hidden="true" /> Processing…</> : 'Analyze Brain Scan'}
                </button>
              )}
            </motion.div>
          )}
        </section>

        {/* ── Right: pipeline and result ───────────────────── */}
        <section className="adapt-panel" aria-label="Classification result">
          <ol className="adapt-steps" aria-label="Pipeline">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={step > i ? 'is-done' : step === i ? 'is-active' : ''}
              >
                <span className="adapt-step-mark" aria-hidden="true">{step > i ? '✓' : i + 1}</span>
                <span className="adapt-step-text">{s}</span>
              </li>
            ))}
          </ol>
          {/* Phones show the marks only, with the current step named here */}
          <p className="adapt-step-now" aria-hidden="true">
            {step < 0 ? 'Pipeline idle' : step >= STEPS.length ? 'Pipeline complete' : STEPS[step]}
          </p>

          <div className={`adapt-result${phase === 'done' ? ' is-ready' : ''}`} aria-live="polite">
            {phase === 'done' ? (
              <>
                <p className="adapt-label">Detected stage</p>
                <p className="adapt-stage-name">Late Mild Cognitive Impairment <span>(LMCI)</span></p>

                <div className="adapt-confidence">
                  <span className="adapt-label">Confidence</span>
                  <motion.span className="adapt-confidence-value">{confidenceText}</motion.span>
                  <span className="adapt-meter"><motion.span style={{ width: confidenceWidth }} /></span>
                </div>

                <div className="adapt-scale" role="group" aria-label="Disease stages">
                  <span className="adapt-track" aria-hidden="true">
                    <motion.span
                      className="adapt-track-fill"
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={{ scaleX: predicted / (STAGES.length - 1) }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  </span>
                  {STAGES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`adapt-stop${i === predicted ? ' is-predicted' : ''}${s.id === stage ? ' is-shown' : ''}`}
                      aria-pressed={s.id === stage}
                      aria-label={`${s.name}${i === predicted ? ' (predicted)' : ''}`}
                      onClick={() => setStage(s.id)}
                    >
                      <span className="adapt-stop-dot" aria-hidden="true" />
                      <span className="adapt-stop-id">{s.id}</span>
                    </button>
                  ))}
                </div>
                <p className="adapt-stage-note">
                  <b>{current.id === RESULT.stage ? 'Predicted · ' : ''}{current.name}.</b> {current.note}
                </p>
              </>
            ) : (
              <p className="adapt-waiting">
                {phase === 'analyzing' ? 'Running the model…' : 'Load a scan and press Analyze to classify it into one of four stages.'}
              </p>
            )}
          </div>

          <dl className="adapt-model">
            <div><dt>Model</dt><dd>VGG-19, transfer</dd></div>
            <div><dt>Test accuracy</dt><dd>~92%</dd></div>
            <div><dt>F1</dt><dd>~90.5%</dd></div>
            <div><dt>Tracking</dt><dd>DVC + MLflow</dd></div>
          </dl>
        </section>
      </div>

      <p className="adapt-foot">A recorded run of the deployed model, for demonstration only. Not medical advice.</p>
    </div>
  );
}
