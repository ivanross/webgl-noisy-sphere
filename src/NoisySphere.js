import createREGL from 'regl'
import createCamera from 'regl-camera'
import vec3 from 'gl-vec3'
import mat3 from 'gl-mat3'
import mat4 from 'gl-mat4'
import mouseChange from 'mouse-change'
import sphere from './icosphere.json'
import vert from './noisy.vert'
import frag from './noisy.frag'

const getLightColor = (light) => light.color.map((ch) => ch * light.intensity)

export class NoisySphere {
  constructor(container) {
    this.regl = createREGL(container)
    this.camera = createCamera(this.regl, { damping: 0, noScroll: true, distance: 5 })

    this.lights = this.regl({
      uniforms: {
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
        'pointLight.radius': this.regl.prop('pointLight.radius'),
        'pointLight.col': (c, { pointLight }) => getLightColor(pointLight),
        'pointLight.pos': (context) => {
          const pos = vec3.fromValues(
            (this.mouse.x / context.viewportWidth - 0.5) * 20,
            -(this.mouse.y / context.viewportHeight - 0.5) * 20,
            -2
          )

          vec3.transformMat4(pos, pos, mat4.invert([], context.view))
          return pos
        },
      },
    })

    this.drawSphere = this.regl({
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
        time: this.regl.context('time'),
        colorPerc: () => this.interpolatedValues.colorPerc,
        noisePerc: () => this.interpolatedValues.noisePerc,
      },
    })

    mouseChange((btn, x, y) => ((this.mouse.x = x), (this.mouse.y = y)))

    this.regl.frame(() => {
      try {
        this.regl.clear({ color: [0, 0, 0, 1] })
        this.camera(() => {
          this.lights(this.lightState, () => {
            this.drawSphere()
          })
        })
      } catch (e) {
        console.error(e)
        console.log('🧨 DESTROY regl')
        this.regl.destroy()
      }
    })
  }

  interpolatedValues = {
    colorPerc: 0,
    noisePerc: 0,
  }

  mouse = { x: 0, y: 0 }

  lightState = {
    ambientLight: {
      color: [1, 1, 1],
      intensity: 0.2,
    },
    dirLight: {
      color: [1, 1, 1],
      intensity: 0.3,
      direction: [0.3, -1, -0.1],
    },
    pointLight: {
      color: [1, 1, 1],
      intensity: 1,
      radius: 6,
    },
  }
}
