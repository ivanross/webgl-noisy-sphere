precision mediump float;
varying float noiseAmt;
varying float noiseAmt2;
varying vec3 fragNrm;
varying vec3 fragWorldPos;

struct AmbientLight{
  vec3 col;
};

struct PointLight{
  vec3 pos;
  vec3 col;
  float radius;
};

struct DirectionalLight{
  vec3 dir;
  vec3 col;
};

uniform AmbientLight ambientLight;
uniform DirectionalLight dirLight;
uniform PointLight pointLight;
uniform vec3 eye;
uniform float colorPerc;
uniform float envPerc;
uniform samplerCube envMap;

float bell(float _min,float _max,float value){
  float mid=(_min+_max)/2.;
  return smoothstep(_min,mid,value)*smoothstep(_max,mid,value);
}

vec3 palette(float n){
  vec3 col=
  vec3(.3686,0.,0.)*smoothstep(.8,0.,n)+
  vec3(.1059,.0627,.7255)*bell(.4,.7,n)+
  vec3(.0627,.7255,.4471)*bell(.5,.8,n)+
  vec3(0.,1.,1.)*smoothstep(.5,1.,n);
  return mix(vec3(.6),col,colorPerc);
}

float diffuse(in vec3 lightDir,in vec3 normal){
  return max(0.,dot(lightDir,normal));
}

float specular(in vec3 lightDir,in vec3 normal,in vec3 viewDir,float bright){
  vec3 halfVec=normalize(viewDir+lightDir);
  float specAmt=max(0.,dot(halfVec,normal));
  specAmt=pow(specAmt,bright);
  return specAmt;
}

vec3 getDirectionalLightColor(
  in DirectionalLight light,
  in vec3 viewDir,
  in vec3 normal,
  in vec3 color
){
  float diffuseAmt=diffuse(light.dir,normal);
  vec3 diffuseCol=color*light.col*diffuseAmt;
  
  float specAmt=specular(light.dir,normal,viewDir,128.);
  vec3 specCol=light.col*specAmt;
  
  return specCol+diffuseCol;
}

vec3 getPointLightColor(
  in PointLight light,
  in vec3 viewDir,
  in vec3 normal,
  in vec3 color
){
  vec3 toLight=light.pos-fragWorldPos;
  vec3 lightDir=normalize(toLight);
  float lightDist=length(toLight);
  float falloff=max(0.,1.-lightDist/light.radius);
  
  float diffuseAmt=diffuse(lightDir,normal)*falloff;
  vec3 diffuseCol=color*light.col*diffuseAmt;
  
  float specAmt=specular(lightDir,normal,viewDir,64.)*falloff;
  vec3 specCol=light.col*specAmt;
  
  return specCol+diffuseCol;
}

void main(){
  vec3 nrm=normalize(fragNrm);
  vec3 viewDir=normalize(eye-fragWorldPos);
  vec3 col=palette(noiseAmt);
  vec3 envSample=textureCube(envMap,reflect(-viewDir,nrm)).rgb;
  float mixCoeff=smoothstep(.2,.6,noiseAmt2);
  col=mix(col,envSample,mixCoeff*envPerc);
  
  vec3 pointLightColor=getPointLightColor(pointLight,viewDir,nrm,col);
  vec3 dirLightColor=getDirectionalLightColor(dirLight,viewDir,nrm,col);
  
  vec3 ambientCol=col*ambientLight.col;
  gl_FragColor=vec4(pointLightColor+dirLightColor+ambientCol,1);
}