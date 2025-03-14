import { container } from '@/three/container/DIContainer'

import { SceneManager } from './SceneManager'
import { CameraManager } from './CameraManager'
import { LightManager } from './LightManager'
import { HelperManager } from './HelperManager'
import { RendererManager } from './RendererManager'
import { ControlsManager } from './ControlsManager'

import { Clock } from 'three'

export class MainManager {
  private sceneManager: SceneManager
  private cameraManager: CameraManager 
  private rendererManager: RendererManager
  private LightManager: LightManager
  private HelperManager: HelperManager
  private controlsManager: ControlsManager
  private animationFrameId!: number
  private lastTime = 0
  private clock: Clock

  constructor(el: HTMLElement) {
    container.register('RenderContainer', el)

    this.sceneManager = new SceneManager()
    container.register('SceneManager', this.sceneManager)

    this.cameraManager = new CameraManager()
    container.register('CameraManager', this.cameraManager)

    this.LightManager = new LightManager()
    container.register('LightManager', this.LightManager)

    this.HelperManager = new HelperManager()
    container.register('HelperManager', this.HelperManager)

    this.rendererManager = new RendererManager()
    container.register('RendererManager', this.rendererManager)

    this.controlsManager = new ControlsManager()
    container.register('ControlsManager', this.controlsManager)

    this.clock = new Clock()
    this.upadte()
  }

  private upadte = (): void => {
    const dt = this.clock.getDelta()

    this.animationFrameId = requestAnimationFrame(this.upadte)

    this.sceneManager.update(dt)
    this.cameraManager.update(dt)
    this.LightManager.update(dt)
    this.HelperManager.update(dt)
    this.rendererManager.update(dt)
    this.controlsManager.update(dt)
  }

  clear(): void {
    cancelAnimationFrame(this.animationFrameId)

    this.sceneManager.clear()
    this.cameraManager.clear()
    this.LightManager.clear()
    this.HelperManager.clear()
    this.rendererManager.clear()
    this.controlsManager.clear()
    console.log('Three.js resources cleared.')
  }
}
