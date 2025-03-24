import { container } from '@/three/container/DIContainer'
import type { IEditorInteractionManager } from '@/three/interfaces/IResourceManager'
import type { ControlsManager } from './ControlsManager'
import type { SelectionManager } from './SelectionManager'
import type { SceneManager } from './SceneManager'

import { TransformControls } from 'three/addons/controls/TransformControls.js'

/**
 * 编辑器交互管理器 - 负责处理编辑操作和交互
 */
export class EditorInteractionManager implements IEditorInteractionManager {
  private controlsManager!: ControlsManager
  private selectionManager!: SelectionManager
  private sceneManager!: SceneManager
  private transformControls: TransformControls | null = null
  private currentMode: string | null = null
  private currentSpace: string = 'world' // 'world' 或 'local'
  private initialized = false

  constructor() {
    // 构造函数不做具体初始化
  }

  /**
   * 初始化编辑器交互管理器
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.log('EditorInteractionManager already initialized')
      return
    }

    console.log('Initializing EditorInteractionManager')
    
    // 获取依赖的管理器
    this.controlsManager = container.resolve<ControlsManager>('ControlsManager')
    this.selectionManager = container.resolve<SelectionManager>('SelectionManager')
    this.sceneManager = container.resolve<SceneManager>('SceneManager')
    
    // 获取变换控制器
    this.transformControls = this.controlsManager.getTransformControls()
    
    // 如果ControlsManager没有提供TransformControls，则创建一个
    if (!this.transformControls) {
      console.warn('TransformControls not found in ControlsManager, creating a new one')
      // 在这里需要创建新的TransformControls，但需要相机和渲染器的DOM元素
    }
    

      
      // 监听变换控制器事件
      this.setupTransformControlsListeners()
    
    
    this.initialized = true
    console.log('EditorInteractionManager initialized successfully')
  }

  /**
   * 设置变换控制器事件监听
   */
  private setupTransformControlsListeners(): void {
    if (!this.transformControls) return
    
    // 监听变换结束事件
    this.transformControls.addEventListener('objectChange', () => {
      // 对象被变换时的处理
      console.log('Object transformed')
    })
  }

  /**
   * 启用编辑模式
   * @param mode 编辑模式('translate' | 'rotate' | 'scale')
   */
  enableEditMode(mode: string): void {
    if (!this.initialized || !this.transformControls) return
    
    // 检查模式是否有效
    if (!['translate', 'rotate', 'scale'].includes(mode)) {
      console.error(`Invalid edit mode: ${mode}. Use 'translate', 'rotate', or 'scale'.`)
      return
    }
    
    // 获取当前选中的对象
    const selectedObject = this.selectionManager.getSelection()
    if (!selectedObject) {
      console.warn('No object selected to edit')
      return
    }
    
    // 设置变换控制器模式
    this.transformControls.setMode(mode)
    
    // 附加到选中对象
    this.transformControls.attach(selectedObject)
    
    // 保存当前模式
    this.currentMode = mode
    
    console.log(`Enabled ${mode} mode for selected object`)
  }

  /**
   * 禁用编辑模式
   */
  disableEditMode(): void {
    if (!this.initialized || !this.transformControls) return
    
    // 分离变换控制器
    this.transformControls.detach()
    
    // 清除当前模式
    this.currentMode = null
    
    console.log('Disabled edit mode')
  }

  /**
   * 获取当前编辑模式
   */
  getCurrentEditMode(): string | null {
    return this.currentMode
  }

  /**
   * 切换编辑空间(世界/本地)
   */
  toggleSpace(): void {
    if (!this.initialized || !this.transformControls) return
    
    // 切换空间
    this.currentSpace = this.currentSpace === 'world' ? 'local' : 'world'
    
    // 设置变换控制器空间
    this.transformControls.setSpace(this.currentSpace)
    
    console.log(`Switched to ${this.currentSpace} space`)
  }

  /**
   * 更新方法
   */
  update(dt: number): void {
    // 如果有选中对象变化，更新变换控制器的附加状态
    const selectedObject = this.selectionManager?.getSelection()
    
    if (this.transformControls && this.currentMode && selectedObject) {
      // 确保变换控制器已附加到正确对象
      if (this.transformControls.object !== selectedObject) {
        this.transformControls.attach(selectedObject)
      }
    } else if (this.transformControls && !selectedObject) {
      // 如果没有选中对象，分离变换控制器
      this.transformControls.detach()
    }
  }

  /**
   * 清理方法
   */
  clear(): void {
    if (this.transformControls) {
      this.transformControls.detach()
      
      if (this.sceneManager?.getScene()) {
        this.sceneManager.getScene().remove(this.transformControls)
      }
      
      this.transformControls.dispose()
      this.transformControls = null
    }
    
    this.currentMode = null
    this.initialized = false
    console.log('EditorInteractionManager cleared')
  }
}
