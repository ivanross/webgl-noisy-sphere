export function onTouchDirection(fn) {
  let startY = 0
  let moved = false
  window.addEventListener('touchstart', (e) => {
    moved = false
    startY = e.touches[0].clientY
  })

  window.addEventListener('touchmove', (e) => {
    if (moved) return
    moved = true
    const clientY = e.touches[0].clientY
    const event = { direction: Math.sign(startY - clientY) }
    fn(event)
  })
}
