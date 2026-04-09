import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/features/user/api'

const useAddresses = () => {
  const { data, setData, loading, error, run } = useAsync([], { cacheKey: 'user:addresses' })

  const refresh = useCallback(() => {
    return run(() => listAddresses()).then((addresses) => {
      setData(addresses || [])
      return addresses
    })
  }, [run, setData])

  const create = useCallback(
    (payload) => run(() => createAddress(payload)).then(() => refresh()),
    [run, refresh]
  )

  const update = useCallback(
    (id, payload) => run(() => updateAddress(id, payload)).then(() => refresh()),
    [run, refresh]
  )

  const remove = useCallback(
    (id) => run(() => deleteAddress(id)).then(() => refresh()),
    [run, refresh]
  )

  const setDefault = useCallback(
    (id) => run(() => setDefaultAddress(id)).then(() => refresh()),
    [run, refresh]
  )

  return {
    addresses: data || [],
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    setDefault,
  }
}

export default useAddresses
