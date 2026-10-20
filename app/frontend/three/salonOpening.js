// One timeline for the real scissors cut, the ivory curtain, name and camera push-in.
export const salonOpening = {
  cutStart: .35, cutDuration: 3.2,
  peelStart: 3.0, peelDuration: 1.65,
  heroStart: 3.55, zoomDuration: 2,
  returnStart: 3.65, returnDuration: 1.9,
  complete: 4.65, settle: 5.55,
}
const clamp=value=>Math.max(0,Math.min(value,1))
const ease=value=>{const t=clamp(value);return t*t*(3-2*t)}
export function openingFrame(seconds,skip=false) {
  if(skip) return {phase:'complete',cut:1.15,travel:1,peel:1,zoom:1,return:1,opening:.075,heroTime:Math.max(0,seconds)}
  const travel=ease((seconds-salonOpening.cutStart)/salonOpening.cutDuration)
  return {
    phase:seconds>=salonOpening.complete?'complete':seconds>=salonOpening.heroStart?'reveal':'cutting',
    cut:-.15+travel*1.30,
    travel,
    peel:ease((seconds-salonOpening.peelStart)/salonOpening.peelDuration),
    zoom:ease((seconds-salonOpening.heroStart)/salonOpening.zoomDuration),
    return:ease((seconds-salonOpening.returnStart)/salonOpening.returnDuration),
    opening:.055+(1-Math.cos(Math.max(0,seconds-.15)*11))*.095,
    heroTime:Math.max(0,seconds-salonOpening.heroStart),
  }
}

// Shared by the paper's actual cut edge and the scissors' position / tangent.
export function paperCutPath(t) {
  return {
    x:t+.055*Math.sin(2*Math.PI*t)+.018*Math.sin(Math.PI*t),
    y:t,
    dx:1+.11*Math.PI*Math.cos(2*Math.PI*t)+.018*Math.PI*Math.cos(Math.PI*t),
    dy:1,
  }
}
