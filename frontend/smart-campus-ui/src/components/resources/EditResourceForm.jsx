import ResourceForm from './ResourceForm'

export default function EditResourceForm({ initialValues, onSubmit, onCancel, busy }) {
  return (
    <ResourceForm
      title="Edit Resource"
      submitLabel="Update Resource"
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      busy={busy}
    />
  )
}
