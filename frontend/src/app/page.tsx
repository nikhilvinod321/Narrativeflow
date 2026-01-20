import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  Users, 
  GitBranch, 
  Wand2,
  ArrowRight,
  CheckCircle
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
            <a href="#modes" className="text-text-secondary hover:text-text-primary transition">Writing Modes</a>
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
            <span>Powered by Google Gemini AI</span>
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
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-accent">∞</div>
              <div className="text-text-secondary">Chapters</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">3</div>
              <div className="text-text-secondary">Writing Modes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">100%</div>
              <div className="text-text-secondary">Memory Retention</div>
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

      {/* Writing Modes Section */}
      <section id="modes" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Three Ways to Write</h2>
          <p className="text-text-secondary text-center mb-16 max-w-2xl mx-auto">
            Choose your creative collaboration style. Switch modes at any time.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {writingModes.map((mode, index) => (
              <div key={index} className={`card p-8 ${mode.borderClass}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${mode.bgClass}`}>
                  <mode.icon className={`w-8 h-8 ${mode.textClass}`} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{mode.title}</h3>
                <p className="text-text-secondary mb-6">{mode.description}</p>
                <ul className="space-y-2">
                  {mode.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className={`w-4 h-4 ${mode.textClass}`} />
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
    title: 'Long-Term Memory',
    description: 'AI remembers everything. Character details, plot points, and world rules persist across your entire story.',
  },
  {
    icon: Users,
    title: 'Character Management',
    description: 'Deep character profiles with personalities, backstories, and voice patterns. AI writes them consistently.',
  },
  {
    icon: GitBranch,
    title: 'Plot Tracking',
    description: 'Track multiple plotlines, subplots, and story arcs. Never lose track of your narrative threads.',
  },
  {
    icon: Wand2,
    title: 'Story Bible',
    description: 'Define your world rules, magic systems, and lore. AI enforces consistency automatically.',
  },
  {
    icon: Sparkles,
    title: 'Consistency Engine',
    description: 'AI analyzes your writing for character drift, timeline issues, and world rule violations.',
  },
];

const writingModes = [
  {
    icon: Sparkles,
    title: 'AI-Lead Mode',
    description: 'Let the AI take creative control. Provide high-level direction and watch your story unfold.',
    borderClass: 'border-l-4 border-mode-aiLead',
    bgClass: 'bg-mode-aiLead/10',
    textClass: 'text-mode-aiLead',
    features: [
      'Autonomous story generation',
      'Creative surprises',
      'Rate and regenerate options',
      'Branch alternative paths',
    ],
  },
  {
    icon: Users,
    title: 'User-Lead Mode',
    description: 'You write, AI assists. Get editing help, suggestions, and rewrites without losing control.',
    borderClass: 'border-l-4 border-mode-userLead',
    bgClass: 'bg-mode-userLead/10',
    textClass: 'text-mode-userLead',
    features: [
      'Full creative control',
      'AI editing assistance',
      'Rewrite suggestions',
      'Grammar and style help',
    ],
  },
  {
    icon: Brain,
    title: 'Co-Author Mode',
    description: 'True collaboration. Take turns writing with AI, blending your vision with AI creativity.',
    borderClass: 'border-l-4 border-mode-coAuthor',
    bgClass: 'bg-mode-coAuthor/10',
    textClass: 'text-mode-coAuthor',
    features: [
      'Turn-based writing',
      'Multiple continuations',
      'Creative suggestions',
      'Balanced collaboration',
    ],
  },
];
