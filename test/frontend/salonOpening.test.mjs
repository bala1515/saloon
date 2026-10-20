import assert from 'node:assert/strict'
import test from 'node:test'
import { openingFrame, salonOpening, paperCutPath } from '../../app/frontend/three/salonOpening.js'
import { paperVertex } from '../../app/frontend/three/PaperOpening.js'

test('cut travels from the lower-left outside the frame to the upper-right before revealing the name',()=>{
  assert.ok(openingFrame(0).cut<0)
  let previous=-Infinity
  for(let t=0;t<salonOpening.heroStart;t+=.01) {
    const frame=openingFrame(t)
    assert.ok(frame.cut>=previous);previous=frame.cut
    assert.equal(frame.phase,'cutting')
    assert.ok(frame.opening>=.055&&frame.opening<=.246)
  }
  assert.ok(openingFrame(salonOpening.heroStart).cut>1)
  assert.equal(openingFrame(salonOpening.heroStart).phase,'reveal')
  assert.equal(openingFrame(0).zoom,0)
  assert.equal(openingFrame(salonOpening.settle).zoom,1)
})

test('curtain clears completely and the scissors return to the shared hero composition',()=>{
  const settled=openingFrame(salonOpening.settle)
  assert.equal(settled.phase,'complete')
  assert.equal(settled.peel,1)
  assert.equal(settled.return,1)
  assert.equal(openingFrame(salonOpening.complete).peel,1)
})

test('skip bypasses the cut and camera zoom while the idle animation clock remains available',()=>{
  const still=openingFrame(0,true)
  assert.equal(still.phase,'complete')
  assert.equal(still.peel,1);assert.equal(still.zoom,1);assert.equal(still.return,1)
  assert.equal(openingFrame(200,true).heroTime,200)
})

test('the paper seam is curved, monotonic and has the tangent used to orient the scissors',()=>{
  assert.equal(paperCutPath(0).x,0)
  assert.ok(Math.abs(paperCutPath(1).x-1)<1e-9)
  assert.ok(Math.abs(paperCutPath(.25).x-.25)>.05)
  for(let t=0;t<=1;t+=.01) {
    const point=paperCutPath(t),delta=.00001
    const derivative=(paperCutPath(t+delta).x-paperCutPath(t-delta).x)/(2*delta)
    assert.ok(point.dx>0)
    assert.ok(Math.abs(derivative-point.dx)<1e-7)
  }
})

test('the intact sheet has no seam gap and uncut paper stays flat',()=>{
  for(const aspect of [.45,1,1.8])for(let v=0;v<=1;v+=.05) {
    const a=paperVertex(1,v,-1,aspect,openingFrame(0),0)
    const b=paperVertex(0,v,1,aspect,openingFrame(0),0)
    assert.ok(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.y-b.y)<1e-8)
    assert.equal(a.z,0);assert.equal(b.z,0)
  }
  const ahead=paperVertex(1,.8,-1,1,{cut:.4,peel:.2},2)
  assert.equal(ahead.freed,0);assert.equal(ahead.z,0)
})

test('cut edges lift in 3D and the paper deformation remains finite through its exit',()=>{
  assert.ok(paperVertex(1,.3,-1,1,{cut:.7,peel:.3},3).z>.02)
  for(const aspect of [.4,1,1.8,2.6])for(const side of [-1,1])for(let t=0;t<5;t+=.2) {
    for(let u=0;u<=1;u+=.25)for(let v=0;v<=1;v+=.1) {
      const p=paperVertex(u,v,side,aspect,openingFrame(t),t)
      assert.ok([p.x,p.y,p.z,p.uvX,p.uvY].every(Number.isFinite))
    }
  }
})
