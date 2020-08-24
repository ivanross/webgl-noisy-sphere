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
import { $ } from './utils'

const getLightColor = (light, alpha = false) =>
  alpha ? [...light.color, light.intensity] : light.color.map((ch) => ch * light.intensity)

const scaledCoord = (pos, length, res) => ((pos * res) / length - 0.5) * 2

export class NoisySphere {
  constructor(container) {
    this.container = $(container)
    this.regl = createREGL(this.container)
    this.camera = createCamera(this.regl, {
      damping: 0,
      zoomSpeed: 0,
      rotationSpeed: 0,
      noScroll: false,
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

          const p = vec3
            .normalize([], context.eye)
            .map((c) => c * this.lightState.pointLight.distance)
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
        minRadius: () => this.interpolatedValues.minRadius,
        maxRadius: () => this.interpolatedValues.maxRadius,
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
      uniform vec4 color;
      void main() {
        gl_FragColor=color;
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
      blend: { enable: true, func: { src: 'src alpha', dst: 'one minus src alpha' } },
    })

    this.drawAxes = createAxis(this.regl)
    mouseChange(this.container, (btn, x, y) => ((this.mouse.x = x), (this.mouse.y = y)))

    this.regl.frame(() => {
      try {
        this.regl.clear({ color: [0, 0, 0, 1] })
        this.camera(this.cameraState, () => {
          this.lights(this.lightState, (state) => {
            this.drawSphere()
            debugState.axis && this.drawAxes()
            this.drawPoint({
              position: state.pointLightPos,
              color: getLightColor(this.lightState.pointLight, true),
            })
          })
        })
      } catch (e) {
        console.error(e)
        console.log('🧨 DESTROY regl')
        this.regl.destroy()
      }
    })
  }

  cameraState = {
    phi: 0,
    theta: Math.PI / 2,
    distance: 2,
    center: [0, 0, 0],
  }

  interpolatedValues = {
    colorPerc: 0,
    noisePerc: 0,
    minRadius: 0.65,
    maxRadius: 0.65,
  }

  mouse = { x: 0, y: 0 }

  lightState = {
    ambientLight: {
      color: [1, 1, 1],
      intensity: 0, // 0.2,
    },
    dirLight: {
      color: [1, 1, 1],
      intensity: 0, //0.3,
      direction: [0.3, -1, -0.1],
    },
    pointLight: {
      color: [1, 1, 1],
      intensity: 0,
      radius: 3,
      distance: 4,
    },
  }
}
