import { BaseManager } from './BaseManager'
import type { MainManager } from './MainManager'

export class RenderManager extends BaseManager {
  constructor(manager: MainManager) {
    super(manager)
  }

  init(): void {}

  updated(dt: number): void {}

  clear(): void {
    super.clear()
  }
}
