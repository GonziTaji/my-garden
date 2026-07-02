const DateUtils = {
  toInputValue,
  getMonthDays,
  toDisplayDate,
}

export default DateUtils

function toDisplayDate(date: Date) {
  return Intl.DateTimeFormat('default', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

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
      return 31

    case 4:
    case 6:
    case 9:
    case 11:
      return 30
  }

  return 0
}
