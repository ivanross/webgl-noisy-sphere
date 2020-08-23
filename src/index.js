import gsap from 'gsap'
import './reset.css'
import './style.css'
import { NoisySphere } from './NoisySphere'

const container = document.createElement('div')
container.style.width = '100vw'
container.style.height = '100vh'
document.getElementById('root').appendChild(container)

const noisy = new NoisySphere(container)

const duration = 0.6
const stages = [
  () => gsap.to(noisy.lightState.ambientLight, { intensity: 1, duration }),
  () => [
    gsap.to(noisy.lightState.dirLight, { intensity: 0.7, duration }),
    gsap.to(noisy.lightState.ambientLight, { intensity: 0.1, duration }),
  ],
  () => gsap.to(noisy.lightState.pointLight, { distance: 3, intensity: 1, duration }),
  () => gsap.to(noisy.interpolatedValues, { noisePerc: 1, duration }),
  () => [
    gsap.to(noisy.interpolatedValues, { colorPerc: 1, duration }),
    gsap.to(noisy.lightState.pointLight, { distance: 2, radius: 5, duration }),
    gsap.to(noisy.lightState.ambientLight, { intensity: 0.3, duration }),
    gsap.to(noisy.lightState.dirLight, { intensity: 0.9, duration }),
  ],
  () => gsap.to(noisy.interpolatedValues, { maxRadius: 0.95, duration }),
]

stages.index = 0
stages.wait = false

const run = (fns) => (Array.isArray(fns) ? fns.forEach(run) : fns())
const changeStage = () => {
  if (stages.wait) return
  if (stages.index >= stages.length) return
  run(stages[stages.index++])
  stages.wait = true
  setTimeout(() => (stages.wait = false), 1000)
}

window.addEventListener('click', changeStage)
