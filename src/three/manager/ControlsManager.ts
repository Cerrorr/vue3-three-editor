import { container } from '@/three/container/DIContainer'

import type  { CameraManager } from './CameraManager'
import type  { RendererManager } from './RendererManager'

import {} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class ControlsManager {
  private cameraManager!: CameraManager
  private rendererManager!: RendererManager
  private controls!: OrbitControls
  constructor() {

  }
 init(): void {
    this.cameraManager = container.resolve<CameraManager>('CameraManager')
    this.rendererManager = container.resolve<RendererManager>('RendererManager')

    this.controls = new OrbitControls(this.cameraManager.getActiveCamera(), this.rendererManager.getRenderer().domElement)
    this.controls.screenSpacePanning = true
  }

  update(dt: number): void {
    this.controls.update()
  }

  clear(): void {
    this.controls.dispose()
    this.controls = undefined!
  }

  getControls(): OrbitControls | undefined {
    return this.controls
  }
}
