import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register as registerApi } from '@/features/auth/api'
import useAuthStore from '@/features/auth/authSlice'
import { getApiError } from '@/shared/services/apiClient'
import { isValidEmail, isValidPassword, isValidPhone } from '@/shared/utils/validators'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/app'

const NAME_RE = /^[a-zA-Z\s'-]{1,50}$/

const useRegister = () => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const submit = async ({ firstName, lastName, email, phone, password, confirmPassword, role }) => {
    const nextErrors = {}

    if (!NAME_RE.test((firstName || '').trim())) nextErrors.firstName = 'First name must be 1-50 letters'
    if (!NAME_RE.test((lastName || '').trim())) nextErrors.lastName = 'Last name must be 1-50 letters'
    if (!isValidEmail(email || '')) nextErrors.email = 'Enter a valid email address'
    if (phone?.trim() && !isValidPhone(phone)) nextErrors.phone = 'Enter a valid phone number'
    if (!isValidPassword(password || '')) {
      nextErrors.password = 'Use 8+ chars with uppercase, number and special character'
    }
    if (!confirmPassword || confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }
    if (![ROLES.CUSTOMER, ROLES.SELLER].includes(role)) {
      nextErrors.role = 'Select customer or seller'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})
    setApiError('')

    try {
      const { accessToken, user } = await registerApi({
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
      })
      login({ user, accessToken })

      if (user.role === ROLES.SELLER) {
        navigate(ROUTES.SELLER_PENDING, { replace: true })
        return
      }
      navigate(ROUTES.HOME, { replace: true })
    } catch (error) {
      setApiError(getApiError(error, 'Unable to register right now'))
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

export default useRegister
