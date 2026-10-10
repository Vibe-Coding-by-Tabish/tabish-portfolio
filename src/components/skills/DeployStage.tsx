import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTimers } from '../demos/useTimers';

// A simplified replay of genie.sh deploying one environment in one command.
// Interrupt it and run again, and it resumes from the phase it stopped at.
// The phase list is a plain-English summary of the real script.

const ENV = 'uat';
const COMMAND = `./genie.sh --env ${ENV}`;

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
  'primary keys match the expected schema',
];

const PHASE_MS = 150;

interface Line {
  text: string;
  tone?: 'ok' | 'warn' | 'dim' | 'live';
}

export default function DeployStage({ active }: { active: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const screenRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [resumeAt, setResumeAt] = useState(0);
  const [live, setLive] = useState(false);
  const [typed, setTyped] = useState('');
  const timers = useTimers();
  const typedOnce = useRef(false);

  // Keep the newest line in view inside the terminal, never the page
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // The first time the tab is shown, type the command so it is ready to run
  useEffect(() => {
    if (!active || typedOnce.current) return;
    typedOnce.current = true;
    if (reduced) {
      timers.after(0, () => setTyped(COMMAND));
      return;
    }
    for (let i = 1; i <= COMMAND.length; i++) timers.after(150 + i * 40, () => setTyped(COMMAND.slice(0, i)));
  }, [active, reduced, timers]);

  const push = (l: Line) => setLines(prev => [...prev, l]);

  const deploy = () => {
    timers.clear();
    const from = resumeAt;
    setRunning(true);
    setLive(false);
    setTyped(COMMAND);
    setLines([{ text: `$ ${COMMAND}`, tone: 'dim' }]);
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
      push({ text: `✓ ${ENV} is live. One command, no manual steps.`, tone: 'live' });
      setRunning(false);
      setResumeAt(0);
      setLive(true);
    });
  };

  // Ctrl+C: stop mid-run; the next run picks up where this one stopped
  const interrupt = () => {
    timers.clear();
    setRunning(false);
    setResumeAt(phase);
    push({ text: `^C  Interrupted at phase ${phase}/14. Run again to resume.`, tone: 'warn' });
  };

  return (
    <div className="dp">
      <div className="dp-term">
        <div className="dp-chrome">
          <span className="dp-lights" aria-hidden="true"><i /><i /><i /></span>
          <span className="dp-title">genie.sh — {ENV}</span>
          <span className={`dp-env-lamp${live ? ' is-live' : ''}`} aria-label={live ? `${ENV} is live` : `${ENV} not deployed yet`} />
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
            {resumeAt ? `Resume ${ENV} deploy` : live ? `Deploy ${ENV} again` : `Deploy ${ENV}`}
          </button>
        )}
        <div className="dp-compare" aria-label="Setup time compared">
          <div className="dp-bar">
            <span className="dp-bar-label">By hand</span>
            <span className="dp-bar-track"><span className="dp-bar-fill is-manual" /></span>
            <span className="dp-bar-value">~3 hours</span>
          </div>
          <div className="dp-bar">
            <span className="dp-bar-label">genie.sh</span>
            <span className="dp-bar-track"><span className="dp-bar-fill is-genie" /></span>
            <span className="dp-bar-value">1 command</span>
          </div>
        </div>
      </div>
    </div>
  );
}
