import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MousePointerClick,
  GitBranch,
  CheckCircle2,
  ClipboardList,
  Bell,
  Users,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { routes } from '../utils/routes';

function SvgAnnotations() {
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full">
      {/* Image placeholder */}
      <rect x="16" y="8" width="248" height="80" rx="8" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.08" />
      {/* Landscape shapes inside */}
      <rect x="28" y="20" width="60" height="40" rx="4" fill="white" fillOpacity="0.05" />
      <rect x="96" y="20" width="80" height="56" rx="4" fill="white" fillOpacity="0.05" />
      <rect x="184" y="20" width="68" height="30" rx="4" fill="white" fillOpacity="0.05" />
      {/* Annotation pins */}
      <circle cx="58" cy="38" r="10" fill="#8B5CF6" fillOpacity="0.3" />
      <circle cx="58" cy="38" r="5" fill="#8B5CF6" />
      <text x="56" y="41" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">1</text>
      <circle cx="136" cy="48" r="10" fill="#8B5CF6" fillOpacity="0.3" />
      <circle cx="136" cy="48" r="5" fill="#8B5CF6" />
      <text x="134" y="51" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">2</text>
      <circle cx="218" cy="32" r="10" fill="#8B5CF6" fillOpacity="0.3" />
      <circle cx="218" cy="32" r="5" fill="#8B5CF6" />
      <text x="216" y="35" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">3</text>
      {/* Comment bubble */}
      <rect x="148" y="82" width="108" height="30" rx="6" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.1" />
      <circle cx="162" cy="97" r="6" fill="#8B5CF6" fillOpacity="0.4" />
      <rect x="174" y="92" width="50" height="4" rx="2" fill="white" fillOpacity="0.15" />
      <rect x="174" y="100" width="32" height="3" rx="1.5" fill="white" fillOpacity="0.08" />
    </svg>
  );
}

function SvgVersions() {
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full">
      {/* V1 panel */}
      <rect x="16" y="12" width="116" height="96" rx="8" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.08" />
      <rect x="28" y="24" width="32" height="6" rx="3" fill="white" fillOpacity="0.12" />
      <text x="68" y="30" fill="white" fillOpacity="0.3" fontSize="8">v1</text>
      <rect x="28" y="38" width="92" height="50" rx="4" fill="white" fillOpacity="0.04" />
      <rect x="36" y="46" width="40" height="4" rx="2" fill="white" fillOpacity="0.1" />
      <rect x="36" y="54" width="60" height="4" rx="2" fill="white" fillOpacity="0.07" />
      <rect x="36" y="62" width="50" height="4" rx="2" fill="white" fillOpacity="0.07" />
      <rect x="36" y="74" width="30" height="8" rx="4" fill="#EF4444" fillOpacity="0.2" />
      <text x="41" y="80" fill="#F87171" fontSize="6">Rejected</text>
      {/* Arrow */}
      <path d="M140 60 L148 60" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M146 56 L152 60 L146 64" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />
      {/* V2 panel */}
      <rect x="156" y="12" width="116" height="96" rx="8" fill="white" fillOpacity="0.03" stroke="#22D3EE" strokeOpacity="0.2" />
      <rect x="168" y="24" width="32" height="6" rx="3" fill="#22D3EE" fillOpacity="0.2" />
      <text x="208" y="30" fill="#22D3EE" fillOpacity="0.6" fontSize="8">v2</text>
      <rect x="168" y="38" width="92" height="50" rx="4" fill="white" fillOpacity="0.04" />
      <rect x="176" y="46" width="40" height="4" rx="2" fill="white" fillOpacity="0.1" />
      <rect x="176" y="54" width="70" height="4" rx="2" fill="#22D3EE" fillOpacity="0.15" />
      <rect x="176" y="62" width="55" height="4" rx="2" fill="#22D3EE" fillOpacity="0.15" />
      <rect x="176" y="74" width="30" height="8" rx="4" fill="#22D3EE" fillOpacity="0.2" />
      <text x="181" y="80" fill="#22D3EE" fontSize="6">Current</text>
    </svg>
  );
}

function SvgApprovals() {
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full">
      {/* Pipeline steps */}
      {/* Step 1 - Done */}
      <rect x="16" y="30" width="72" height="60" rx="8" fill="white" fillOpacity="0.03" stroke="#34D399" strokeOpacity="0.3" />
      <circle cx="52" cy="52" r="10" fill="#34D399" fillOpacity="0.15" />
      <path d="M47 52 L50 55 L57 48" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="52" y="76" fill="white" fillOpacity="0.4" fontSize="7" textAnchor="middle">Upload</text>
      {/* Connector */}
      <line x1="88" y1="60" x2="100" y2="60" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" />
      {/* Step 2 - Done */}
      <rect x="100" y="30" width="72" height="60" rx="8" fill="white" fillOpacity="0.03" stroke="#34D399" strokeOpacity="0.3" />
      <circle cx="136" cy="52" r="10" fill="#34D399" fillOpacity="0.15" />
      <path d="M131 52 L134 55 L141 48" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="136" y="76" fill="white" fillOpacity="0.4" fontSize="7" textAnchor="middle">Review</text>
      {/* Connector */}
      <line x1="172" y1="60" x2="184" y2="60" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" />
      {/* Step 3 - Active */}
      <rect x="184" y="30" width="80" height="60" rx="8" fill="white" fillOpacity="0.03" stroke="#FBBF24" strokeOpacity="0.3" />
      <circle cx="224" cy="52" r="10" fill="#FBBF24" fillOpacity="0.15" />
      <circle cx="224" cy="52" r="3" fill="#FBBF24" fillOpacity="0.6" />
      <text x="224" y="76" fill="#FBBF24" fillOpacity="0.7" fontSize="7" textAnchor="middle" fontWeight="600">Approve</text>
    </svg>
  );
}

function SvgRequests() {
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full">
      {/* Request card */}
      <rect x="24" y="8" width="232" height="104" rx="8" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.08" />
      {/* Title bar */}
      <rect x="36" y="20" width="80" height="6" rx="3" fill="white" fillOpacity="0.15" />
      <rect x="200" y="18" width="44" height="10" rx="5" fill="#F59E0B" fillOpacity="0.15" />
      <text x="222" y="26" fill="#FBBF24" fontSize="6" textAnchor="middle">Urgent</text>
      {/* Fields */}
      <rect x="36" y="38" width="28" height="4" rx="2" fill="white" fillOpacity="0.08" />
      <rect x="70" y="38" width="90" height="4" rx="2" fill="white" fillOpacity="0.05" />
      <rect x="36" y="50" width="28" height="4" rx="2" fill="white" fillOpacity="0.08" />
      <rect x="70" y="50" width="60" height="4" rx="2" fill="white" fillOpacity="0.05" />
      {/* Deadline */}
      <rect x="36" y="62" width="28" height="4" rx="2" fill="white" fillOpacity="0.08" />
      <rect x="70" y="60" width="50" height="8" rx="4" fill="#EF4444" fillOpacity="0.1" />
      <text x="78" y="66" fill="#F87171" fontSize="6">Feb 28, 2026</text>
      {/* Assignee row */}
      <line x1="36" y1="78" x2="244" y2="78" stroke="white" strokeOpacity="0.05" />
      <circle cx="48" cy="92" r="8" fill="#8B5CF6" fillOpacity="0.3" />
      <text x="48" y="95" fill="white" fillOpacity="0.5" fontSize="7" textAnchor="middle">A</text>
      <rect x="62" y="88" width="50" height="4" rx="2" fill="white" fillOpacity="0.1" />
      <rect x="62" y="96" width="34" height="3" rx="1.5" fill="white" fillOpacity="0.06" />
      <rect x="186" y="86" width="52" height="14" rx="7" fill="#F97316" fillOpacity="0.15" stroke="#F97316" strokeOpacity="0.2" />
      <text x="212" y="96" fill="#FB923C" fontSize="7" textAnchor="middle">In Progress</text>
    </svg>
  );
}

function SvgNotifications() {
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full">
      {/* Toast 1 */}
      <rect x="40" y="8" width="200" height="32" rx="8" fill="white" fillOpacity="0.05" stroke="#EC4899" strokeOpacity="0.2" />
      <circle cx="60" cy="24" r="8" fill="#EC4899" fillOpacity="0.2" />
      <circle cx="60" cy="24" r="3" fill="#EC4899" />
      <rect x="74" y="19" width="80" height="4" rx="2" fill="white" fillOpacity="0.15" />
      <rect x="74" y="27" width="50" height="3" rx="1.5" fill="white" fillOpacity="0.07" />
      <text x="220" y="27" fill="white" fillOpacity="0.2" fontSize="7">2m ago</text>
      {/* Toast 2 */}
      <rect x="40" y="48" width="200" height="32" rx="8" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.06" />
      <circle cx="60" cy="64" r="8" fill="#8B5CF6" fillOpacity="0.2" />
      <circle cx="60" cy="64" r="3" fill="#8B5CF6" />
      <rect x="74" y="59" width="100" height="4" rx="2" fill="white" fillOpacity="0.12" />
      <rect x="74" y="67" width="60" height="3" rx="1.5" fill="white" fillOpacity="0.07" />
      <text x="220" y="67" fill="white" fillOpacity="0.2" fontSize="7">15m ago</text>
      {/* Toast 3 */}
      <rect x="40" y="88" width="200" height="28" rx="8" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.04" />
      <circle cx="60" cy="102" r="8" fill="#34D399" fillOpacity="0.15" />
      <circle cx="60" cy="102" r="3" fill="#34D399" />
      <rect x="74" y="98" width="70" height="4" rx="2" fill="white" fillOpacity="0.08" />
      <rect x="74" y="105" width="40" height="3" rx="1.5" fill="white" fillOpacity="0.05" />
      <text x="220" y="105" fill="white" fillOpacity="0.15" fontSize="7">1h ago</text>
    </svg>
  );
}

function SvgTeam() {
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full">
      {/* Avatar group */}
      <circle cx="100" cy="36" r="14" fill="#8B5CF6" fillOpacity="0.3" stroke="rgb(3 7 18)" strokeWidth="2" />
      <text x="100" y="40" fill="white" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontWeight="600">S</text>
      <circle cx="124" cy="36" r="14" fill="#3B82F6" fillOpacity="0.3" stroke="rgb(3 7 18)" strokeWidth="2" />
      <text x="124" y="40" fill="white" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontWeight="600">M</text>
      <circle cx="148" cy="36" r="14" fill="#EC4899" fillOpacity="0.3" stroke="rgb(3 7 18)" strokeWidth="2" />
      <text x="148" y="40" fill="white" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontWeight="600">J</text>
      <circle cx="172" cy="36" r="14" fill="white" fillOpacity="0.06" stroke="rgb(3 7 18)" strokeWidth="2" />
      <text x="172" y="40" fill="white" fillOpacity="0.3" fontSize="9" textAnchor="middle">+4</text>
      {/* Project cards below */}
      <rect x="36" y="64" width="92" height="44" rx="6" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.08" />
      <rect x="48" y="74" width="44" height="5" rx="2.5" fill="white" fillOpacity="0.12" />
      <rect x="48" y="84" width="68" height="4" rx="2" fill="white" fillOpacity="0.06" />
      <rect x="48" y="94" width="24" height="6" rx="3" fill="#8B5CF6" fillOpacity="0.2" />
      <rect x="152" y="64" width="92" height="44" rx="6" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.08" />
      <rect x="164" y="74" width="52" height="5" rx="2.5" fill="white" fillOpacity="0.12" />
      <rect x="164" y="84" width="60" height="4" rx="2" fill="white" fillOpacity="0.06" />
      <rect x="164" y="94" width="28" height="6" rx="3" fill="#34D399" fillOpacity="0.2" />
    </svg>
  );
}

const features = [
  {
    icon: MousePointerClick,
    title: 'Visual Annotations',
    description:
      'Click anywhere on images, videos, or PDFs to leave pinpoint feedback. No more "the thing on the left."',
    gradient: 'from-violet-500 to-purple-600',
    illustration: SvgAnnotations,
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description:
      'Every revision tracked. Compare versions side-by-side. Never lose work.',
    gradient: 'from-blue-500 to-cyan-500',
    illustration: SvgVersions,
  },
  {
    icon: CheckCircle2,
    title: 'Approval Workflows',
    description:
      'One-click approvals and revision requests. Know exactly where every asset stands.',
    gradient: 'from-emerald-500 to-teal-500',
    illustration: SvgApprovals,
  },
  {
    icon: ClipboardList,
    title: 'Creative Requests',
    description:
      'Briefs with deadlines, specs, and priorities. From request to delivery, all in one place.',
    gradient: 'from-orange-500 to-amber-500',
    illustration: SvgRequests,
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description:
      'Discord integration, push notifications, and in-app alerts. Nothing slips through.',
    gradient: 'from-pink-500 to-rose-500',
    illustration: SvgNotifications,
  },
  {
    icon: Users,
    title: 'Team Workspaces',
    description:
      'Invite your team, manage projects, and keep everyone in the loop.',
    gradient: 'from-indigo-500 to-violet-500',
    illustration: SvgTeam,
  },
];

const faqs = [
  {
    q: 'What file types are supported?',
    a: 'Images (PNG, JPG, WebP, GIF), Videos (MP4, MOV, WebM), PDFs, and rich-text documents. Annotate directly on any of them.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Sign up and get full access to all features for 14 days. No credit card required. Cancel anytime.',
  },
  {
    q: 'Can I invite external reviewers or clients?',
    a: 'Yes! Invite external reviewers with limited access so they can leave feedback without seeing your full workspace.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All data is encrypted in transit and at rest. We follow industry-standard security practices.',
  },
];

function useInView(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return { ref, isVisible };
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroInView = useInView();
  const ctaInView = useInView();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src="/logo-dark.svg" alt="Briefloop" className="h-8 w-auto" />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollTo('features')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollTo('faq')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                FAQ
              </button>
              <Link
                to={routes.login()}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to={routes.signup()}
                className="relative inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-400 rounded-full transition-all hover:shadow-lg hover:shadow-primary-500/25"
              >
                <Sparkles size={14} />
                Start Free Trial
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-6 pt-2 space-y-1 border-t border-white/5">
              <button
                onClick={() => scrollTo('features')}
                className="block w-full text-left px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="block w-full text-left px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollTo('faq')}
                className="block w-full text-left px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                FAQ
              </button>
              <Link
                to={routes.login()}
                className="block px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <div className="pt-2 px-3">
                <Link
                  to={routes.signup()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-400 rounded-full transition-colors"
                >
                  <Sparkles size={14} />
                  Start Free Trial
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-accent-400/10 rounded-full blur-[100px]" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
        </div>

        <div
          ref={heroInView.ref}
          className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ${
            heroInView.isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Now in public beta
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="block">Creative feedback,</span>
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
              full circle.
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop chasing feedback across Slack, email, and Drive. Briefloop brings your creative
            review process into one playful, powerful workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={routes.signup()}
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-white bg-primary-500 hover:bg-primary-400 rounded-full transition-all hover:shadow-xl hover:shadow-primary-500/25 w-full sm:w-auto justify-center"
            >
              Start Free Trial
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <button
              onClick={() => scrollTo('features')}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full transition-all w-full sm:w-auto justify-center"
            >
              See how it works
              <ChevronDown size={16} />
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            14 days free &middot; No credit card required
          </p>

          {/* App preview mockup */}
          <div className="mt-20 relative">
            <div className="absolute -inset-4 bg-gradient-to-b from-primary-500/20 via-transparent to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur overflow-hidden shadow-2xl shadow-primary-500/10">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/90 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500 text-center max-w-xs mx-auto">
                    briefloop.app/studio
                  </div>
                </div>
              </div>
              {/* Content area */}
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
                <div className="w-full max-w-lg space-y-4">
                  {/* Fake sidebar + content layout */}
                  <div className="flex gap-4 h-48">
                    <div className="w-12 bg-white/5 rounded-lg flex flex-col items-center gap-3 py-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded ${
                            i === 0
                              ? 'bg-primary-500/40'
                              : 'bg-white/5'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <div className="h-8 w-32 bg-white/5 rounded" />
                        <div className="h-8 w-20 bg-primary-500/20 rounded" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-lg bg-white/5 flex items-center justify-center"
                          >
                            <div
                              className={`w-6 h-6 rounded ${
                                i === 1
                                  ? 'bg-emerald-500/30'
                                  : i === 3
                                  ? 'bg-amber-500/30'
                                  : 'bg-white/10'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">
            Built for teams who ship creative work
          </p>
          <p className="text-xl sm:text-2xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto">
            &ldquo;Unlike scattered tools, Briefloop was built for creative teams from day one.
            No more stitching together Google Drive, Slack, and spreadsheets.&rdquo;
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-primary-400 uppercase tracking-wider mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Everything your creative
              <br />
              <span className="text-gray-400">team needs</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} index={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary-400 uppercase tracking-wider mb-3">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Starter plan */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 hover:border-white/20 transition-colors">
              <h3 className="text-lg font-semibold">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 5 team seats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 3 reviewer seats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 10 GB storage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> All core features
                </li>
              </ul>
              <Link
                to={routes.signup()}
                className="mt-8 block w-full text-center py-2.5 text-sm font-medium border border-white/10 hover:bg-white/5 rounded-full transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro plan */}
            <div className="relative rounded-2xl border border-primary-500/50 bg-primary-500/5 p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-500 text-xs font-medium">
                  <Sparkles size={12} /> Most popular
                </span>
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$39</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 25 team seats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 10 reviewer seats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 100 GB storage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Priority support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Advanced analytics
                </li>
              </ul>
              <Link
                to={routes.signup()}
                className="mt-8 block w-full text-center py-2.5 text-sm font-medium bg-primary-500 hover:bg-primary-400 rounded-full transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-gray-500">
            Need more seats or storage? Add-ons available on all plans.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary-400 uppercase tracking-wider mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div
          ref={ctaInView.ref}
          className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ${
            ctaInView.isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="absolute inset-0 -m-8 bg-gradient-to-r from-primary-500/10 via-accent-400/10 to-primary-500/10 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur px-8 py-16 sm:px-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to streamline your
              <br />
              creative workflow?
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
              Join creative teams already using Briefloop to ship better work, faster.
            </p>
            <Link
              to={routes.signup()}
              className="group relative inline-flex items-center gap-2 mt-8 px-8 py-3.5 text-base font-medium text-white bg-primary-500 hover:bg-primary-400 rounded-full transition-all hover:shadow-xl hover:shadow-primary-500/25"
            >
              Get started for free
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <img src="/logo-dark.svg" alt="Briefloop" className="h-6 w-auto" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <button
              onClick={() => scrollTo('features')}
              className="hover:text-gray-300 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="hover:text-gray-300 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo('faq')}
              className="hover:text-gray-300 transition-colors"
            >
              FAQ
            </button>
            <Link to={routes.login()} className="hover:text-gray-300 transition-colors">
              Log in
            </Link>
            <Link to={routes.signup()} className="hover:text-gray-300 transition-colors">
              Sign up
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Briefloop
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  illustration: Illustration,
  index,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  gradient: string;
  illustration: React.ComponentType;
  index: number;
}) {
  const { ref, isVisible } = useInView(index * 100);

  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-700 hover:border-white/10 hover:bg-white/[0.04] overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="p-8 pb-4">
        <div
          className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} mb-5 shadow-lg`}
        >
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="px-4 pb-4 pt-2 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
        <Illustration />
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-colors hover:border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-5 text-left"
      >
        <span className="font-medium text-sm sm:text-base">{question}</span>
        <ChevronDown
          size={18}
          className={`text-gray-500 shrink-0 ml-4 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}
