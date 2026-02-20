import Link from 'next/link';
import { BookOpen, ArrowLeft, ShieldCheck, Github } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Short version: we collect nothing, because we have nowhere to put it</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-text-secondary">
            Effective date: Always · Last updated: Whenever something changed (not much has)
          </p>
        </div>

        <div className="prose-custom space-y-10 text-text-secondary">

          {/* The One-Sentence Version */}
          <section className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <h2 className="text-xl font-bold text-text-primary mb-3">🏆 The One-Sentence Version</h2>
            <p className="text-text-primary text-lg leading-relaxed">
              NarrativeFlow does not collect, store, transmit, sell, rent, lend, gift-wrap, or otherwise touch 
              your personal data — because everything runs on your own machine and we have no server to send it to.
            </p>
            <p className="mt-3 text-sm">
              If that's all you needed, welcome aboard. The rest of this document is for the thorough among us, 
              and for legal completeness.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Who We Are</h2>
            <p>
              NarrativeFlow is a free, open-source writing platform. There is no company behind it in the traditional 
              sense — no venture-backed startup, no advertising revenue model, no dark-pattern subscription to cancel. 
              It's software built by writers, for writers, and released to the public because knowledge should be free 
              and good tools should be accessible.
            </p>
            <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-lg flex items-start gap-3">
              <Github className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong className="text-text-primary">Fully transparent:</strong> Every line of NarrativeFlow's code is 
                publicly auditable on GitHub. If you're ever curious about what the software does with your data, 
                you can read the source code. This is, to be clear, a superpower that most closed-source apps don't give you.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. What Data We Collect</h2>
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-4">
              <p className="text-emerald-400 font-semibold text-lg">None. Zero. Zilch. The empty set. ∅</p>
              <p className="mt-2 text-sm">
                NarrativeFlow has no telemetry, no analytics, no error reporting that phones home, 
                no "help us improve the product" opt-in that's actually an opt-out. We are not watching. 
                We are not listening. We genuinely have no idea how many people use this software, 
                and we consider that an acceptable trade-off for your privacy.
              </p>
            </div>
            <p>
              Specifically, we do not collect:
            </p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Your name, email address, or any account information',
                'Your stories, chapters, characters, or any creative work',
                'Your usage patterns, feature preferences, or session data',
                'Your IP address, device fingerprint, or browser information',
                'Crash reports, error logs, or any diagnostic data',
                "Cookies (we don't have a server to set them on)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Where Your Data Actually Lives</h2>
            <p>
              NarrativeFlow stores all its data in a local database on your computer. 
              Your account, your stories, your characters, your entire narrative universe — all of it is on your machine, 
              in a folder you could find if you wanted to, in a format you could read if you were so inclined.
            </p>
            <p className="mt-3">
              When you uninstall NarrativeFlow, your data doesn't go anywhere. It stays on your drive until you delete it. 
              When you export a story, the exported file is yours. There is no cloud backup, no sync service, 
              no "your files are safely stored in our servers" — there are no our servers.
            </p>
            <div className="mt-4 p-4 bg-surface rounded-lg">
              <p className="text-sm font-semibold text-text-primary mb-2">Data stored locally on your machine:</p>
              <ul className="space-y-1 text-sm">
                {[
                  'SQLite database — your stories, chapters, characters, plotlines',
                  'ChromaDB vector store — semantic story memory (for RAG)',
                  'TTS audio files — generated speech, in /static/tts_audio/',
                  'Generated images — AI art, in /static/generated_images/',
                  'Your configuration — API keys, settings, preferences',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary">
                    <span className="text-accent mt-0.5">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Third-Party AI Services (The Important Bit)</h2>
            <p>
              This is the one section where data <em>does</em> leave your machine — but only if you choose it, 
              and only to the service you choose.
            </p>
            <p className="mt-3">
              NarrativeFlow supports three ways to power its AI features:
            </p>
            <div className="mt-4 space-y-4">
              {[
                {
                  title: '🟢 Ollama (Local) — Maximum Privacy',
                  body: 'The AI model runs entirely on your machine via Ollama. Nothing leaves your computer. Your prompts, your story text, your characters — all processed locally. This is the option for writers who handle sensitive material, write in private genres, or simply believe their creative work is none of anyone else\'s business.',
                  borderColor: 'border-emerald-500/30',
                  bgColor: 'bg-emerald-500/5',
                },
                {
                  title: '🟡 OpenAI / Anthropic / Gemini — API Mode',
                  body: 'When you provide an API key for a cloud provider, NarrativeFlow sends your story text and prompts to that provider\'s servers to generate responses. This means your content is subject to that provider\'s privacy policy and data handling practices. We have no control over what OpenAI, Anthropic, or Google do with that data. Please review their policies before using API mode if this is a concern for you.',
                  borderColor: 'border-amber-500/30',
                  bgColor: 'bg-amber-500/5',
                },
              ].map(({ title, body, borderColor, bgColor }, i) => (
                <div key={i} className={`p-4 ${bgColor} border ${borderColor} rounded-lg`}>
                  <p className="font-semibold text-text-primary mb-2">{title}</p>
                  <p className="text-sm">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              NarrativeFlow does not store, log, or have any visibility into the prompts or responses exchanged 
              with third-party AI providers. From our code's perspective, we send text out and text comes back. 
              The API key you provide is stored locally in your configuration and never transmitted to us.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. API Keys</h2>
            <p>
              If you configure an API key for OpenAI, Anthropic, or Gemini, that key is stored in your local 
              configuration file on your machine. NarrativeFlow uses it solely to authenticate requests to the 
              respective AI provider on your behalf.
            </p>
            <p className="mt-3">
              We do not have access to your API keys. We cannot see them, log them, or transmit them anywhere. 
              They exist only on your machine, used only by your running instance of NarrativeFlow. 
              Treat them as you would any credential — don't share them, and don't commit them to a public repository 
              if you fork the code.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Children's Privacy</h2>
            <p>
              NarrativeFlow is a creative writing tool suitable for all ages (the content you generate is up to you 
              and your own content standards). We do not knowingly collect data from children because we do not 
              knowingly collect data from anyone. Our position on the privacy of minors is: same as adults, 
              which is to say, comprehensive and absolute.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Changes to This Policy</h2>
            <p>
              If we update this Privacy Policy, changes will appear in the public GitHub repository. 
              Since our privacy stance is essentially "we collect nothing," material changes in the direction of 
              "actually we do collect some things now" would represent a significant philosophical shift 
              that we would want to announce loudly and clearly — and which the open-source community 
              would notice immediately, because that's how open source works.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Your Rights</h2>
            <p>
              Under various privacy regulations (GDPR, CCPA, and the general principle of human dignity), 
              you have the right to access, correct, and delete your data. Since all your data is stored locally 
              on your own machine, you already have all of these rights in their most complete possible form. 
              You have root access to your own database. You are the administrator. The power was inside you all along.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">9. Contact</h2>
            <p>
              Privacy questions, concerns, or feedback? Open an issue on our GitHub repository. 
              It's the fastest way to reach us, and it creates a public record we can't quietly ignore.
            </p>
          </section>

          {/* Closing */}
          <section className="pt-6 border-t border-surface-border">
            <p className="text-center text-text-secondary italic">
              Your stories are yours. Your data is yours. Your privacy is not a product. Happy writing.
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-border">
          <Link href="/terms" className="text-accent hover:underline text-sm">Read our Terms of Service →</Link>
          <Link href="/auth/register" className="btn-primary text-sm px-6 py-2">
            Back to Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
