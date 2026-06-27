const DateUtils = {
  toInputValue,
  getDateRange,
  getMonthDays,
}

export default DateUtils

function toInputValue(date: Date) {
  let mm = (date.getMonth() + 1).toString()
  let dd = date.getDate().toString()

  if (Number(mm) < 10) {
    mm = `${0}${mm}`
  }

  if (Number(dd) < 10) {
    dd = `${0}${dd}`
  }

  return `${date.getFullYear()}-${mm}-${dd}`
}

/**
  * @param {number} marginLeft the days before the current date to be included in the range
* @param {number} marginRight the days after the current date to be included in the range
* */
function getDateRange(marginLeft: number, marginRight: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = -marginLeft + 2; i <= marginRight; i++) {
    const d = new Date(today)

    d.setDate(d.getDate() + i)

    dates.push(d.toLocaleDateString())
  }
  return dates
}

function getMonthDays(numericMonth: number) {
  if (numericMonth === 2) {
    const YYYY = new Date().getFullYear()
    if (YYYY % 100 === 0) {
      if (YYYY % 400 === 0) {
        return 29
      }
    } else if (YYYY % 4 === 0) {
      return 29
    }

    return 28
  }

  switch (numericMonth) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;

    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
  }

  return 0
}
