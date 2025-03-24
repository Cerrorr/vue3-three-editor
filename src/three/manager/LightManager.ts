import { container } from '@/three/container/DIContainer'

import type { ILightManager } from '../interfaces/IResourceManager'
import type { SceneManager } from './SceneManager'

import { AmbientLight, DirectionalLight, Scene } from 'three'

export class LightManager implements ILightManager {
  private sceneManager!: SceneManager
  constructor() {}
  init(): void {
    this.sceneManager = container.resolve<SceneManager>('SceneManager')
    this.createLights(this.sceneManager.getScene())
  }
  private createLights(scene: Scene, intensity = 0.5): void {
    const directionalLightRight = new DirectionalLight(0xffffff, intensity)
    directionalLightRight.position.set(0.5, 1.2, 0.5)
    scene.add(directionalLightRight)
    const directionalLightLeft = new DirectionalLight(0xffffff, intensity)
    directionalLightLeft.position.set(-0.5, 1.2, 0.5)
    scene.add(directionalLightRight)
    const ambientLight = new AmbientLight(0xffffff, intensity)
    scene.add(ambientLight)
  }
  delLight(): void {}
  update(dt: number): void {}

  clear(): void {}
}
