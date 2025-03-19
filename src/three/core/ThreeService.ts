import { MainManager } from '@/three/manager/MainManager'
import { requiresInit } from '@/three/utils/decorators'

// 对业务层提供服务接口
class ThreeService {
  private mainManager!: MainManager
  private initialized = false
  // 业务层传入的 HTMLElement 以及配置项
  init(el: HTMLElement, options?: any): void {
    console.log('Initializing Three.js with element:', el)
    console.log('Options:', options)
    this.mainManager = new MainManager(el, options)
    this.initialized = true
  }

  // 加载模型
  @requiresInit
  loadModel(file: File): void {
    this.mainManager.loadModel(file)
  }

  // 销毁
  @requiresInit
  clear(): void {
    this.mainManager.clear()
    this.mainManager = undefined!
    this.initialized = false
  }
}

// 导出一个单例实例供全局使用
export const threeService = new ThreeService()
