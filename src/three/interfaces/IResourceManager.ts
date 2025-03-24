/**
 * 基础资源管理器接口 - 所有管理器都应该实现这个接口
 */
export interface IResourceManager {
  /**
   * 初始化管理器
   */
  init(): void

  /**
   * 更新管理器状态
   * @param dt 距离上一帧的时间差（秒）
   */
  update(dt: number): void

  /**
   * 清理管理器资源
   */
  clear(): void
}

/**
 * 场景管理器接口
 */
export interface ISceneManager extends IResourceManager {
  /**
   * 获取场景实例
   */
  getScene(): THREE.Scene
}

/**
 * 相机管理器接口
 */
export interface ICameraManager extends IResourceManager {
  /**
   * 获取当前活动相机
   */
  getActiveCamera(): THREE.PerspectiveCamera
}

/**
 * 渲染器管理器接口
 */
export interface IRendererManager extends IResourceManager {
  /**
   * 获取渲染器实例
   */
  getRenderer(): THREE.WebGLRenderer

  /**
   * 执行渲染
   */
  render(): void
}

/**
 * 加载器管理器接口
 */
export interface ILoaderManager extends IResourceManager {
  /**
   * 加载3D模型
   * @param file 模型文件
   * @param onLoad 加载完成回调
   */
  loadModel(file: File, onLoad?: (object: THREE.Object3D) => void): Promise<THREE.Object3D>

  /**
   * 加载纹理
   * @param file 纹理文件
   */
  loadTexture(file: File | string): Promise<THREE.Texture>

  /**
   * 加载HDR纹理
   * @param file HDR纹理文件
   */
  loadHDRTexture(file: File | string): Promise<THREE.Texture>
}

/**
 * 灯光管理器接口
 */
export interface ILightManager extends IResourceManager {
  /**
   * 创建灯光
   */
  // createLights(scene: THREE.Scene, intensity: number): void
}

/**
 * 辅助工具管理器接口
 */
export interface IHelperManager extends IResourceManager {
  /**
   * 显示或隐藏辅助工具
   * @param visible 是否可见
   */
  setVisibility(visible: boolean): void
}

/**
 * 控制器管理器接口
 */
export interface IControlsManager extends IResourceManager {}

/**
 * GUI管理器接口
 */
export interface IGUIManager extends IResourceManager {
  /**
   * 创建GUI面板
   */
  createGUI(): void
}

/**
 * 选择管理器接口
 */
export interface ISelectionManager extends IResourceManager {
  /**
   * 选择对象
   * @param object 要选择的对象
   */
  select(object: THREE.Object3D): void;
  
  /**
   * 取消选择当前对象
   */
  deselect(): void;
  
  /**
   * 获取当前选中的对象
   */
  getSelection(): THREE.Object3D | null;
  
  /**
   * 检查对象是否被选中
   */
  isSelected(object: THREE.Object3D): boolean;
  
  /**
   * 高亮选中的对象
   * @param highlight 是否高亮
   */
  highlightSelection(highlight: boolean): void;
}

/**
 * 编辑交互管理器接口
 */
export interface IEditorInteractionManager extends IResourceManager {
  /**
   * 启用编辑模式
   * @param mode 编辑模式('translate' | 'rotate' | 'scale')
   */
  enableEditMode(mode: string): void;
  
  /**
   * 禁用编辑模式
   */
  disableEditMode(): void;
  
  /**
   * 获取当前编辑模式
   */
  getCurrentEditMode(): string | null;
  
  /**
   * 切换编辑空间(世界/本地)
   */
  toggleSpace(): void;
}

// 导入THREE类型，避免编译错误
import * as THREE from 'three'
