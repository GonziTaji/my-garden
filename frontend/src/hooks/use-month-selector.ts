import { useState, type ChangeEventHandler } from 'react'

export interface UseMonthSelectorParams {
  defaultMonthIndex?: number
  defaultYear?: number
}

export function useMonthSelector({
  defaultMonthIndex,
  defaultYear,
}: UseMonthSelectorParams) {
  const [monthIndex, setMonthIndex] = useState(
    () => defaultMonthIndex || new Date().getMonth()
  )
  const [year, setYear] = useState(
    () => defaultYear || new Date().getFullYear()
  )

  function setNextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0)
      setYear((y) => y + 1)
    } else {
      setMonthIndex((state) => state + 1)
    }
  }

  function setPreviousMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11)
      setYear((y) => y + 1)
    } else {
      setMonthIndex((state) => state - 1)
    }
  }

  // function changeMonth(newMonthIndex: number, newYear?: number) {
  //   if (newMonthIndex === 12) {
  //     setMonthIndex(0)
  //   } else if (newMonthIndex === -1) {
  //     setMonthIndex(11)
  //   } else {
  //     setMonthIndex(newMonthIndex)
  //   }
  //
  //   if (newYear) {
  //     setYear(newYear)
  //   }
  // }

  const handleInputMonthChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const [yyyy, mm] = ev.currentTarget.value.split('-')
    setMonthIndex(Number(mm))
    setYear(Number(yyyy))
  }

  return {
    monthIndex,
    year,
    setPreviousMonth,
    setNextMonth,
    handleInputMonthChange,
  }
}
