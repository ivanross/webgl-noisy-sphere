#pragma glslify:snoise=require('glsl-noise/simplex/4d')

attribute vec3 position;

uniform mat4 mvp;
uniform mat4 model;
uniform mat3 normal;
uniform float time;
uniform float noisePerc;
uniform float minRadius;
uniform float maxRadius;
uniform float timeNoise;

varying float noiseAmt;
varying float noiseAmt2;
varying vec3 fragNrm;
varying vec3 fragWorldPos;

float noise(vec3 x){
  if(noisePerc==0.)return 1.;
  float n1=snoise(vec4(x,timeNoise))*.5+.5;
  float n2=snoise(vec4(x*4.,timeNoise))*.5+.5;
  float n=mix(n1,n1*n2*n2,.25);
  
  return n*noisePerc;
}

float displacement(float n){
  float m=mix(minRadius,maxRadius,(sin(time)*.5+.5));
  return mix(1.,m,(1.-n)*noisePerc);
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

void main(){
  
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
  fragNrm=normal*cross(T,B);
  fragWorldPos=(model*vec4(P,1.)).xyz;
}