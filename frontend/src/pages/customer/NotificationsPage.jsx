import { ROUTES } from '@/shared/constants/routes'
import NotificationsCenter from '@/features/notifications/components/NotificationsCenter'

export default function NotificationsPage() {
  return <NotificationsCenter homeRoute={ROUTES.HOME} />
}
