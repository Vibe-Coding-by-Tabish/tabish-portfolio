import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettledInView } from '../demos/useSettledInView';
import { useTimers } from '../demos/useTimers';

// A simplified replay of genie.sh: pick an environment and deploy it in one
// command. Interrupt it and run again, and it resumes from the phase it
// stopped at. The phase list is a plain-English summary of the real script.

const ENVS = ['dev', 'qa', 'uat', 'staging', 'prod'] as const;
type Env = (typeof ENVS)[number];

const PHASES = [
  'Preflight checks',
  'OS packages',
  'SELinux contexts',
  'firewalld rules',
  'Service account',
  'Git credentials (GIT_ASKPASS)',
  'Clone and checkout',
  'Python environment',
  'Database migrations',
  'systemd units',
  'nginx configuration',
  'Incident assertions',
  'Start services',
  'Health checks',
];

// Hard checks the script carries from past production incidents
const ASSERTIONS = [
  'nginx keeps the URI path on named locations',
  'Entra token version matches the API',
  'cases_users primary key is as expected',
];

const PHASE_MS = 150;

interface Line {
  text: string;
  tone?: 'ok' | 'warn' | 'dim' | 'live';
}

export default function DeployStage() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inView = useSettledInView(rootRef, 0.4);

  const [env, setEnv] = useState<Env>('uat');
  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [resumeAt, setResumeAt] = useState<Record<string, number>>({});
  const [live, setLive] = useState<Env[]>([]);
  const [typed, setTyped] = useState('');
  const timers = useTimers();
  const touched = useRef(false);

  const command = `./genie.sh --env ${env}`;

  // Keep the newest line in view inside the terminal, never the page
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const push = (l: Line) => setLines(prev => [...prev, l]);

  const deploy = () => {
    timers.clear();
    const target = env;
    const from = resumeAt[target] ?? 0;
    setRunning(true);
    setTyped(command);
    setLines([{ text: `$ ${command}`, tone: 'dim' }]);
    if (from > 0) push({ text: `Resuming at phase ${from + 1}/14. Phases 1–${from} already done.`, tone: 'warn' });
    setPhase(from);
    const ms = reduced ? 0 : PHASE_MS;
    let t = 0;
    for (let i = from; i < PHASES.length; i++) {
      t += ms;
      timers.after(t, () => {
        setPhase(i + 1);
        push({ text: `[${String(i + 1).padStart(2, ' ')}/14] ${PHASES[i]}`, tone: 'ok' });
      });
      if (i === 11) {
        for (const a of ASSERTIONS) {
          t += ms * 0.6;
          timers.after(t, () => push({ text: `        assert ${a} ✓`, tone: 'dim' }));
        }
      }
    }
    timers.after(t + ms * 2, () => {
      push({ text: `✓ ${target} is live. One command, no manual steps.`, tone: 'live' });
      setRunning(false);
      setResumeAt(r => ({ ...r, [target]: 0 }));
      setLive(l => (l.includes(target) ? l : [...l, target]));
    });
  };

  // Ctrl+C: stop mid-run; the next run picks up where this one stopped
  const interrupt = () => {
    timers.clear();
    setRunning(false);
    setResumeAt(r => ({ ...r, [env]: phase }));
    push({ text: `^C  Interrupted at phase ${phase}/14. Run again to resume.`, tone: 'warn' });
  };

  // First sight: type the command so it is ready to run
  useEffect(() => {
    if (!inView || touched.current || reduced) {
      if (inView && reduced) timers.after(0, () => setTyped(command));
      return;
    }
    for (let i = 1; i <= command.length; i++) {
      timers.after(200 + i * 45, () => { if (!touched.current) setTyped(command.slice(0, i)); });
    }
    // command is fixed for this first pass
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const chooseEnv = (e: Env) => {
    if (running) return;
    setEnv(e);
    setTyped(`./genie.sh --env ${e}`);
  };

  const allLive = live.length === ENVS.length;

  return (
    <div ref={rootRef} className="dp" onPointerDownCapture={() => { touched.current = true; }}>
      <div className="dp-envs" role="radiogroup" aria-label="Environment">
        {ENVS.map(e => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={env === e}
            className={`dp-env${env === e ? ' is-on' : ''}${live.includes(e) ? ' is-live' : ''}`}
            onClick={() => chooseEnv(e)}
            disabled={running && env !== e}
          >
            <span className="dp-lamp" aria-hidden="true" />
            {e === 'qa' || e === 'uat' ? e.toUpperCase() : e}
          </button>
        ))}
      </div>

      <div className="dp-term">
        <div className="dp-chrome">
          <span className="dp-lights" aria-hidden="true"><i /><i /><i /></span>
          <span className="dp-title">genie.sh — {env}</span>
        </div>
        <div ref={screenRef} className="dp-screen" aria-live="polite">
          {lines.length === 0 && (
            <p className="dp-line is-dim">
              <span className="dp-prompt">$</span> {typed}
              <span className="dp-caret" aria-hidden="true" />
            </p>
          )}
          {lines.map((l, i) => (
            <motion.p
              key={i}
              className={`dp-line${l.tone ? ` is-${l.tone}` : ''}`}
              initial={reduced ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
            >
              {l.text}
            </motion.p>
          ))}
        </div>
        <div className="dp-progress" aria-hidden="true">
          <motion.span animate={{ scaleX: phase / PHASES.length }} transition={{ duration: reduced ? 0 : 0.15 }} />
        </div>
      </div>

      <div className="dp-actions">
        {running ? (
          <button type="button" className="dp-btn dp-btn--stop" onClick={interrupt}>Ctrl + C</button>
        ) : (
          <button type="button" className="dp-btn" onClick={deploy}>
            {resumeAt[env] ? `Resume ${env} deploy` : `Deploy ${env}`}
          </button>
        )}
        <p className="dp-status">
          {allLive ? 'All five environments green.' : `${live.length} of 5 environments deployed`}
        </p>
      </div>

      <div className="dp-compare" aria-label="Setup time compared">
        <div className="dp-bar">
          <span className="dp-bar-label">Manual setup</span>
          <span className="dp-bar-track"><span className="dp-bar-fill is-manual" /></span>
          <span className="dp-bar-value">~3 hours</span>
        </div>
        <div className="dp-bar">
          <span className="dp-bar-label">genie.sh</span>
          <span className="dp-bar-track"><span className="dp-bar-fill is-genie" /></span>
          <span className="dp-bar-value">1 command</span>
        </div>
      </div>
      <p className="pl-note">A simplified replay of the script&rsquo;s 14 phases.</p>
    </div>
  );
}
