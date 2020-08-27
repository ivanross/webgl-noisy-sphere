import _ from 'lodash-es'
import pMap from 'p-map'

const fetchImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve(img)
  })
}

const fetchJson = (url) => {
  return window.fetch(url).then((res) => res.json())
}

export async function fetchAssets(obj) {
  const imgs = await pMap(Object.values(obj), (url) => {
    if (/.png$/.test(url)) return fetchImage(url)
    if (/.json$/.test(url)) return fetchJson(url)
  })

  return _.zipObject(Object.keys(obj), imgs)
}
