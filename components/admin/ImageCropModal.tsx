'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ImageCropModalProps {
  open: boolean
  imageSrc: string
  onClose: () => void
  onApply: (croppedImage: string) => void
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function getCroppedDataUrl(imageSrc: string, cropPixels: Area | null): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')

  // Fallback: if cropPixels are not ready, save the whole image.
  if (!cropPixels) {
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const ctxFull = canvas.getContext('2d')
    if (!ctxFull) throw new Error('Canvas context is unavailable')
    ctxFull.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  canvas.width = cropPixels.width
  canvas.height = cropPixels.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context is unavailable')
  }

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  )

  return canvas.toDataURL('image/jpeg', 0.92)
}

export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onApply,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // When switching images in the queue, reset crop selection.
  // This avoids applying with stale cropPixels (or getting stuck if cropPixels isn't ready yet).
  useEffect(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    // Do not reset cropPixels here.
    // reset-in-effect can race with react-easy-crop's onCropComplete:
    // it may set cropPixels for the new image and then we immediately clear it,
    // which makes the middle images impossible to apply.
    // apply will be gated via cropPixelsForSrc match instead.
  }, [imageSrc])

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCropPixels(areaPixels)
  }, [])

  async function handleApply() {
    setIsSaving(true)
    try {
      const cropped = await getCroppedDataUrl(imageSrc, cropPixels)
      onApply(cropped)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Редагування зображення"
      description="Перемістіть зображення та налаштуйте масштаб."
      size="md"
    >
      <div className="space-y-4">
        <div className="relative h-72 rounded border border-border bg-bg-elevated overflow-hidden">
          <Cropper
            key={imageSrc}
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            showGrid={false}
            cropShape="rect"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div>
          <p className="text-xs text-text-muted mb-1">Масштаб</p>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Скасувати
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSaving}
          >
            Застосувати
          </Button>
        </div>
      </div>
    </Modal>
  )
}
