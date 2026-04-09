import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'
import { getColorImageSet } from '@/features/products/utils/productBrowse.utils'

const ProductImageGallery = ({ product, selectedColorName }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const scrollLockRef = useRef({
    bodyOverflow: '',
    bodyPosition: '',
    bodyTop: '',
    bodyWidth: '',
    htmlOverflow: '',
    scrollY: 0,
  })

  const images = useMemo(() => {
    const selectedImages = getColorImageSet(product, selectedColorName)
    return selectedImages.length ? selectedImages : getColorImageSet(product)
  }, [product, selectedColorName])

  const activeImage = images[activeIndex] || images[0]

  useEffect(() => {
    if (!isLightboxOpen && !showVideo) return

    scrollLockRef.current = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
      scrollY: window.scrollY,
    }

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollLockRef.current.scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = scrollLockRef.current.htmlOverflow
      document.body.style.overflow = scrollLockRef.current.bodyOverflow
      document.body.style.position = scrollLockRef.current.bodyPosition
      document.body.style.top = scrollLockRef.current.bodyTop
      document.body.style.width = scrollLockRef.current.bodyWidth
      window.scrollTo(0, scrollLockRef.current.scrollY)
    }
  }, [isLightboxOpen, showVideo])

  const clampZoom = (value) => Math.min(3, Math.max(1, value))

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setZoomScale(1)
  }

  const openLightbox = () => {
    setZoomScale(1)
    setIsLightboxOpen(true)
  }

  return (
    <section className="space-y-sm">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-elevated">
        {activeImage ? (
          <button
            type="button"
            onClick={openLightbox}
            className="group relative block w-full"
          >
            <img
              src={activeImage}
              alt={product?.name}
              className="h-[420px] w-full object-cover sm:h-[520px]"
            />
            <span className="absolute right-sm top-sm rounded-full border border-white/40 bg-black/70 px-sm py-1 text-xs font-semibold text-white shadow">
              Zoom
            </span>
          </button>
        ) : (
          <div className="flex h-[420px] items-center justify-center text-sm text-text-muted">No image available</div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn('overflow-hidden rounded-md border', activeIndex === index ? 'border-primary' : 'border-border')}
            >
              <img src={image} alt={`${product?.name} thumbnail ${index + 1}`} className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {product?.video ? (
        <Button variant="secondary" size="sm" onClick={() => setShowVideo(true)}>
          Watch Video
        </Button>
      ) : null}

      {isLightboxOpen ? (
        createPortal(
          <div
            className="fixed inset-0 z-[1000] h-screen w-screen overflow-hidden bg-text-primary/95"
            role="dialog"
            aria-modal="true"
            onClick={closeLightbox}
          >
            <div className="mx-auto my-[4vh] flex h-[92vh] w-[80vw] max-w-[80vw] min-w-0 flex-col gap-sm" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between gap-sm rounded-lg border border-white/25 bg-black/60 px-sm py-2 backdrop-blur-sm">
                <p className="truncate text-sm font-semibold text-white drop-shadow">{product?.name}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded border border-white/60 bg-black/55 px-2 py-1 text-sm font-semibold text-white"
                    onClick={() => setZoomScale((prev) => clampZoom(prev - 0.2))}
                  >
                    -
                  </button>
                  <span className="min-w-12 rounded bg-black/60 px-2 py-1 text-center text-xs font-semibold text-white">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    className="rounded border border-white/60 bg-black/55 px-2 py-1 text-sm font-semibold text-white"
                    onClick={() => setZoomScale((prev) => clampZoom(prev + 0.2))}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="rounded border border-white/60 bg-black/55 px-sm py-1 text-sm font-semibold text-white"
                    onClick={closeLightbox}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black/40">
                <img
                  src={activeImage}
                  alt={product?.name}
                  className="h-auto max-h-full w-auto max-w-full select-none object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
                  onDoubleClick={() => setZoomScale((prev) => (prev > 1 ? 1 : 2))}
                  onWheel={(event) => {
                    event.preventDefault()
                    const delta = event.deltaY > 0 ? -0.12 : 0.12
                    setZoomScale((prev) => clampZoom(prev + delta))
                  }}
                />
              </div>

              <p className="rounded-lg border border-white/20 bg-black/55 px-sm py-2 text-center text-xs font-medium text-white">
                Click outside to close. Double click image to toggle zoom.
              </p>
            </div>
          </div>,
          document.body,
        )
      ) : null}

      {showVideo ? (
        createPortal(
          <div
            className="fixed inset-0 z-[1000] h-screen w-screen bg-text-primary/85 p-sm sm:p-md"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowVideo(false)}
          >
            <div className="mx-auto my-[6vh] flex h-[88vh] w-[80vw] max-w-[80vw] min-w-0 flex-col justify-center" onClick={(event) => event.stopPropagation()}>
              <div className="space-y-sm rounded-xl border border-white/40 bg-black/70 p-md text-white backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-white">Product Video</p>
                  <button type="button" className="rounded border border-white/60 bg-black/55 px-sm py-1 text-sm font-semibold text-white" onClick={() => setShowVideo(false)}>
                    Close
                  </button>
                </div>
                <div className="aspect-video overflow-hidden rounded-lg border border-border">
                  <iframe
                    src={product.video}
                    title={`${product?.name} video`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      ) : null}
    </section>
  )
}

export default ProductImageGallery
