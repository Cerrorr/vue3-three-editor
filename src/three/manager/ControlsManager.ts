import { container } from '@/three/container/DIContainer'

import type { IControlsManager } from '@/three/interfaces/IResourceManager'
import type  { CameraManager } from './CameraManager'
import type  { RendererManager } from './RendererManager'

import {} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class ControlsManager implements IControlsManager {
  private cameraManager!: CameraManager
  private rendererManager!: RendererManager
  private controls!: OrbitControls
  private transformControls!: TransformControls
  constructor() {

  }

 init(): void {
    this.cameraManager = container.resolve<CameraManager>('CameraManager')
    this.rendererManager = container.resolve<RendererManager>('RendererManager')


    this.controls = new OrbitControls(this.cameraManager.getActiveCamera(), this.rendererManager.getRenderer().domElement)
    this.controls.screenSpacePanning = true

    this.transformControls = new TransformControls(this.cameraManager.getActiveCamera(), this.rendererManager.getRenderer().domElement)
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.controls.enabled = !event.value
    })

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

  getTransformControls(): TransformControls | undefined {
    return this.transformControls
  }
}
