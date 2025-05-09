import { container } from '@/three/container/DIContainer'

import type { ICameraManager } from '@/three/interfaces/IResourceManager'

import { Camera, PerspectiveCamera } from 'three'

export class CameraManager implements ICameraManager {
  private defaultCamera: PerspectiveCamera
  private activeCamera: PerspectiveCamera
  private el: HTMLElement

  constructor() {
    this.el = container.resolve<HTMLElement>('RenderContainer')

    const fov = 60
    const aspect = this.el.clientWidth / this.el.clientHeight
    const near = 0.01
    const far = 1000

    this.defaultCamera = new PerspectiveCamera(fov, aspect, near, far)
    this.activeCamera = this.defaultCamera

    this.activeCamera.position.set(0, 5, 5)
  }
  init(): void {}
  // 获取摄像机实例
  getActiveCamera(): PerspectiveCamera {
    return this.activeCamera
  }

  update(dt: number): void {}

  clear(): void {
    // 清理相机资源
    this.activeCamera = null!
    this.defaultCamera = null!
    console.log('CameraManager cleared')
  }
}
