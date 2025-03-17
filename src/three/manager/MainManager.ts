import { container } from '@/three/container/DIContainer'

import { SceneManager } from './SceneManager'
import { CameraManager } from './CameraManager'
import { LightManager } from './LightManager'
import { HelperManager } from './HelperManager'
import { RendererManager } from './RendererManager'
import { ControlsManager } from './ControlsManager'
import { GUIManager } from './GUIManager'

import { Clock } from 'three'


export class MainManager {
  private sceneManager: SceneManager
  private cameraManager: CameraManager
  private rendererManager: RendererManager
  private lightManager: LightManager
  private helperManager: HelperManager
  private controlsManager: ControlsManager
  private GUIManager: GUIManager
  private animationFrameId!: number
  private clock: Clock

  constructor(el: HTMLElement) {
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

    this.GUIManager = new GUIManager()
    container.register('GUImanager',this.GUIManager)


    this.clock = new Clock()
    
    this.upadte = this.upadte.bind(this)
    this.upadte()
  }

  private upadte = (): void => {
    const dt = this.clock.getDelta()

    this.animationFrameId = requestAnimationFrame(this.upadte)

    this.sceneManager.update(dt)
    this.cameraManager.update(dt)
    this.lightManager.update(dt)
    this.helperManager.update(dt)
    this.rendererManager.update(dt)
    this.controlsManager.update(dt)
    this.GUIManager.update(dt)
  }

  clear(): void {
    cancelAnimationFrame(this.animationFrameId)

    this.sceneManager.clear()
    this.cameraManager.clear()
    this.lightManager.clear()
    this.helperManager.clear()
    this.rendererManager.clear()
    this.controlsManager.clear()
    this.GUIManager.clear()
    console.log('Three.js resources cleared.')
  }
}
