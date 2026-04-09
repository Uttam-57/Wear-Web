import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '@/features/auth/api'
import { getSellerProfile } from '@/features/user/api'
import useAuthStore from '@/features/auth/authSlice'
import { getApiError } from '@/shared/services/apiClient'
import { isValidEmail } from '@/shared/utils/validators'
import { ROLES, USER_STATUS } from '@/shared/constants/app'
import { ROUTES } from '@/shared/constants/routes'

const useLogin = () => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const submit = async ({ email, password }) => {
    const nextErrors = {}

    if (!email || !isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    if (!password) {
      nextErrors.password = 'Password is required'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})
    setApiError('')

    try {
      const { accessToken, user } = await loginApi({ email, password })
      login({ user, accessToken })

      if (user.role === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
        return
      }

      if (user.role === ROLES.SELLER) {
        if (user.status === USER_STATUS.PENDING) {
          try {
            const profile = await getSellerProfile()
            const sellerTarget = profile?.profileComplete ? ROUTES.SELLER_PENDING : ROUTES.SELLER_PROFILE_SETUP
            navigate(sellerTarget, { replace: true })
            return
          } catch (error) {
            const fallback = error?.response?.status === 404 ? ROUTES.SELLER_PROFILE_SETUP : ROUTES.SELLER_PENDING
            navigate(fallback, { replace: true })
            return
          }
        }

        navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
        return
      }

      navigate(ROUTES.HOME, { replace: true })
    } catch (error) {
      setApiError(getApiError(error, 'Unable to login right now'))
    } finally {
      setLoading(false)
    }
  }

  const clearErrors = () => {
    setErrors({})
    setApiError('')
  }

  return { submit, loading, errors, apiError, clearErrors }
}

export default useLogin
