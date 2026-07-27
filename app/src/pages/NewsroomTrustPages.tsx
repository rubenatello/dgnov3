import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { SEO_CONFIG } from '../utils/seoConstants';

interface TrustPageProps {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

function TrustPage({ path, eyebrow, title, description, children }: TrustPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 min-h-[60vh]">
      <SEOHead title={`${title} | DGNO`} description={description} url={`${SEO_CONFIG.siteUrl}${path}`} type="website" />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-inkMuted">
        <Link to="/" className="hover:text-accent">Home</Link> <span aria-hidden="true">/</span> {title}
      </nav>
      <header className="border-b border-stone/50 pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-dark">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-4xl sm:text-5xl font-bold text-ink">{title}</h1>
        <p className="mt-4 text-lg sm:text-xl text-inkMuted max-w-3xl">{description}</p>
      </header>
      <div className="mt-10 prose prose-lg max-w-none text-inkMuted prose-headings:text-ink prose-a:text-accent">
        {children}
      </div>
    </div>
  );
}

export function ContactPage() {
  const [submissionState, setSubmissionState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmissionState('sending');
    setSubmissionMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'The newsroom could not receive your message.');
      }

      form.reset();
      setSubmissionState('sent');
      setSubmissionMessage('Your message was sent to the DGNO newsroom.');
    } catch (error) {
      setSubmissionState('error');
      setSubmissionMessage(
        error instanceof Error ? error.message : 'The newsroom could not receive your message.',
      );
    }
  };

  return (
    <TrustPage
      path="/contact"
      eyebrow="Accountability"
      title="Contact DGNO"
      description="Reach the newsroom about reporting, corrections, tracker records, accessibility, or general questions."
    >
      <h2>Send the newsroom a message</h2>
      <p>
        Use this form for reporting tips, corrections, tracker records, accessibility issues, privacy requests,
        or general questions. Submissions go to a private, monitored DGNO inbox; its address is not exposed on
        this page.
      </p>

      <form
        className="not-prose mt-8 space-y-5 rounded-2xl border border-stone/60 bg-paper-soft p-5 shadow-sm sm:p-7"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-ink">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={120}
              required
              className="w-full rounded-lg border border-stone bg-surface px-3 py-2.5 text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-2 block text-sm font-bold text-ink">Reply email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              className="w-full rounded-lg border border-stone bg-surface px-3 py-2.5 text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-topic" className="mb-2 block text-sm font-bold text-ink">Topic</label>
            <select
              id="contact-topic"
              name="topic"
              defaultValue="reporting"
              className="w-full rounded-lg border border-stone bg-surface px-3 py-2.5 text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="reporting">Reporting tip</option>
              <option value="correction">Correction request</option>
              <option value="tracker">Tracker record</option>
              <option value="accessibility">Accessibility issue</option>
              <option value="privacy">Privacy request</option>
              <option value="general">General question</option>
            </select>
          </div>
          <div>
            <label htmlFor="contact-source-url" className="mb-2 block text-sm font-bold text-ink">
              Article or tracker URL <span className="font-normal text-inkMuted">(optional)</span>
            </label>
            <input
              id="contact-source-url"
              name="sourceUrl"
              type="url"
              inputMode="url"
              maxLength={1000}
              placeholder="https://dgno.us/..."
              className="w-full rounded-lg border border-stone bg-surface px-3 py-2.5 text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="contact-company">Company</label>
          <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-ink">Message</label>
          <textarea
            id="contact-message"
            name="message"
            rows={7}
            minLength={20}
            maxLength={5000}
            required
            aria-describedby="contact-message-help"
            className="w-full resize-y rounded-lg border border-stone bg-surface px-3 py-2.5 text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <p id="contact-message-help" className="mt-2 text-xs text-inkMuted">20–5,000 characters. Include evidence links where possible.</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-inkMuted">
            DGNO uses this information to review and respond to your message. See the <Link to="/privacy" className="font-semibold text-accent-dark underline underline-offset-2">privacy policy</Link>.
          </p>
          <button
            type="submit"
            disabled={submissionState === 'sending'}
            className="min-h-11 shrink-0 rounded-lg bg-accent-strong px-5 py-2.5 font-bold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {submissionState === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </div>

        <p
          className={`min-h-6 text-sm font-semibold ${submissionState === 'error' ? 'text-red-700' : 'text-green-800'}`}
          role={submissionState === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {submissionMessage}
        </p>
      </form>

      <h2>Other public channels</h2>
      <p>
        DGNO also maintains public accounts as <strong>@dgnonews</strong> on
        <a href="https://www.instagram.com/dgnonews" target="_blank" rel="noopener noreferrer"> Instagram</a> and
        <a href="https://www.tiktok.com/@dgnonews" target="_blank" rel="noopener noreferrer"> TikTok</a>.
      </p>

      <h2>What to include</h2>
      <ul>
        <li><strong>Correction request:</strong> the article or tracker URL, the statement or field at issue, and source material supporting the correction.</li>
        <li><strong>News tip:</strong> what happened, when it happened, how you know, and what documents or witnesses may confirm it.</li>
        <li><strong>Accessibility issue:</strong> the page URL, device or browser, and the control or content you could not use.</li>
        <li><strong>Privacy request:</strong> the relevant account or page and the action requested; do not post passwords or recovery codes.</li>
      </ul>

      <aside className="not-prose mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
        This form and social-media direct messages are not secure drops. Do not send classified material,
        passwords, medical records, or other highly sensitive documents through them.
      </aside>
    </TrustPage>
  );
}

export function EditorialStandardsPage() {
  return (
    <TrustPage
      path="/editorial-standards"
      eyebrow="How we work"
      title="Editorial Standards"
      description="DGNO's working standard is skeptical, constitutional, progressive in concern for rights and accountable government, and honest about what the evidence does not establish."
    >
      <h2>Scrutiny without exemptions</h2>
      <p>
        Claims from public officials, political parties, corporations, advocates, law-enforcement agencies, witnesses, anonymous accounts, and DGNO itself should be tested against evidence. Agreement with a source's politics is not confirmation.
      </p>

      <h2>Three-part reporting discipline</h2>
      <ul>
        <li><strong>What Happened</strong> states the event or decision being reported and attributes consequential claims.</li>
        <li><strong>What Is Confirmed</strong> identifies facts supported by records, direct observation, on-the-record sources, or multiple credible sources.</li>
        <li><strong>What Is Speculated</strong> separates disputed, predictive, unverified, or inferential claims from established facts.</li>
      </ul>

      <h2>Sources, anonymity, and documents</h2>
      <p>
        DGNO prefers primary records and named sources when they are available. Official statements are evidence of what an institution says, not automatic proof that its account is complete. Anonymous sourcing should be used only when the information serves a clear public interest and the source cannot safely be named; readers should receive enough context to assess credibility without identifying the source.
      </p>

      <h2>Constitutional analysis and opinion</h2>
      <p>
        Constitutional text, controlling decisions, legal arguments, and DGNO's analysis should be distinguishable from one another. Opinion and analysis should be labeled and should not be presented as neutral straight-news reporting.
      </p>

      <h2>Use of AI tools</h2>
      <p>
        AI tools may assist with research organization, source comparison, scraping, tracker normalization, or drafting. They do not supply authority or accountability. A human with publishing authority reviews work before publication, and unverifiable model output must not be treated as a source.
      </p>

      <h2>Corrections and updates</h2>
      <p>
        Factual errors should be corrected promptly and materially changed stories should explain the change. New reporting should be labeled as an update rather than silently rewriting the publication record. See the <Link to="/corrections">corrections policy</Link> for how to report a problem.
      </p>
    </TrustPage>
  );
}

export function CorrectionsPage() {
  return (
    <TrustPage
      path="/corrections"
      eyebrow="Accuracy"
      title="Corrections and Updates"
      description="DGNO's working policy distinguishes factual corrections, clarifications, and later developments so readers can understand what changed and why."
    >
      <aside className="not-prose rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
        Current limitation: article pages display a generic record-updated time, but the publishing model does not yet include a dedicated public correction or material-change note. Until that field is added, readers should not interpret an updated time as an explanation of what changed.
      </aside>
      <h2>What DGNO corrects</h2>
      <p>
        Incorrect names, dates, figures, quotations, descriptions, links, captions, legal characterizations, and tracker fields should be corrected. A clarification may be added when accurate wording creates a materially misleading impression. Typos that do not change meaning may be fixed without a formal note.
      </p>

      <h2>Updates are not corrections</h2>
      <p>
        An update adds a later event, document, response, or verified fact. It should not make the original publication time appear newer. The visible “updated” time refers to a record change; it does not by itself mean that every fact was re-verified at that time.
      </p>

      <h2>Request a review</h2>
      <p>
        Use the <Link to="/contact">contact page</Link> and include the exact URL, the disputed sentence or tracker field, your proposed correction, and source material. DGNO evaluates the evidence; a request from a subject, agency, political ally, or critic does not automatically prove or disprove the underlying claim.
      </p>

      <h2>Recordkeeping</h2>
      <p>
        When DGNO's publishing system contains a material correction note or verified evidence record, that information should be displayed with the affected article or tracker. A complete public corrections ledger remains a future product task and is not represented here as already available.
      </p>
    </TrustPage>
  );
}

export function FundingPage() {
  return (
    <TrustPage
      path="/funding"
      eyebrow="Independence"
      title="Funding and Independence"
      description="DGNO is building an audience-supported model intended to protect editorial judgment from donor or advertiser control."
    >
      <h2>How DGNO is supported</h2>
      <p>
        DGNO may seek support through one-time and recurring donations. Donations are intended to help cover hosting, software, reporting, data maintenance, and contributor work. DGNO has not yet published an audited allocation report, and this page will be updated when material funding arrangements change.
      </p>

      <h2>Ownership disclosure</h2>
      <p>
        A verified public disclosure naming DGNO's legal operator has not yet been added. Ownership transparency is therefore incomplete; DGNO should publish the operator and any material outside ownership or controlling interest once that information is verified for public release.
      </p>

      <h2>Editorial firewall</h2>
      <p>
        Financial support does not purchase a favorable story, removal of accurate reporting, access to unpublished editorial work, or control over a tracker. Donors, readers, and critics may request corrections, but evidence and editorial judgment govern the result.
      </p>

      <h2>Sponsorship and conflicts</h2>
      <p>
        Paid or sponsored material must be conspicuously labeled if DGNO introduces it. Writers and editors should disclose a personal or financial relationship that could reasonably affect a story, and should recuse themselves when disclosure alone is not enough.
      </p>

      <h2>Questions</h2>
      <p>
        Questions about ownership, funding, sponsorship, or a potential conflict can be sent through the <Link to="/contact">contact page</Link>.
      </p>
    </TrustPage>
  );
}
