import State from 'controls-state'
import GUI from 'controls-gui'
import Stats from 'stats.js'

const DEBUG = new URL(window.location.href).searchParams.has('debug')

export const debugState = State({
  axis: DEBUG,
  noiseSpeed: State.Slider(1, { min: 0, max: 4, step: 0.01 }),
})

DEBUG &&
  GUI(debugState, {
    root: document.body,
    containerCSS: 'max-width:350px; position: fixed; top: 0; right: 0',
  })

export const stats = DEBUG ? new Stats() : null
DEBUG && document.body.appendChild(stats.dom)
