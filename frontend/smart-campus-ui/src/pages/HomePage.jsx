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
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Building2,
    title: 'Facilities Visibility',
    description: 'Track room occupancy and operational health across all buildings in one place with real-time heatmaps.',
  },
  {
    icon: CalendarCheck2,
    title: 'Booking Workflow',
    description: 'Approve, reject, and monitor bookings with clear status indicators and automated conflict resolution.',
  },
  {
    icon: Ticket,
    title: 'Maintenance Tickets',
    description: 'Prioritize incidents, assign technicians instantly, and close issues faster with SLA tracking.',
  },
  {
    icon: Bell,
    title: 'Notification Center',
    description: 'Keep staff informed with timely alerts, push notifications, and role-targeted announcements.',
  },
]

const steps = [
  { label: 'Step 1: Authenticate', detail: 'Login securely with role-based access control or Google Workspace.' },
  { label: 'Step 2: Monitor', detail: 'View key metrics, urgent events, and current campus activity on a unified dashboard.' },
  { label: 'Step 3: Act', detail: 'Handle bookings, tickets, and notifications rapidly based on your specific role.' },
]

const stats = [
  { icon: Users, value: '1,200+', label: 'Active users' },
  { icon: Wrench, value: '98%', label: 'Ticket SLA met' },
  { icon: ShieldCheck, value: '24/7', label: 'System uptime' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 font-body text-slate-900 selection:bg-blue-500/30 selection:text-blue-900">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <p className="font-display text-xl font-bold tracking-tight">Smart Campus Hub</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 transition hover:text-slate-900">Sign in</Link>
          <Link to="/signup" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 hover:bg-slate-800 hover:shadow-md">
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-20 text-center lg:pt-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Smart Campus Operations Platform 2.0
            </span>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Keep Campus Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Clear & Fast.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
              A single, high-performance workspace for administrators, technicians, and users to manage facilities, bookings, tickets, and notifications without the chaos.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40">
                Start for free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="flex w-full sm:w-auto items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                Explore Platform
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-20 w-full max-w-5xl relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/40 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5">
              <img
                src="/hero-campus.svg"
                alt="Dashboard Preview"
                className="rounded-xl border border-slate-200/50 w-full object-cover bg-slate-100"
                style={{ aspectRatio: '16/9' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-[500px] flex items-center justify-center bg-slate-100 rounded-xl"><p class="text-slate-400 font-medium">Dashboard Interface Preview</p></div>';
                }}
              />
            </div>
          </motion.div>
        </section>

        <section id="features" className="relative bg-white py-24 border-y border-slate-200">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Features That Keep Teams Aligned</h2>
              <p className="mt-4 text-lg text-slate-600">Everything you need to orchestrate campus operations from a single pane of glass.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-24">
          <div className="rounded-3xl bg-slate-900 px-6 py-16 sm:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-500 opacity-20 blur-[80px]" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
                <p className="mt-4 text-lg text-slate-300">A streamlined workflow designed to eliminate bottlenecks and reduce operational friction.</p>
                <div className="mt-8 space-y-6">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 }}
                      className="flex gap-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-white">{step.label.split(': ')[1]}</p>
                        <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={stat.label} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/50">
                        <stat.icon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-white">{stat.value}</p>
                        <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 text-center text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
             <Zap className="h-5 w-5 text-slate-400" />
             <span className="font-display font-bold text-slate-900">Smart Campus</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Smart Campus Operations Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
