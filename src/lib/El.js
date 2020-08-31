import { $ } from './utils'

export class El {
  constructor(el) {
    this.el = $(el)
  }

  show() {
    this.el.style.opacity = 1
  }

  hide() {
    this.el.style.opacity = 0
  }
}
