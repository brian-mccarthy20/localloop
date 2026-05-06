'use client'

import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Returns true when the viewport is below the mobile breakpoint.
 * Renders consistently on the server (always false) and updates after mount.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}
