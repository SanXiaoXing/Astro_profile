export function defaultPaperMonth(months, date = new Date()) {
  const current = paperMonth(date)
  return months.includes(current) ? current : months[0] || ''
}

export function paperMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(date))
  return `${parts.find((part) => part.type === 'year').value}-${parts.find((part) => part.type === 'month').value}`
}

export function constrainPaper(x, y, width, height) {
  const halfWidth = Math.min(60, width / 2),
    halfHeight = Math.min(60, height / 2)
  return {
    x: Math.max(halfWidth, Math.min(width - halfWidth, x)),
    y: Math.max(halfHeight, Math.min(height - halfHeight, y)),
  }
}

export function layoutPapers(count, width) {
  const columns = Math.max(1, Math.floor(width / 140))
  const rows = Math.ceil(count / columns)
  const height = Math.max(360, rows * 150 + 60)
  const positions = Array.from({ length: count }, (_, index) =>
    constrainPaper(
      (((index % columns) + 0.5) * width) / columns +
        Math.sin(index * 7.3) * 16,
      100 + Math.floor(index / columns) * 150 + Math.cos(index * 4.7) * 24,
      width,
      height,
    ),
  )
  return { height, positions }
}
