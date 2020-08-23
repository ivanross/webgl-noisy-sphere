import gsap from 'gsap'
import './reset.css'
import './style.css'
import { NoisySphere } from './NoisySphere'

const container = document.createElement('div')
container.style.width = '100vw'
container.style.height = '100vh'
document.getElementById('root').appendChild(container)

const noisy = new NoisySphere(container)

const duration = 2.33
const stages = [
  () => gsap.to(noisy.interpolatedValues, { noisePerc: 1, duration }),
  () => gsap.to(noisy.interpolatedValues, { colorPerc: 1, duration }),
]

stages.index = 0
stages.wait = false

const changeStage = () => {
  if (stages.wait) return
  if (stages.index >= stages.length) return
  stages[stages.index++]()
  stages.wait = true
  setTimeout(() => (stages.wait = false), 1000)
}

window.addEventListener('click', changeStage)

console.log()
