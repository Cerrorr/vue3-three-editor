import { container } from '@/three/container/DIContainer'
import type { ISelectionManager } from '@/three/interfaces/IResourceManager'
import type { SceneManager } from './SceneManager'

import { Object3D, BoxHelper, Box3, Vector3, MeshBasicMaterial, Color } from 'three'

/**
 * 选择管理器 - 负责处理对象的选择和高亮
 */
export class SelectionManager implements ISelectionManager {
  private sceneManager!: SceneManager
  private selectedObject: Object3D | null = null
  private selectionHelper: BoxHelper | null = null
  private initialized = false
  private highlightColor: Color

  constructor() {
    this.highlightColor = new Color(0xffff00) // 默认高亮颜色为黄色
  }

  /**
   * 初始化选择管理器
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.log('SelectionManager already initialized')
      return
    }

    console.log('Initializing SelectionManager')
    
    // 获取场景管理器
    this.sceneManager = container.resolve<SceneManager>('SceneManager')
    
    this.initialized = true
    console.log('SelectionManager initialized successfully')
  }

  /**
   * 选择对象
   * @param object 要选择的对象
   */
  select(object: Object3D): void {
    // 如果已经选中了这个对象，不需要重新选择
    if (this.selectedObject === object) return
    
    // 先取消当前选择
    this.deselect()
    
    // 设置新的选中对象
    this.selectedObject = object
    
    // 创建高亮框
    this.createSelectionHighlight()
    
    console.log('Selected object:', object.name || 'Unnamed Object')
    
    // 触发选择事件，其他管理器可以监听这个事件
    // 这里可以使用事件系统来通知，例如 EventEmitter
  }

  /**
   * 取消选择当前对象
   */
  deselect(): void {
    if (!this.selectedObject) return
    
    // 移除高亮效果
    this.removeSelectionHighlight()
    
    // 清除选中对象引用
    this.selectedObject = null
    
    console.log('Deselected object')
    
    // 触发取消选择事件
  }

  /**
   * 获取当前选中的对象
   */
  getSelection(): Object3D | null {
    return this.selectedObject
  }

  /**
   * 检查对象是否被选中
   */
  isSelected(object: Object3D): boolean {
    return this.selectedObject === object
  }

  /**
   * 高亮选中的对象
   * @param highlight 是否高亮
   */
  highlightSelection(highlight: boolean): void {
    if (!this.selectedObject) return
    
    if (highlight) {
      this.createSelectionHighlight()
    } else {
      this.removeSelectionHighlight()
    }
  }

  /**
   * 创建选择高亮
   */
  private createSelectionHighlight(): void {
    if (!this.selectedObject || !this.sceneManager) return
    
    // 移除旧的高亮
    this.removeSelectionHighlight()
    
    // 创建一个新的BoxHelper来可视化选择
    this.selectionHelper = new BoxHelper(this.selectedObject, this.highlightColor)
    
    // 将BoxHelper添加到场景
    this.sceneManager.getScene().add(this.selectionHelper)
  }

  /**
   * 移除选择高亮
   */
  private removeSelectionHighlight(): void {
    if (!this.selectionHelper || !this.sceneManager) return
    
    // 从场景中移除BoxHelper
    this.sceneManager.getScene().remove(this.selectionHelper)
    this.selectionHelper = null
  }

  /**
   * 设置高亮颜色
   */
  setHighlightColor(color: Color): void {
    this.highlightColor = color
    
    // 如果当前有选中对象，更新高亮效果
    if (this.selectedObject) {
      this.createSelectionHighlight()
    }
  }

  /**
   * 更新方法
   */
  update(dt: number): void {
    // 如果有高亮选择框，可能需要在这里更新它
    if (this.selectionHelper && this.selectedObject) {
      this.selectionHelper.update()
    }
  }

  /**
   * 清理方法
   */
  clear(): void {
    this.deselect()
    this.selectedObject = null
    this.selectionHelper = null
    this.initialized = false
    console.log('SelectionManager cleared')
  }
}
