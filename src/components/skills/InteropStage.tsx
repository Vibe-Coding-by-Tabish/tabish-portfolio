import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSettledInView } from '../demos/useSettledInView';
import { useTimers } from '../demos/useTimers';

// One lab result travelling the way InterGenix moves it: an HL7 v2 ORU^R01
// message, validated, then mapped to FHIR resources. Tap a field to see
// where it lands. Break the message and validation rejects it. The message is
// synthetic; there is no patient data here.

interface Field {
  v: string;
  /** HL7 field id, when the field maps to FHIR */
  id?: string;
}

interface Segment {
  name: string;
  fields: Field[];
}

const MESSAGE: Segment[] = [
  { name: 'MSH', fields: [{ v: '^~\\&' }, { v: 'OPENELIS', id: 'MSH-3' }, { v: 'LAB' }, { v: 'INTERGENIX' }, { v: 'HOSP' }, { v: '202604120930' }, { v: '' }, { v: 'ORU^R01', id: 'MSH-9' }, { v: 'MSG00042', id: 'MSH-10' }, { v: 'P' }, { v: '2.5.1' }] },
  { name: 'PID', fields: [{ v: '1' }, { v: '' }, { v: '48213^^^HOSP^MR', id: 'PID-3' }, { v: '' }, { v: 'DOE^JANE', id: 'PID-5' }, { v: '' }, { v: '19860214', id: 'PID-7' }, { v: 'F', id: 'PID-8' }] },
  { name: 'OBR', fields: [{ v: '1' }, { v: 'ORD7731' }, { v: '' }, { v: '2345-7^Glucose^LN' }, { v: '' }, { v: '' }, { v: '202604120815', id: 'OBR-7' }] },
  { name: 'OBX', fields: [{ v: '1' }, { v: 'NM' }, { v: '2345-7^Glucose^LN', id: 'OBX-3' }, { v: '' }, { v: '95', id: 'OBX-5' }, { v: 'mg/dL', id: 'OBX-6' }, { v: '70-99', id: 'OBX-7' }, { v: 'N', id: 'OBX-8' }, { v: '' }, { v: '' }, { v: 'F', id: 'OBX-11' }] },
];

// What each field means, and the FHIR path it becomes
const MAP: Record<string, { name: string; fhir: string }> = {
  'MSH-3': { name: 'Sending application', fhir: 'Bundle.meta.source' },
  'MSH-9': { name: 'Message type', fhir: 'Bundle.type' },
  'MSH-10': { name: 'Message control ID', fhir: 'Bundle.identifier' },
  'PID-3': { name: 'Patient identifier', fhir: 'Patient.identifier' },
  'PID-5': { name: 'Patient name', fhir: 'Patient.name' },
  'PID-7': { name: 'Date of birth', fhir: 'Patient.birthDate' },
  'PID-8': { name: 'Administrative sex', fhir: 'Patient.gender' },
  'OBR-7': { name: 'Observation time', fhir: 'Observation.effectiveDateTime' },
  'OBX-3': { name: 'Test code (LOINC)', fhir: 'Observation.code' },
  'OBX-5': { name: 'Result value', fhir: 'Observation.valueQuantity.value' },
  'OBX-6': { name: 'Units', fhir: 'Observation.valueQuantity.unit' },
  'OBX-7': { name: 'Reference range', fhir: 'Observation.referenceRange' },
  'OBX-8': { name: 'Abnormal flag', fhir: 'Observation.interpretation' },
  'OBX-11': { name: 'Result status', fhir: 'Observation.status' },
};

// The FHIR side, line by line, tagged with the HL7 fields each line comes from
const FHIR: [indent: number, text: string, from?: string[]][] = [
  [0, '{'],
  [1, '"resourceType": "Bundle",'],
  [1, '"type": "collection",', ['MSH-9']],
  [1, '"identifier": { "value": "MSG00042" },', ['MSH-10']],
  [1, '"meta": { "source": "OPENELIS" },', ['MSH-3']],
  [1, '"entry": [{ "resource": {'],
  [2, '"resourceType": "Patient",'],
  [2, '"identifier": [{ "value": "48213" }],', ['PID-3']],
  [2, '"name": [{ "family": "Doe", "given": ["Jane"] }],', ['PID-5']],
  [2, '"birthDate": "1986-02-14",', ['PID-7']],
  [2, '"gender": "female"', ['PID-8']],
  [1, '} }, { "resource": {'],
  [2, '"resourceType": "Observation",'],
  [2, '"status": "final",', ['OBX-11']],
  [2, '"code": { "coding": [{ "system": "loinc", "code": "2345-7" }] },', ['OBX-3']],
  [2, '"effectiveDateTime": "2026-04-12T08:15:00",', ['OBR-7']],
  [2, '"valueQuantity": { "value": 95, "unit": "mg/dL" },', ['OBX-5', 'OBX-6']],
  [2, '"referenceRange": [{ "text": "70-99" }],', ['OBX-7']],
  [2, '"interpretation": [{ "text": "Normal" }]', ['OBX-8']],
  [1, '} }]'],
  [0, '}'],
];

const HOPS = ['OpenELIS', 'Mirth Connect', 'InterGenix', 'Medplum'];
const TOUR = ['PID-5', 'PID-7', 'OBX-3', 'OBX-5', 'OBX-8'];
const BROKEN_DOB = '19861402';

export default function InteropStage() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useSettledInView(rootRef, 0.4);
  const [active, setActive] = useState<string>('PID-5');
  const [broken, setBroken] = useState(false);
  const [sent, setSent] = useState(0);
  const timers = useTimers();
  const touched = useRef(false);

  // On first sight, step through a few mappings until the visitor takes over
  useEffect(() => {
    if (!inView || reduced) return;
    TOUR.forEach((id, i) => timers.after(900 + i * 1500, () => { if (!touched.current) setActive(id); }));
    // a single tour per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const pick = (id: string) => setActive(id);
  const send = () => setSent(n => n + 1);
  const toggleBroken = () => {
    setBroken(b => !b);
    setActive('PID-7');
    send();
  };

  const value = (f: Field) => (broken && f.id === 'PID-7' ? BROKEN_DOB : f.v);
  const info = MAP[active];
  const activeField = MESSAGE.flatMap(s => s.fields).find(f => f.id === active)!;
  const activeValue = value(activeField) || '(empty)';

  return (
    <div
      ref={rootRef}
      className={`io${broken ? ' is-broken' : ''}`}
      onPointerDownCapture={() => { touched.current = true; timers.clear(); }}
    >
      {/* The route a message takes; a packet runs it on every send */}
      <div className="io-route" aria-label="Message route">
        {HOPS.map((h, i) => (
          <Fragment key={h}>
            <span className={`io-hop${h === 'InterGenix' ? ' is-me' : ''}${broken && i === 3 ? ' is-blocked' : ''}`}>{h}</span>
            {i < HOPS.length - 1 && (
              <span className="io-wire" aria-hidden="true">
                {!reduced && sent > 0 && !(broken && i === 2) && (
                  <motion.i
                    key={`${sent}-${i}`}
                    initial={{ left: '0%', opacity: 0 }}
                    animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.55, delay: i * 0.45, ease: 'easeInOut' }}
                  />
                )}
              </span>
            )}
          </Fragment>
        ))}
      </div>

      <div className="io-panes">
        <section className="io-pane io-pane--hl7" aria-label="HL7 v2 message">
          <p className="io-pane-title">HL7 v2 · ORU^R01</p>
          <div className="io-code">
            {MESSAGE.map(seg => (
              <p key={seg.name} className="io-seg">
                <b>{seg.name}</b>
                {seg.fields.map((f, i) => (
                  <Fragment key={i}>
                    <span className="io-pipe">|</span>
                    {f.id ? (
                      <button
                        type="button"
                        className={`io-field${active === f.id ? ' is-active' : ''}${broken && f.id === 'PID-7' ? ' is-bad' : ''}`}
                        onClick={() => pick(f.id!)}
                        onPointerEnter={e => { if (e.pointerType === 'mouse') { touched.current = true; pick(f.id!); } }}
                        aria-pressed={active === f.id}
                        aria-label={`${f.id}, ${MAP[f.id].name}: ${value(f)}`}
                      >
                        {value(f)}
                      </button>
                    ) : (
                      <span className="io-plain">{f.v}</span>
                    )}
                  </Fragment>
                ))}
              </p>
            ))}
          </div>
          {/* What the tapped field is, and where it goes */}
          <motion.div
            key={active}
            className="io-inspect"
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
          >
            <p className="io-inspect-id">{active}</p>
            <p className="io-inspect-name">{info.name}</p>
            <p className="io-inspect-value">{activeValue}</p>
            <p className="io-inspect-to"><span aria-hidden="true">→</span> <code>{info.fhir}</code></p>
          </motion.div>
        </section>

        <div className="io-arrow" aria-hidden="true">
          <span>{broken ? '✕' : '→'}</span>
        </div>

        <section className="io-pane io-pane--fhir" aria-label="FHIR resources">
          <p className="io-pane-title">FHIR · Bundle</p>
          <div className="io-code io-json">
            {FHIR.map(([indent, text, from], i) => (
              <p
                key={i}
                className={`io-json-line${from?.includes(active) ? ' is-active' : ''}`}
                style={{ paddingLeft: `${indent * 1.2}em` }}
              >
                {text}
              </p>
            ))}
            <AnimatePresence>
              {broken && (
                <motion.div
                  className="io-reject"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Not converted. The message was rejected before it reached FHIR.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <div className="io-foot">
        <p className={`io-verdict${broken ? ' is-bad' : ''}`} aria-live="polite">
          {broken
            ? <>✕ HAPI validation failed: PID-7 <code>{BROKEN_DOB}</code> is not a valid date.</>
            : <>✓ Valid ORU^R01. Converted to 2 FHIR resources.</>}
        </p>
        <div className="io-actions">
          <button type="button" className="io-btn" onClick={send}>Send message</button>
          <button type="button" className={`io-btn io-btn--ghost${broken ? ' is-fix' : ''}`} onClick={toggleBroken}>
            {broken ? 'Fix the message' : 'Break the message'}
          </button>
        </div>
      </div>
      <p className="pl-note">Synthetic message, no patient data. Tap any highlighted field.</p>
    </div>
  );
}
