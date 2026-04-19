import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck2,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Building2,
    title: 'Facilities Visibility',
    description: 'Track room occupancy and operational health across all buildings in one place.',
  },
  {
    icon: CalendarCheck2,
    title: 'Booking Workflow',
    description: 'Approve, reject, and monitor bookings with clear status indicators and history.',
  },
  {
    icon: Ticket,
    title: 'Maintenance Tickets',
    description: 'Prioritize incidents, assign technicians, and close issues faster.',
  },
  {
    icon: Bell,
    title: 'Notification Center',
    description: 'Keep staff informed with timely alerts and role-targeted announcements.',
  },
]

const steps = [
  { label: '1. Authenticate', detail: 'Login securely with credentials or Google Sign-In.' },
  { label: '2. Monitor', detail: 'View key metrics, urgent events, and current campus activity.' },
  { label: '3. Act', detail: 'Handle bookings, tickets, and notifications based on your role.' },
]

const stats = [
  { icon: Users, value: '1,200+', label: 'Active users' },
  { icon: Wrench, value: '98%', label: 'Ticket SLA met' },
  { icon: ShieldCheck, value: '24/7', label: 'System uptime' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.25),_transparent_40%),#f4f7ff] font-body text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-xl font-bold">Smart Campus Hub</p>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/60">Login</Link>
          <Link to="/signup" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Signup</Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-6 lg:grid-cols-2 lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Smart Campus Operations Platform
          </p>
          <h1 className="font-display text-4xl font-black leading-tight text-slate-900 lg:text-5xl">
            Keep Campus Operations Clear, Fast, and Coordinated.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600 lg:text-lg">
            A single workspace for administrators, technicians, and students to manage facilities, bookings,
            tickets, and notifications without confusion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="rounded-xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white">
              Explore Features
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }} className="relative">
          <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-10 right-2 h-40 w-40 rounded-full bg-fuchsia-200/50 blur-3xl" />
          <div className="relative rounded-3xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur">
            <img
              src="/hero-campus.svg"
              alt="Campus operations team"
              className="h-80 w-full rounded-2xl object-cover"
            />
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-display text-3xl font-bold text-slate-900">Features That Keep Teams Aligned</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-soft backdrop-blur"
            >
              <feature.icon className="h-6 w-6 text-blue-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <h2 className="font-display text-3xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{step.label}</p>
              <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white lg:px-10">
          <h2 className="font-display text-2xl font-bold">Campus Highlights</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 p-4">
                <stat.icon className="h-5 w-5 text-blue-300" />
                <p className="mt-3 text-2xl font-black">{stat.value}</p>
                <p className="text-sm text-slate-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/60 py-6 text-center text-sm text-slate-500">
        <p>Smart Campus Operations Hub • Built for clear decisions and faster actions.</p>
      </footer>
    </div>
  )
}
