import { BaseManager } from './BaseManager'
import type { MainManager } from './MainManager'

export class AnimationManager extends BaseManager {
  constructor(manager: MainManager) {
    super(manager)
  }

  updated(dt: number): void {
    console.log('AnimationManager updated')
  }

  clear(): void {
    console.log('AnimationManager cleared')
    super.clear()
  }
}
