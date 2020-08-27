import Swiper, { Mousewheel } from 'swiper'
import 'swiper/swiper-bundle.css'
import '@accurat/tachyons-lite'
import 'tachyons-extra'
import './reset.css'
import './style.css'
import { Scene } from './scene/Scene'
import { $ } from './lib/utils'
import { buildTimeline } from './lib/buildTimeline'
import { fetchAssets } from './lib/fetchAssets'
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

  const opts = { duration: 1, ease: 'power2.inOut' }
  const timeline = buildTimeline(
    [
      [
        [noisy.lightState.dirLight, { intensity: 0.7 }],
        [noisy.lightState.ambientLight, { intensity: 0.1 }],
        [noisy.cameraState.center, { ...[0, 1, 0], ease: 'power2.linear' }],
        [noisy.cameraState, { distance: 1, ease: 'power2.linear' }],
      ],
      [
        [noisy.cameraState, { distance: 2 }],
        [noisy.cameraState.center, { ...[-1, 0.25, 0] }],
        [noisy.lightState.pointLight, { distance: 3, intensity: 1 }],
        [noisy.cameraState, { phi: Math.PI / 4 }],
      ],

      [
        [noisy.cameraState.center, { ...[0, 0, -1] }],
        [noisy.cameraState, { distance: 1.8, phi: 0, theta: -Math.PI / 6 }],
        [noisy.interpolatedValues, { noisePerc: 1 }],
        [noisy.lightState.pointLight.color, { ...[1, 0, 1] }],
        [noisy.lightState.pointLight, { radius: 4 }],
      ],
      [
        [noisy.interpolatedValues, { colorPerc: 1 }],
        [noisy.lightState.pointLight, { distance: 2, radius: 5 }],
        [noisy.lightState.pointLight.color, { ...[1, 1, 1] }],
        [noisy.lightState.ambientLight, { intensity: 0.3 }],
        [noisy.lightState.dirLight, { intensity: 0.9 }],
        [noisy.cameraState.center, { ...[0, 0, 0] }],
        [noisy.cameraState, { phi: Math.PI / 6 }],
      ],
      [
        [noisy.cameraState, { theta: -Math.PI / 4, phi: -Math.PI * 0.02, distance: 1.3 }],
        [noisy.interpolatedValues, { maxRadius: 0.95, envPerc: 1 }],
        [noisy.lightState.pointLight, { intensity: 0, distance: 5 }],
        [noisy.lightState.dirLight, { intensity: 1 }],
        [noisy.lightState.ambientLight, { intensity: 0.8 }],
      ],
    ],
    opts
  )

  const scrollMessage = {
    el: $('#scroll-message'),
    show() {
      this.el.style.opacity = 1
    },
    hide() {
      this.el.style.opacity = 0
    },
  }

  Swiper.use([Mousewheel])
  // eslint-disable-next-line
  new Swiper('.swiper-container', {
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
})()
