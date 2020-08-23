import State from 'controls-state'
import GUI from 'controls-gui'

const DEBUG = new URL(window.location.href).searchParams.has('debug')

export const debugState = State({
  axis: DEBUG,
})

DEBUG &&
  GUI(debugState, {
    root: document.body,
    containerCSS: 'max-width:350px; position: fixed; top: 0; right: 0',
  })
