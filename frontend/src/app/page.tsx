import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  Users, 
  GitBranch, 
  Wand2,
  ArrowRight,
  CheckCircle,
  Volume2,
  Image,
  Terminal,
  Download,
  Server,
  Cpu,
  Globe,
  Key,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-surface-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold text-gradient">NarrativeFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition">Features</a>
            <a href="#ai-tools" className="text-text-secondary hover:text-text-primary transition">AI Tools</a>
            <a href="#setup" className="text-text-secondary hover:text-text-primary transition">Setup Guide</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login" className="btn-ghost">Sign In</Link>
            <Link href="/auth/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Local AI • Text • Images • Voice • Export</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Write Your Story with an
            <span className="text-gradient block">AI Co-Author</span>
          </h1>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-10">
            NarrativeFlow is a premium narrative engine for writing novels, screenplays, 
            and episodic fiction. Maintain character consistency, plot continuity, and 
            creative vision across unlimited chapters.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-3 gap-2">
              Start Writing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-accent">∞</div>
              <div className="text-text-secondary">Chapters</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">14</div>
              <div className="text-text-secondary">Art Styles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">🎙️</div>
              <div className="text-text-secondary">Text-to-Speech</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">100%</div>
              <div className="text-text-secondary">Local & Private</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-text-secondary text-center mb-16 max-w-2xl mx-auto">
            A complete creative studio for serious writers, not just another chatbot.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card-hover p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="ai-tools" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Powerful AI Tools</h2>
          <p className="text-text-secondary text-center mb-16 max-w-2xl mx-auto">
            Multi-modal AI capabilities for text, images, and voice - all running locally on your machine.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiTools.map((tool, index) => (
              <div key={index} className={`card p-6 ${tool.borderClass}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${tool.bgClass}`}>
                  <tool.icon className={`w-7 h-7 ${tool.textClass}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                <p className="text-text-secondary text-sm mb-4">{tool.description}</p>
                <ul className="space-y-2">
                  {tool.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <CheckCircle className={`w-3 h-3 ${tool.textClass}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Guide Section */}
      <section id="setup" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
              <Terminal className="w-4 h-4" />
              <span>Get up and running in minutes</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Connect Your AI</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              NarrativeFlow works with local Ollama models (100% private, no API costs) or cloud providers like OpenAI, Anthropic, and Gemini.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Ollama — Local */}
            <div className="card p-8 border-l-4 border-emerald-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Ollama — Local &amp; Free</h3>
                  <p className="text-text-secondary text-sm">Runs on your machine. No API key. No data leaves your computer.</p>
                </div>
              </div>

              <ol className="space-y-4">
                {[
                  {
                    icon: Download,
                    step: '1. Install Ollama',
                    desc: 'Download from ollama.com — available for macOS, Linux, and Windows.',
                    code: null,
                    link: 'https://ollama.com/download',
                    linkLabel: 'ollama.com/download →',
                  },
                  {
                    icon: Terminal,
                    step: '2. Pull a model',
                    desc: 'Open a terminal and pull your preferred model.',
                    code: 'ollama pull llama3.2\n# or for better quality:\nollama pull mistral',
                    link: null,
                    linkLabel: null,
                  },
                  {
                    icon: Server,
                    step: '3. Ollama starts automatically',
                    desc: 'Ollama runs at http://localhost:11434 in the background. NarrativeFlow connects to it automatically.',
                    code: null,
                    link: null,
                    linkLabel: null,
                  },
                  {
                    icon: CheckCircle,
                    step: '4. Select your model in Settings',
                    desc: 'Go to Settings → AI → Ollama Model and type the model name you pulled.',
                    code: null,
                    link: null,
                    linkLabel: null,
                  },
                ].map(({ icon: Icon, step, desc, code, link, linkLabel }, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary text-sm">{step}</p>
                      <p className="text-text-secondary text-xs mt-0.5">{desc}</p>
                      {code && (
                        <pre className="mt-2 bg-surface rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono overflow-x-auto">{code}</pre>
                      )}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">{linkLabel}</a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cloud APIs */}
            <div className="flex flex-col gap-6">
              <div className="card p-8 border-l-4 border-accent">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Cloud APIs</h3>
                    <p className="text-text-secondary text-sm">Use OpenAI, Anthropic, or Gemini. Paste your key in Settings.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'OpenAI', key: 'sk-...', models: 'GPT-4o, GPT-4o mini', url: 'https://platform.openai.com/api-keys', color: 'text-green-400' },
                    { name: 'Anthropic', key: 'sk-ant-...', models: 'Claude 3.5 Sonnet, Claude 3 Haiku', url: 'https://console.anthropic.com/', color: 'text-orange-400' },
                    { name: 'Google Gemini', key: 'AIza...', models: 'Gemini 1.5 Pro, Gemini 1.5 Flash', url: 'https://aistudio.google.com/app/apikey', color: 'text-blue-400' },
                  ].map(({ name, key, models, url, color }) => (
                    <div key={name} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                      <Key className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-semibold text-sm ${color}`}>{name}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-text-secondary hover:text-accent transition flex items-center gap-1">
                            Get key <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">Key prefix: <code className="text-text-primary">{key}</code></p>
                        <p className="text-xs text-text-secondary">{models}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-4 p-3 bg-surface rounded-lg">
                  💡 Just paste your API key in <strong>Settings → AI Provider</strong>. NarrativeFlow auto-detects the provider from the key prefix — no extra configuration needed.
                </p>
              </div>

              {/* Recommended Ollama Models */}
              <div className="card p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Recommended Ollama Models
                </h4>
                <div className="space-y-2">
                  {[
                    { model: 'llama3.2', vram: '~2 GB', quality: 'Good', badge: 'bg-blue-500/20 text-blue-400', note: 'Fast, great for most writing tasks' },
                    { model: 'mistral', vram: '~4 GB', quality: 'Better', badge: 'bg-emerald-500/20 text-emerald-400', note: 'Excellent narrative quality' },
                    { model: 'llama3.1:8b', vram: '~5 GB', quality: 'Better', badge: 'bg-emerald-500/20 text-emerald-400', note: 'Strong instruction following' },
                    { model: 'qwen2.5:14b', vram: '~9 GB', quality: 'Best', badge: 'bg-purple-500/20 text-purple-400', note: 'Best quality for long-form stories' },
                  ].map(({ model, vram, badge, note }) => (
                    <div key={model} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                      <code className="text-sm text-text-primary font-mono flex-1">{model}</code>
                      <span className="text-xs text-text-secondary">{vram}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{note}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-3">Pull with: <code className="text-text-primary">ollama pull &lt;model&gt;</code></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-background-secondary">

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Write Your Masterpiece?</h2>
          <p className="text-text-secondary text-xl mb-10">
            Join thousands of writers using NarrativeFlow to bring their stories to life.
          </p>
          <Link href="/auth/register" className="btn-primary text-lg px-10 py-4 gap-2">
            Start Writing for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-surface-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="font-bold">NarrativeFlow</span>
          </div>
          <p className="text-text-tertiary text-sm">
            © 2026 NarrativeFlow. Crafted for storytellers.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: BookOpen,
    title: 'Unlimited Chapters',
    description: 'Create sprawling novels with as many chapters as your story needs. Full chapter management and navigation.',
  },
  {
    icon: Brain,
    title: 'RAG Long-Term Memory',
    description: 'Story context is retrieved from chapters, characters, and the Narrative Codex to keep outputs consistent.',
  },
  {
    icon: Users,
    title: 'Character + Plot Tools',
    description: 'Deep character profiles, plotlines, and Narrative Codex rules stay connected to every chapter.',
  },
  {
    icon: GitBranch,
    title: 'Branching Paths',
    description: 'Generate alternate directions and compare previews before you commit to the next scene.',
  },
  {
    icon: Wand2,
    title: 'Narrative Codex',
    description: 'Define world rules, lore, and constraints that the AI must follow across the entire project.',
  },
  {
    icon: Sparkles,
    title: 'Consistency Engine',
    description: 'AI analyzes your writing for character drift, timeline issues, and world rule violations.',
  },
  {
    icon: BookOpen,
    title: 'Preview + BookReader',
    description: 'Read clean previews, paginate with BookReader, and print with image-safe rendering.',
  },
  {
    icon: Wand2,
    title: 'Export Studio',
    description: 'Export DOCX, EPUB, PDF, Markdown, Text, JSON, and outline formats with cleaned HTML.',
  },
  {
    icon: Image,
    title: 'Image Gallery',
    description: 'Generate, tag, and organize art assets tied to stories, scenes, and characters.',
  },
];

const aiTools = [
  {
    icon: GitBranch,
    title: 'Story Branching',
    description: 'Explore multiple story directions and choose the path that fits your vision.',
    borderClass: 'border-l-4 border-purple-500',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    features: [
      '2-5 alternative paths',
      'Customizable preview length',
      'Compare and select',
    ],
  },
  {
    icon: Sparkles,
    title: 'Rewrite + Summarize',
    description: 'Refine passages, tighten prose, and generate concise summaries and recaps.',
    borderClass: 'border-l-4 border-cyan-500',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-500',
    features: [
      'Selected text rewrites',
      'Recap and summary tools',
      'Structured outputs',
    ],
  },
  {
    icon: Users,
    title: 'Dialogue Assist',
    description: 'Generate character dialogue with voice and personality grounded in profiles.',
    borderClass: 'border-l-4 border-emerald-500',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-500',
    features: [
      'Voice consistency',
      'Scene context aware',
      'Character-driven output',
    ],
  },
  {
    icon: Brain,
    title: 'Brainstorming',
    description: 'Generate fresh ideas, twists, and scene beats when you need momentum.',
    borderClass: 'border-l-4 border-indigo-500',
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-500',
    features: [
      'Multiple directions',
      'Tone-aware ideas',
      'Fast iteration',
    ],
  },
  {
    icon: Sparkles,
    title: 'Grammar + Style',
    description: 'Scan for grammar, style issues, and strengths with structured feedback.',
    borderClass: 'border-l-4 border-sky-500',
    bgClass: 'bg-sky-500/10',
    textClass: 'text-sky-500',
    features: [
      'Severity levels',
      'Actionable suggestions',
      'Strength highlights',
    ],
  },
  {
    icon: Image,
    title: 'Story to Image',
    description: 'Transform passages into art with style presets and local generation.',
    borderClass: 'border-l-4 border-pink-500',
    bgClass: 'bg-pink-500/10',
    textClass: 'text-pink-500',
    features: [
      '14 unique art styles',
      'Style presets',
      'Gallery integration',
    ],
  },
  {
    icon: Image,
    title: 'Image to Story',
    description: 'Upload an image and generate narrative beats inspired by the scene.',
    borderClass: 'border-l-4 border-rose-500',
    bgClass: 'bg-rose-500/10',
    textClass: 'text-rose-500',
    features: [
      'Visual prompts',
      'Scene descriptions',
      'Character inspiration',
    ],
  },
  {
    icon: Volume2,
    title: 'Read Aloud',
    description: 'Listen to your story with natural text-to-speech voices.',
    borderClass: 'border-l-4 border-amber-500',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    features: [
      'Multiple voice options',
      'Kokoro-82M TTS',
      'Catch errors by ear',
    ],
  },
];
