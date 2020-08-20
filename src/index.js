const buildRegl = require('regl')
const vec3 = require('gl-vec3')
const mat3 = require('gl-mat3')
const mat4 = require('gl-mat4')
const icosphere = require('./sphere.json')
const noise = require('./noise')

const container = document.createElement('div')
container.style.width = '100vw'
container.style.height = '100vh'
document.getElementById('root').appendChild(container)
document.body.style.padding = 0
document.body.style.margin = 0

const regl = buildRegl(container)
const camera = require('regl-camera')(regl, { damping: 0, noScroll: true, distance: 3 })

const drawSphere = regl({
  vert: `
  attribute vec3 position;

  uniform mat4 mvp;
  uniform mat4 model;
  uniform mat3 normal;
  uniform float time;
  
  varying float noiseAmt;
  varying float noiseAmt2;
  varying vec3 fragNrm;
  varying vec3 fragWorldPos;

  ${noise()}

  float noise(vec3 x){
    float n1=snoise(vec4(x,time))*.5+.5;
    float n2=snoise(vec4(x*4.,time))*.5+.5;
    float n=mix(n1,n1*n2*n2,.25);
    
    return n;
  }
  
  float displacement(float n){
    float m=mix(.65,.95,(sin(time)*.5+.5));
    return mix(m,1.,n);
  }
  
  vec3 calc(float phi,float theta){
    vec3 p=vec3(
      sin(theta)*cos(phi),
      sin(theta)*sin(phi),
      cos(theta)
    );
    p=normalize(p);
    return p*displacement(noise(p));
  }


  void main() {

    float phi=atan(position.y,position.x);
    float theta=acos(position.z);
    float e=.005;
    
    float n=noise(position);
    float d=displacement(n);
    
    vec3 P=position*d;
    vec3 T=calc(phi+e,theta)-P;
    vec3 B=calc(phi,theta-e)-P;

    gl_Position=mvp*vec4(P,1.);
    noiseAmt=n;
    noiseAmt2=noise(position*1.5);
    fragNrm=normal*normalize(cross(T,B));
    fragWorldPos=(model*vec4(P,1.)).xyz;
  }
  `,
  frag: `
  precision mediump float;
  varying float noiseAmt;
  varying float noiseAmt2;
  varying vec3 fragNrm;
  varying vec3 fragWorldPos;

  uniform vec3 lightDir;
  uniform vec3 eye;

  float bell(float _min,float _max,float value){
    float mid=(_min+_max)/2.;
    return smoothstep(_min,mid,value)*smoothstep(_max,mid,value);
  }
  
  vec3 noiseColor(float n){
    vec3 col=
    vec3(.3686,0.,0.)*smoothstep(.8,0.,n)+
    vec3(.1059,.0627,.7255)*bell(.4,.7,n)+
    vec3(.0627,.7255,.4471)*bell(.5,.8,n)+
    vec3(0.,1.,1.)*smoothstep(.5,1.,n);
    return col;
  }

  void main() {
    vec3 nrm = normalize(fragNrm);
    vec3 viewDir = normalize(eye - fragWorldPos);
    vec3 col=noiseColor(noiseAmt);

    float diffuseAmt=max(0.,dot(nrm,lightDir));
    vec3 diffuseCol=col*diffuseAmt;


    vec3 halfVec = normalize(viewDir + lightDir);
    float specAmt = max(0.,dot(nrm,halfVec));
    specAmt=pow(specAmt,36.);

    gl_FragColor=vec4(diffuseCol+specAmt,1);
  }
  `,
  attributes: {
    position: icosphere.positions,
  },
  elements: icosphere.cells,
  uniforms: {
    mvp: ({ projection, view }) => mat4.multiply([], projection, view),
    model: mat4.identity([]),
    normal: () => mat3.fromMat4([], mat4.transpose([], mat4.invert([], mat4.identity([])))),
    time: regl.context('time'),
    lightDir: (c, { lightDir }) =>
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
        lightDir: [-0.5, -0.5, -0.3],
      })
    })
  } catch (e) {
    console.log('DESTROY')
    console.error(e)
    regl.destroy()
  }
})
