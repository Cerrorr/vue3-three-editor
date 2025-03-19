import { container } from '@/three/container/DIContainer'

import type { GUIManager } from '../manager/GUIManager'
import type { Pane } from 'tweakpane'
import type { LoaderManager } from '../manager/LoaderManager'
import type { SceneManager } from '../manager/SceneManager'

export class DebugUI {
  private gui: Pane
  loaderManager: LoaderManager
  sceneManager: SceneManager
  constructor() {
    this.gui = container.resolve<GUIManager>('GUIManager').pane // 假设 GUIManager 中有 pane 对象来管理 UI
    this.loaderManager = container.resolve<LoaderManager>('LoaderManager')
    this.sceneManager = container.resolve<SceneManager>('SceneManager')
    this.init()
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
      this.loaderManager.loadModel(file, (scene) => {
        this.sceneManager.getScene().add(scene)
      })
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
