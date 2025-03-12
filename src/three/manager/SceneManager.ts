import { BaseManager } from './BaseManager'
import type { MainManager } from './MainManager'

export class SceneManager extends BaseManager {
  constructor(manager: MainManager) {
    super(manager)
  }

  updated(dt: number): void {
    console.log('SceneManager updated')
  }

  clear(): void {
    console.log('SceneManager cleared')
    super.clear()
  }
}
