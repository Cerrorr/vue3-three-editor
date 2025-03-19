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

  }

  update(dt: number): void {}

  clear(): void {
    this.pane = undefined!
  }
}
