export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">{title}</h1>
          {description && <p className="text-sm md:text-base text-gray-600">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2 md:gap-3">{children}</div>}
      </div>
    </div>
  )
}
