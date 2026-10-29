export function nextImageIndex(index, direction, length) {
  return (index + direction + length) % length
}

export function imageTransform(source, target) {
  if (!source.width || !source.height || !target.width || !target.height) return null
  return `translate(${source.left - target.left}px, ${source.top - target.top}px) scale(${source.width / target.width}, ${source.height / target.height})`
}
