import vec3 from 'gl-vec3'
import mat4 from 'gl-mat4'
const cube = require('primitive-cube')()

export default function (regl) {
  return regl({
    vert: `
    attribute vec3 position;
    uniform mat4 mvp;
    varying vec3 fromCam;
    void main() {
      fromCam=position;
      gl_Position=normalize(mvp*vec4(position*4.,1.)).xyww;
    }
    `,
    frag: `
    precision mediump float;
    uniform float perc;
    uniform samplerCube envMap;
    varying vec3 fromCam;
    void main() {
      vec3 sample=textureCube(envMap,fromCam).rgb;
      gl_FragColor=vec4(sample*perc,1.);
    }
  `,
    attributes: {
      position: cube.positions,
    },
    elements: cube.cells,
    context: {
      model: (context) =>
        mat4.translate([], mat4.identity([]), vec3.sub([], context.eye, context.center)),
    },
    uniforms: {
      mvp: ({ projection, view, model }) =>
        mat4.multiply([], projection, mat4.multiply([], view, model)),
      perc: regl.prop('perc'),
    },
    depth: { func: '<=' },
  })
}
