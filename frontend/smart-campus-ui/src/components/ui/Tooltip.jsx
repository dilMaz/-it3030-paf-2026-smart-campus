export default function Tooltip({ text, children }) {
  return (
    <span title={text} className="cursor-help">
      {children}
    </span>
  )
}
