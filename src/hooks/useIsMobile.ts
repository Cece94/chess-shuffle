'use client'

import { useEffect, useState } from 'react'

/** True below Tailwind `md` (768px). */
export function useIsMobile(breakpointPx = 768): boolean {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [breakpointPx])

  return mobile
}
