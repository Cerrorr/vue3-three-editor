import { container } from '@/three/container/DIContainer'

import type { SceneManager } from './SceneManager'

import { GridHelper, Scene } from 'three'

export class HelperManager {
  private sceneManager!: SceneManager
  constructor() {}
  init(): void {
    this.sceneManager = container.resolve<SceneManager>('SceneManager')
    this.createGridHelper(this.sceneManager.getScene())
  }
  private createGridHelper(scene: Scene): void {
    const gridHelper = new GridHelper(50, 50, 0xffffff, 0x787878)
    scene.add(gridHelper)
  }
  update(dt: number): void {}

  clear(): void {
    this.sceneManager = undefined!
  }
}
