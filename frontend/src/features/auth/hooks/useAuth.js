import useAuthStore from '@/features/auth/authSlice'
import { ROLES } from '@/shared/constants/app'

// ─────────────────────────────────────────────────────────────────────────────
// useAuth — application layer hook
//
// Read-only. Exposes auth state to components.
// Components never import useAuthStore directly — always go through useAuth.
// Mutations (login, logout) go through useLogin, useRegister hooks.
// ─────────────────────────────────────────────────────────────────────────────
const useAuth = () => {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  return {
    user,
    token,
    isLoggedIn,
    isCustomer: isLoggedIn && user?.role === ROLES.CUSTOMER,
    isSeller: isLoggedIn && user?.role === ROLES.SELLER,
    isAdmin: isLoggedIn && user?.role === ROLES.ADMIN,
  }
}

export default useAuth