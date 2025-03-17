import { container } from '@/three/container/DIContainer'

import {} from 'three'

import { Pane } from 'tweakpane'

export class GUIManager {
  pane: Pane
  constructor() {
    this.pane = new Pane({
      title: '调试',
      expanded: true,
    })
    const PARAMS = {
      factor: 123,
      title: 'hello',
      color: '#ff0055',
    }
    this.pane.addBinding(PARAMS, 'factor')
    this.pane.addBinding(PARAMS, 'title')
    this.pane.addBinding(PARAMS, 'color')
  }

  update(dt: number): void {}

  clear(): void {
    this.pane = undefined!
  }
}
