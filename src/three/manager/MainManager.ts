import { SceneManager } from './SceneManager'

export class MainManager {
  private el: HTMLElement
  private options: any
  private sceneManager!: SceneManager

  constructor(el: HTMLElement, options: any) {
    this.el = el
    this.options = options
    this.init()
  }

  private init(): void {
    const scope = this

    this.sceneManager = new SceneManager(scope)
  }

  updated(dt: number): void {
    this.sceneManager && this.sceneManager.updated(dt)
  }

  clear(): void {
    this.sceneManager && this.sceneManager.clear()
  }

  public getElement(): HTMLElement {
    return this.el
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager
  }
}
