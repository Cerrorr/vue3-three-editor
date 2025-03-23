import { container } from '@/three/container/DIContainer'

import type { GUIManager } from '../manager/GUIManager'
import type { Pane } from 'tweakpane'

import { threeService } from '@/three/core/ThreeService'

export class DebugUI {
  private gui: Pane
  constructor() {
    this.gui = container.resolve<GUIManager>('GUIManager').pane
    this.init()
    // setEnableInitCheck(!enableInitCheck)
  }
  init() {
    const PARAMS = {
      import: {
        title: '导入',
        label: '导入模型',
      },
    }

    const btn = this.gui.addButton(PARAMS.import)
    btn.on('click', () => this.importModel())
  }

  importModel() {
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'

    input.addEventListener('change', (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return
      threeService.loadModel(file)
      console.log(file)
    })

    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }

  update(dt: number): void {}

  clear(): void {
    this.gui = undefined!
  }
}
