'use client'

import { MapPin } from 'lucide-react'

interface Props {
  embedUrl: string
}

export default function GoogleMapEmbed({ embedUrl }: Props) {
  return (
    <div className="mt-14">
      <div className="flex items-center gap-3 mb-4">
        <MapPin size={22} className="text-text-muted" />
        <h2 className="text-[1.1rem] font-semibold text-text-primary">Як нас знайти</h2>
      </div>
      <div className="rounded-md overflow-hidden border border-border h-80 md:h-[22rem]">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Autocast на карті"
        />
      </div>
    </div>
  )
}
