import gsap from 'gsap'
import Swiper, { Mousewheel } from 'swiper'
import 'swiper/swiper-bundle.css'
import '@accurat/tachyons-lite'
import 'tachyons-extra'
import './reset.css'
import './style.css'
import { NoisySphere } from './NoisySphere'
import { $ } from './utils'

const noisy = new NoisySphere('.webgl-container')

const opts = { duration: 1, ease: 'power2.inOut' }
const vars = (o) => ({ ...opts, ...o })

const timeline = gsap
  .timeline()
  .addLabel('0')
  .to(noisy.lightState.ambientLight, vars({ intensity: 1 }), '0')
  .addLabel('1')
  .to(noisy.lightState.dirLight, vars({ intensity: 0.7 }), '1')
  .to(noisy.lightState.ambientLight, vars({ intensity: 0.1 }), '1')
  .to(noisy.cameraState.center, vars({ ...[0, 1, 0] }), '1')
  .to(noisy.cameraState, vars({ distance: 1 }), '1')
  .addLabel('2')
  .to(noisy.cameraState, vars({ distance: 2 }), '2')
  .to(noisy.cameraState.center, vars({ ...[-1, 0.25, 0] }), '2')
  .to(noisy.lightState.pointLight, vars({ distance: 3, intensity: 1 }), '2')
  .to(noisy.cameraState, vars({ phi: Math.PI / 4 }), '2')
  .addLabel('3')
  .to(noisy.cameraState.center, vars({ ...[0, 0, -1] }), '3')
  .to(noisy.cameraState, vars({ distance: 1.8, phi: 0, theta: -Math.PI / 6 }), '3')
  .to(noisy.interpolatedValues, vars({ noisePerc: 1 }), '3')
  .addLabel('4')
  .to(noisy.interpolatedValues, vars({ colorPerc: 1 }), '4')
  .to(noisy.lightState.pointLight, vars({ distance: 2, radius: 5 }), '4')
  .to(noisy.lightState.ambientLight, vars({ intensity: 0.3 }), '4')
  .to(noisy.lightState.dirLight, vars({ intensity: 0.9 }), '4')
  .to(noisy.cameraState.center, vars({ ...[0, 0, 0] }), '4')
  .to(noisy.cameraState, vars({ phi: Math.PI / 6 }), '4')
  .addLabel('5')
  .to(noisy.cameraState, vars({ theta: 0, distance: 1.3 }), '5')
  .to(noisy.interpolatedValues, vars({ maxRadius: 0.95 }), '5')
  .addLabel('6')
  .pause()

Swiper.use([Mousewheel])

const scrollMessage = {
  el: $('#scroll-message'),
  show() {
    this.el.style.opacity = 1
  },
  hide() {
    this.el.style.opacity = 0
  },
}

const swiper = new Swiper('.swiper-container', {
  direction: 'vertical',
  slidesPerView: 1,
  spaceBetween: 30,
  speed: opts.duration * 1000,
  mousewheel: { eventsTarget: '.webgl-container', sensitivity: 0 },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  on: {
    slideChange: (e) => {
      timeline.tweenTo(String(e.activeIndex))
      if (e.activeIndex === 0) scrollMessage.show()
      else scrollMessage.hide()
    },
  },
})
