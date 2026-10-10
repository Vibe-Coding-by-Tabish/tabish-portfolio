import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSettledInView } from '../demos/useSettledInView';
import { useTimers } from '../demos/useTimers';
import DeployStage from './DeployStage';

// Three tabs on one device: a FastAPI ETL endpoint (typed), Okta
// machine-to-machine auth (secured) and genie.sh (shipped). The first two are
// illustrations of real work with every identifying value simplified or
// masked; nothing here names the systems it came from.

type Tab = 'etl' | 'okta' | 'genie';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'etl', label: 'ETL API', hint: 'FastAPI' },
  { id: 'okta', label: 'Okta M2M', hint: 'OAuth 2.0' },
  { id: 'genie', label: 'genie.sh', hint: 'Deploy' },
];

const STEP_MS = 380;

// ── ETL API ───────────────────────────────────────────────────

type Case = 'valid' | 'missing' | 'type' | 'auth';

interface EtlCase {
  id: Case;
  label: string;
  token: boolean;
  body: [key: string, value: string, bad?: boolean][];
  status: number;
  statusText: string;
  /** How far the request gets: index into ETL_STEPS of the step that stops it */
  stopsAt: number | null;
  response: string;
}

const ETL_STEPS = ['Auth', 'Validate', 'Extract', 'Transform', 'Load'];

const CASES: EtlCase[] = [
  {
    id: 'valid',
    label: 'Valid run',
    token: true,
    body: [['dataset_id', '"ds_••••7c"'], ['pipeline', '"<masked>"'], ['dry_run', 'false']],
    status: 200,
    statusText: 'OK',
    stopsAt: null,
    response: `{
  "run_id": "run_••••42",
  "status": "succeeded",
  "extracted": 12840,
  "loaded": 12811,
  "rejected": 29
}`,
  },
  {
    id: 'missing',
    label: 'Missing field',
    token: true,
    body: [['pipeline', '"<masked>"'], ['dry_run', 'false']],
    status: 422,
    statusText: 'Unprocessable Entity',
    stopsAt: 1,
    response: `{
  "detail": [{
    "type": "missing",
    "loc": ["body", "dataset_id"],
    "msg": "Field required"
  }]
}`,
  },
  {
    id: 'type',
    label: 'Wrong type',
    token: true,
    body: [['dataset_id', '"ds_••••7c"'], ['pipeline', '"<masked>"'], ['dry_run', '"yes please"', true]],
    status: 422,
    statusText: 'Unprocessable Entity',
    stopsAt: 1,
    response: `{
  "detail": [{
    "type": "bool_parsing",
    "loc": ["body", "dry_run"],
    "msg": "Input should be a valid boolean"
  }]
}`,
  },
  {
    id: 'auth',
    label: 'No token',
    token: false,
    body: [['dataset_id', '"ds_••••7c"'], ['pipeline', '"<masked>"'], ['dry_run', 'false']],
    status: 401,
    statusText: 'Unauthorized',
    stopsAt: 0,
    response: `{
  "detail": "Not authenticated"
}`,
  },
];

const ROUTE_CODE = `class RunRequest(BaseModel):
    dataset_id: str
    pipeline: str
    dry_run: bool = False

@router.post("/etl/runs")
def start_run(req: RunRequest,
              token = Depends(verify_token)):
    ...`;

type StepState = 'idle' | 'running' | 'done' | 'failed';

function EtlPanel({ active }: { active: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const [caseId, setCaseId] = useState<Case>('valid');
  const [steps, setSteps] = useState<StepState[]>(ETL_STEPS.map(() => 'idle'));
  const [sent, setSent] = useState<EtlCase | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const timers = useTimers();
  const auto = useRef(false);

  const c = CASES.find(x => x.id === caseId)!;

  const send = (which: EtlCase = c) => {
    timers.clear();
    setSent(null);
    setBusy(true);
    setSteps(ETL_STEPS.map(() => 'idle'));
    const ms = reduced ? 0 : STEP_MS;
    const last = which.stopsAt ?? ETL_STEPS.length - 1;
    for (let i = 0; i <= last; i++) {
      timers.after(i * ms, () => setSteps(s => s.map((v, j) => (j === i ? 'running' : v))));
      const failed = i === which.stopsAt;
      timers.after(i * ms + ms * 0.85, () => setSteps(s => s.map((v, j) => (j === i ? (failed ? 'failed' : 'done') : v))));
    }
    timers.after((last + 1) * ms, () => {
      setSent(which);
      setBusy(false);
    });
  };

  // First time the console is on screen, send the valid request by itself
  useEffect(() => {
    if (!active || auto.current) return;
    auto.current = true;
    timers.after(400, () => send(CASES[0]));
    // send only reads state at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const choose = (id: Case) => {
    setCaseId(id);
    setSent(null);
    setSteps(ETL_STEPS.map(() => 'idle'));
  };

  return (
    <div className="etl">
      <div className="etl-cases" role="radiogroup" aria-label="Request to send">
        {CASES.map(x => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={caseId === x.id}
            className={`etl-case${caseId === x.id ? ' is-on' : ''}`}
            onClick={() => choose(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="etl-grid">
        <section className="etl-card" aria-label="Request">
          <p className="etl-line">
            <span className="etl-method">POST</span>
            <code>/etl/runs</code>
          </p>
          <p className={`etl-header${c.token ? '' : ' is-missing'}`}>
            <span>Authorization</span>
            <code>{c.token ? 'Bearer eyJraWQi…••••' : '(not sent)'}</code>
          </p>
          <pre className="etl-json">
            {'{\n'}
            {c.body.map(([k, v, bad], i) => (
              <span key={k} className={bad ? 'is-bad' : undefined}>
                {`  "${k}": ${v}${i < c.body.length - 1 ? ',' : ''}\n`}
              </span>
            ))}
            {'}'}
          </pre>
          <button type="button" className="sw-btn" onClick={() => send()} disabled={busy}>
            {busy ? 'Sending…' : 'Send request'}
          </button>
        </section>

        <section className="etl-card" aria-label="Response">
          <ol className="etl-steps" aria-label="Request lifecycle">
            {ETL_STEPS.map((s, i) => (
              <li key={s} className={`etl-step is-${steps[i]}`}>
                <span className="etl-step-dot" aria-hidden="true">{steps[i] === 'done' ? '✓' : steps[i] === 'failed' ? '✕' : ''}</span>
                {s}
              </li>
            ))}
          </ol>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key={sent.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-live="polite"
              >
                <p className={`etl-status is-${sent.status < 300 ? 'ok' : sent.status === 422 ? 'warn' : 'bad'}`}>
                  {sent.status} {sent.statusText}
                </p>
                <pre className="etl-json">{sent.response}</pre>
              </motion.div>
            ) : (
              <motion.p key="wait" className="etl-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {busy ? 'Working…' : 'Pick a request and send it.'}
              </motion.p>
            )}
          </AnimatePresence>
        </section>
      </div>

      <button type="button" className="sw-link" aria-expanded={showCode} onClick={() => setShowCode(s => !s)}>
        {showCode ? 'Hide the route' : 'Show the route'} <span aria-hidden="true">{showCode ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {showCode && (
          <motion.pre
            className="etl-code"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {ROUTE_CODE}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Okta machine to machine ───────────────────────────────────

type Scenario = 'valid' | 'none' | 'scope' | 'expired';

const SCENARIOS: { id: Scenario; label: string; status: string; tone: 'ok' | 'bad'; note: string }[] = [
  { id: 'valid', label: 'Valid token', status: '200 OK', tone: 'ok', note: 'Signature, issuer, audience, scope and expiry all check out.' },
  { id: 'none', label: 'No token', status: '401 Unauthorized', tone: 'bad', note: 'No Bearer token on the call, so the API never looks further.' },
  { id: 'scope', label: 'Wrong scope', status: '403 Forbidden', tone: 'bad', note: 'A real token, but not allowed to do this. insufficient_scope.' },
  { id: 'expired', label: 'Expired', status: '401 Unauthorized', tone: 'bad', note: 'The token’s exp is in the past. The service fetches a fresh one.' },
];

const FLOW = [
  { from: 'ETL service', to: 'Okta', title: 'Ask for a token', code: 'POST /oauth2/<server>/v1/token\ngrant_type=client_credentials\nscope=<masked>\nAuthorization: Basic ••••' },
  { from: 'Okta', to: 'ETL service', title: 'Get a signed JWT', code: '{ "token_type": "Bearer",\n  "expires_in": 3600,\n  "access_token": "eyJ…" }' },
  { from: 'ETL service', to: 'Protected API', title: 'Call with Bearer', code: 'POST /etl/runs\nAuthorization: Bearer eyJ…' },
];

function OktaPanel({ active }: { active: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const [scenario, setScenario] = useState<Scenario>('valid');
  const [step, setStep] = useState(-1);
  const timers = useTimers();
  const auto = useRef(false);

  const play = () => {
    timers.clear();
    setStep(-1);
    const ms = reduced ? 0 : 650;
    FLOW.forEach((_, i) => timers.after(i * ms + 50, () => setStep(i)));
    timers.after(FLOW.length * ms + 50, () => setStep(FLOW.length));
  };

  useEffect(() => {
    if (!active || auto.current) return;
    auto.current = true;
    timers.after(300, play);
    // play only reads state at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pick = (s: Scenario) => {
    setScenario(s);
    play();
  };

  const sc = SCENARIOS.find(s => s.id === scenario)!;
  const done = step >= FLOW.length;

  return (
    <div className="okta">
      <div className="etl-cases" role="radiogroup" aria-label="Token to present">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={scenario === s.id}
            className={`etl-case${scenario === s.id ? ' is-on' : ''}`}
            onClick={() => pick(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="okta-grid">
        <ol className="okta-flow" aria-label="Client credentials flow">
          {FLOW.map((f, i) => {
            // With no token the service skips straight to calling the API
            const skipped = scenario === 'none' && i < 2;
            const state = skipped ? 'skipped' : step > i ? 'done' : step === i ? 'running' : 'idle';
            return (
              <li key={f.title} className={`okta-step is-${state}`}>
                <p className="okta-step-head">
                  <span className="okta-num" aria-hidden="true">{i + 1}</span>
                  <b>{f.title}</b>
                  <span className="okta-route">{f.from} → {f.to}</span>
                </p>
                <pre className="okta-code">{skipped ? '(skipped: no token requested)' : i === 2 && scenario === 'none' ? 'POST /etl/runs\n(no Authorization header)' : f.code}</pre>
              </li>
            );
          })}
        </ol>

        <section className="okta-jwt" aria-label="Decoded access token">
          <p className="okta-jwt-title">Access token, decoded</p>
          <div className={`okta-token${scenario === 'none' ? ' is-absent' : ''}`}>
            <span className="jwt-h">eyJhbGciOiJSUzI1NiIs</span>.<span className="jwt-p">eyJpc3MiOiJodHRwczovL…</span>.<span className="jwt-s">••••</span>
          </div>
          <pre className="okta-claims">
            <span className="jwt-h">{'{ "alg": "RS256", "kid": "••••" }'}</span>{'\n'}
            <span className="jwt-p">{'{\n  "iss": "https://<org>.okta.com/oauth2/<server>",\n  "aud": "api://<masked>",\n  "cid": "0oa••••",\n'}</span>
            <span className={`jwt-p${scenario === 'scope' ? ' is-bad' : ''}`}>{`  "scp": ["${scenario === 'scope' ? '<another scope>' : '<masked>'}"],\n`}</span>
            <span className={`jwt-p${scenario === 'expired' ? ' is-bad' : ''}`}>{`  "exp": ${scenario === 'expired' ? '(1 hour ago)' : '(in 59 min)'}\n}`}</span>
          </pre>
          <p className="okta-sig"><span className="jwt-s">Signature</span> checked against Okta&rsquo;s published keys (JWKS)</p>
        </section>
      </div>

      <div className="okta-result" aria-live="polite">
        {done ? (
          <motion.p
            key={scenario}
            className={`okta-verdict is-${sc.tone}`}
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <b>{sc.status}</b> {sc.note}
          </motion.p>
        ) : (
          <p className="okta-verdict is-wait">Running the flow…</p>
        )}
        <button type="button" className="sw-btn" onClick={play}>Run the flow again</button>
      </div>
    </div>
  );
}

// ── The device ────────────────────────────────────────────────

export default function SoftwareStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useSettledInView(rootRef, 0.35);
  const [tab, setTab] = useState<Tab>('etl');
  const [seen, setSeen] = useState<Tab[]>(['etl']);

  const choose = (t: Tab) => {
    setTab(t);
    setSeen(s => (s.includes(t) ? s : [...s, t]));
  };

  return (
    <div ref={rootRef} className="sw">
      <div className="sw-tabs" role="tablist" aria-label="Software engineering examples">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`sw-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`sw-panel-${t.id}`}
            className={`sw-tab${tab === t.id ? ' is-on' : ''}`}
            onClick={() => choose(t.id)}
          >
            {tab === t.id && <motion.span className="sw-tab-pill" layoutId="sw-tab-pill" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
            <span className="sw-tab-label">{t.label}</span>
            <span className="sw-tab-hint">{t.hint}</span>
          </button>
        ))}
      </div>

      {TABS.map(t => (
        <div
          key={t.id}
          id={`sw-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`sw-tab-${t.id}`}
          className="sw-panel"
          hidden={tab !== t.id}
        >
          {/* Panels mount once visited and keep their state after */}
          {seen.includes(t.id) && (
            t.id === 'etl' ? <EtlPanel active={inView && tab === 'etl'} /> :
            t.id === 'okta' ? <OktaPanel active={inView && tab === 'okta'} /> :
            <DeployStage active={inView && tab === 'genie'} />
          )}
        </div>
      ))}

      <p className="pl-note">
        {tab === 'genie'
          ? 'A simplified replay of the script’s 14 phases.'
          : 'Illustrative and simplified. Routes, fields and values are masked.'}
      </p>
    </div>
  );
}
