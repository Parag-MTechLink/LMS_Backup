import clsx from 'clsx'

export default function Card({ children, title, icon, hover = true, gradient = false, className, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-200 shadow-lg bg-white transition duration-300 overflow-hidden',
        hover && 'hover:-translate-y-0.5 hover:shadow-xl',
        gradient && 'bg-gradient-to-br from-white via-primary/5 to-primary/10',
        className
      )}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
