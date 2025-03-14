import { Scene } from 'three'

export class SceneManager {
  private scene: Scene

  constructor() {
    this.scene = new Scene()
  }

  getScene(): Scene {
    return this.scene
  }

  update(dt: number): void {}

  clear(): void {}
}
