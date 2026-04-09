import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getSellerProfile, setupSellerProfile, updateSellerProfile } from '@/features/user/api'

const useSellerProfile = () => {
  const { data, setData, loading, error, run } = useAsync(null, { cacheKey: 'user:seller-profile' })

  const refresh = useCallback(() => {
    return run(() => getSellerProfile()).then((profile) => {
      setData(profile)
      return profile
    })
  }, [run, setData])

  const setup = useCallback(
    (payload) => run(() => setupSellerProfile(payload)).then((profile) => {
      setData(profile)
      return profile
    }),
    [run, setData]
  )

  const update = useCallback(
    (payload) => run(() => updateSellerProfile(payload)).then((profile) => {
      setData(profile)
      return profile
    }),
    [run, setData]
  )

  return {
    sellerProfile: data,
    loading,
    error,
    refresh,
    setup,
    update,
  }
}

export default useSellerProfile
