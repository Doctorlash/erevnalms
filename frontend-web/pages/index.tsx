import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "../services/api";

export default function Home() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");

  const submitContact = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSending(true);
      setContactSuccess("");

      await api.post("/contact", contactForm);

      setContactForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      setContactSuccess(
        "Thank you for contacting Erevna Leadership Academy. Your message has been received.",
      );
    } catch (error) {
      console.error("Contact submission failed:", error);

      alert("Unable to send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* =====================================================
          NAVBAR
      ===================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <nav className="min-h-[82px] flex items-center justify-between gap-6">
            {/* BRAND */}
            {/* BRAND */}
            <Link href="/" className="flex items-center gap-4 group shrink-0">
              <div className="relative flex h-16 w-16 items-center justify-center transition duration-300 group-hover:scale-105">
                <Image
                  src="/logo4.png"
                  alt="Erevna Leadership Academy Logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain drop-shadow-lg"
                  priority
                />
              </div>

              <div className="hidden sm:block">
                <p className="text-white font-extrabold text-lg leading-tight tracking-tight">
                  Erevna Leadership Academy
                </p>

                <p className="text-blue-300 text-xs font-semibold tracking-[0.2em] uppercase mt-1">
                  Learn · Lead · Succeed
                </p>
              </div>
            </Link>

            {/* NAVIGATION */}
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="#about"
                className="hidden md:inline-flex text-sm font-medium text-slate-300 hover:text-white transition"
              >
                About
              </Link>

              <Link
                href="#programs"
                className="hidden md:inline-flex text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Programs
              </Link>

              <Link
                href="#leadership"
                className="hidden md:inline-flex text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Leadership
              </Link>

              <Link
                href="#contact"
                className="hidden md:inline-flex text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Contact
              </Link>

              <Link
                href="/login"
                className="text-sm font-semibold text-white hover:text-blue-300 transition"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 sm:px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* Decorative background */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-20 items-center">
            {/* HERO CONTENT */}
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-300/40 bg-blue-400/15 px-5 py-2.5 mb-7 shadow-lg shadow-blue-950/20">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-300 animate-pulse shadow-[0_0_12px_rgba(147,197,253,0.9)]" />

                <span className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                  Erevna Leadership Academy
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-[-0.03em]">
                <span className="text-white">Learn.</span>

                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-white">
                  Lead.
                </span>

                <span className="block text-white">Succeed.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-slate-300">
                Accessible, structured and technology-powered education for
                academic excellence, examination success and authentic
                leadership development.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-7 py-3.5 font-bold text-white shadow-xl shadow-blue-900/30 transition duration-300 hover:-translate-y-1 hover:bg-blue-400"
                >
                  Start Your Journey
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  href="#about"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  Discover Erevna
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 grid grid-cols-3 max-w-xl border-t border-white/10 pt-7">
                <div>
                  <p className="text-2xl font-bold text-white">WAEC</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Exam Preparation
                  </p>
                </div>

                <div className="border-l border-white/10 pl-5">
                  <p className="text-2xl font-bold text-white">JAMB</p>
                  <p className="text-xs text-slate-400 mt-1">CBT Preparation</p>
                </div>

                <div className="border-l border-white/10 pl-5">
                  <p className="text-2xl font-bold text-white">9 Pillars</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Leadership Development
                  </p>
                </div>
              </div>
            </div>

            {/* HERO LOGO */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 rounded-[3rem] bg-blue-500/20 blur-3xl scale-90" />

                <div className="relative rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
                  <Image
                    src="/logo4.png"
                    alt="Erevna Leadership Academy"
                    width={500}
                    height={500}
                    priority
                    className="relative w-[280px] sm:w-[350px] lg:w-[420px] h-auto object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}
      <section id="about" className="scroll-mt-24 py-24 px-6 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">
              Who We Are
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950">
              Education that develops both{" "}
              <span className="text-blue-600">competence</span> and{" "}
              <span className="text-purple-600">character.</span>
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Erevna Leadership Academy exists to close two gaps at once: the
              gap between where young Nigerians start and the leaders they are
              capable of becoming, and the gap between good examination
              preparation and who can actually afford it.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* WHO WE ARE CARD */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-8 md:p-10 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-100">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl transition duration-500 group-hover:scale-150" />

              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-lg shadow-blue-600/20">
                  🌍
                </div>

                <h3 className="text-2xl font-bold text-slate-950">
                  Who We Are
                </h3>

                <p className="mt-5 text-slate-600 leading-relaxed">
                  Founded by Emmanuel Oluwafemi Thomas, Erevna is built on a
                  simple conviction: character and access are not luxuries. They
                  are the foundation every young person deserves, regardless of
                  their city, income or connections.
                </p>

                <p className="mt-5 text-slate-600 leading-relaxed">
                  Erevna Leadership Academy is currently in the process of
                  formal NGO registration in Nigeria and is focused on combining
                  academic preparation, leadership development, mentorship and
                  access.
                </p>
              </div>
            </div>

            {/* MISSION CARD */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-8 md:p-10 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-100">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-200/30 blur-2xl transition duration-500 group-hover:scale-150" />

              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-2xl shadow-lg shadow-purple-600/20">
                  🎯
                </div>

                <h3 className="text-2xl font-bold text-slate-950">
                  Our Mission
                </h3>

                <p className="mt-5 text-slate-600 leading-relaxed">
                  We aim to make quality education, examination preparation and
                  leadership development accessible to young people wherever
                  they are.
                </p>

                <p className="mt-5 text-slate-600 leading-relaxed">
                  Through technology, qualified tutors, structured learning
                  pathways and practical leadership training, we help students
                  develop both the competence to succeed and the character to
                  lead.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT WE DO
      ===================================================== */}
      <section className="py-24 px-6 sm:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-600 mb-4">
              What We Do
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950">
              Education beyond the classroom.
            </h2>

            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              We combine academic preparation, leadership development,
              technology and mentorship to help young people become capable,
              confident and responsible leaders.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEADERSHIP */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-950 p-8 md:p-10 text-white shadow-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl transition duration-500 group-hover:scale-125" />

              <div className="relative">
                <div className="flex items-center gap-4 mb-7">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl">
                    🌱
                  </div>

                  <div>
                    <p className="text-blue-400 text-sm font-bold uppercase tracking-wider">
                      Leadership
                    </p>

                    <h3 className="text-2xl font-bold">
                      We Build Leaders from the Inside Out
                    </h3>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Our Personal Development Training Manual guides teenagers
                  through nine core pillars of authentic leadership.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-7">
                  {[
                    "Authentic leadership",
                    "Self-worth",
                    "Effective communication",
                    "Speech delivery",
                    "Active listening",
                    "Emotional intelligence",
                    "Composure & resilience",
                    "Presence & poise",
                    "Presentation skills",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      <span className="text-blue-400 mr-2">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* UNIVERSITY */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 md:p-10 shadow-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-purple-100 blur-3xl transition duration-500 group-hover:scale-125" />

              <div className="relative">
                <div className="flex items-center gap-4 mb-7">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
                    🎓
                  </div>

                  <div>
                    <p className="text-purple-600 text-sm font-bold uppercase tracking-wider">
                      University Access
                    </p>

                    <h3 className="text-2xl font-bold text-slate-950">
                      We Open the Door to University
                    </h3>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  Our remote tutoring and university access programme provides
                  structured, exam-focused coaching for WAEC and JAMB
                  candidates.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-7">
                  {[
                    "Live remote classes",
                    "Recorded lessons",
                    "Exam-format practice",
                    "Performance tracking",
                    "Study skills",
                    "Exam strategy",
                    "Course guidance",
                    "Admission support",
                    "Mentorship",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-purple-200 hover:bg-purple-50"
                    >
                      <span className="text-purple-600 mr-2">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}
      <section className="py-24 px-6 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">
              The Erevna Advantage
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-slate-950">
              Why choose Erevna?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            {[
              {
                icon: "👨‍🏫",
                title: "Expert Teachers",
                text: "Learn from vetted and qualified educators with experience in examination preparation and student development.",
              },
              {
                icon: "💻",
                title: "Technology-Powered Learning",
                text: "Access structured learning, digital resources, CBT practice and performance tracking through a modern learning platform.",
              },
              {
                icon: "🏆",
                title: "Leadership Development",
                text: "Build confidence, communication, emotional intelligence, resilience, character and practical leadership capacity.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 transition group-hover:opacity-100" />

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl transition duration-300 group-hover:scale-110 group-hover:bg-blue-50">
                  {feature.icon}
                </div>

                <h3 className="mt-7 text-xl font-bold text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-4 text-slate-600 leading-relaxed">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          PROGRAMS
      ===================================================== */}
      <section
        id="programs"
        className="scroll-mt-24 py-24 px-6 sm:px-8 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">
              Our Programs
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-slate-950">
              Learning paths designed for impact.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-7">
            {[
              {
                title: "WAEC Preparation",
                text: "Structured preparation, revision classes, practice exercises and examination-focused learning.",
                icon: "📘",
                className:
                  "from-blue-600 to-cyan-500 shadow-blue-200 hover:shadow-blue-200",
              },
              {
                title: "JAMB Preparation",
                text: "CBT practice, question banks, performance analytics and strategic examination preparation.",
                icon: "🎓",
                className:
                  "from-purple-600 to-indigo-500 shadow-purple-200 hover:shadow-purple-200",
              },
              {
                title: "Leadership Academy",
                text: "Practical leadership, communication, confidence, character and personal development training.",
                icon: "🌟",
                className:
                  "from-amber-500 to-orange-500 shadow-orange-200 hover:shadow-orange-200",
              },
            ].map((program) => (
              <div
                key={program.title}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${program.className} p-8 md:p-10 text-white shadow-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition group-hover:scale-150" />

                <div className="relative">
                  <div className="text-5xl">{program.icon}</div>

                  <h3 className="mt-8 text-2xl font-bold">{program.title}</h3>

                  <p className="mt-4 text-white/85 leading-relaxed">
                    {program.text}
                  </p>

                  <Link
                    href="/register"
                    className="inline-flex mt-8 rounded-xl bg-white/15 border border-white/20 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white hover:text-slate-950"
                  >
                    Explore Programme →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY IT MATTERS
      ===================================================== */}
      <section className="relative overflow-hidden bg-blue-950 text-white py-24 px-6 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.2),transparent_35%)]" />

        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300 mb-5">
            Why It Matters
          </p>

          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Education should not be limited by location or income.
          </h2>

          <p className="mt-7 text-lg md:text-xl leading-relaxed text-blue-100">
            Private coaching in Nigeria is concentrated in a handful of cities
            and can be priced beyond the reach of many families, while students
            across the country continue to face uneven preparation for major
            examinations.
          </p>

          <p className="mt-6 text-lg md:text-xl leading-relaxed text-blue-100">
            Erevna was built to address both realities together: reaching
            students wherever they are, keeping quality education within reach,
            and shaping not only examination results but the character and
            capacity of the people behind those results.
          </p>
        </div>
      </section>

      {/* =====================================================
          CEO / FOUNDER
      ===================================================== */}
      <section
        id="leadership"
        className="scroll-mt-24 bg-slate-950 text-white py-24 px-6 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">
              Leadership
            </p>

            <h2 className="text-4xl md:text-5xl font-black">
              Meet Our Founder
            </h2>

            <p className="mt-5 max-w-2xl mx-auto text-slate-400 text-lg">
              The vision and leadership behind Erevna Leadership Academy.
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-14 items-start">
            {/* IMAGE */}
            <div className="lg:sticky lg:top-28">
              <div className="relative max-w-md mx-auto">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-600/30 to-purple-600/30 blur-2xl" />

                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 shadow-2xl">
                  <Image
                    src="/ceo.png"
                    alt="Emmanuel Oluwafemi Thomas - Founder of Erevna Leadership Academy"
                    width={600}
                    height={600}
                    className="w-full rounded-[1.5rem] object-cover"
                  />
                </div>

                <div className="absolute -bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">
                    Founder
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    Emmanuel Oluwafemi Thomas
                  </p>
                </div>
              </div>
            </div>

            {/* BIO */}
            <div className="pt-4 lg:pt-0">
              <p className="text-blue-400 text-sm font-bold uppercase tracking-widest">
                Environmental Specialist · Business Consultant
              </p>

              <h3 className="mt-4 text-3xl md:text-4xl font-black">
                Emmanuel Oluwafemi Thomas
              </h3>

              <p className="mt-5 text-lg leading-relaxed text-slate-300">
                Emmanuel Oluwafemi Thomas is a multidisciplinary professional
                whose expertise spans environmental management, data-driven
                business consultancy and applied research — a foundation he now
                also brings to youth leadership development and education access
                as the founder of Erevna Leadership Academy.
              </p>

              <div className="mt-10 space-y-10">
                <div>
                  <h4 className="text-xl font-bold text-white">
                    Environmental & Business Practice
                  </h4>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    With over 8 years of experience as an Environmental
                    Specialist, Emmanuel has designed and implemented
                    comprehensive environmental programmes across diverse
                    industries, with particular focus on road construction and
                    maintenance.
                  </p>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    His work spans regulatory compliance, sustainability
                    strategy and innovative problem-solving, consistently
                    translating complex environmental challenges into practical,
                    compliance-ready solutions.
                  </p>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    As a Business Consultant, he leverages advanced data
                    analytics to help organisations make smarter, evidence-based
                    decisions, transforming operational and environmental data
                    into strategic insights that identify inefficiencies,
                    forecast risks and unlock growth.
                  </p>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white">
                    Research & Applied Analysis
                  </h4>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    Underpinning both roles is 11 years of rigorous academic and
                    applied research experience. Emmanuel is proficient in
                    quantitative and qualitative methodologies, literature
                    reviews, large-scale data analysis and interdisciplinary
                    collaboration.
                  </p>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    He has a proven ability to synthesise complex findings into
                    clear, actionable recommendations while managing multiple
                    high-priority projects and communicating effectively across
                    technical and non-technical audiences.
                  </p>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white">
                    Founder, Erevna Leadership Academy
                  </h4>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    Emmanuel channels the same rigour, evidence-based thinking
                    and structured problem-solving into Erevna Leadership
                    Academy.
                  </p>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    He founded Erevna on the conviction that character and
                    access are not luxuries but the foundation every young
                    person deserves, regardless of their city, income or
                    connections.
                  </p>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    Under his leadership, Erevna delivers a Personal Development
                    Training Manual guiding teenagers through nine core pillars
                    of authentic leadership, alongside a remote tutoring and
                    university access programme for WAEC and JAMB candidates.
                  </p>

                  <p className="mt-4 text-slate-400 leading-relaxed">
                    The academy combines qualified tutors, technology,
                    structured learning, mentorship and accessible pricing,
                    including a limited number of fully-funded places for
                    students who cannot pay.
                  </p>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border-l-4 border-blue-500 bg-white/5 p-6">
                <p className="text-lg leading-relaxed text-white font-medium">
                  Emmanuel brings together environmental intelligence,
                  analytical rigour and business acumen with a strong commitment
                  to developing the next generation of authentic, resilient and
                  impactful leaders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FUTURE
      ===================================================== */}
      <section className="py-24 px-6 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-600 mb-4">
            Where We're Headed
          </p>

          <h2 className="text-4xl md:text-5xl font-black text-slate-950">
            Building a future where ability can go further.
          </h2>

          <p className="mt-7 text-lg text-slate-600 leading-relaxed">
            Erevna is building toward the Erevna Scholarship Scheme — a future
            phase that will track students' academic progress at university and
            provide financial support to high-performing students from
            less-privileged backgrounds.
          </p>

          <div className="mt-10 inline-flex max-w-3xl rounded-2xl border border-blue-100 bg-blue-50 px-7 py-5">
            <p className="text-lg md:text-xl font-bold text-blue-800 leading-relaxed">
              Every student we reach is a future authentic, resilient, impactful
              leader — and we're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ===================================================== */}
      <section
        id="contact"
        className="scroll-mt-24 py-24 px-6 sm:px-8 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">
              Contact Us
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-slate-950">
              Let's start a conversation.
            </h2>

            <p className="mt-5 text-lg text-slate-600">
              Have a question, need assistance, or want to learn more about
              Erevna Leadership Academy? We would love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8">
            {/* CONTACT INFORMATION */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 md:p-10 text-white shadow-2xl">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

              <div className="relative">
                <p className="text-blue-400 text-sm font-bold uppercase tracking-widest">
                  Get in Touch
                </p>

                <h3 className="mt-3 text-3xl font-bold">We're here to help.</h3>

                <p className="mt-5 text-slate-400 leading-relaxed">
                  Whether you are a student, parent, educator, organisation or
                  potential partner, we would love to hear from you.
                </p>

                <div className="mt-10 space-y-7">
                  <a
                    href="mailto:foserevnainc@gmail.com"
                    className="group flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl transition group-hover:bg-blue-500">
                      ✉
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Email
                      </p>

                      <p className="mt-1 font-semibold text-lg group-hover:text-blue-400 transition">
                        foserevnainc@gmail.com
                      </p>
                    </div>
                  </a>

                  <a
                    href="tel:+2348125903687"
                    className="group flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl transition group-hover:bg-blue-500">
                      ☎
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Phone
                      </p>

                      <p className="mt-1 font-semibold text-lg group-hover:text-blue-400 transition">
                        +234 812 590 3687
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                      🇳🇬
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Location
                      </p>

                      <p className="mt-1 font-semibold text-lg">Nigeria</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACT FORM */}
            <form
              onSubmit={submitContact}
              className="rounded-3xl border border-slate-200 bg-white p-7 md:p-10 shadow-xl"
            >
              <h3 className="text-2xl font-bold text-slate-950">
                Send Us a Message
              </h3>

              <p className="mt-2 text-slate-500">
                Fill in the form and our team will get back to you.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-7">
                <input
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Full Name"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  required
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Email Address"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <input
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Phone Number (optional)"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    phone: e.target.value,
                  })
                }
              />

              <input
                required
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Subject"
                value={contactForm.subject}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    subject: e.target.value,
                  })
                }
              />

              <textarea
                required
                rows={6}
                className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Write your message..."
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    message: e.target.value,
                  })
                }
              />

              {contactSuccess && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                  {contactSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {sending ? "Sending Message..." : "Send Message →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14">
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1">
                  <Image
                    src="/logo4.png"
                    alt="Erevna Logo"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="font-bold">Erevna Leadership Academy</p>
                  <p className="text-xs text-blue-300">
                    Learn · Lead · Succeed
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
                Building capable, confident and authentic young leaders through
                accessible education, mentorship and structured learning.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>

              <div className="space-y-3 text-sm text-slate-400">
                <Link
                  href="#about"
                  className="block hover:text-white transition"
                >
                  About Erevna
                </Link>

                <Link
                  href="#programs"
                  className="block hover:text-white transition"
                >
                  Our Programs
                </Link>

                <Link
                  href="#leadership"
                  className="block hover:text-white transition"
                >
                  Our Founder
                </Link>

                <Link
                  href="#contact"
                  className="block hover:text-white transition"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>

              <div className="space-y-3 text-sm text-slate-400">
                <a
                  href="mailto:foserevnainc@gmail.com"
                  className="block hover:text-white transition"
                >
                  foserevnainc@gmail.com
                </a>

                <a
                  href="tel:+2348125903687"
                  className="block hover:text-white transition"
                >
                  +234 812 590 3687
                </a>

                <p>Nigeria</p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-7 flex flex-col md:flex-row justify-between gap-3 text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} Erevna Leadership Academy. All Rights
              Reserved.
            </p>

            <p>Learn. Lead. Succeed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
