import { MainManager } from '@/three/manager/MainManager'
// 对业务层提供服务接口
class ThreeService {
  private mainManager!: MainManager

  // 业务层传入的 HTMLElement 以及配置项
  init(el: HTMLElement, options?: any): void {
    console.log('Initializing Three.js with element:', el)
    console.log('Options:', options)
    this.mainManager = new MainManager(el)
  }
  // 销毁
  clear(): void {
    if (this.mainManager) {
      this.mainManager.clear()
      this.mainManager = undefined!
    }
  }
}

export const threeService = new ThreeService()
