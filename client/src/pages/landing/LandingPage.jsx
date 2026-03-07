import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Zap, CheckCircle, Shield,
  TrendingUp, FileText, Bell, Star, BarChart3
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [.16,.77,.31,1], delay },
})

// ─── Navbar ────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80">
      <div className="w-full max-w-screen-xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-navy rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif font-bold text-[19px] text-navy tracking-tight">Nexlynk</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how"      className="text-sm text-slate-500 hover:text-navy transition-colors font-medium">How it works</a>
          <a href="#features" className="text-sm text-slate-500 hover:text-navy transition-colors font-medium">Features</a>
          <a href="#roles"    className="text-sm text-slate-500 hover:text-navy transition-colors font-medium">For you</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="btn-ghost text-sm">Log in</Link>
          <Link to="/register" className="btn-primary text-sm">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ──────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1800&q=80&auto=format&fit=crop')`,
        }}
      />
      {/* Dark overlay — navy tint */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/80 to-navy/50" />
      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent" />

      <div className="relative w-full max-w-screen-xl mx-auto px-8 pt-28 pb-24">
        <div className="max-w-2xl">
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-widest mb-6">
              <span className="w-5 h-px bg-blue-300" /> Now live in Kenya
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(.1)}
            className="font-serif text-5xl lg:text-6xl xl:text-7xl leading-[1.03] font-black text-white tracking-tight mb-7"
          >
            Where talent meets{' '}
            <span className="text-blue-300">opportunity</span>
          </motion.h1>

          <motion.p {...fadeUp(.2)} className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
            Nexlynk connects ambitious students with forward-thinking companies.
            Streamlined internship management — from discovery to placement.
          </motion.p>

          <motion.div {...fadeUp(.3)} className="flex flex-wrap gap-4">
            <Link to="/register" className="btn btn-lg bg-blue-DEFAULT text-white hover:bg-blue-800 shadow-blue active:scale-[.98]">
              Find internships <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register?role=company" className="btn btn-lg bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white backdrop-blur-sm">
              Post an opportunity
            </Link>
          </motion.div>

          {/* Trust indicators — no fake numbers */}
          <motion.div {...fadeUp(.4)} className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-white/15">
            {[
              { icon: '🎓', label: 'Students across Kenya' },
              { icon: '🏢', label: 'Verified companies' },
              { icon: '⚡', label: 'Fast placement process' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-white/60 font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Feature Card ──────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-navy text-base mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Role Card ─────────────────────────────────────────────
function RoleCard({ emoji, title, desc, perks, to, cta }) {
  return (
    <div className="bg-white/[.04] border border-white/10 hover:bg-white/[.07] rounded-2xl p-8 flex flex-col transition-all duration-300">
      <div className="text-4xl mb-5">{emoji}</div>
      <h3 className="font-serif text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-white/55 leading-relaxed mb-5">{desc}</p>
      <ul className="space-y-2.5 mb-7 flex-1">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
            <span className="text-white/70">{p}</span>
          </li>
        ))}
      </ul>
      <Link to={to} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 group">
        {cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-white font-sans">
      <Navbar />
      <Hero />

      {/* ── LOGO STRIP ─────────────────────────────────── */}
      <section className="py-14 px-8 border-b border-slate-100">
        <div className="w-full max-w-screen-xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Trusted by leading organisations across Kenya
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {['Safaricom', 'Equity Bank', 'Andela', 'KCB Group', 'Twiga Foods', 'KPMG', 'Microsoft Kenya'].map((co) => (
              <div key={co} className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-400 hover:border-blue-200 hover:text-blue-DEFAULT transition-colors">
                {co}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section id="how" className="py-24 px-8 bg-slate-50">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-eyebrow justify-center">How it works</span>
            <h2 className="font-serif text-4xl font-bold text-navy mt-1">Three steps to your placement</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(33%+24px)] right-[calc(33%+24px)] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
            {[
              { n: '01', title: 'Create your profile',  desc: 'Build a complete profile showcasing your skills and experience. Companies set up their branded company profile.' },
              { n: '02', title: 'Discover & connect',   desc: 'Browse opportunities filtered by discipline and location. Companies review qualified applicants instantly.' },
              { n: '03', title: 'Get placed',           desc: 'Track your application status in real time. Admins manage placements end-to-end for everyone.' },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-2xl border border-slate-200 p-8 relative">
                <div className="font-serif text-6xl font-black text-blue-50 leading-none mb-4">{step.n}</div>
                <h3 className="text-lg font-bold text-navy mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section id="features" className="py-24 px-8">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-eyebrow justify-center">Platform features</span>
            <h2 className="font-serif text-4xl font-bold text-navy mt-1">Built for the full placement lifecycle</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard icon={FileText}  accent="bg-blue-50 text-blue-DEFAULT"  title="Smart tracking"    desc="Real-time status updates keep students and companies in sync across every application." />
            <FeatureCard icon={Shield}    accent="bg-success-light text-success" title="Secure documents"  desc="CVs and company documents stored securely with signed-URL access that expires automatically." />
            <FeatureCard icon={Bell}      accent="bg-warning-light text-warning" title="Auto notifications" desc="Email alerts at every stage — applied, shortlisted, placed — sent automatically." />
            <FeatureCard icon={BarChart3} accent="bg-purple-50 text-purple-600" title="Admin oversight"    desc="Full platform visibility across all students, companies, and placements in one view." />
          </div>
        </div>
      </section>

      {/* ── ROLES ──────────────────────────────────────── */}
      <section id="roles" className="py-24 px-8 bg-navy">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-white/20" />Who it's for<span className="w-5 h-px bg-white/20" />
            </span>
            <h2 className="font-serif text-4xl font-bold text-white">One platform, three perspectives</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <RoleCard emoji="🎓" title="Students" to="/register"
              desc="Find, apply, and track internships that match your discipline and ambitions."
              perks={['Browse verified listings', 'Upload CV once, apply anywhere', 'Real-time application status', 'Profile completion guidance']}
              cta="Get started as a student"
            />
            <RoleCard emoji="🏢" title="Companies" to="/register?role=company"
              desc="Post opportunities, review qualified candidates, manage your programme efficiently."
              perks={['Post internships & attachments', 'Filter by skills & discipline', 'Full applicant pipeline view', 'Branded company profile']}
              cta="Register your company"
            />
            <RoleCard emoji="🛡️" title="Administrators" to="/login"
              desc="Oversee the entire platform — approve companies, manage placements, track outcomes."
              perks={['Full visibility dashboard', 'Company verification workflow', 'Placement tracking', 'Audit log for all actions']}
              cta="Admin access"
            />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────── */}
      <section className="py-24 px-8">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-eyebrow justify-center">Testimonials</span>
            <h2 className="font-serif text-4xl font-bold text-navy mt-1">What our community says</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'I applied to three companies and got placed within two weeks. The status tracking kept me informed throughout.', name: 'Amina Mwangi', role: 'CS Student, UoN · Placed at Safaricom', initials: 'AM', color: 'bg-blue-DEFAULT' },
              { quote: 'We hired three interns this quarter from a single post. Nexlynk consolidated everything in one place.', name: 'Daniel Kariuki', role: 'HR Manager · Equity Bank', initials: 'DK', color: 'bg-info' },
              { quote: 'The admin dashboard gives me everything I need to manage placements across 40+ companies effortlessly.', name: 'Faith Odhiambo', role: 'Platform Administrator', initials: 'FO', color: 'bg-success' },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-2xl border border-slate-200 p-7">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold`}>{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B1D3F 0%, #1a3a7a 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(26,86,219,.4) 0%, transparent 65%)' }} />
        <div className="w-full max-w-screen-xl mx-auto text-center relative">
          <h2 className="font-serif text-5xl font-black text-white mb-5 max-w-2xl mx-auto text-balance">
            Ready to find your next opportunity?
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Join students and companies across Kenya already using Nexlynk.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn btn-lg bg-white text-navy hover:bg-slate-100 active:scale-[.98]">
              Create free account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register?role=company" className="btn btn-lg border-2 border-white/30 text-white hover:border-white hover:bg-white/5">
              Post an opportunity
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="bg-navy border-t border-white/[.06] pt-16 pb-8 px-8">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-blue-DEFAULT rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-serif font-bold text-white text-lg">Nexlynk</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Connecting Kenya's next generation of talent with the companies shaping the future.
              </p>
            </div>
            {[
              { h: 'Platform', links: ['How it works', 'For students', 'For companies'] },
              { h: 'Company',  links: ['About us', 'Blog', 'Careers'] },
              { h: 'Legal',    links: ['Privacy Policy', 'Terms of Service'] },
            ].map(({ h, links }) => (
              <div key={h}>
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">{h}</h4>
                {links.map((l) => (
                  <a key={l} href="#" className="block text-sm text-white/40 hover:text-white transition-colors mb-2.5">{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/[.06] pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-white/30">© 2026 Nexlynk Engineers Limited. All rights reserved.</p>
            <p className="text-sm text-white/30">Built with ❤ in Nairobi, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
