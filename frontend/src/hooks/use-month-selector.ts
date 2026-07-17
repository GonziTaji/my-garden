import { useState, useCallback, type ChangeEventHandler } from 'react'

export interface UseMonthSelectorParams {
  defaultMonthIndex?: number
  defaultYear?: number
}

export function useMonthSelector({ defaultMonthIndex, defaultYear }: UseMonthSelectorParams) {
  const [monthIndex, setMonthIndex] = useState(() => defaultMonthIndex || new Date().getMonth())
  const [year, setYear] = useState(() => defaultYear || new Date().getFullYear())

  const setNextMonth = useCallback(() => {
    if (monthIndex === 11) {
      setMonthIndex(0)
      setYear((y) => y + 1)
    } else {
      setMonthIndex((state) => state + 1)
    }
  }, [monthIndex])

  const setPreviousMonth = useCallback(() => {
    if (monthIndex === 0) {
      setMonthIndex(11)
      setYear((y) => y - 1)
    } else {
      setMonthIndex((state) => state - 1)
    }
  }, [monthIndex])

  const handleInputMonthChange: ChangeEventHandler<HTMLInputElement> = useCallback((ev) => {
    const [yyyy, mm] = ev.currentTarget.value.split('-')
    setMonthIndex(Number(mm) - 1)
    setYear(Number(yyyy))
  }, [])

  return {
    monthIndex,
    year,
    setPreviousMonth,
    setNextMonth,
    handleInputMonthChange,
  }
}
