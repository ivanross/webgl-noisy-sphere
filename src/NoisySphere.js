import createREGL from 'regl'
import createCamera from 'regl-camera'
import vec3 from 'gl-vec3'
import mat3 from 'gl-mat3'
import mat4 from 'gl-mat4'
import mouseChange from 'mouse-change'
import sphere from './icosphere.json'
import vert from './noisy.vert'
import frag from './noisy.frag'
import { debugState } from './debug-state'
import createAxis from './createAxis'
const getLightColor = (light) => light.color.map((ch) => ch * light.intensity)

const scaledCoord = (pos, length, res) => ((pos * res) / length - 0.5) * 2

export class NoisySphere {
  constructor(container) {
    this.regl = createREGL(container)
    this.camera = createCamera(this.regl, {
      damping: 0,
      noScroll: true,
      distance: 5,
      fvoy: Math.PI / 2,
    })

    this.lights = this.regl({
      context: {
        pointLightPos: (context) => {
          const x = scaledCoord(this.mouse.x, context.viewportWidth, context.pixelRatio)
          const y = scaledCoord(this.mouse.y, context.viewportHeight, context.pixelRatio)

          const front = vec3.normalize([], vec3.sub([], context.eye, context.center))
          const right = vec3.normalize([], vec3.cross([], context.up, front))
          const up = vec3.normalize([], vec3.cross([], right, vec3.negate([], front)))

          const rot = mat4.identity([])
          mat4.rotate(rot, rot, (x * Math.PI) / 2, up) // ROTATE X
          mat4.rotate(rot, rot, (y * Math.PI) / 2, right) // ROTATE Y

          const p = vec3.normalize([], context.eye).map((c) => c * 2)
          vec3.transformMat4(p, p, rot)

          return p
        },
      },

      uniforms: {
        // AMBIENT LIGHT
        'ambientLight.col': (c, { ambientLight }) => getLightColor(ambientLight),

        // DIRECTIONAL LIGHT
        'dirLight.col': (c, { dirLight }) => getLightColor(dirLight),
        'dirLight.dir': (c, { dirLight }) =>
          vec3.normalize([], vec3.negate([], dirLight.direction)),

        // POINT LIGHT
        'pointLight.radius': this.regl.prop('pointLight.radius'),
        'pointLight.col': (c, { pointLight }) => getLightColor(pointLight),
        'pointLight.pos': this.regl.context('pointLightPos'),
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

    this.drawPoint = this.regl({
      vert: `
      attribute vec3 position;
      uniform mat4 mvp;
      void main() {
        gl_Position=mvp*vec4(position,1.);
      }
      `,
      frag: `
      precision mediump float;
      uniform vec3 color;
      void main() {
        gl_FragColor=vec4(color,1.);
      }
      `,
      attributes: {
        position: sphere.positions,
      },
      elements: sphere.cells,
      context: {
        model: (c, { position }) => {
          const model = mat4.identity([])
          mat4.translate(model, model, position)
          mat4.scale(model, model, [0.05, 0.05, 0.05])

          return model
        },
      },
      uniforms: {
        color: this.regl.prop('color'),
        model: this.regl.context('model'),
        mvp: ({ projection, view, model }) =>
          mat4.multiply([], projection, mat4.multiply([], view, model)),
      },
    })

    this.drawAxes = createAxis(this.regl)
    mouseChange((btn, x, y) => ((this.mouse.x = x), (this.mouse.y = y)))

    this.regl.frame(() => {
      try {
        this.regl.clear({ color: [0, 0, 0, 1] })
        this.camera({ center: [0, 0, 0] }, () => {
          this.lights(this.lightState, (state) => {
            this.drawSphere()
            this.drawPoint({
              position: state.pointLightPos,
              color: [1, 1, 1],
            })

            debugState.axis && this.drawAxes()
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
