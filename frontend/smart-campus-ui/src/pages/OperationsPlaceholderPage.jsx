import { motion } from 'framer-motion'
import EmptyState from '../components/ui/EmptyState'

export default function OperationsPlaceholderPage({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <EmptyState
        title={`${title} module is ready for integration`}
        description="This section is scaffolded with the same production UI pattern and can now be connected to your backend endpoints."
      />
    </motion.div>
  )
}
