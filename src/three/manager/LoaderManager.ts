import { container } from '@/three/container/DIContainer'
import type { RendererManager } from './RendererManager'

import { LoadingManager, type Object3DEventMap, Object3D } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

import JSZip from 'jszip'
import { MTLLoader } from 'three/examples/jsm/Addons.js'

export class LoaderManager {
  private loadingManager: LoadingManager
  private dracoLoader: DRACOLoader
  private ktx2Loader: KTX2Loader
  private gltfLoader: GLTFLoader
  private objLoader: OBJLoader
  private fbxLoader: FBXLoader
  private mtlLoader: MTLLoader
  rendererManager: RendererManager

  constructor() {
    this.rendererManager = container.resolve<RendererManager>('RendererManager')

    // 跟踪加载进度
    this.loadingManager = new LoadingManager()
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`开始加载: ${url} (${itemsLoaded}/${itemsTotal})`)
    }
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`加载进度: ${url} (${itemsLoaded}/${itemsTotal})`)
    }
    this.loadingManager.onLoad = () => {
      console.log('所有资源加载完成！')
    }
    this.loadingManager.onError = (url) => {
      console.error(`加载失败: ${url}`)
    }

    // 解码 .gltf/.glb 文件中的 DRACO 压缩网格数据
    this.dracoLoader = new DRACOLoader().setDecoderPath('draco/')
    // 支持 KTX2 纹理格式，用于优化加载效率
    this.ktx2Loader = new KTX2Loader().setTranscoderPath('basis/').detectSupport(this.rendererManager.getRenderer())
    // 配置 GLTF 加载优化工具 MeshoptDecoder用于解码 Meshopt 压缩的顶点数据
    this.gltfLoader = new GLTFLoader(this.loadingManager).setCrossOrigin('anonymous').setDRACOLoader(this.dracoLoader).setKTX2Loader(this.ktx2Loader).setMeshoptDecoder(MeshoptDecoder)

    // OBJ 和 FBX 不需要额外的 Loader 配置
    this.objLoader = new OBJLoader(this.loadingManager)
    this.fbxLoader = new FBXLoader(this.loadingManager)
    // 用于加载 .mtl 材质
    this.mtlLoader = new MTLLoader(this.loadingManager)
  }

  /**
   * 加载模型（支持 .gltf, .glb, .obj, .fbx 以及 .zip）
   * @param file 3D 模型文件或 ZIP 压缩包
   * @param callback 处理加载后模型的回调函数
   * @returns Promise，解析后的模型对象
   */
  loadModel(file: File, callback: (model: Object3D) => void): Promise<Object3D> {
    const fileExtension = this.getFileExtension(file)
    if (!fileExtension) {
      return Promise.reject(new Error('无法识别的文件类型'))
    }

    return fileExtension === 'zip'
      ? this.loadFromZip(file).then((model) => {
          callback(model)
          return model
        })
      : this.loadFromFile(file).then((model) => {
          callback(model)
          return model
        })
  }

  /**
   * 解析并加载 ZIP 文件中的 3D 模型
   * @param file ZIP 文件
   * @returns Promise，解析后的模型对象
   */
  private async loadFromZip(file: File): Promise<Object3D> {
    const zip = new JSZip()

    try {
      const zipContent = await zip.loadAsync(file)
      const modelFileEntry = Object.keys(zipContent.files).find((name) => /\.(gltf|glb|obj|fbx)$/i.test(name))

      if (!modelFileEntry) {
        throw new Error('ZIP 压缩包中未找到有效的 .gltf, .glb, .obj, .fbx 文件')
      }

      const modelFile = zipContent.files[modelFileEntry]
      const modelBlob = await modelFile.async('blob')
      const model = new File([modelBlob], modelFileEntry, { type: 'application/octet-stream' })
      return this.loadFromFile(model)
    } catch (error) {
      throw new Error(`解压 ZIP 失败: ${error.message}`)
    }
  }

  /**
   * 加载普通 3D 模型文件
   * @param file 3D 模型文件（.gltf, .glb, .obj, .fbx）
   * @returns Promise，解析后的模型对象
   */
  private loadFromFile(file: File): Promise<Object3D> {
    const fileExtension = this.getFileExtension(file)
    const url = URL.createObjectURL(file)

    return new Promise((resolve, reject) => {
      switch (fileExtension) {
        case 'gltf':
        case 'glb':
          this.gltfLoader.load(
            url,
            (gltf) => resolve(gltf.scene || gltf.scenes[0]),
            undefined,
            (error) => reject(new Error(`GLTF/GLB 加载失败: ${error.message}`))
          )
          break

        case 'obj':
          this.loadOBJ(url).then(resolve).catch(reject)
          break

        case 'fbx':
          this.fbxLoader.load(url, resolve, undefined, (error) => reject(new Error(`FBX 加载失败: ${error.message}`)))
          break

        default:
          reject(new Error('不支持的 3D 模型格式'))
          break
      }
    })
  }

  /**
   * 获取文件扩展名
   * @param file 文件
   * @returns 文件扩展名
   */
  private getFileExtension(file: File): string | undefined {
    return file.name.split('.').pop()?.toLowerCase()
  }

  /**
   * 加载 OBJ 文件，并解析 MTL 材质
   * @param url OBJ 文件路径
   * @param mtlUrl MTL 材质文件路径（可选）
   * @returns Promise，解析后的 OBJ 模型对象
   */
  private async loadOBJ(url: string, mtlUrl?: string): Promise<Object3D> {
    return new Promise((resolve, reject) => {
      if (mtlUrl) {
        this.mtlLoader.load(mtlUrl, (mtl) => {
          mtl.preload()
          this.objLoader.setMaterials(mtl)
          this.objLoader.load(url, resolve, undefined, (error) => reject(new Error(`OBJ 加载失败: ${error.message}`)))
        })
      } else {
        this.objLoader.load(url, resolve, undefined, (error) => reject(new Error(`OBJ 加载失败: ${error.message}`)))
      }
    })
  }

  // 清理缓存或其他资源
  loadTexture(): void {}

  update(dt: number): void {
  }

  clear(): void {}
}
