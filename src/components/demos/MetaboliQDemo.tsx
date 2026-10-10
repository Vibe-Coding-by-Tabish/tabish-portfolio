import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useSettledInView } from './useSettledInView';
import { useTimers } from './useTimers';
import './metaboliq.css';

// A static replica of MetaboliQ AI's four predictors. Every input and every
// result is one real run from the team's hackathon demo recording; the demo
// replays those runs and scores nothing new.

type ModelId = 'gestational' | 'lifestyle' | 'type' | 'projection';

interface Model {
  id: ModelId;
  tab: string;
  title: string;
  algo: string;
  fields: [label: string, value: string][];
  /** Shown first; the rest sit behind "Show all inputs" */
  visible: number;
  verdict: { lead: string; value: string; tone: 'alert' | 'clear' | 'info' };
  /** A count that rolls up instead of a sentence */
  count?: number;
}

const MODELS: Model[] = [
  {
    id: 'gestational',
    tab: 'Gestational',
    title: 'Gestational Diabetes Prediction',
    algo: 'Decision Tree',
    fields: [
      ['Age', '24'],
      ['Pregnancies', '1'],
      ['Weight (kg)', '68'],
      ['Height (cm)', '155'],
      ['BMI', '28.3'],
      ['Heredity', '1'],
    ],
    visible: 6,
    verdict: { lead: 'The woman', value: 'has gestational diabetes', tone: 'alert' },
  },
  {
    id: 'lifestyle',
    tab: 'Lifestyle risk',
    title: 'Diabetes Prediction',
    algo: 'Decision Tree',
    fields: [
      ['Age', '21'],
      ['Sex', 'Male'],
      ['BMI (0–60)', '22'],
      ['Smoker', 'Yes'],
      ['High BP', 'Yes'],
      ['High cholesterol', 'Yes'],
      ['Stroke', 'Yes'],
      ['Heart disease or attack', 'Yes'],
      ['Physical activity', 'Yes'],
      ['Heavy alcohol use', 'Yes'],
      ['General health (1–5)', '3'],
      ['Mental health (days)', '21'],
      ['Physical health (days)', '21'],
    ],
    visible: 13,
    verdict: { lead: 'The user is', value: 'Non-Diabetic', tone: 'clear' },
  },
  {
    id: 'type',
    tab: 'Diabetes type',
    title: 'Classify Type of Diabetes',
    algo: 'Random Forest',
    fields: [
      ['Age', '23'],
      ['BMI', '21'],
      ['Blood glucose', '12'],
      ['Insulin levels', '3'],
      ['Autoantibodies', 'Positive'],
      ['Genetic testing', 'Positive'],
      ['Early onset symptoms', 'No'],
      ['Birth weight (g)', '2751'],
      ['Urine test', 'Glucose present'],
      ['Blood pressure', '118'],
      ['Cholesterol levels', '75'],
      ['Waist circumference', '30'],
      ['Weight gain in pregnancy', '7'],
      ['Pancreatic health', '1'],
      ['Pulmonary function', '2'],
      ['Digestive enzyme levels', '2'],
      ['Neurological assessments', '21'],
      ['Genetic markers', 'Negative'],
      ['Family history', 'No'],
      ['Environmental factors', 'Absent'],
      ['Physical activity', 'Low'],
      ['Dietary habits', 'Unhealthy'],
      ['Ethnicity', 'Low risk'],
      ['Socioeconomic factors', 'Low'],
      ['Smoking status', 'Smoker'],
      ['Alcohol consumption', 'Moderate'],
      ['Glucose tolerance test', 'Normal'],
      ['History of PCOS', 'Yes'],
      ['Previous gestational diabetes', 'Yes'],
      ['Pregnancy history', 'Normal'],
      ['Cystic fibrosis diagnosis', 'No'],
      ['Steroid use history', 'Yes'],
      ['Liver function tests', 'Abnormal'],
    ],
    visible: 9,
    verdict: { lead: 'Predicted type', value: 'Neonatal Diabetes Mellitus (NDM)', tone: 'info' },
  },
  {
    id: 'projection',
    tab: 'Case projection',
    title: 'Diabetic Patients Prediction',
    algo: 'Linear Regression',
    fields: [['Year', '2026']],
    visible: 1,
    verdict: { lead: 'Predicted number of diabetic patients', value: '208,437', tone: 'info' },
    count: 208437,
  },
];

type Phase = 'empty' | 'filling' | 'ready' | 'running' | 'done';

const FILL_MS = 55;
const RUN_MS = 900;

function Count({ to, reduced }: { to: number; reduced: boolean }) {
  const n = useMotionValue(reduced ? to : 0);
  const text = useTransform(n, v => Math.round(v).toLocaleString('en-US'));
  useEffect(() => {
    if (reduced) return;
    const c = animate(n, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [n, reduced, to]);
  return <motion.span>{text}</motion.span>;
}

export default function MetaboliQDemo() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const inView = useSettledInView(rootRef);

  const [active, setActive] = useState<ModelId>('gestational');
  const [phase, setPhase] = useState<Phase>('empty');
  const [filled, setFilled] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [pressing, setPressing] = useState(false);

  const auto = useTimers();
  const run = useTimers();
  const tookOver = useRef(false);

  const model = MODELS.find(m => m.id === active)!;

  // Type the recorded inputs into the form, one field after another
  const fill = (m: Model, then?: () => void) => {
    run.clear();
    setShowAll(false);
    if (reduced) {
      setFilled(m.fields.length);
      setPhase('ready');
      then?.();
      return;
    }
    setFilled(0);
    setPhase('filling');
    const shown = m.visible;
    for (let i = 1; i <= shown; i++) run.after(i * FILL_MS, () => setFilled(i));
    run.after(shown * FILL_MS + 120, () => {
      setFilled(m.fields.length);
      setPhase('ready');
      then?.();
    });
  };

  const predict = () => {
    run.clear();
    if (reduced) {
      setPhase('done');
      return;
    }
    setPhase('running');
    run.after(RUN_MS, () => setPhase('done'));
  };

  const choose = (id: ModelId, tab: HTMLElement) => {
    // On a phone the row scrolls sideways: bring the chosen tab fully into view,
    // moving only the row, never the page
    const row = tabsRef.current!;
    row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    if (id === active && phase !== 'empty') return;
    setActive(id);
    fill(MODELS.find(m => m.id === id)!);
  };

  // First sight: fill the gestational case and press Predict by itself
  useEffect(() => {
    if (!inView) return;
    const first = MODELS[0];
    if (reduced) {
      auto.after(0, () => {
        if (tookOver.current) return;
        fill(first);
        predict();
      });
      return;
    }
    auto.after(200, () => fill(first, () => {
      if (tookOver.current) return;
      auto.after(500, () => setPressing(true));
      auto.after(700, () => {
        setPressing(false);
        predict();
      });
    }));
    // fill and predict are stable for the life of this single run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const takeOver = () => {
    if (tookOver.current) return;
    tookOver.current = true;
    auto.clear();
    setPressing(false);
  };

  const fields = showAll ? model.fields : model.fields.slice(0, model.visible);
  const hidden = model.fields.length - model.visible;

  return (
    <div
      ref={rootRef}
      className="mq"
      data-phase={phase}
      data-model={active}
      onPointerDownCapture={takeOver}
      onKeyDownCapture={takeOver}
    >
      <div className="mq-head">
        <span className="mq-logo" aria-hidden="true"><i /></span>
        <span className="mq-brand">
          <b>MetaboliQ AI</b>
          <span>Go sweet, not sugar</span>
        </span>
        <span className="mq-badge"><span className="mq-badge-long">Live demo · recorded runs</span><span className="mq-badge-short">Live demo</span></span>
      </div>

      <div ref={tabsRef} className="mq-tabs" role="tablist" aria-label="Predictors">
        {MODELS.map(m => (
          <button
            key={m.id}
            type="button"
            role="tab"
            id={`mq-tab-${m.id}`}
            aria-selected={m.id === active}
            aria-controls="mq-panel"
            className={`mq-tab${m.id === active ? ' is-active' : ''}`}
            onClick={e => choose(m.id, e.currentTarget)}
          >
            {m.tab}
          </button>
        ))}
      </div>

      <div className="mq-body" id="mq-panel" role="tabpanel" aria-labelledby={`mq-tab-${active}`}>
        <section className="mq-form" aria-label={`${model.title} inputs`}>
          <div className="mq-form-head">
            <h4>{model.title}</h4>
            <span className="mq-recorded">Recorded case</span>
          </div>

          <dl className={`mq-fields${model.fields.length === 1 ? ' is-single' : ''}`}>
            {fields.map(([label, value], i) => {
              const shown = i < filled;
              return (
                <div key={label} className={`mq-field${shown ? ' is-filled' : ''}`}>
                  <dt>{label}</dt>
                  <dd>
                    {shown ? (
                      <motion.span
                        initial={reduced ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {value}
                      </motion.span>
                    ) : <span className="mq-placeholder" aria-hidden="true">—</span>}
                  </dd>
                </div>
              );
            })}
          </dl>

          {hidden > 0 && phase !== 'empty' && phase !== 'filling' && (
            <button type="button" className="mq-more" onClick={() => setShowAll(s => !s)} aria-expanded={showAll}>
              {showAll ? 'Show fewer inputs' : `Show all ${model.fields.length} inputs`}
            </button>
          )}

          <button
            type="button"
            className={`mq-predict${pressing ? ' is-pressing' : ''}`}
            onClick={phase === 'empty' ? () => fill(model) : predict}
            disabled={phase === 'filling' || phase === 'running'}
          >
            {phase === 'empty' && 'Fill recorded case'}
            {phase === 'filling' && 'Filling…'}
            {phase === 'ready' && 'Predict'}
            {phase === 'running' && <><span className="mq-spinner" aria-hidden="true" /> Running {model.algo}…</>}
            {phase === 'done' && 'Predict again'}
          </button>
        </section>

        <section className="mq-result" aria-label="Prediction result" aria-live="polite">
          <p className="mq-label">Prediction result</p>
          {phase === 'done' ? (
            <motion.div
              key={active}
              className={`mq-verdict is-${model.verdict.tone}`}
              initial={reduced ? false : { opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            >
              <span className="mq-verdict-lead">{model.verdict.lead}</span>
              <span className="mq-verdict-value">
                {model.count ? <Count to={model.count} reduced={reduced} /> : model.verdict.value}
              </span>
            </motion.div>
          ) : (
            <p className="mq-waiting">
              {phase === 'running'
                ? `Scoring the inputs with a ${model.algo}…`
                : `Press Predict to run the ${model.algo.toLowerCase()} on this case.`}
            </p>
          )}

          <dl className="mq-meta">
            <div><dt>Model</dt><dd>{model.algo}</dd></div>
            <div><dt>Library</dt><dd>scikit-learn + Intel oneDAL</dd></div>
            <div><dt>Served by</dt><dd>Flask</dd></div>
          </dl>
        </section>
      </div>

      <p className="mq-foot">Replays the team&rsquo;s recorded runs from the hackathon demo. Not medical advice.</p>
    </div>
  );
}
