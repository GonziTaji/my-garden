const DateUtils = {
  toInputValue,
  getDateRange,
}

export default DateUtils

function toInputValue(date: Date) {
  let mm = (date.getMonth() + 1).toString()
  let dd = date.getDate().toString()

  if (Number(mm) < 9) {
    mm = `${0}${mm}`
  }

  if (Number(dd) < 9) {
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
    console.log(d)

    dates.push(d.toLocaleDateString())
  }
  return dates
}
