import { FormEvent, useState } from 'react';

type CampaignResult = {
  concept: { name: string; oneLiner: string; strategicIdea: string; keyMessage: string };
  variants: Array<{ headline: string; body: string; angle: string }>;
  checklist: Array<{ task: string; owner: string; timing: string }>;
  imagePrompts: string[];
  images: Array<{ prompt: string; dataUrl: string }>;
};

type FormState = {
  brief: string;
  audience: string;
  product: string;
  tone: string;
  channels: string[];
};

const channelOptions = ['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Email', 'Landing page', 'Search ads', 'OOH'];

const initialForm: FormState = {
  brief: '',
  audience: '',
  product: '',
  tone: 'Confident, warm, modern',
  channels: ['Instagram', 'Facebook'],
};

function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleChannel = (channel: string) => {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  };

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Generation failed.');
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setResult(null);
    setError('');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>Campaign Concept Studio</span></div>
        <div className="status-pill"><span className="status-dot" /> OpenAI Responses workflow</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">MARKETING TEAM WORKBENCH</p>
          <h1>From brief to <em>campaign world</em> in one pass.</h1>
          <p className="hero-text">Shape the strategic idea, copy system, launch plan, and visual direction from a compact campaign brief.</p>
        </div>
        <div className="hero-note">
          <span>01</span><p>Strategy + copy</p><span>02</span><p>Visual direction</p>
        </div>
      </section>

      <div className="workspace">
        <form className="brief-card" onSubmit={generate}>
          <div className="card-heading">
            <div><p className="eyebrow">INPUT</p><h2>Campaign brief</h2></div>
            <button type="button" className="text-button" onClick={reset}>Reset</button>
          </div>

          <label>What are we trying to launch?<textarea required value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} placeholder="Example: Launch a new everyday sunscreen that feels premium but approachable..." /></label>
          <label>Who is it for?<textarea required value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="Audience, context, motivations, objections, cultural cues..." /></label>
          <label>Product / proof points<textarea required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Product details, differentiators, offers, facts we can safely claim..." /></label>
          <label>Tone<input required value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} /></label>
          <fieldset><legend>Desired channels</legend><div className="chips">{channelOptions.map((channel) => <button type="button" key={channel} className={`chip ${form.channels.includes(channel) ? 'selected' : ''}`} onClick={() => toggleChannel(channel)}>{channel}</button>)}</div></fieldset>

          <button className="generate-button" type="submit" disabled={loading || form.channels.length === 0}>
            {loading ? <><span className="spinner" /> Building campaign…</> : <>Generate campaign <span>↗</span></>}
          </button>
          <p className="boundary-note">Your brief is sent to our server endpoint. The OpenAI API key never reaches the browser.</p>
        </form>

        <section className="results-column" aria-live="polite">
          {error && <div className="error-state"><strong>Couldn’t generate the campaign.</strong><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
          {!result && !loading && !error && <div className="empty-state"><div className="empty-icon">✦</div><h2>Your campaign canvas is ready.</h2><p>Fill the brief and generate a complete campaign direction. Your strategy, copy, checklist, prompts, and visuals will land here.</p><div className="empty-grid"><span>Concept</span><span>3 copy routes</span><span>Launch checklist</span><span>Visual system</span></div></div>}
          {loading && <div className="loading-state"><div className="loading-orbit" /><h2>Building the campaign world…</h2><p>Strategy first, then copy and visual direction.</p><div className="loading-lines"><span /><span /><span /></div></div>}

          {result && !loading && <div className="result-stack">
            <section className="result-hero"><p className="eyebrow">CAMPAIGN PLATFORM</p><h2>{result.concept.name}</h2><p className="one-liner">{result.concept.oneLiner}</p><div className="idea-grid"><div><span>Strategic idea</span><p>{result.concept.strategicIdea}</p></div><div><span>Key message</span><p>{result.concept.keyMessage}</p></div></div></section>

            <section className="result-section"><div className="section-title"><span>01</span><div><p className="eyebrow">COPY SYSTEM</p><h3>Three routes to market</h3></div></div><div className="variant-grid">{result.variants.map((variant, index) => <article className="variant" key={variant.headline}><div className="variant-number">0{index + 1}</div><span className="angle">{variant.angle}</span><h4>{variant.headline}</h4><p>{variant.body}</p></article>)}</div></section>

            <section className="result-section"><div className="section-title"><span>02</span><div><p className="eyebrow">LAUNCH PLAN</p><h3>Ready-to-run checklist</h3></div></div><div className="checklist">{result.checklist.map((item) => <div className="check-row" key={`${item.task}-${item.owner}`}><span className="checkmark">✓</span><div><strong>{item.task}</strong><small>{item.owner} · {item.timing}</small></div></div>)}</div></section>

            <section className="result-section visuals"><div className="section-title"><span>03</span><div><p className="eyebrow">VISUAL DIRECTION</p><h3>Prompts + generated references</h3></div></div><div className="visual-grid">{result.images.map((image, index) => <figure key={image.prompt}><img src={image.dataUrl} alt={`Generated campaign direction ${index + 1}`} /><figcaption><span>Direction 0{index + 1}</span>{image.prompt}</figcaption></figure>)}</div><div className="prompt-list">{result.imagePrompts.map((prompt, index) => <div key={prompt}><span>Prompt 0{index + 1}</span><p>{prompt}</p></div>)}</div></section>
          </div>}
        </section>
      </div>
    </main>
  );
}

export default App;
