import { Suspense, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import ErrorBoundary from '@/shared/ui/organisms/ErrorBoundary'
import Spinner from '@/shared/ui/atoms/Spinner'
import ToastStack from '@/shared/ui/organisms/ToastStack'
import useUIStore from '@/shared/uiSlice'
import useBootstrapAuth from '@/features/auth/hooks/useBootstrapAuth'

export default function App() {
  const theme = useUIStore((s) => s.theme)
  const { booting } = useBootstrapAuth()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>}>
        <RouterProvider router={router} />
      </Suspense>
      <ToastStack />
    </ErrorBoundary>
  )
}