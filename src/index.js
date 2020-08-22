import vec3 from 'gl-vec3'
import mat3 from 'gl-mat3'
import mat4 from 'gl-mat4'
import mouseChange from 'mouse-change'
import sphere from './icosphere.json'
import vert from './noisy.vert'
import frag from './noisy.frag'

const mouse = { x: 0, y: 0 }
mouseChange((btn, x, y) => ((mouse.x = x), (mouse.y = y)))

const container = document.createElement('div')
container.style.width = '100vw'
container.style.height = '100vh'
document.getElementById('root').appendChild(container)
document.body.style.padding = 0
document.body.style.margin = 0

const regl = require('regl')(container)
const camera = require('regl-camera')(regl, {
  damping: 0,
  noScroll: true,
  distance: 5,
  // theta: Math.PI / 2,
})

const drawSphere = regl({
  vert,
  frag,
  attributes: {
    position: sphere.positions,
  },
  elements: sphere.cells,
  uniforms: {
    mvp: ({ projection, view }) => mat4.multiply([], projection, view),
    model: mat4.identity([]),
    normal: () => mat3.fromMat4([], mat4.transpose([], mat4.invert([], mat4.identity([])))),
    time: regl.context('time'),

    // POINT LIGHT
    'pointLight.radius': 6,
    'pointLight.col': vec3.fromValues(1, 0, 1),
    'pointLight.pos': (context) => {
      const pos = vec3.fromValues(
        (mouse.x / context.viewportWidth - 0.5) * 4,
        -(mouse.y / context.viewportHeight - 0.5) * 4,
        -2
      )

      vec3.transformMat4(pos, pos, mat4.invert([], context.view))
      return pos
    },

    // DIRECTIONAL LIGHT
    'dirLight.col': vec3.fromValues(0.5, 1, 1),
    'dirLight.dir': (c, { lightDir }) =>
      vec3.normalize(
        [],
        lightDir.map((c) => c * -1)
      ),
  },
})

regl.frame(() => {
  try {
    camera(() => {
      regl.clear({ color: [0, 0, 0, 1] })
      drawSphere({
        lightDir: [0, -1, 0],
      })
    })
  } catch (e) {
    console.error(e)
    console.log('🧨 DESTROY regl')
    regl.destroy()
  }
})
