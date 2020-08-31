import Swiper from 'swiper'
import _ from 'lodash-es'
import 'swiper/swiper-bundle.css'
import '@accurat/tachyons-lite'
import 'tachyons-extra'
import './reset.css'
import './style.css'
import { Scene } from './scene/Scene'
import { El } from './lib/El'
import { buildTimeline } from './lib/buildTimeline'
import { fetchAssets } from './lib/fetchAssets'
import { onMouseWheelDirection } from './lib/onMouseWheelDirection'
import { onTouchDirection } from './lib/onTouchDirection'

const OPTS = { duration: 1, ease: 'power2.inOut' }

;(async function () {
  const assets = await fetchAssets({
    posX: 'positive_x.png',
    posY: 'positive_y.png',
    posZ: 'positive_z.png',
    negX: 'negative_x.png',
    negY: 'negative_y.png',
    negZ: 'negative_z.png',
    sphere: 'icosphere.json',
  })

  const noisy = new Scene('.webgl-container', assets)
  const scrollMessage = new El('#scroll-message')
  const swiper = new Swiper('.swiper-container', {
    direction: 'vertical',
    slidesPerView: 1,
    spaceBetween: 0,
    speed: OPTS.duration * 1000,
  })

  const timeline = buildTimeline(
    [
      // AMBIENT LIGHT
      [
        [noisy.lightState.dirLight, { intensity: 0.7 }],
        [noisy.lightState.ambientLight, { intensity: 0.1 }],
        [noisy.cameraState.center, { ...[0, 1, 0], ease: 'power2.linear' }],
        [noisy.cameraState, { distance: 1, ease: 'power2.linear' }],
      ],

      // POINT LIGHT
      [
        [noisy.cameraState, { distance: 2 }],
        [noisy.cameraState.center, { ...[-1, 0.25, 0] }],
        [noisy.lightState.pointLight, { distance: 3, intensity: 1 }],
        [noisy.cameraState, { phi: Math.PI / 4 }],
      ],

      // NOISE IN VERTEX
      [
        [noisy.cameraState.center, { ...[0, 0, -1] }],
        [noisy.cameraState, { distance: 1.5, phi: 0, theta: -Math.PI / 6 }],
        [noisy.interpolatedValues, { noisePerc: 1 }],
        [noisy.lightState.pointLight.color, { ...[1, 0, 1] }],
        [noisy.lightState.pointLight, { radius: 4 }],
      ],

      // NOISE IN FRAGMENT
      [
        [noisy.interpolatedValues, { colorPerc: 1 }],
        [noisy.lightState.pointLight, { distance: 2, radius: 5 }],
        [noisy.lightState.pointLight.color, { ...[1, 1, 1] }],
        [noisy.lightState.ambientLight, { intensity: 0.3 }],
        [noisy.lightState.dirLight, { intensity: 0.9 }],

        [noisy.cameraState.center, { ...[0, -0.85, 0] }],
        [noisy.cameraState, { phi: Math.PI / 6, theta: -Math.PI, distance: 1.5 }],
      ],

      // SKYBOX
      [
        [noisy.interpolatedValues, { maxRadius: 0.95, envPerc: 1 }],
        [noisy.lightState.pointLight, { intensity: 0, distance: 5 }],
        [noisy.lightState.dirLight, { intensity: 1 }],
        [noisy.lightState.ambientLight, { intensity: 0.8 }],

        [noisy.cameraState.center, { ...[0, 0, 0] }],
        [noisy.cameraState, { theta: -Math.PI / 4, phi: -Math.PI * 0.02, distance: 1.3 }],
      ],
    ],
    OPTS
  )

  let slide = 0
  let canAnimate = true

  const handleUserDirection = ({ direction }) => {
    // wait for the end of previous animation
    if (!canAnimate) return

    // Update visible slide
    const prevSlide = slide
    slide += direction
    slide = _.clamp(slide, 0, swiper.slides.length - 1)
    // early return if clamp to avoid blocking animation
    if (prevSlide === slide) return

    // change slide
    swiper.slideTo(slide)

    // Trigger Animation
    timeline.tweenTo(String(slide))

    // Show/hide "scroll" message
    if (slide === 0) scrollMessage.show()
    else scrollMessage.hide()

    canAnimate = false
    setTimeout(() => (canAnimate = true), 750)
  }

  onMouseWheelDirection(handleUserDirection)
  onTouchDirection(handleUserDirection)
})()
