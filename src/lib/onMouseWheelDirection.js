import _ from 'lodash-es'

function detectMouseWheelDirection(fn) {
  let prevDelta = 0

  // debounce because on mac the delta has an initial increasing speed
  const debfn = _.debounce(fn, 200, { leading: true, trailing: false })

  return function (e) {
    const delta = e.deltaY

    const isOppositeDirection = delta * prevDelta <= 0
    if (isOppositeDirection) prevDelta = 0

    const isFasterThanBefore = Math.abs(delta) > Math.abs(prevDelta)
    prevDelta = delta

    const event = { direction: Math.sign(delta) }

    if (isFasterThanBefore) debfn(event)
  }
}

export function onMouseWheelDirection(fn) {
  window.addEventListener('mousewheel', detectMouseWheelDirection(fn))
}
