import { container } from '@/three/container/DIContainer'
import type { RendererManager } from './RendererManager'

import { LoadingManager, Object3D, TextureLoader, Texture } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { MTLLoader } from 'three/examples/jsm/Addons.js'

import JSZip from 'jszip'

/**
 * LoaderManager 类 - 负责处理各种3D模型和纹理的加载
 * 支持 GLTF/GLB, OBJ/MTL, FBX 格式以及包含这些模型的ZIP文件
 */
export class LoaderManager {
  private loadingManager: LoadingManager
  private dracoLoader: DRACOLoader
  private ktx2Loader: KTX2Loader
  private gltfLoader: GLTFLoader
  private objLoader: OBJLoader
  private fbxLoader: FBXLoader
  private mtlLoader: MTLLoader
  private textureLoader: TextureLoader
  rendererManager: RendererManager

  // 存储从ZIP提取的文件URL，用于后续清理
  private extractedUrls: string[] = []

  // 支持的文件格式
  private static readonly SUPPORTED_FORMATS = ['gltf', 'glb', 'obj', 'fbx', 'zip']

  constructor() {
    this.rendererManager = container.resolve<RendererManager>('RendererManager')

    // 创建加载管理器以跟踪整体加载进度
    this.loadingManager = new LoadingManager(
      () => console.log('所有资源加载完成！'),
      (url, itemsLoaded, itemsTotal) => console.log(`加载进度: ${url} (${itemsLoaded}/${itemsTotal})`),
      (url) => console.error(`加载失败: ${url}`)
    )

    // 初始化DRACO解码器 - 用于解压GLTF中的压缩网格
    this.dracoLoader = new DRACOLoader().setDecoderPath('draco/') // 设置解码器路径

    // 初始化KTX2加载器 - 支持高效压缩纹理格式
    this.ktx2Loader = new KTX2Loader()
      .setTranscoderPath('basis/') // 设置转码器路径
      .detectSupport(this.rendererManager.getRenderer()) // 检测浏览器支持

    // 配置GLTF加载器
    this.gltfLoader = new GLTFLoader(this.loadingManager)
      .setCrossOrigin('anonymous') // 允许跨域加载
      .setDRACOLoader(this.dracoLoader) // 配置DRACO解码
      .setKTX2Loader(this.ktx2Loader) // 支持KTX2纹理
      .setMeshoptDecoder(MeshoptDecoder) // 设置网格优化解码器

    this.objLoader = new OBJLoader(this.loadingManager)
    this.fbxLoader = new FBXLoader(this.loadingManager)
    this.mtlLoader = new MTLLoader(this.loadingManager)
    this.textureLoader = new TextureLoader(this.loadingManager)
  }

  // 创建URL并添加到提取列表中的辅助方法
  private createObjectURL(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    this.extractedUrls.push(url)
    return url
  }

  /**
   * 加载模型 - 支持多种格式和ZIP压缩包
   *
   * @param file 3D模型文件或包含模型的ZIP压缩包
   * @param callback 加载完成后的回调函数，接收加载的模型对象
   * @param onProgress 可选的进度回调函数
   * @returns Promise，解析后的模型对象
   */
  async loadModel(file: File, callback?: (model: Object3D) => void, onProgress?: (event: ProgressEvent) => void): Promise<Object3D> {
    // 获取文件扩展名并检查有效性
    const fileExtension = this.getFileExtension(file)

    if (!fileExtension || !LoaderManager.SUPPORTED_FORMATS.includes(fileExtension)) {
      throw new Error(`不支持的文件格式: ${fileExtension || '未知'}`)
    }

    // 根据文件类型选择加载方法
    let model: Object3D
    if (fileExtension === 'zip') {
      model = await this.loadFromZip(file, onProgress)
    } else {
      model = await this.loadFromFile(file, onProgress)
    }

    // 如果提供了回调，则调用
    if (callback) callback(model)
    return model
  }

  /**
   * 解析并加载ZIP文件中的3D模型及其关联资源
   *
   * @param file ZIP文件
   * @param onProgress 可选的进度回调函数
   * @returns Promise，解析后的模型对象
   */
  private async loadFromZip(file: File, onProgress?: (event: ProgressEvent) => void): Promise<Object3D> {
    const zip = new JSZip()

    try {
      // 清理之前提取的资源
      this.cleanupExtractedUrls()

      // 加载并解析ZIP文件
      const zipContent = await zip.loadAsync(file, {
        checkCRC32: true, // 验证文件完整性
      })

      // 获取ZIP文件列表
      const zipFiles = Object.keys(zipContent.files).filter((name) => !zipContent.files[name].dir) // 只保留文件，排除目录

      // 查找主要模型文件
      const modelFileEntry = zipFiles.find((name) => /\.(gltf|glb|obj|fbx)$/i.test(name))

      if (!modelFileEntry) {
        throw new Error('ZIP压缩包中未找到有效的3D模型文件(.gltf, .glb, .obj, .fbx)')
      }

      // 获取模型文件扩展名
      const modelFileExtension = this.getFileExtension(new File([new Blob()], modelFileEntry))

      // 使用映射代替switch语句
      const loaderMap: Record<string, (content: JSZip, path: string, files: string[]) => Promise<Object3D>> = {
        gltf: this.loadGltfFromZip.bind(this),
        obj: this.loadObjFromZip.bind(this),
        glb: async (content, path) => {
          const modelBlob = await content.files[path].async('blob')
          const modelFile = new File([modelBlob], path, {
            type: 'application/octet-stream',
          })
          return this.loadFromFile(modelFile)
        },
        fbx: async (content, path) => {
          const modelBlob = await content.files[path].async('blob')
          const modelFile = new File([modelBlob], path, {
            type: 'application/octet-stream',
          })
          return this.loadFromFile(modelFile)
        },
      }

      const loader = loaderMap[modelFileExtension]
      if (!loader) {
        throw new Error(`不支持的模型格式: ${modelFileExtension}`)
      }

      return await loader(zipContent, modelFileEntry, zipFiles)
    } catch (error: any) {
      // 确保清理所有提取的URLs
      this.cleanupExtractedUrls()
      throw new Error(`解压或处理ZIP失败: ${error.message}`)
    }
  }

  /**
   * 从ZIP中加载GLTF模型及其所有关联资源
   *
   * @param zipContent 解析后的ZIP内容
   * @param gltfPath GLTF文件路径
   * @param allFiles ZIP中的所有文件路径
   * @returns Promise，解析后的模型对象
   */
  private async loadGltfFromZip(zipContent: JSZip, gltfPath: string, allFiles: string[]): Promise<Object3D> {
    try {
      // 读取GLTF文件内容
      const gltfBlob = await zipContent.files[gltfPath].async('blob')
      const gltfText = await gltfBlob.text()
      const gltfJson = JSON.parse(gltfText)

      // 获取GLTF文件所在目录路径
      const gltfDir = this.getDirectoryPath(gltfPath)

      // 用于存储原始路径与生成URL的映射
      const fileMap = new Map<string, string>()

      // 处理所有资源
      await Promise.all([
        // 处理binary buffer文件
        gltfJson.buffers && this.processGltfBuffers(gltfJson.buffers, gltfDir, zipContent, fileMap),
        // 处理图像/纹理文件
        gltfJson.images && this.processGltfImages(gltfJson.images, gltfDir, zipContent, fileMap),
      ])

      // 修改GLTF文件中的URI引用
      const modifiedGltfText = this.replaceUrisInText(gltfText, fileMap)

      // 创建修改后的GLTF文件
      const modifiedGltfBlob = new Blob([modifiedGltfText], {
        type: 'application/json',
      })
      const gltfUrl = this.createObjectURL(modifiedGltfBlob)

      // 加载修改后的GLTF
      return await this.loadGltfFromUrl(gltfUrl)
    } catch (error: any) {
      this.cleanupExtractedUrls()
      throw new Error(`处理GLTF文件失败: ${error.message}`)
    }
  }

  /**
   * 从URL加载GLTF模型
   */
  private loadGltfFromUrl(url: string): Promise<Object3D> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene || gltf.scenes[0]),
        undefined,
        (error: any) => {
          this.cleanupExtractedUrls()
          reject(new Error(`GLTF加载失败: ${error.message}`))
        }
      )
    })
  }

  /**
   * 获取文件所在目录路径
   */
  private getDirectoryPath(filePath: string): string {
    return filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/') + 1) : ''
  }

  /**
   * 处理GLTF中的二进制buffer文件
   */
  private async processGltfBuffers(buffers: any[], baseDir: string, zipContent: JSZip, fileMap: Map<string, string>): Promise<void> {
    for (const buffer of buffers) {
      if (buffer.uri && !buffer.uri.startsWith('data:')) {
        const bufferPath = this.normalizePath(baseDir + buffer.uri)
        if (zipContent.files[bufferPath]) {
          const bufferBlob = await zipContent.files[bufferPath].async('blob')
          const bufferUrl = URL.createObjectURL(bufferBlob)
          fileMap.set(buffer.uri, bufferUrl)
          this.extractedUrls.push(bufferUrl)
        }
      }
    }
  }

  /**
   * 处理GLTF中的图像文件
   */
  private async processGltfImages(images: any[], baseDir: string, zipContent: JSZip, fileMap: Map<string, string>): Promise<void> {
    for (const image of images) {
      if (image.uri && !image.uri.startsWith('data:')) {
        const imagePath = this.normalizePath(baseDir + image.uri)
        if (zipContent.files[imagePath]) {
          const imageBlob = await zipContent.files[imagePath].async('blob')
          const imageUrl = URL.createObjectURL(imageBlob)
          fileMap.set(image.uri, imageUrl)
          this.extractedUrls.push(imageUrl)
        }
      }
    }
  }

  /**
   * 从ZIP中加载OBJ模型及其MTL材质
   *
   * @param zipContent 解析后的ZIP内容
   * @param objPath OBJ文件路径
   * @param allFiles ZIP中的所有文件路径
   * @returns Promise，解析后的模型对象
   */
  private async loadObjFromZip(zipContent: JSZip, objPath: string, allFiles: string[]): Promise<Object3D> {
    try {
      // 获取OBJ文件内容
      const objBlob = await zipContent.files[objPath].async('blob')
      const objUrl = this.createObjectURL(objBlob)

      // 确定OBJ文件所在目录
      const objDir = this.getDirectoryPath(objPath)
      const objText = await objBlob.text()

      // 从OBJ内容中查找MTL文件引用
      const mtlMatch = objText.match(/mtllib\s+([^\s]+)/i)
      let mtlUrl = null

      // 如果找到MTL引用，则处理MTL文件
      if (mtlMatch && mtlMatch[1]) {
        mtlUrl = await this.processMtlFile(mtlMatch[1], objDir, zipContent)
      }

      // 使用OBJ加载器加载OBJ文件
      return await this.loadOBJ(objUrl, mtlUrl)
    } catch (error: any) {
      this.cleanupExtractedUrls()
      throw new Error(`处理OBJ文件失败: ${error.message}`)
    }
  }

  /**
   * 加载OBJ文件及其可能的MTL材质
   */
  private loadOBJ(url: string, mtlUrl?: string | null): Promise<Object3D> {
    return this.loadOBJWithMtl(url, mtlUrl)
  }

  /**
   * 加载OBJ文件及其MTL材质
   */
  private loadOBJWithMtl(objUrl: string, mtlUrl?: string | null): Promise<Object3D> {
    return new Promise((resolve, reject) => {
      if (mtlUrl) {
        // 有MTL文件时，先加载MTL
        this.mtlLoader.load(
          mtlUrl,
          (mtl) => {
            mtl.preload()
            this.objLoader.setMaterials(mtl)
            // 然后加载OBJ
            this.objLoader.load(objUrl, resolve, undefined, (error: any) => {
              this.cleanupExtractedUrls()
              reject(new Error(`OBJ加载失败: ${error.message}`))
            })
          },
          undefined,
          (error: any) => {
            this.cleanupExtractedUrls()
            reject(new Error(`MTL加载失败: ${error.message}`))
          }
        )
      } else {
        // 无MTL时直接加载OBJ
        this.objLoader.load(objUrl, resolve, undefined, (error: any) => {
          this.cleanupExtractedUrls()
          reject(new Error(`OBJ加载失败: ${error.message}`))
        })
      }
    })
  }

  /**
   * 处理MTL材质文件并提取纹理
   */
  private async processMtlFile(mtlFileName: string, baseDir: string, zipContent: JSZip): Promise<string | null> {
    const mtlPath = this.normalizePath(baseDir + mtlFileName)

    // 检查MTL文件是否存在
    if (!zipContent.files[mtlPath]) {
      return null
    }

    const mtlBlob = await zipContent.files[mtlPath].async('blob')
    const mtlText = await mtlBlob.text()

    // 查找MTL中引用的所有纹理
    const textureMatches = [...mtlText.matchAll(/map_\w+\s+([^\s]+)/g), ...mtlText.matchAll(/bump\s+([^\s]+)/g), ...mtlText.matchAll(/disp\s+([^\s]+)/g)]

    // 存储纹理路径和对应的URL
    const textureMap = new Map<string, string>()

    // 提取所有纹理文件并创建URL
    for (const match of textureMatches) {
      const texturePath = this.normalizePath(baseDir + match[1])
      if (zipContent.files[texturePath]) {
        const textureBlob = await zipContent.files[texturePath].async('blob')
        const textureUrl = URL.createObjectURL(textureBlob)
        textureMap.set(match[1], textureUrl)
        this.extractedUrls.push(textureUrl)
      }
    }

    // 替换MTL中的纹理路径
    let modifiedMtlText = mtlText
    for (const [originalPath, url] of textureMap.entries()) {
      // 替换各种材质贴图引用
      modifiedMtlText = this.replaceTextureReferences(modifiedMtlText, originalPath, url)
    }

    // 创建修改后的MTL文件
    const modifiedMtlBlob = new Blob([modifiedMtlText], { type: 'text/plain' })
    const modifiedMtlUrl = URL.createObjectURL(modifiedMtlBlob)
    this.extractedUrls.push(modifiedMtlUrl)

    return modifiedMtlUrl
  }

  /**
   * 替换MTL文件中的纹理引用
   */
  private replaceTextureReferences(text: string, originalPath: string, newUrl: string): string {
    const escapedPath = this.escapeRegExp(originalPath)
    // 替换各种材质属性引用的纹理
    return text
      .replace(new RegExp(`(map_\\w+\\s+)${escapedPath}`, 'g'), `$1${newUrl}`)
      .replace(new RegExp(`(bump\\s+)${escapedPath}`, 'g'), `$1${newUrl}`)
      .replace(new RegExp(`(disp\\s+)${escapedPath}`, 'g'), `$1${newUrl}`)
  }

  /**
   * 在文本中替换所有URI引用
   */
  private replaceUrisInText(text: string, uriMap: Map<string, string>): string {
    let result = text
    for (const [originalUri, newUrl] of uriMap.entries()) {
      const escapedUri = this.escapeRegExp(originalUri)
      result = result.replace(new RegExp(`"${escapedUri}"`, 'g'), `"${newUrl}"`)
    }
    return result
  }

  /**
   * 加载单个3D模型文件(非ZIP格式)
   *
   * @param file 3D模型文件（.gltf, .glb, .obj, .fbx）
   * @param onProgress 可选的进度回调函数
   * @returns Promise，解析后的模型对象
   */
  private loadFromFile(file: File, onProgress?: (event: ProgressEvent) => void): Promise<Object3D> {
    const fileExtension = this.getFileExtension(file)
    const url = this.createObjectURL(file)

    return new Promise((resolve, reject) => {
      try {
        // 使用映射代替switch语句
        const loaderMap: Record<string, () => void> = {
          gltf: () =>
            this.gltfLoader.load(
              url,
              (gltf) => resolve(gltf.scene || gltf.scenes[0]),
              onProgress,
              (error: any) => {
                this.cleanupExtractedUrls()
                reject(new Error(`GLTF/GLB加载失败: ${error.message}`))
              }
            ),
          glb: () =>
            this.gltfLoader.load(
              url,
              (gltf) => resolve(gltf.scene || gltf.scenes[0]),
              onProgress,
              (error: any) => {
                this.cleanupExtractedUrls()
                reject(new Error(`GLTF/GLB加载失败: ${error.message}`))
              }
            ),
          obj: async () => {
            try {
              const result = await this.loadOBJ(url)
              resolve(result)
            } catch (error) {
              this.cleanupExtractedUrls()
              reject(error)
            }
          },
          fbx: () =>
            this.fbxLoader.load(url, resolve, onProgress, (error: any) => {
              this.cleanupExtractedUrls()
              reject(new Error(`FBX加载失败: ${error.message}`))
            }),
        }

        const loader = loaderMap[fileExtension]
        if (!loader) {
          this.cleanupExtractedUrls()
          reject(new Error(`不支持的3D模型格式: ${fileExtension}`))
          return
        }

        loader()
      } catch (error: any) {
        this.cleanupExtractedUrls()
        reject(new Error(`加载模型时出错: ${error.message}`))
      }
    })
  }

  /**
   * 加载纹理
   *
   * @param file 纹理文件
   * @returns Promise，解析后的纹理对象
   */
  loadTexture(file: File): Promise<Texture> {
    const url = URL.createObjectURL(file)
    this.extractedUrls.push(url)

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          resolve(texture)
        },
        undefined,
        (error: any) => {
          this.cleanupExtractedUrls()
          reject(new Error(`纹理加载失败: ${error.message}`))
        }
      )
    })
  }

  /**
   * 获取文件扩展名
   *
   * @param file 文件对象
   * @returns 小写的文件扩展名
   */
  private getFileExtension(file: File): string | undefined {
    const nameParts = file.name.split('.')
    return nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : undefined
  }

  /**
   * 规范化文件路径，处理"./"和"../"引用
   *
   * @param path 原始文件路径
   * @returns 规范化后的路径
   */
  private normalizePath(path: string): string {
    // 分割路径为组件
    const parts = path.split('/')
    const result = []

    // 处理每个路径组件
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
   *
   * @param string 要转义的字符串
   * @returns 转义后的字符串
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 清理所有已创建的URL对象，防止内存泄漏
   */
  private cleanupExtractedUrls(): void {
    for (const url of this.extractedUrls) {
      URL.revokeObjectURL(url)
    }
    this.extractedUrls = []
  }

  clear(): void {
    this.cleanupExtractedUrls()
  }

  update(dt: number): void {
    // 目前无需实现，预留接口以支持将来的扩展
  }
}
