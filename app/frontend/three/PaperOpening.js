import * as THREE from 'three'
import { paperCutPath } from './salonOpening.js'

const clamp=x=>Math.max(0,Math.min(1,x))
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)}

/** A cut sheet, not a widening alpha mask: two tessellated, deforming surfaces. */
export function paperVertex(u,v,side,aspect,frame,seconds) {
  const path=paperCutPath(v)
  const x=side<0?THREE.MathUtils.lerp(-.08,path.x,u):THREE.MathUtils.lerp(path.x,1.08,u)
  const nx=1/Math.sqrt(1+(aspect*path.dx)**2),ny=-aspect*path.dx*nx
  const distance=Math.abs(x-path.x)*2*aspect*nx
  // Nothing ahead of the blades is released. A short delay gives the paper weight.
  const freed=smooth((frame.cut-v)/.10)
  const peel=smooth((frame.peel-(side<0?0:.055))/(side<0?1:.945))*freed
  const width=.19+peel*.92
  const bend=freed*(.65+peel*2.5+.08*Math.sin(seconds*2.7+v*7))
  const theta=bend*clamp(1-distance/width)
  const radius=width/Math.max(.00001,bend)
  const rolledDistance=bend>.00001&&distance<width?width-radius*Math.sin(theta):distance
  const rollZ=distance<width?radius*(1-Math.cos(theta)):0
  const separation=freed*.003+peel**1.35*(2.7*aspect+2.1)
  const shift=side*(rolledDistance-distance+separation)
  const flutter=freed*Math.exp(-distance/.8)*(.008+.025*peel)*Math.sin(seconds*3.1-v*8+side)
  return {
    x:(x-.5)*2*aspect+nx*shift,
    y:(v-.5)*2+ny*shift+peel*.045*Math.sin(v*5+seconds*1.8+side),
    z:rollZ+flutter+peel*.16,
    uvX:x,uvY:v,freed,distance,
  }
}

const paperShader={
  vertexShader:`
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPaper;
    attribute vec3 paperDetail;
    void main(){
      vUv=uv;vNormal=normalMatrix*normal;vPaper=paperDetail;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    }`,
  fragmentShader:`
    uniform sampler2D uPrint;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPaper;
    float grain(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec3 ink=texture2D(uPrint,vUv).rgb;
      // An unprinted underside becomes visible as the edge rolls over.
      if(!gl_FrontFacing) ink=vec3(.83,.79,.72);
      vec3 n=normalize(vNormal)*(gl_FrontFacing?1.0:-1.0);
      float light=.72+.28*max(0.0,dot(n,normalize(vec3(-.42,.5,.84))))/.79;
      float foldShadow=exp(-vPaper.y*8.0)*vPaper.x*.10;
      float fiber=(grain(vUv*vec2(1700.,2300.))-.5)*.009;
      vec3 paper=ink*(light-foldShadow)+fiber;
      gl_FragColor=vec4(paper,1.0);
      #include <colorspace_fragment>
    }`,
}

export function createPaperOpening(element) {
  const scene=new THREE.Scene()
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,12)
  camera.position.z=5
  const canvas=document.createElement('canvas')
  const texture=new THREE.CanvasTexture(canvas)
  texture.colorSpace=THREE.SRGBColorSpace
  const material=new THREE.ShaderMaterial({...paperShader,uniforms:{uPrint:{value:texture}},side:THREE.DoubleSide,toneMapped:false})
  const rows=96,columns=24,panels=[]
  let aspect=1,currentWidth=0,currentHeight=0
  for(const side of [-1,1]) {
    const count=(rows+1)*(columns+1),geometry=new THREE.BufferGeometry(),indices=[]
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(count*2),2))
    geometry.setAttribute('paperDetail',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage))
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const a=row*(columns+1)+col,b=a+columns+1
      indices.push(a,a+1,b,a+1,b+1,b)
    }
    geometry.setIndex(indices)
    const mesh=new THREE.Mesh(geometry,material)
    mesh.frustumCulled=false;scene.add(mesh);panels.push({side,geometry})
  }
  function resize(width,height) {
    aspect=width/height
    camera.left=-aspect;camera.right=aspect;camera.updateProjectionMatrix()
    if(width===currentWidth&&height===currentHeight)return
    currentWidth=width;currentHeight=height
    const scale=Math.min(2,2048/Math.max(width,height))
    canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale)
    const ctx=canvas.getContext('2d')
    ctx.scale(scale,scale);ctx.fillStyle='#efe9df';ctx.fillRect(0,0,width,height)
    // Copy the loading wordmark's actual font/position so it stays on the sheet
    // when the WebGL surface replaces the HTML loading cover.
    const mark=element.closest('.cinematic-stage')?.querySelector('.opening-monogram')
    const stage=element.getBoundingClientRect()
    ctx.fillStyle='#34332c';ctx.textAlign='center';ctx.textBaseline='middle'
    if(mark) {
      const box=mark.getBoundingClientRect(),style=getComputedStyle(mark)
      ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      ctx.letterSpacing=style.letterSpacing
      ctx.fillText('ABC',box.left-stage.left+box.width/2,box.top-stage.top+parseFloat(style.lineHeight)/2)
      const caption=mark.querySelector('span'),rect=caption.getBoundingClientRect(),captionStyle=getComputedStyle(caption)
      ctx.font=`${captionStyle.fontWeight} ${captionStyle.fontSize} ${captionStyle.fontFamily}`
      ctx.letterSpacing=captionStyle.letterSpacing
      ctx.fillText(caption.textContent,rect.left-stage.left+rect.width/2,rect.top-stage.top+rect.height/2)
    }
    texture.needsUpdate=true
  }
  function update(frame,seconds) {
    for(const {side,geometry} of panels) {
      const positions=geometry.attributes.position,uvs=geometry.attributes.uv,details=geometry.attributes.paperDetail
      for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++) {
        const index=row*(columns+1)+col,v=-.04+row/rows*1.08
        const p=paperVertex(col/columns,v,side,aspect,frame,seconds)
        positions.setXYZ(index,p.x,p.y,p.z);uvs.setXY(index,p.uvX,p.uvY)
        details.setXYZ(index,p.freed,p.distance,side)
      }
      positions.needsUpdate=true;uvs.needsUpdate=true;details.needsUpdate=true
      geometry.computeVertexNormals()
    }
  }
  return {
    resize,update,
    render(renderer){renderer.clearDepth();renderer.render(scene,camera)},
    dispose(){panels.forEach(({geometry})=>geometry.dispose());material.dispose();texture.dispose()},
  }
}
