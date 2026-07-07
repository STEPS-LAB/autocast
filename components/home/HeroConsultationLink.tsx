'use client'

import { ArrowRight } from 'lucide-react'
import { smoothScrollToAnchor } from '@/lib/utils'

export default function HeroConsultationLink() {
  return (
    <a
      href="#contact"
      onClick={(e) => smoothScrollToAnchor(e, '#contact')}
      className="order-2 lg:order-1 flex w-full md:inline-flex md:w-auto md:min-w-[29rem] shrink-0 self-stretch items-center justify-center gap-2 rounded-md px-5 md:px-8 py-4 md:py-0 md:min-h-12 text-[15px] md:text-base leading-snug text-center whitespace-normal md:whitespace-nowrap bg-accent text-black font-bold shadow-[0_12px_40px_-10px_rgb(255_193_7/0.55)] hover:bg-accent-hover hover:scale-[1.02] transition-all duration-500"
    >
      Записатись на безкоштовну консультацію майстра
      <ArrowRight size={18} className="shrink-0" aria-hidden />
    </a>
  )
}
