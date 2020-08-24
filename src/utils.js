import _ from 'lodash-es'
import pMap from 'p-map'

export const $ = (el) => (typeof el === 'string' ? document.querySelector(el) : el)

const loadImg = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve(img)
  })
}

export async function fetchImges(obj) {
  const imgs = await pMap(Object.values(obj), loadImg)
  return _.zipObject(Object.keys(obj), imgs)
}
