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

  // 存储从ZIP提取的文件URL，用于清理
  private extractedUrls: string[] = []

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

    // 配置 GLTF 加载器
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
   * 解析并加载 ZIP 文件中的 3D 模型及其关联资源
   * @param file ZIP 文件
   * @returns Promise，解析后的模型对象
   */
  private async loadFromZip(file: File): Promise<Object3D> {
    const zip = new JSZip()

    try {
      // 清理之前创建的URL对象
      this.cleanupExtractedUrls()

      // 加载并解析ZIP文件
      const zipContent = await zip.loadAsync(file)

      // 查找主要模型文件
      const zipFiles = Object.keys(zipContent.files)
      const modelFileEntry = zipFiles.find((name) => /\.(gltf|glb|obj|fbx)$/i.test(name) && !zipContent.files[name].dir)

      if (!modelFileEntry) {
        throw new Error('ZIP 压缩包中未找到有效的 .gltf, .glb, .obj, .fbx 文件')
      }

      const modelFileExtension = modelFileEntry.split('.').pop()?.toLowerCase()

      // 处理GLTF格式，需要特殊处理关联文件
      if (modelFileExtension === 'gltf') {
        return await this.loadGltfFromZip(zipContent, modelFileEntry, zipFiles)
      }
      // 处理OBJ格式，可能需要MTL文件
      else if (modelFileExtension === 'obj') {
        return await this.loadObjFromZip(zipContent, modelFileEntry, zipFiles)
      }
      // 其他格式(GLB/FBX)直接加载单文件
      else {
        const modelBlob = await zipContent.files[modelFileEntry].async('blob')
        const modelFile = new File([modelBlob], modelFileEntry, { type: 'application/octet-stream' })
        return this.loadFromFile(modelFile)
      }
    } catch (error) {
      this.cleanupExtractedUrls()
      throw new Error(`解压 ZIP 失败: ${error.message}`)
    }
  }

  /**
   * 从ZIP中加载GLTF模型及其所有关联资源
   */
  private async loadGltfFromZip(zipContent: JSZip, gltfPath: string, allFiles: string[]): Promise<Object3D> {
    try {
      // 首先读取GLTF文件内容
      const gltfBlob = await zipContent.files[gltfPath].async('blob')
      const gltfText = await gltfBlob.text()
      const gltfJson = JSON.parse(gltfText)

      // 获取GLTF文件所在目录路径
      const gltfDir = gltfPath.includes('/') ? gltfPath.substring(0, gltfPath.lastIndexOf('/') + 1) : ''

      // 提取并创建所有关联文件的URLs
      const fileMap = new Map<string, string>()

      // 1. 处理bin文件
      if (gltfJson.buffers) {
        for (const buffer of gltfJson.buffers) {
          if (buffer.uri && !buffer.uri.startsWith('data:')) {
            const bufferPath = this.normalizePath(gltfDir + buffer.uri)
            if (zipContent.files[bufferPath]) {
              const bufferBlob = await zipContent.files[bufferPath].async('blob')
              const bufferUrl = URL.createObjectURL(bufferBlob)
              fileMap.set(buffer.uri, bufferUrl)
              this.extractedUrls.push(bufferUrl)
            }
          }
        }
      }

      // 2. 处理图像/纹理文件
      if (gltfJson.images) {
        for (const image of gltfJson.images) {
          if (image.uri && !image.uri.startsWith('data:')) {
            const imagePath = this.normalizePath(gltfDir + image.uri)
            if (zipContent.files[imagePath]) {
              const imageBlob = await zipContent.files[imagePath].async('blob')
              const imageUrl = URL.createObjectURL(imageBlob)
              fileMap.set(image.uri, imageUrl)
              this.extractedUrls.push(imageUrl)
            }
          }
        }
      }

      // 3. 修改GLTF文件中的URI引用
      let modifiedGltfText = gltfText
      for (const [originalPath, url] of fileMap.entries()) {
        modifiedGltfText = modifiedGltfText.replace(new RegExp(`"${this.escapeRegExp(originalPath)}"`, 'g'), `"${url}"`)
      }

      // 4. 创建修改后的GLTF文件
      const modifiedGltfBlob = new Blob([modifiedGltfText], { type: 'application/json' })
      const gltfUrl = URL.createObjectURL(modifiedGltfBlob)
      this.extractedUrls.push(gltfUrl)

      // 5. 加载修改后的GLTF
      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          gltfUrl,
          (gltf) => resolve(gltf.scene || gltf.scenes[0]),
          undefined,
          (error) => {
            this.cleanupExtractedUrls()
            reject(new Error(`GLTF 加载失败: ${error.message}`))
          }
        )
      })
    } catch (error) {
      this.cleanupExtractedUrls()
      throw new Error(`处理 GLTF 文件失败: ${error.message}`)
    }
  }

  /**
   * 从ZIP中加载OBJ模型及其MTL材质
   */
  private async loadObjFromZip(zipContent: JSZip, objPath: string, allFiles: string[]): Promise<Object3D> {
    try {
      // 获取OBJ文件内容
      const objBlob = await zipContent.files[objPath].async('blob')
      const objUrl = URL.createObjectURL(objBlob)
      this.extractedUrls.push(objUrl)

      // 查找相关的MTL文件
      const objDir = objPath.includes('/') ? objPath.substring(0, objPath.lastIndexOf('/') + 1) : ''
      const objText = await objBlob.text()

      // 从OBJ内容中提取MTL引用
      const mtlMatch = objText.match(/mtllib\s+([^\s]+)/i)
      let mtlPath = null
      let mtlUrl = null

      if (mtlMatch && mtlMatch[1]) {
        mtlPath = this.normalizePath(objDir + mtlMatch[1])

        // 检查MTL文件是否存在于ZIP中
        if (zipContent.files[mtlPath]) {
          const mtlBlob = await zipContent.files[mtlPath].async('blob')
          mtlUrl = URL.createObjectURL(mtlBlob)
          this.extractedUrls.push(mtlUrl)

          // 处理MTL中引用的纹理
          const mtlText = await mtlBlob.text()
          const textureMatches = [...mtlText.matchAll(/map_\w+\s+([^\s]+)/g)]

          // 创建纹理URL字典
          const textureMap = new Map<string, string>()

          for (const match of textureMatches) {
            const texturePath = this.normalizePath(objDir + match[1])
            if (zipContent.files[texturePath]) {
              const textureBlob = await zipContent.files[texturePath].async('blob')
              const textureUrl = URL.createObjectURL(textureBlob)
              textureMap.set(match[1], textureUrl)
              this.extractedUrls.push(textureUrl)
            }
          }

          // 修改MTL文件内容，替换纹理路径
          let modifiedMtlText = mtlText
          for (const [originalPath, url] of textureMap.entries()) {
            modifiedMtlText = modifiedMtlText.replace(new RegExp(`(map_\\w+\\s+)${this.escapeRegExp(originalPath)}`, 'g'), `$1${url}`)
          }

          // 创建修改后的MTL文件
          const modifiedMtlBlob = new Blob([modifiedMtlText], { type: 'text/plain' })
          const modifiedMtlUrl = URL.createObjectURL(modifiedMtlBlob)
          this.extractedUrls.push(modifiedMtlUrl)
          mtlUrl = modifiedMtlUrl
        }
      }

      // 使用OBJ加载器加载OBJ文件
      return new Promise((resolve, reject) => {
        if (mtlUrl) {
          this.mtlLoader.load(
            mtlUrl,
            (mtl) => {
              mtl.preload()
              this.objLoader.setMaterials(mtl)
              this.objLoader.load(objUrl, resolve, undefined, (error) => {
                this.cleanupExtractedUrls()
                reject(new Error(`OBJ 加载失败: ${error.message}`))
              })
            },
            undefined,
            (error) => {
              this.cleanupExtractedUrls()
              reject(new Error(`MTL 加载失败: ${error.message}`))
            }
          )
        } else {
          this.objLoader.load(objUrl, resolve, undefined, (error) => {
            this.cleanupExtractedUrls()
            reject(new Error(`OBJ 加载失败: ${error.message}`))
          })
        }
      })
    } catch (error) {
      this.cleanupExtractedUrls()
      throw new Error(`处理 OBJ 文件失败: ${error.message}`)
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
    this.extractedUrls.push(url)

    return new Promise((resolve, reject) => {
      switch (fileExtension) {
        case 'gltf':
        case 'glb':
          this.gltfLoader.load(
            url,
            (gltf) => resolve(gltf.scene || gltf.scenes[0]),
            undefined,
            (error) => {
              this.cleanupExtractedUrls()
              reject(new Error(`GLTF/GLB 加载失败: ${error.message}`))
            }
          )
          break

        case 'obj':
          this.loadOBJ(url)
            .then(resolve)
            .catch((error) => {
              this.cleanupExtractedUrls()
              reject(error)
            })
          break

        case 'fbx':
          this.fbxLoader.load(url, resolve, undefined, (error) => {
            this.cleanupExtractedUrls()
            reject(new Error(`FBX 加载失败: ${error.message}`))
          })
          break

        default:
          this.cleanupExtractedUrls()
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
        this.mtlLoader.load(
          mtlUrl,
          (mtl) => {
            mtl.preload()
            this.objLoader.setMaterials(mtl)
            this.objLoader.load(url, resolve, undefined, (error) => reject(new Error(`OBJ 加载失败: ${error.message}`)))
          },
          undefined,
          (error) => reject(new Error(`MTL 加载失败: ${error.message}`))
        )
      } else {
        this.objLoader.load(url, resolve, undefined, (error) => reject(new Error(`OBJ 加载失败: ${error.message}`)))
      }
    })
  }

  /**
   * 规范化文件路径
   * @param path 文件路径
   * @returns 规范化后的路径
   */
  private normalizePath(path: string): string {
    // 处理路径中的 "./" 和 "../"
    const parts = path.split('/')
    const result = []

    for (const part of parts) {
      if (part === '.' || part === '') {
        continue
      } else if (part === '..') {
        result.pop()
      } else {
        result.push(part)
      }
    }

    return result.join('/')
  }

  /**
   * 转义正则表达式中的特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 清理创建的URL对象
   */
  private cleanupExtractedUrls(): void {
    for (const url of this.extractedUrls) {
      URL.revokeObjectURL(url)
    }
    this.extractedUrls = []
  }

  // 清理所有资源和URL
  clear(): void {
    this.cleanupExtractedUrls()
  }

  loadTexture(): void {}

  update(dt: number): void {}
}
