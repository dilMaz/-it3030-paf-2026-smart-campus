import ResourceForm from './ResourceForm'

export default function AddResourceForm({ onSubmit, onCancel, busy }) {
  return (
    <ResourceForm
      title="Add Resource"
      submitLabel="Create Resource"
      onSubmit={onSubmit}
      onCancel={onCancel}
      busy={busy}
    />
  )
}
