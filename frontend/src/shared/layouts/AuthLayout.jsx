import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { Toggle } from '@/shared/ui'
import useUIStore from '@/shared/uiSlice'

const laneUp = [
  'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
]

const laneDown = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=900&q=80',
]

export default function AuthLayout() {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-surface lg:grid-cols-2">
      <section className="h-full overflow-y-auto px-md py-lg lg:px-xl">
        <div className="flex min-h-full items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-lg flex items-center justify-between">
              <Link to={ROUTES.HOME} className="font-display text-2xl tracking-tight text-text-primary">
                Wear Web
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-text-muted">Theme</span>
                <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </div>
            <div className="glass-panel p-lg">
              <Outlet />
            </div>
          </div>
        </div>
      </section>

      <section className="relative hidden h-full overflow-hidden bg-surface-secondary p-sm lg:block">
        <div className="grid h-full grid-cols-2 gap-sm">
          <div className="overflow-hidden rounded-xl">
            <div className="animate-marquee-up">
              {laneUp.map((src, i) => (
                <figure key={`${src}-${i}`} className="mb-sm w-full overflow-hidden rounded-xl border border-border/60">
                  <img
                    src={src}
                    alt="Fashion collage"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl">
            <div className="animate-marquee-down">
              {laneDown.map((src, i) => (
                <figure key={`${src}-rev-${i}`} className="mb-sm w-full overflow-hidden rounded-xl border border-border/60">
                  <img
                    src={src}
                    alt="Style editorial"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
