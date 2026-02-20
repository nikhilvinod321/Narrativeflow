import Link from 'next/link';
import { BookOpen, ArrowLeft, Scale, Github } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-surface-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold text-gradient">NarrativeFlow</span>
          </Link>
          <Link
            href="/auth/register"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign Up
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm mb-6">
            <Scale className="w-4 h-4" />
            <span>Legally binding (we checked)</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-text-secondary">
            Effective date: The day NarrativeFlow first compiled without errors · Last updated: Whenever we last felt like it
          </p>
        </div>

        <div className="prose-custom space-y-10 text-text-secondary">

          {/* Preamble */}
          <section>
            <p className="text-lg text-text-primary leading-relaxed">
              Welcome to NarrativeFlow. These Terms of Service govern your use of our software. 
              By clicking "Create Account," you acknowledge that you have read these Terms, or at the very least
              scrolled past them at a reasonable speed that creates plausible deniability.
            </p>
            <p className="mt-4">
              Please read these Terms carefully. Or skim them. We're an open-source project run by people 
              who also have to cook dinner, so we're not going to pretend this document carries the weight of international 
              maritime law.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. What NarrativeFlow Actually Is</h2>
            <p>
              NarrativeFlow is a free, open-source AI-powered story writing platform. We didn't charge you to download it. 
              We're not selling your data. We're not a subscription trap. We're writers who wanted a better tool and decided 
              to share it with the world, because that's what decent people do.
            </p>
            <p className="mt-3">
              The source code is publicly available on GitHub. You can read it, fork it, audit it, 
              and verify with your own eyes that it does exactly what it says it does. 
              This is, we humbly suggest, more transparency than most software you paid good money for.
            </p>
            <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-lg flex items-start gap-3">
              <Github className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong className="text-text-primary">Open Source:</strong> NarrativeFlow is released under the MIT License. 
                You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies 
                of the software. The only thing we ask is that you keep the copyright notice intact, 
                which takes approximately four seconds per copy.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Your Account</h2>
            <p>
              To use NarrativeFlow, you create a local account stored entirely on <em>your</em> machine. 
              We do not have a central server holding your login credentials. We do not know your password. 
              We cannot reset your password. We are, in the most empowering possible way, completely unable to help you 
              if you forget it. Write it down somewhere.
            </p>
            <p className="mt-3">
              You are responsible for:
            </p>
            <ul className="mt-2 space-y-2 list-none">
              {[
                'Keeping your account credentials secure (please, a sticky note on the monitor is not "secure")',
                'All activity that occurs under your account',
                'Not sharing your account with your entire writing group, unless you want to',
                'Backing up your stories, because we are not responsible for your laptop meeting your coffee',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent mt-1">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Your Content</h2>
            <p>
              Everything you write in NarrativeFlow belongs to you. Completely. Entirely. 
              No asterisks, no sub-clauses, no "we reserve the right to use your creative work for training purposes."
            </p>
            <p className="mt-3">
              Your stories live in a local database on your machine. When you export them, they're yours. 
              When you delete them, they're gone. We do not have copies. We are not reading your space opera 
              about sentient staplers. (Though if you want to share it, we'd honestly love to.)
            </p>
            <p className="mt-3">
              You agree not to use NarrativeFlow to generate content that is illegal in your jurisdiction. 
              We mention this not because we can enforce it — we literally cannot see your stories — but because 
              it's the right thing to say, and we're optimistic about humanity.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. AI-Generated Content</h2>
            <p>
              NarrativeFlow uses AI language models — either locally via Ollama or through third-party APIs 
              such as OpenAI, Anthropic, or Google Gemini — to assist in generating text. 
              A few important notes:
            </p>
            <ul className="mt-3 space-y-3 list-none">
              {[
                { title: 'AI makes stuff up.', body: "That\u2019s actually the point, but be aware that AI-generated content may occasionally be inaccurate, absurd, internally contradictory, or unexpectedly philosophical. This is a feature in a fiction tool." },
                { title: 'You own the output.', body: 'Content you generate with NarrativeFlow \u2014 whether AI-assisted or not \u2014 is yours. Copyright law around AI is evolving rapidly and jurisdiction-dependent; consult a lawyer if this is commercially significant to you, because we are writers, not attorneys.' },
                { title: 'Third-party API terms apply.', body: "If you choose to use OpenAI, Anthropic, or Gemini, your prompts are subject to their respective terms of service. NarrativeFlow sends your story text to those services when you use them. If you\u2019d prefer zero data leaves your machine, just use Ollama." },
              ].map(({ title, body }, i) => (
                <li key={i} className="p-4 bg-surface rounded-lg">
                  <strong className="text-text-primary">{title}</strong>{' '}
                  <span>{body}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Limitation of Liability</h2>
            <p>
              NarrativeFlow is provided "as is," without warranty of any kind, express or implied. 
              This is standard legal language that means: we wrote this software with care and good intentions, 
              but software is complicated and things sometimes go wrong.
            </p>
            <p className="mt-3">
              In no event shall the NarrativeFlow contributors be liable for:
            </p>
            <ul className="mt-2 space-y-2 list-none">
              {[
                'Loss of data resulting from hardware failure, accidental deletion, or a power cut at a critical moment',
                'Lost productivity caused by spending three hours tweaking your Narrative Codex settings instead of writing',
                'Existential crises triggered by an AI generating a better plot twist than you thought of',
                'Your novel not getting published (we believe in you, but we have no influence over literary agents)',
                'Any indirect, incidental, special, or consequential damages of any kind',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent mt-1">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Modifications</h2>
            <p>
              We may update these Terms from time to time. Since this is an open-source project, 
              changes to the Terms will be visible in the public repository's commit history. 
              We'll try to flag significant changes in the changelog. 
              Continued use of NarrativeFlow after changes constitutes acceptance — but honestly, 
              if we ever add something genuinely harmful, the community will fork the repo before we finish our coffee.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of wherever you are, subject to whatever jurisdiction applies to 
              you specifically. We are an open-source project without a registered legal entity, a venture capital backer, 
              or a legal department. We're just here to help you write better stories.
            </p>
            <p className="mt-3">
              If you have a dispute with us, please open a GitHub issue first. It's faster, cheaper, and 
              significantly more likely to result in an actual fix than litigation.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Contact</h2>
            <p>
              Questions, concerns, compliments, or fan mail about your favourite open-source writing tool? 
              Open an issue or discussion on our GitHub repository. We read everything, even if we occasionally 
              respond with the enthusiasm of someone who is also trying to finish a chapter.
            </p>
          </section>

          {/* Closing */}
          <section className="pt-6 border-t border-surface-border">
            <p className="text-center text-text-secondary italic">
              Thank you for using NarrativeFlow. Now go write something wonderful.
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-border">
          <Link href="/privacy" className="text-accent hover:underline text-sm">Read our Privacy Policy →</Link>
          <Link href="/auth/register" className="btn-primary text-sm px-6 py-2">
            Back to Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
