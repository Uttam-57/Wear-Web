const Label = ({ htmlFor, required = false, children }) => {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </label>
  )
}

export default Label
