import { Outlet } from 'react-router-dom'
import Navbar from '@/shared/ui/organisms/Navbar'
import Footer from '@/shared/ui/organisms/Footer'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="animate-fade-up pb-lg pt-[122px] flex-1 md:pt-[126px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
