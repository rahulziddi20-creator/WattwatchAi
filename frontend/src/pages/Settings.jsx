import PageShell from '../components/layout/PageShell'

function Section({ title, children }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded p-5 mb-4">
      <h2 className="text-sm font-semibold text-[#0f172a] mb-3 pb-2 border-b border-[#f1f5f9]">{title}</h2>
      {children}
    </div>
  )
}

export default function Settings() {
  return (
    <PageShell title="Settings & Model Information" subtitle="Detection methodology, scoring, limitations, and responsible AI">
      <div className="max-w-3xl space-y-0">
        <Section title="Anomaly Detection Method">
          <p className="text-sm text-[#475569] mb-3">
            WattWatch AI uses an ensemble of machine-learning and rule-based techniques to detect suspicious electricity consumption patterns.
          </p>
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Primary Model: Isolation Forest</p>
          <p className="text-sm text-[#475569] mb-3">
            An unsupervised machine learning algorithm that isolates anomalies by randomly partitioning features.
            Anomalous observations require fewer partitions to isolate — they produce shorter paths in the isolation tree.
          </p>
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Features Used</p>
          <ul className="list-none text-sm text-[#475569] space-y-1">
            {[
              ['Metered Units', 'Current meter reading minus previous reading — actual period consumption'],
              ['Deviation from Mean', 'Standardized deviation from the consumer\'s own 12-month average'],
              ['Peer Group Deviation', 'Percentage difference from the average of the same area + connection type'],
              ['Billing Consistency Ratio', 'Absolute difference between billed units and metered units, normalized'],
            ].map(([name, desc]) => (
              <li key={name} className="flex gap-2">
                <span className="font-mono text-xs bg-[#f8f9fb] border border-[#e2e8f0] px-1.5 py-0.5 rounded self-start mt-0.5">{name}</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Fraud Risk Scoring Methodology">
          <p className="text-sm text-[#475569] mb-3">
            Each consumer receives a transparent 0–100 risk score computed from five weighted components.
          </p>
          <table className="w-full text-sm border border-[#e2e8f0] rounded overflow-hidden">
            <thead>
              <tr className="bg-[#f8f9fb]">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#475569]">Component</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#475569]">Weight</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#475569]">Description</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {[
                ['Isolation Forest Score', '30%', 'ML anomaly score — higher = more statistically unusual'],
                ['Baseline Deviation', '25%', 'Deviation from the consumer\'s own historical average'],
                ['Peer Group Deviation', '20%', 'Deviation from similar consumers in the same area and category'],
                ['Billing Consistency', '15%', 'Mismatch between billed units and meter reading difference'],
                ['Rule-Based Flags', '10%', 'Number of triggered rule-based fraud indicators'],
              ].map(([name, w, desc], i) => (
                <tr key={name} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fb]'}>
                  <td className="px-4 py-2 font-medium text-[#0f172a]">{name}</td>
                  <td className="px-4 py-2 font-semibold text-blue-600">{w}</td>
                  <td className="px-4 py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-xs text-[#475569] grid grid-cols-4 gap-2">
            {[['0–29', 'Low', 'text-green-700 bg-green-50'], ['30–59', 'Medium', 'text-amber-700 bg-amber-50'], ['60–79', 'High', 'text-red-700 bg-red-50'], ['80–100', 'Critical', 'text-purple-700 bg-purple-50']].map(([r, l, cls]) => (
              <div key={l} className={`border rounded px-3 py-2 text-center ${cls} border-current border-opacity-20`}>
                <p className="font-bold">{l}</p><p className="font-mono text-xs">{r}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Model Limitations">
          <ul className="list-disc list-inside text-sm text-[#475569] space-y-1.5">
            <li>The system uses unsupervised learning — it has no labeled historical fraud cases to learn from.</li>
            <li>Seasonal consumption patterns (air conditioning, heating) may increase false-positive rates.</li>
            <li>New consumers with fewer than 6 months of history will have less reliable baseline analysis.</li>
            <li>Peer-group comparisons assume consumers in the same area have similar usage profiles.</li>
            <li>Billing discrepancies may have legitimate explanations (meter replacement, billing corrections).</li>
            <li>The model detects anomalies, not confirmed fraud — all flags require human verification.</li>
          </ul>
        </Section>

        <Section title="IBM Granite Integration">
          <p className="text-sm text-[#475569] mb-2">
            The AI Investigation Workspace uses IBM Granite (via IBM watsonx.ai) to generate natural-language investigation
            summaries based on computed evidence. Granite receives structured fraud signals and interprets them into
            professional investigator-ready text.
          </p>
          <p className="text-sm text-[#475569]">
            When IBM credentials are not configured, a rule-based fallback engine generates summaries automatically.
            The system gracefully handles API unavailability.
          </p>
        </Section>

        <Section title="Responsible AI Disclaimer">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900 space-y-2">
            <p className="font-semibold">This system is a decision support tool, not a judgment engine.</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Risk scores and anomaly flags indicate statistical irregularities, not proven fraud.</li>
              <li>No consumer should be penalized, disconnected, or prosecuted based solely on this system's output.</li>
              <li>All flagged accounts must be reviewed by a qualified human investigator before action is taken.</li>
              <li>AI-generated investigation summaries use cautious language by design: "suspicious anomaly", "requires verification", "inspection recommended".</li>
              <li>IBM Granite is instructed never to make definitive accusations against any individual consumer.</li>
            </ul>
          </div>
        </Section>
      </div>
    </PageShell>
  )
}
