import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'

export default function Sidebar({ links = [], title = '' }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-surface-elevated/95 p-md shadow-soft lg:block">
      <div className="mb-lg rounded-lg border border-border bg-surface-3 px-md py-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Workspace</p>
        <h2 className="mt-1 font-display text-lg text-text-primary">{title}</h2>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              cn(
                'group rounded-md px-md py-2 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
