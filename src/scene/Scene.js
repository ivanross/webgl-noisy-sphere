import createREGL from 'regl'
import createCamera from 'regl-camera'
import vec3 from 'gl-vec3'
import mat3 from 'gl-mat3'
import mat4 from 'gl-mat4'
import mouseChange from 'mouse-change'
import vert from '../shaders/noisy.vert'
import frag from '../shaders/noisy.frag'
import { debugState, stats } from '../debug-state'
import createAxis from './createAxis'
import createSkybox from './createSkybox'
import { $ } from '../lib/utils'

const getLightColor = (light, alpha = false) =>
  alpha ? [...light.color, light.intensity] : light.color.map((ch) => ch * light.intensity)

const scaledCoord = (pos, length, res) => ((pos * res) / length - 0.5) * 2

export class Scene {
  constructor(container, assets) {
    this.container = $(container)
    this.regl = createREGL(this.container)
    this.camera = createCamera(this.regl, {
      damping: 0,
      zoomSpeed: 0,
      rotationSpeed: 0,
      noScroll: false,
      fvoy: Math.PI / 2,
    })

    const imgs = [assets.posX, assets.negX, assets.posY, assets.negY, assets.posZ, assets.negZ]

    this.envMap = this.regl.cube({
      faces: imgs,
      min: 'linear',
      mag: 'linear',
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
        envMap: this.envMap,
      },
    })

    this.drawSphere = this.regl({
      vert,
      frag,
      attributes: {
        position: assets.sphere.positions,
      },
      elements: assets.sphere.cells,
      uniforms: {
        mvp: ({ projection, view }) => mat4.multiply([], projection, view),
        model: mat4.identity([]),
        normal: () => mat3.fromMat4([], mat4.transpose([], mat4.invert([], mat4.identity([])))),
        time: this.regl.context('time'),
        timeNoise: this.regl.prop('timeNoise'),
        colorPerc: () => this.interpolatedValues.colorPerc,
        noisePerc: () => this.interpolatedValues.noisePerc,
        minRadius: () => this.interpolatedValues.minRadius,
        maxRadius: () => this.interpolatedValues.maxRadius,
        envPerc: this.regl.prop('envPerc'),
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
        position: assets.sphere.positions,
      },
      elements: assets.sphere.cells,
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
    this.drawSkybox = createSkybox(this.regl)

    mouseChange(this.container, (btn, x, y) => {
      this.mouse.x = x
      this.mouse.y = y
    })

    this.regl.frame(() => {
      try {
        // eslint-disable-next-line
        stats?.begin()
        this.timeNoise += debugState.noiseSpeed / 60

        this.regl.clear({ color: [0, 0, 0, 1] })
        this.camera(this.cameraState, () => {
          this.lights(this.lightState, ({ pointLightPos }) => {
            this.drawSphere({
              envPerc: this.interpolatedValues.envPerc,
              timeNoise: this.timeNoise,
            })

            if (this.interpolatedValues.envPerc > 0) {
              this.drawSkybox({ perc: this.interpolatedValues.envPerc })
            }

            if (debugState.axis) {
              this.drawAxes()
              this.drawPoint({
                position: this.cameraState.center,
                color: [1, 0, 1, 1],
              })
            }

            if (this.lightState.pointLight.intensity > 0) {
              this.drawPoint({
                position: pointLightPos,
                color: getLightColor(this.lightState.pointLight, true),
              })
            }
          })
        })
        // eslint-disable-next-line
        stats?.end()
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
    distance: 0.4,
    center: [0, 1.5, 0],
  }

  interpolatedValues = {
    colorPerc: 0,
    noisePerc: 0,
    envPerc: 0,
    minRadius: 0.65,
    maxRadius: 0.65,
  }

  mouse = { x: 0, y: 0 }
  timeNoise = 0

  lightState = {
    ambientLight: {
      color: [1, 1, 1],
      intensity: 0,
    },
    dirLight: {
      color: [1, 1, 1],
      intensity: 0,
      direction: [0.3, -1, -0.1],
    },
    pointLight: {
      color: [0, 1, 1],
      intensity: 0,
      radius: 3,
      distance: 4,
    },
  }
}
