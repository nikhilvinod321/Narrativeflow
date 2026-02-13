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
  Image
} from 'lucide-react';

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
            <a href="#tech" className="text-text-secondary hover:text-text-primary transition">Technology</a>
          </nav>
          <div className="flex items-center gap-4">
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
            <Link href="/dashboard" className="btn-secondary text-lg px-8 py-3">
              View Demo
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
