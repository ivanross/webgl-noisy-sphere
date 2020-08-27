import mat4 from 'gl-mat4'

export default function (regl) {
  return regl({
    vert: `
    attribute vec3 position;
    attribute vec3 color;
    uniform mat4 mvp;
    varying vec3 fragCol;
    void main() {
      gl_Position=normalize(mvp*vec4(position*4.,1.));
      fragCol=color;
    }
  `,
    frag: `
    precision mediump float;
    varying vec3 fragCol;
    void main() {
      gl_FragColor=vec4(fragCol,1.);
    }
  `,
    attributes: {
      position: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, 0],
      ],
      color: [
        [1, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 1],
      ],
    },
    primitive: 'lines',
    count: 6,
    uniforms: {
      mvp: ({ projection, view }) => mat4.multiply([], projection, view),
    },
  })
}
