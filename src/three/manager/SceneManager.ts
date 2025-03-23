import { container } from '../container/DIContainer'

import type { LoaderManager } from './LoaderManager'
import type { RendererManager } from './RendererManager'

import { Scene, Texture } from 'three'

export class SceneManager {
  private loaderManager!: LoaderManager
  private rendererManager!: RendererManager
  private scene: Scene


  constructor() {
    this.scene = new Scene()
  }

  async init(): Promise<void> {
    this.loaderManager = container.resolve<LoaderManager>('LoaderManager')
    this.rendererManager = container.resolve<RendererManager>('RendererManager')
    this.setEnvironment()
  }

  private async setEnvironment(): Promise<void> {
    const hdrTexture = await this.loaderManager.loadHDRTexture('textures/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr')
    this.scene.environment = this.rendererManager.pmremGenerator.fromEquirectangular(hdrTexture).texture
  }

  getScene(): Scene {
    return this.scene
  }

  update(dt: number): void {}

  clear(): void {}
}
