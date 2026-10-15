import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Plus,
  Quote,
  Menu,
  X,
  GraduationCap,
  Building2,
  Zap,
  Shield,
  Bell,
  BarChart3,
  Upload,
  Activity,
  Users,
} from "lucide-react";
import NexlynkLogo from "@/components/shared/NexlynkLogo";
import "./landing.css";
import IMAGES from "./images";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "Services", href: "#services" },
  { label: "Features", href: "#features" },
];

// Placeholder disciplines. Replace with the ones your platform really lists.
const WORK = [
  { title: "Civil and Structural", a: "Internships", b: "Attachments" },
  { title: "Mechanical", a: "Internships", b: "Attachments" },
  { title: "Electrical", a: "Internships", b: "Attachments" },
  { title: "Pipelines and Process", a: "Internships", b: "Attachments" },
];

const SERVICES = [
  "Student profiles",
  "Opportunity listings",
  "Application tracking",
  "Placement management",
];

const CAPS = [
  { icon: Upload, label: "Upload your CV once" },
  { icon: Activity, label: "Live application status" },
  { icon: Bell, label: "Email alerts" },
  { icon: Building2, label: "Company profiles" },
  { icon: Shield, label: "Secure documents" },
  { icon: BarChart3, label: "Follow up dashboard" },
];

const STEPS = [
  { n: "01", label: "Create your profile" },
  { n: "02", label: "Discover and connect" },
  { n: "03", label: "Get placed" },
];

const WHY = [
  {
    t: "Verified companies",
    d: "Companies are approved before they can post, so students apply to real opportunities.",
  },
  {
    t: "Secure documents",
    d: "CVs and company documents are stored securely, with signed links that expire automatically.",
  },
  {
    t: "Automatic notifications",
    d: "Email alerts go out at every stage, from applied to shortlisted to placed.",
  },
  {
    t: "Placement oversight",
    d: "Admins see students, companies and placements in one place and manage them end to end.",
  },
];

const CTA_TAGS = [
  "Verified company listings",
  "Real time application status",
  "Automatic email alerts",
  "One profile, many applications",
];

// Generic placeholders. Replace with real quotes before deploying.
const TESTIMONIALS = [
  {
    name: "Student name",
    role: "University and course",
    quote: "Replace this with a real quote from a placed student.",
  },
  {
    name: "Company contact",
    role: "Company name",
    quote: "Replace this with a real quote from a hiring company.",
  },
  {
    name: "Hiring manager",
    role: "Company name",
    quote: "Replace this with a real quote from a hiring manager.",
  },
  {
    name: "Platform admin",
    role: "Nexlynk Engineers",
    quote: "Replace this with a real quote from your team.",
  },
];

// Placeholder guides. No article pages exist yet, so these render as coming soon.
const BLOG = [
  {
    tag: "Students",
    title: "How to write an internship CV that gets shortlisted",
    text: "Practical guides for students and companies are on the way.",
  },
  { tag: "Companies", title: "What companies look for in an intern" },
  { tag: "Students", title: "Preparing for your first week on placement" },
];

const FOOTER_TOP = [
  { label: "Log in", to: "/login" },
  { label: "Find internships", to: "/register" },
  { label: "Register your company", to: "/register?role=company" },
  { label: "Sign up", to: "/register" },
];

const FOOTER_A = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "Services", href: "#services" },
];

const FOOTER_B = [
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Guides", href: "#guides" },
];

// ─── Helpers ───
function useTemplateFont() {
  useEffect(() => {
    const id = "nx-poppins";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function Reveal({ children, className = "", delay = 0 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 0.77, 0.31, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function Cover({ src, eager = false }) {
  if (!src) return null;
  return (
    <img
      className="nx-cover"
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
    />
  );
}

function ArrowSwap() {
  return (
    <>
      <ArrowUpRight className="nx-arr nx-arr-a" />
      <ArrowUpRight className="nx-arr nx-arr-b" />
    </>
  );
}

function Button({ to, children, onClick }) {
  return (
    <Link to={to} className="nx-btn" onClick={onClick}>
      <span className="nx-btn-text">{children}</span>
      <span className="nx-circle">
        <ArrowSwap />
      </span>
    </Link>
  );
}

function Heading({ label, children }) {
  return (
    <div className="nx-heading">
      <div className="nx-subtitle">
        <span className="nx-dot" />
        <span className="nx-caption">{label}</span>
      </div>
      <h2 className="nx-h2">{children}</h2>
    </div>
  );
}

// ─── Navbar ───
function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="nx-navbar">
      <div className="nx-container nx-nav-pad">
        <div className="nx-nav-wrap">
          <Link
            to="/"
            className="nx-logo"
            onClick={close}
            aria-label="Nexlynk home"
          >
            <NexlynkLogo variant="full" />
          </Link>
          <nav
            className={`nx-nav-menu${open ? " is-open" : ""}`}
            aria-label="Main"
          >
            <div className="nx-nav-links">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="nx-nav-link"
                  onClick={close}
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="nx-nav-actions">
              <Link to="/login" className="nx-nav-link" onClick={close}>
                Log in
              </Link>
              <Button to="/register" onClick={close}>
                Get started
              </Button>
            </div>
          </nav>
          <button
            type="button"
            className="nx-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ───
function Hero() {
  return (
    <section className="nx-hero">
      <div className="nx-container nx-h100">
        <div className="nx-hero-wrap">
          <div className="nx-hero-title">
            <div className="nx-hero-title-top">
              {/* <Reveal>
                <div className="nx-subtitle">
                  <span className="nx-caption">Now live in Kenya</span>
                </div>
              </Reveal> */}
              <Reveal delay={0.08}>
                <h1 className="nx-hero-heading">
                  Where Kenyan talent meets real opportunity
                </h1>
              </Reveal>
            </div>
            <Reveal delay={0.16}>
              <p className="nx-body">
                Nexlynk connects students with verified companies and handles
                the whole internship process, from discovery to placement, in
                one place.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="nx-hero-button">
              <Button to="/register">Find internships</Button>
            </Reveal>
          </div>

          <Reveal className="nx-client">
            <div className="nx-profiles">
              <span className="nx-profile">
                <GraduationCap size={18} />
              </span>
              <span className="nx-profile">
                <Building2 size={18} />
              </span>
              <span className="nx-profile">
                <Zap size={18} />
              </span>
            </div>
            {/* <div>
              <h6 className="nx-h6">Made for Kenya</h6>
              <p className="nx-small nx-gray">
                Students and companies on one platform
              </p>
            </div> */}
          </Reveal>
        </div>
      </div>

      <div className="nx-hero-image">
        <Cover src={IMAGES.hero} eager />
        <div className="nx-hero-cards">
          <div className="nx-card-top">
            <div className="nx-card nx-card-ghost" />
            <div className="nx-card nx-card-primary">
              <h3 className="nx-h3 nx-white">A few days</h3>
              <p className="nx-small nx-white">to get placed</p>
            </div>
          </div>
          <div className="nx-card-main">
            <div className="nx-card-bottom">
              <div className="nx-card">
                <h3 className="nx-h3 nx-white">3 roles</h3>
                <p className="nx-small nx-white">
                  Students, companies and admins
                </p>
              </div>
              <div className="nx-card-right">
                <p className="nx-body">
                  Verified companies post opportunities. Students apply
                  and track every step.
                </p>
                <a
                  href="#about"
                  className="nx-circle bordered nx-circle-link"
                  aria-label="Scroll to About"
                >
                  <ArrowSwap />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── About ───
function About() {
  return (
    <section id="about" className="nx-section">
      <div className="nx-container">
        <div className="nx-wrap nx-about" style={{ gap: 0 }}>
          <div className="nx-about-left">
            <Reveal>
              <Heading label="About us">
                Internship placement without the paperwork
              </Heading>
            </Reveal>
            <div className="nx-about-bottom">
              <div className="nx-about-info">
                <Reveal className="nx-about-top">
                 
                
                </Reveal>
                <Reveal>
                  <p className="nx-body">
                    Nexlynk is an internship platform that connects students
                    with verified companies. Students build one profile and
                    apply anywhere, while companies review qualified applicants
                    in a single pipeline.
                  </p>
                </Reveal>
                <Reveal>
                  <p className="nx-body">
                    Status updates and email alerts keep everyone in sync, and
                    admins oversee placements from start to finish.
                  </p>
                </Reveal>
              </div>
              <Reveal>
                <Button to="/register">Get started</Button>
              </Reveal>
            </div>
          </div>
          <Reveal className="nx-about-visual">
            <div className="nx-about-image">
              <Cover src={IMAGES.about} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Opportunities ───
function Work() {
  return (
    <section id="opportunities" className="nx-section">
      <div className="nx-container">
        <div className="nx-wrap">
          <Reveal>
            <Heading label="Opportunities">
              Find work that fits your discipline
            </Heading>
          </Reveal>
          <Reveal className="nx-work-grid">
            {WORK.map((w, i) => (
              <Link key={w.title} to="/register" className="nx-work-card">
                <div className="nx-work-image">
                  <Cover src={IMAGES.work[i]} />
                  <span className="nx-work-arrow">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <div className="nx-work-info">
                  <h4 className="nx-h4">{w.title}</h4>
                  <div className="nx-work-meta">
                    <span className="nx-body">{w.a}</span>
                    <span className="nx-divider" />
                    <span className="nx-body">{w.b}</span>
                  </div>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Services ───
function Services() {
  return (
    <section id="services" className="nx-section">
      <div className="nx-container">
        <div className="nx-wrap" style={{ gap: 42 }}>
          <Reveal>
            <Heading label="Services">Everything the placement needs</Heading>
          </Reveal>
          <div className="nx-services">
            {SERVICES.map((s, i) => (
              <Reveal key={s}>
                <Link to="/register" className="nx-service-card">
                  <div className="nx-service-top">
                    <div className="nx-service-num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="nx-service-data">
                      <div className="nx-service-img">
                        <Cover src={IMAGES.services[i]} />
                      </div>
                      <div className="nx-service-left">
                        <h3 className="nx-h4 nx-service-name">{s}</h3>
                        <span className="nx-circle bordered">
                          <ArrowSwap />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Button to="/register">Create free account</Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── How it works ───
function HowItWorks() {
  return (
    <section className="nx-section-bg pad">
      <div className="nx-container">
        <div className="nx-wrap">
          <Reveal>
            <Heading label="How it works">
              Simple by design, from profile to placement
            </Heading>
          </Reveal>
          <div className="nx-two">
            <Reveal className="nx-caps">
              {CAPS.map(({ icon: Icon, label }) => (
                <div key={label} className="nx-cap">
                  <Icon size={28} />
                  <span className="nx-small">{label}</span>
                </div>
              ))}
            </Reveal>
            <div className="nx-right">
              <Reveal>
                <p className="nx-body">
                  Create a profile, find verified opportunities that match your
                  discipline and location, then follow your application until
                  you are placed. Companies and admins get the same clarity from
                  their side.
                </p>
              </Reveal>
              <Reveal className="nx-steps">
                {STEPS.map((s) => (
                  <div key={s.n} className="nx-step">
                    <h3 className="nx-h3">{s.n}</h3>
                    <p className="nx-small nx-gray">{s.label}</p>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why choose us ───
function Why() {
  const [open, setOpen] = useState(0);
  return (
    <section id="features" className="nx-section nx-section-top">
      <div className="nx-container">
        <div className="nx-wrap">
          <Reveal>
            <Heading label="Why Nexlynk">
              Why students and companies trust us
            </Heading>
          </Reveal>
          <div className="nx-why">
            <div className="nx-why-left">
              <Reveal>
                <p className="nx-body">
                  We built Nexlynk around safety, clarity and speed, so every
                  application is tracked and every document stays protected from
                  the first click to the final placement.
                </p>
              </Reveal>
              <div className="nx-tabs">
                {WHY.map((w, i) => {
                  const on = open === i;
                  return (
                    <div key={w.t} className={`nx-tab${on ? " is-open" : ""}`}>
                      <button
                        type="button"
                        className="nx-tab-toggle"
                        aria-expanded={on}
                        onClick={() => setOpen(on ? null : i)}
                      >
                        <span className="nx-large">{w.t}</span>
                        <span className="nx-tab-arrow">
                          <Plus size={16} />
                        </span>
                      </button>
                      <div className="nx-tab-list">
                        <div className="nx-tab-list-inner">
                          <p className="nx-body nx-tab-answer">{w.d}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Reveal className="nx-why-image">
              <Cover src={IMAGES.why} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ───
function Cta() {
  return (
    <section className="nx-section">
      <div className="nx-container">
        <Reveal className="nx-cta">
          <div className="nx-cta-image">
            <Cover src={IMAGES.cta} />
            <div className="nx-cta-shade" />
          </div>
          <div className="nx-cta-text">
            <h2 className="nx-h5 nx-white">What you get on Nexlynk:</h2>
            <div className="nx-cta-tags">
              {CTA_TAGS.map((t) => (
                <div key={t} className="nx-cta-tag">
                  <span className="nx-small nx-white">{t}</span>
                </div>
              ))}
            </div>
            <div className="nx-cta-btn">
              <Button to="/register">Create free account</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Testimonials ───
function Testimonials() {
  const [cur, setCur] = useState(0);
  const t = TESTIMONIALS[cur];
  return (
    <section id="testimonials" className="nx-section">
      <div className="nx-container">
        <div className="nx-wrap">
          <Reveal>
            <Heading label="Testimonials">Words from our community</Heading>
          </Reveal>
          <Reveal>
            <div className="nx-tt">
              <div className="nx-tt-left">
                <Quote size={56} />
              </div>
              <div className="nx-tt-center">
                <p className="nx-large nx-gray">&ldquo;{t.quote}&rdquo;</p>
                <div className="nx-tt-who">
                  <h5 className="nx-h5">{t.name}</h5>
                  <p className="nx-small nx-gray">{t.role}</p>
                </div>
              </div>
              <div className="nx-tt-image">
                <Cover src={IMAGES.testimonials[cur]} />
              </div>
            </div>
            <div className="nx-tt-menu" role="tablist">
              {TESTIMONIALS.map((x, i) => (
                <button
                  key={x.name}
                  type="button"
                  role="tab"
                  aria-selected={cur === i}
                  className={`nx-tt-link${cur === i ? " is-current" : ""}`}
                  onClick={() => setCur(i)}
                >
                  {x.name}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Blog ───
function Blog() {
  const [big, ...small] = BLOG;
  return (
    <section id="guides" className="nx-section-bg pad-main">
      <div className="nx-container">
        <div className="nx-wrap">
          <Reveal>
            <Heading label="Guides">Advice for your internship journey</Heading>
          </Reveal>
          <Reveal className="nx-blog-row">
            <article className="nx-blog-card nx-blog-big">
              <div className="nx-blog-top">
                <div className="nx-blog-date">
                  <h2 className="nx-h6">{big.tag}</h2>
                  <p className="nx-small nx-gray">Coming soon</p>
                </div>
                <div className="nx-blog-image">
                  <Cover src={IMAGES.blog[0]} />
                </div>
              </div>
              <div className="nx-blog-bottom">
                <div className="nx-blog-title">
                  <h3 className="nx-h5">{big.title}</h3>
                  <p className="nx-body">{big.text}</p>
                </div>
              </div>
            </article>
            <div className="nx-blog-small-col">
              {small.map((b, i) => (
                <article key={b.title} className="nx-blog-card">
                  <div className="nx-blog-data">
                    <div className="nx-blog-info">
                      <div className="nx-blog-left">
                        <div className="nx-blog-topdate">
                          <span className="nx-small nx-gray">{b.tag}</span>
                          <span className="nx-blog-line" />
                          <span className="nx-small nx-gray">Coming soon</span>
                        </div>
                        <h3 className="nx-large">{b.title}</h3>
                      </div>
                    </div>
                    <div className="nx-blog-thumb">
                      <Cover src={IMAGES.blog[i + 1]} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───
function FooterForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    // Passed through router state, not the URL, so the address is not logged or shared.
    navigate("/register", { state: { email: value } });
  };
  return (
    <form className="nx-footer-form" onSubmit={submit}>
      <label htmlFor="nx-email" className="nx-small nx-light">
        Email address*
      </label>
      <div className="nx-field-wrap">
        <input
          id="nx-email"
          type="email"
          required
          maxLength={256}
          className="nx-field"
          placeholder="enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="nx-submit">
          Submit
          <span className="nx-submit-circle">
            <ArrowUpRight size={14} />
          </span>
        </button>
      </div>
    </form>
  );
}

function Footer() {
  return (
    <footer className="nx-footer">
      <div className="nx-container">
        <div className="nx-footer-box">
          <div className="nx-social-links">
            {FOOTER_TOP.map((l) => (
              <Link key={l.label} to={l.to} className="nx-social">
                <span className="nx-small nx-white">{l.label}</span>
                <ArrowUpRight size={16} className="nx-arr" />
              </Link>
            ))}
          </div>
          <div className="nx-footer-menu">
            <div className="nx-footer-links">
              <div className="nx-footer-outer">
                <div className="nx-footer-list">
                  {FOOTER_A.map((l) => (
                    <a key={l.label} href={l.href} className="nx-footer-link">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="nx-footer-outer">
                <div className="nx-footer-list">
                  {FOOTER_B.map((l) => (
                    <a key={l.label} href={l.href} className="nx-footer-link">
                      {l.label}
                    </a>
                  ))}
                </div>
                <p className="nx-small nx-light">
                  Nexlynk Engineers Limited, Nairobi, Kenya.
                </p>
              </div>
            </div>
            <div className="nx-footer-right">
              <p className="nx-large nx-white">
                Start your placement journey today
              </p>
              <div className="nx-footer-right-bottom">
                <p className="nx-body nx-light">
                  Nexlynk connects Kenya&rsquo;s next generation of talent with
                  the companies shaping the future.
                </p>
                <FooterForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="nx-container">
        <div className="nx-footer-logo">
          <NexlynkLogo variant="full" />
        </div>
      </div>

      <div className="nx-footer-bottom">
        <div className="nx-container">
          <div className="nx-footer-bottom-wrap">
            <p className="nx-small nx-light">
              &copy;{new Date().getFullYear()} Nexlynk Engineers Limited.
            </p>
            <p className="nx-small nx-light">Built by <a href="https://telvane.co.ke" target="_blank" rel="noreferrer" className="nx-footer-link" style={{ display: "inline" }}>Telvane Technologies</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ───
export default function LandingPage() {
  useTemplateFont();
  return (
    <div id="top" className="nx">
      <Navbar />
      <Hero />
      <About />
      <Work />
      <Services />
      <HowItWorks />
      <Why />
      <Cta />
      <Testimonials />
      <Blog />
      <Footer />
    </div>
  );
}
