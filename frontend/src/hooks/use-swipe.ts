import { useEffect, useState, type RefObject } from "react"

interface UseSwipeParams<T = HTMLElement> {
  swiper: RefObject<T | null>
}

/** unused */
export default function useSwipe<T extends HTMLElement>({ swiper }: UseSwipeParams<T>) {
  const [touchDragging, setTouchDragging] = useState(false)

  useEffect(() => {
    if (!swiper.current) {
      return
    }

    swiper.current.classList.add('transition-[transform]')

    if (!swiper.current.draggable) {
      swiper.current.draggable = true
    }

    const draggingHandler = (e: DragEvent) => {
      console.log(e.clientX, e.clientY)
      e.dataTransfer?.setDragImage(new Image(), 0, 0);
    }

    const touchStartHandler = (_: TouchEvent) => {
      setTouchDragging(true)
    }

    const touchMoveHandler = (e: TouchEvent) => {
      if (!swiper.current || !Array.isArray(e.touches) || e.touches.length === 0) {
        return
      }

      if (touchDragging) {
        const newY = e.touches[0].clientY
        swiper.current.style.top = newY
      }
    }

    const touchEndHandler = (_: TouchEvent) => {
      setTouchDragging(false)
    }

    console.log('adding event listener')
    swiper.current.addEventListener('drag', draggingHandler)
    swiper.current.addEventListener('touchstart', touchStartHandler)
    swiper.current.addEventListener('touchmove', touchMoveHandler)
    swiper.current.addEventListener('touchend', touchEndHandler)

    return () => {
      console.log('removing event listener')
      swiper.current?.removeEventListener('drag', draggingHandler)
    }


  }, [swiper.current])

  return null
}
