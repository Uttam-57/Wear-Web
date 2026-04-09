import { ROUTES } from '@/shared/constants/routes'
import NotificationsCenter from '@/features/notifications/components/NotificationsCenter'

export default function SellerNotificationsPage() {
  return <NotificationsCenter homeRoute={ROUTES.SELLER_DASHBOARD} />
}