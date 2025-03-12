import type { MainManager } from './MainManager'

export class BaseManager {
  protected manager: MainManager

  constructor(manager: MainManager) {
    this.manager = manager
    this.init()
  }

  protected init(): void {}

  updated(dt: number): void {}

  clear(): void {
    this.manager = null!
  }
}
