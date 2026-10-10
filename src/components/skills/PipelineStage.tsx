import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettledInView } from '../demos/useSettledInView';
import { useTimers } from '../demos/useTimers';

// An illustrative Nextflow run: pick where it executes, make a step fail,
// then resume. Steps that already finished come back from the cache and only
// the failed step onwards runs again, which is what -resume does.

const STEPS = ['FASTQC', 'ALIGN', 'MARK_DUPLICATES', 'CALL_VARIANTS', 'MULTIQC'];

const EXECUTORS = [
  { id: 'local', label: 'Local' },
  { id: 'awsbatch', label: 'AWS Batch' },
  { id: 'k8s', label: 'EKS' },
  { id: 'omics', label: 'HealthOmics' },
] as const;

type Executor = (typeof EXECUTORS)[number]['id'];
type StepState = 'idle' | 'running' | 'done' | 'cached' | 'failed';
type RunState = 'idle' | 'running' | 'failed' | 'done';

const STEP_MS = 650;
const CACHE_MS = 140;
// The step the demo breaks by itself on first sight
const AUTO_FAIL = 3;

export default function PipelineStage() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useSettledInView(rootRef, 0.4);

  const [executor, setExecutor] = useState<Executor>('awsbatch');
  const [steps, setSteps] = useState<StepState[]>(STEPS.map(() => 'idle'));
  const [failAt, setFailAt] = useState<number | null>(null);
  const [run, setRun] = useState<RunState>('idle');
  const [log, setLog] = useState('Tap a step to make it fail, then run.');
  const timers = useTimers();
  const touched = useRef(false);

  const set = (i: number, s: StepState) => setSteps(prev => prev.map((p, j) => (j === i ? s : p)));

  // Run steps from `from`; `fail` is the step that will break, if any
  const runFrom = (from: number, fail: number | null) => {
    timers.clear();
    setRun('running');
    const ms = reduced ? 0 : STEP_MS;
    for (let i = from; i < STEPS.length; i++) {
      const at = (i - from) * ms;
      timers.after(at, () => {
        set(i, 'running');
        setLog(`[${executor}] process > ${STEPS[i]} (sample_${(i % 3) + 1})`);
      });
      if (i === fail) {
        timers.after(at + ms * 0.8, () => {
          set(i, 'failed');
          setRun('failed');
          setLog(`ERROR ~ Error executing process > '${STEPS[i]}'. Fix it and resume.`);
        });
        return;
      }
      timers.after(at + ms * 0.9, () => set(i, 'done'));
    }
    timers.after((STEPS.length - from) * ms, () => {
      setRun('done');
      setLog(from > 0
        ? `Completed. ${from} of ${STEPS.length} processes came from the cache.`
        : `Completed. ${STEPS.length} processes on ${EXECUTORS.find(e => e.id === executor)!.label}.`);
    });
  };

  const start = () => {
    setSteps(STEPS.map(() => 'idle'));
    runFrom(0, failAt);
  };

  // -resume: everything before the failure is cached; run on from there
  const resume = () => {
    const from = failAt ?? 0;
    setFailAt(null);
    timers.clear();
    setRun('running');
    setLog('Launching with -resume');
    for (let i = 0; i < from; i++) {
      timers.after(reduced ? 0 : i * CACHE_MS, () => set(i, 'cached'));
    }
    timers.after(reduced ? 0 : from * CACHE_MS + 200, () => runFrom(from, null));
  };

  const toggleFail = (i: number) => {
    if (run === 'running') return;
    setFailAt(f => (f === i ? null : i));
    if (run !== 'idle') {
      setRun('idle');
      setSteps(STEPS.map(() => 'idle'));
    }
    setLog(failAt === i ? 'Tap a step to make it fail, then run.' : `${STEPS[i]} will fail on the next run.`);
  };

  // First sight: break CALL_VARIANTS and run, then leave Resume to the visitor
  useEffect(() => {
    if (!inView || touched.current) return;
    timers.after(300, () => {
      if (touched.current) return;
      setFailAt(AUTO_FAIL);
      runFrom(0, AUTO_FAIL);
    });
    // runFrom is safe to capture once: it only reads state at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const button =
    run === 'running' ? { label: 'Running…', on: undefined } :
    run === 'failed' ? { label: 'Resume  (-resume)', on: resume } :
    run === 'done' ? { label: 'Run again', on: start } :
    { label: 'Run pipeline', on: start };

  return (
    <div
      ref={rootRef}
      className="pl"
      data-run={run}
      onPointerDownCapture={() => { touched.current = true; }}
    >
      <div className="pl-bar">
        <span className="pl-file">main.nf</span>
        <div className="pl-exec" role="radiogroup" aria-label="Executor">
          {EXECUTORS.map(e => (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={executor === e.id}
              className={`pl-exec-btn${executor === e.id ? ' is-on' : ''}`}
              onClick={() => setExecutor(e.id)}
              disabled={run === 'running'}
            >
              {executor === e.id && <motion.span layoutId="pl-exec-pill" className="pl-exec-pill" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
              <span className="pl-exec-label">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ol className="pl-steps" aria-label="Pipeline processes">
        {STEPS.map((s, i) => (
          <li key={s} className={`pl-step is-${steps[i]}${failAt === i ? ' is-armed' : ''}`}>
            <button
              type="button"
              className="pl-node"
              onClick={() => toggleFail(i)}
              aria-pressed={failAt === i}
              aria-label={`${s}: ${steps[i]}${failAt === i ? ', set to fail' : ''}. Toggle failure`}
            >
              <span className="pl-dot" aria-hidden="true">
                {steps[i] === 'done' ? '✓' : steps[i] === 'cached' ? '↺' : steps[i] === 'failed' ? '✕' : failAt === i ? 'ϟ' : i + 1}
              </span>
              <span className="pl-name">{s}</span>
              <span className="pl-meta">
                {steps[i] === 'cached' ? 'cached' : steps[i] === 'failed' ? 'failed' : steps[i] === 'running' ? 'running' : steps[i] === 'done' ? 'done' : failAt === i ? 'will fail' : EXECUTORS.find(e => e.id === executor)!.label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className={`pl-link${steps[i] === 'done' || steps[i] === 'cached' ? ' is-flowing' : ''}`} aria-hidden="true"><i /></span>}
          </li>
        ))}
      </ol>

      <div className="pl-foot">
        <p className="pl-log" aria-live="polite">{log}</p>
        <button type="button" className={`pl-run${run === 'failed' ? ' is-resume' : ''}`} onClick={button.on} disabled={!button.on}>
          {button.label}
        </button>
      </div>
      <p className="pl-note">Illustrative workflow; the process names are examples.</p>
    </div>
  );
}
