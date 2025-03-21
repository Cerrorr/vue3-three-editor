import { container } from '@/three/container/DIContainer'

import { SceneManager } from './SceneManager'
import { CameraManager } from './CameraManager'
import { LightManager } from './LightManager'
import { HelperManager } from './HelperManager'
import { RendererManager } from './RendererManager'
import { ControlsManager } from './ControlsManager'
import { GUIManager } from './GUIManager'
import { LoaderManager } from './LoaderManager'

import { DebugUI } from '@/three/ui/DebugUI'

import { Clock, Cache, Object3D, Scene } from 'three'

Cache.enabled = true

export class MainManager {
  private sceneManager: SceneManager
  private cameraManager: CameraManager
  private rendererManager: RendererManager
  private lightManager: LightManager
  private helperManager: HelperManager
  private controlsManager: ControlsManager
  private loaderManager: LoaderManager
  private GUIManager?: GUIManager
  private debugUI?: DebugUI
  private animationFrameId!: number
  private clock: Clock

  constructor(el: HTMLElement, options?: any) {
    container.register('RenderContainer', el)

    this.sceneManager = new SceneManager()
    container.register('SceneManager', this.sceneManager)

    this.cameraManager = new CameraManager()
    container.register('CameraManager', this.cameraManager)

    this.lightManager = new LightManager()
    container.register('LightManager', this.lightManager)

    this.helperManager = new HelperManager()
    container.register('HelperManager', this.helperManager)

    this.rendererManager = new RendererManager()
    container.register('RendererManager', this.rendererManager)

    this.controlsManager = new ControlsManager()
    container.register('ControlsManager', this.controlsManager)

    this.loaderManager = new LoaderManager()
    container.register('LoaderManager', this.loaderManager)

    if (options.debug) {
      this.GUIManager = new GUIManager()
      container.register('GUIManager', this.GUIManager)

      this.debugUI = new DebugUI()
    }

    this.clock = new Clock()

    this.update()
    console.log(options)
  }

  private update = (): void => {
    const dt = this.clock.getDelta()

    this.animationFrameId = requestAnimationFrame(this.update)

    this.sceneManager.update(dt)
    this.cameraManager.update(dt)
    this.lightManager.update(dt)
    this.helperManager.update(dt)
    this.rendererManager.update(dt)
    this.controlsManager.update(dt)

    this.GUIManager && this.GUIManager.update(dt)
  }

  clear(): void {
    cancelAnimationFrame(this.animationFrameId)

    this.sceneManager.clear()
    this.cameraManager.clear()
    this.lightManager.clear()
    this.helperManager.clear()
    this.rendererManager.clear()
    this.controlsManager.clear()
    this.loaderManager.clear()

    this.GUIManager && this.GUIManager.clear()
    this.debugUI && this.debugUI.clear()

    console.log('Three.js resources cleared.')
  }
  // 加载模型
  async loadModel(file: File): Promise<Object3D> {
    return await this.loaderManager.loadModel(file, (scene) => {
      this.sceneManager.getScene().add(scene)
    })
  }
}
