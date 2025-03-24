import { container } from '@/three/container/DIContainer'

import { SceneManager } from './SceneManager'
import { CameraManager } from './CameraManager'
import { LightManager } from './LightManager'
import { HelperManager } from './HelperManager'
import { RendererManager } from './RendererManager'
import { ControlsManager } from './ControlsManager'
import { GUIManager } from './GUIManager'
import { LoaderManager } from './LoaderManager'
import { SelectionManager } from './SelectionManager'
import { EditorInteractionManager } from './EditorInteractionManager'

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
  private selectionManager!: SelectionManager
  private editorInteractionManager!: EditorInteractionManager

  constructor(el: HTMLElement, options?: any) {
    container.register('RenderContainer', el)

    // 创建所有管理器
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

    this.selectionManager = new SelectionManager()
    container.register('SelectionManager', this.selectionManager)

    this.editorInteractionManager = new EditorInteractionManager()
    container.register('EditorInteractionManager', this.editorInteractionManager)

    if (options?.debug) {
      this.GUIManager = new GUIManager()
      container.register('GUIManager', this.GUIManager)

      this.debugUI = new DebugUI()
    }

    this.clock = new Clock()
    console.log('All managers created and registered')

    // 创建后自动初始化
    this.init()
  }

  // 初始化方法 - 通过容器循环调用所有管理器的初始化
  private async init(): Promise<void> {
    console.log('Initializing all managers')

    try {
      // 需要初始化的管理器名称列表
      const managerNames = [
        'RendererManager',     // 先初始化渲染器
        'CameraManager',       // 再初始化相机
        'LoaderManager',       // 再初始化加载器
        'SceneManager',        // 再初始化场景
        'LightManager',        // 再初始化灯光
        'HelperManager',       // 再初始化辅助工具
        'ControlsManager',     // 初始化控制器
        'SelectionManager',    // 初始化选择管理器
        'EditorInteractionManager', // 最后初始化编辑交互管理器
      ]

      // 按顺序初始化所有管理器
      for (const name of managerNames) {
        try {
          const manager = container.resolve<any>(name)

          // 检查管理器是否有init方法
          if (manager && typeof manager.init === 'function') {
            await manager.init()
            console.log(`${name} initialized`)
          }
        } catch (err) {
          console.warn(`Failed to initialize ${name}:`, err)
        }
      }

      console.log('All managers initialized successfully')

      // 启动更新循环
      this.update()
    } catch (error) {
      console.error('Failed to initialize managers:', error)
    }
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
    this.selectionManager.update(dt)
    this.editorInteractionManager.update(dt)

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
    this.selectionManager.clear()
    this.editorInteractionManager.clear()

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
