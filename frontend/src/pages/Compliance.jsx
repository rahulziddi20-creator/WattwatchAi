import PageShell from '../components/layout/PageShell'
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        {Icon && <Icon size={14} className="text-gray-500" />}
        <p className="text-[13px] font-semibold text-gray-800">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="w-48 shrink-0 text-[12px] text-gray-500 font-medium">{label}</span>
      <span className="text-[12px] text-gray-700">{value}</span>
    </div>
  )
}

export default function Compliance() {
  const SCORE_ROWS = [
    { label: 'Isolation Forest Score', weight: '30%', desc: 'Unsupervised ML anomaly probability — higher = more statistically unusual' },
    { label: 'Baseline Deviation', weight: '25%', desc: "Deviation from the consumer's own 12-month usage average" },
    { label: 'Peer Group Deviation', weight: '20%', desc: 'Deviation from similar consumers in the same area and connection type' },
    { label: 'Billing Consistency', weight: '15%', desc: 'Mismatch between billed units and meter reading difference' },
    { label: 'Rule-Based Flags', weight: '10%', desc: 'Number of triggered rule-based fraud indicators' },
  ]

  return (
    <PageShell title="Model & Compliance" subtitle="Detection methodology, scoring, limitations, and responsible AI">
      {/* Detection Method */}
      <Section title="Detection Method" icon={Info}>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
          WattWatch AI uses an ensemble of three independent detection approaches. Each consumer
          is scored independently and results are combined into a single transparent risk score.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              title: 'Isolation Forest',
              desc: 'Unsupervised machine learning. Detects statistical outliers by isolating anomalous data points through random feature partitioning. Anomalous consumers require fewer splits to isolate — producing a higher anomaly score.',
            },
            {
              title: 'Statistical Rules',
              desc: 'Rule-based checks for specific patterns: sudden consumption drops, near-zero usage with active load, repeated low billing, and consumption spikes. Each rule contributes independently to the evidence set.',
            },
            {
              title: 'Peer Comparison',
              desc: 'Each consumer is compared against others in the same area and connection type. Significant deviation from the peer group mean — especially downward — contributes to the risk score.',
            },
          ].map(m => (
            <div key={m.title} className="bg-gray-50 border border-gray-100 rounded p-3">
              <p className="text-[12px] font-semibold text-gray-800 mb-1">{m.title}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-gray-700 mb-2">Features Used by Isolation Forest</p>
          <table className="text-[12px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-[11px] text-gray-500 font-semibold">Feature</th>
                <th className="px-3 py-2 text-[11px] text-gray-500 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['Metered Units', 'Current reading minus previous reading — actual period consumption'],
                ['Deviation from Mean', "Standardized deviation from the consumer's own 12-month mean"],
                ['Peer Group Deviation', 'Percentage difference from the area + connection type peer average'],
                ['Billing Consistency Ratio', 'Absolute difference between billed and metered units (normalized)'],
              ].map(([f, d]) => (
                <tr key={f} className="trow">
                  <td className="px-3 py-2 font-mono text-[11px] font-medium text-gray-700 bg-gray-50 w-52">{f}</td>
                  <td className="px-3 py-2 text-gray-600">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Risk Scoring */}
      <Section title="Risk Scoring Methodology" icon={Info}>
        <p className="text-[13px] text-gray-600 mb-4">
          Each consumer receives a transparent 0–100 risk score computed from five weighted components.
          A severity bonus of up to +15 points applies when multiple high-severity signals coincide.
        </p>
        <table className="text-[12px] mb-4">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-[11px] text-gray-500 font-semibold">Component</th>
              <th className="px-4 py-2 text-[11px] text-gray-500 font-semibold">Weight</th>
              <th className="px-4 py-2 text-[11px] text-gray-500 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {SCORE_ROWS.map(r => (
              <tr key={r.label} className="trow">
                <td className="px-4 py-2.5 font-semibold text-gray-800">{r.label}</td>
                <td className="px-4 py-2.5 text-blue-600 font-bold">{r.weight}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-4 gap-2">
          {[
            { range: '0 – 29',  level: 'Low',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { range: '30 – 59', level: 'Medium',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { range: '60 – 79', level: 'High',     color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
            { range: '80 – 100',level: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          ].map(r => (
            <div key={r.level} style={{ background: r.bg, border: `1px solid ${r.border}` }} className="rounded p-3 text-center">
              <p style={{ color: r.color }} className="text-[16px] font-bold">{r.level}</p>
              <p style={{ color: r.color }} className="font-mono text-[12px]">{r.range}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Model Limitations */}
      <Section title="Model Limitations" icon={AlertTriangle}>
        <ul className="space-y-2">
          {[
            'This system uses unsupervised learning — it has no labeled historical fraud cases to learn from. Results are probabilistic, not conclusive.',
            'Seasonal consumption patterns (air conditioning, heating loads) may cause elevated false-positive rates during peak seasons.',
            'New consumers with fewer than 6 months of history will have less reliable baseline analysis.',
            'Peer-group comparisons assume consumers in the same area and connection type have broadly similar usage profiles.',
            'Billing discrepancies may have legitimate explanations: meter replacement, billing corrections, or tariff changes.',
            'The model detects consumption anomalies, not confirmed fraud — all flags require human verification before action.',
            'Detection threshold (10% contamination rate) means approximately 1 in 10 consumers may be flagged even without any actual irregularity.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Responsible AI */}
      <Section title="Responsible AI Statement" icon={ShieldCheck}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-4">
          <p className="text-[14px] font-bold text-amber-900 mb-2">
            WattWatch AI identifies suspicious anomalies for human review. It does not determine guilt or confirm electricity theft.
          </p>
          <p className="text-[13px] text-amber-800 leading-relaxed">
            All risk scores and investigation flags are computed from statistical analysis of consumption patterns.
            They represent anomalies relative to historical behavior and peer groups — not evidence of intentional fraud.
            No consumer should be penalized, disconnected, or prosecuted based solely on the output of this system.
          </p>
        </div>
        <div className="space-y-2">
          {[
            ['Human Review Required', 'Every flagged account must be reviewed by a qualified human investigator before any field action is taken.'],
            ['Cautious AI Language', 'IBM Granite is explicitly instructed to use cautious language: "suspicious anomaly", "requires verification", "inspection recommended". It does not make definitive accusations.'],
            ['Explainability', 'Every risk score includes a transparent breakdown of contributing factors, so investigators can evaluate the reasoning independently.'],
            ['Data Privacy', 'Consumer records should be handled in accordance with applicable data protection regulations. API keys and credentials must never be exposed in frontend code.'],
          ].map(([t, d]) => (
            <div key={t} className="flex items-start gap-3">
              <ShieldCheck size={13} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-gray-800">{t}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}
