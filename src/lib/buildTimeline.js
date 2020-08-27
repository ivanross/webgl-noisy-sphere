import gsap from 'gsap'

export function buildTimeline(config, defaultOptions) {
  const timeline = gsap.timeline()
  const vars = (o) => ({ ...defaultOptions, ...o })

  config.forEach((block, i) => {
    const label = String(i)
    timeline.addLabel(label)

    block.forEach(([obj, vals]) => {
      timeline.to(obj, vars(vals), label)
    })
  })

  timeline.addLabel(String(config.length))
  timeline.pause()

  return timeline
}
