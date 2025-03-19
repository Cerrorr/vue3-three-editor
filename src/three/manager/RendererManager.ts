import { container } from '@/three/container/DIContainer'

import type  { SceneManager } from './SceneManager'
import type  { CameraManager } from './CameraManager'

import { WebGLRenderer, SRGBColorSpace } from 'three'

export class RendererManager {
  private renderer: WebGLRenderer
  private sceneManager: SceneManager
  private cameraManager: CameraManager
  private el: HTMLElement

  constructor() {
    this.sceneManager = container.resolve<SceneManager>('SceneManager')
    this.cameraManager = container.resolve<CameraManager>('CameraManager')
    this.el = container.resolve<HTMLElement>('RenderContainer')

    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setClearColor('#3c3c3c')
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight)

    this.el.appendChild(this.renderer.domElement)

    this.addListener()
  }

  render(): void {
    this.renderer.render(this.sceneManager.getScene(), this.cameraManager.getActiveCamera())
  }

  getRenderer(): WebGLRenderer {
    return this.renderer
  }

  addListener() {
    // window.addEventListener('keydown', this.onKeyDown, false)
    // window.addEventListener('keyup', this.onKeyUp, false)
    // this.renderer.domElement.addEventListener('pointerdown', this.onMouseDown, false)
    // this.renderer.domElement.addEventListener('pointerup', this.onMouseUp, false)
    // this.renderer.domElement.addEventListener('dblclick', this.onDBlclick, false)
    // //this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false)
    // this.renderer.domElement.addEventListener('pointermove', this.onMouseMove, false)
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  resize() {
    if (!this.el) return
    const parentElement = this.el.parentElement
    if (!parentElement) return
    const { clientHeight, clientWidth } = parentElement

    this.cameraManager.getActiveCamera().aspect = clientWidth / clientHeight
    this.cameraManager.getActiveCamera().updateProjectionMatrix()

    this.renderer.setSize(clientWidth, clientHeight)
  }

  update(dt: number): void {
    this.render()
  }

  clear(): void {
    this.renderer.dispose()
    this.el.removeChild(this.renderer.domElement)
  }
}
