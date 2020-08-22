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
})

const getLightColor = (light) => light.color.map((ch) => ch * light.intensity)

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

    // AMBIENT LIGHT
    'ambientLight.col': (c, { ambientLight }) => getLightColor(ambientLight),

    // DIRECTIONAL LIGHT
    'dirLight.col': (c, { dirLight }) => getLightColor(dirLight),
    'dirLight.dir': (c, { dirLight }) =>
      vec3.normalize(
        [],
        dirLight.direction.map((ch) => ch * -1)
      ),

    // POINT LIGHT
    'pointLight.radius': regl.prop('pointLight.radius'),
    'pointLight.col': (c, { pointLight }) => getLightColor(pointLight),
    'pointLight.pos': (context) => {
      const pos = vec3.fromValues(
        (mouse.x / context.viewportWidth - 0.5) * 20,
        -(mouse.y / context.viewportHeight - 0.5) * 20,
        -2
      )

      vec3.transformMat4(pos, pos, mat4.invert([], context.view))
      return pos
    },
  },
})

regl.frame(() => {
  try {
    camera((state) => {
      regl.clear({ color: [0, 0, 0, 1] })
      drawSphere({
        ambientLight: {
          color: [1, 1, 1],
          intensity: 0.4,
        },
        dirLight: {
          color: [1, 1, 1],
          intensity: 0.5,
          direction: [0, -1, 0],
        },

        pointLight: {
          color: [1, 1, 1],
          intensity: 1,
          radius: 6,
        },
      })
    })
  } catch (e) {
    console.error(e)
    console.log('🧨 DESTROY regl')
    regl.destroy()
  }
})
