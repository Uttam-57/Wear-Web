import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const MobileStickyCartBar = ({
  anchorId,
  visiblePrice,
  disabled,
  onAddToCart,
  onBuyNow,
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const anchor = document.getElementById(anchorId)
      if (!anchor) {
        setVisible(false)
        return
      }

      const rect = anchor.getBoundingClientRect()
      setVisible(rect.bottom < 0)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [anchorId])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[95] border-t border-border bg-surface-elevated/95 px-md py-sm shadow-nav md:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <div className="min-w-[88px] text-sm font-semibold text-text-primary">{formatPrice(visiblePrice)}</div>
        <Button size="sm" fullWidth disabled={disabled} onClick={onAddToCart}>Add to Cart</Button>
        <Button size="sm" variant="secondary" fullWidth disabled={disabled} onClick={onBuyNow}>Buy Now</Button>
      </div>
    </div>
  )
}

export default MobileStickyCartBar
