import { container } from '@/three/container/DIContainer'

import type { RendererManager } from './RendererManager'

import { LoadingManager, LoaderUtils, Group, type Object3DEventMap } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

export class LoaderManager {
  private loadingManager: LoadingManager
  private dracoLoader: DRACOLoader
  private kx2Loadder: KTX2Loader
  private gltfLoader: GLTFLoader
  rendererManager: RendererManager

  constructor() {
    this.rendererManager = container.resolve<RendererManager>('RendererManager')
    this.loadingManager = new LoadingManager()
    this.dracoLoader = new DRACOLoader().setDecoderPath('draco/')
    this.kx2Loadder = new KTX2Loader().setTranscoderPath('basis/').detectSupport(this.rendererManager.getRenderer())

    this.gltfLoader = new GLTFLoader(this.loadingManager).setCrossOrigin('anonymous').setDRACOLoader(this.dracoLoader).setKTX2Loader(this.kx2Loadder).setMeshoptDecoder(MeshoptDecoder)
  }

  loadGltf(url: string, rootPath: string, assetMap: { has: (arg0: string) => any; get: (arg0: string) => any }, cb: (arg: Group<Object3DEventMap>) => void): Promise<any> {
    const baseURL = LoaderUtils.extractUrlBase(url)
    return new Promise((resolve, reject) => {
      this.loadingManager.setURLModifier((url: string) => {
        const normalizedURL =
          rootPath +
          decodeURI(url)
            .replace(baseURL, '')
            .replace(/^(\.?\/)/, '')

        if (assetMap.has(normalizedURL)) {
          const blob = assetMap.get(normalizedURL)
          const blobURL = URL.createObjectURL(blob)
          blobURLs.push(blobURL)
          return blobURL
        }
        return url
      })

      // 使用构造函数中初始化的 GLTFLoader 实例进行加载
      const blobURLs: string[] = []

      this.gltfLoader.load(
        url,
        (gltf) => {
          const scene = gltf.scene || gltf.scenes[0]
          const clips = gltf.animations || []
          if (!scene) {
            throw new Error('This model contains no scene, and cannot be viewed here.')
          }
          cb(scene)
          blobURLs.forEach(URL.revokeObjectURL)
          resolve(gltf)
        },
        undefined,
        reject
      )
    })
  }

  loadTexture(): void {}

  update(dt: number): void {}

  clear(): void {}
}
