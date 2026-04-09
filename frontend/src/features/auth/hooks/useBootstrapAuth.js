import { useEffect, useState } from 'react'
import { refreshToken } from '@/features/auth/api'
import { getProfile } from '@/features/user/api'
import useAuthStore from '@/features/auth/authSlice'

let bootstrapAuthInFlight = null

const useBootstrapAuth = () => {
  const [booting, setBooting] = useState(true)
  const hydrateSession = useAuthStore((s) => s.hydrateSession)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        if (!bootstrapAuthInFlight) {
          bootstrapAuthInFlight = refreshToken()
            .then((refresh) => {
              if (!refresh?.accessToken) throw new Error('Missing access token')
              return getProfile(refresh.accessToken).then((profile) => ({
                profile,
                accessToken: refresh.accessToken,
              }))
            })
            .finally(() => {
              bootstrapAuthInFlight = null
            })
        }

        const payload = await bootstrapAuthInFlight
        if (!mounted) return

        hydrateSession({
          user: payload.profile,
          accessToken: payload.accessToken,
        })
      } catch {
        if (mounted) logout()
      } finally {
        if (mounted) setBooting(false)
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [hydrateSession, logout])

  return { booting }
}

export default useBootstrapAuth
