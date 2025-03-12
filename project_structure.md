📦 项目根目录
├── public/                 # 公共资源目录（不会被 Webpack / Vite 处理）
│   ├── models/                 # 3D 模型文件（GLTF、FBX 等）
│   ├── textures/               # 纹理文件（JPG、PNG、HDR 等）
│   └── vite.svg                # Vite 默认的 SVG 图标
│
├── src/                    # 源代码目录
│   ├── assets/                 # 静态资源（如图片、SVG 等）
│   │   └── vue.svg             # Vue.js 相关的 SVG 图标
│   ├── components/             # Vue 组件目录
│   │   └── HelloWorld.vue      # 示例 Vue 组件
│   ├── route/                  # 路由管理
│   ├── store/                  # 状态管理（Vuex 或 Pinia）
│   ├── style/                  # 样式文件（CSS / SCSS / Tailwind）
│   ├── three/              # Three.js 相关代码（3D 相关的所有内容）
│   │   ├── assets/             # 3D 相关的资源文件
│   │   │   ├── fonts/          # 字体资源
│   │   │   ├── models/         # 3D 模型文件
│   │   │   ├── shaders/        # GLSL 着色器代码
│   │   │   └── textures/       # 纹理资源
│   │   ├── core/               # Three.js 核心功能封装
│   │   │   ├── ThreeConfig.ts  # Three.js 配置文件（全局参数）
│   │   │   └── ThreeService.ts # Three.js 主要服务，提供 API
│   │   ├── examples/           # 示例代码
│   │   │   ├── animationExample.ts  # 动画示例
│   │   │   ├── basicScene.ts        # 基础场景示例
│   │   │   ├── physicsExample.ts     # 物理引擎示例
│   │   │   └── postProcessing.ts     # 后处理示例
│   │   ├── loaders/            # 资源加载器
│   │   │   ├── FontLoader.ts   # 字体加载器
│   │   │   ├── HDRLoader.ts    # HDR 贴图加载器
│   │   │   ├── ModelLoader.ts  # 3D 模型加载器（GLTF、FBX、OBJ）
│   │   │   └── TextureLoader.ts # 纹理加载器
│   │   ├── manager/            # 3D 相关的管理器
│   │   │   ├── AnimationManager.ts        # 动画管理
│   │   │   ├── CameraManager.ts           # 摄像机管理
│   │   │   ├── CollectorManager.ts        # 资源收集器（存储模型、动画等）
│   │   │   ├── ControlManager.ts          # 交互控制管理
│   │   │   ├── GUIManager.ts              # GUI（如 dat.GUI）
│   │   │   ├── LightManager.ts            # 灯光管理
│   │   │   ├── MainManager.ts             # 统一管理所有 Three.js 相关的管理器
│   │   │   ├── MaterialManager.ts         # 材质管理
│   │   │   ├── ObjectManager.ts           # 3D 物体管理（动态加载/删除）
│   │   │   ├── PhysicsManager.ts          # 物理管理（基于 Cannon.js / Ammo.js）
│   │   │   ├── PostProcessingManager.ts   # 后处理管理（如 Bloom、SSAO）
│   │   │   ├── RenderManager.ts           # 渲染管理
│   │   │   └── SceneManager.ts            # 场景管理
│   │   ├── physics/             # 物理引擎相关代码
│   │   │   ├── CollisionHandler.ts # 碰撞检测
│   │   │   ├── PhysicsWorld.ts     # 物理世界初始化
│   │   │   └── RigidBody.ts        # 刚体物理
│   │   ├── shaders/             # 自定义 GLSL 着色器
│   │   │   ├── CustomShader.ts  # 自定义 Shader
│   │   │   ├── SkyboxShader.ts  # 天空盒 Shader
│   │   │   └── WaterShader.ts   # 水面 Shader
│   │   ├── tests/               # 测试代码
│   │   │   ├── PhysicsManager.test.ts # 物理管理测试
│   │   │   └── SceneManager.test.ts   # 场景管理测试
│   │   ├── ui/                  # UI 交互层（如性能监测）
│   │   │   ├── DebugUI.ts        # 调试 UI（如 dat.GUI）
│   │   │   └── StatsMonitor.ts   # FPS 监控（stats.js）
│   │   ├── utils/                # 通用工具方法
│   │   │   ├── HelperUtils.ts    # Three.js 相关工具（坐标轴、网格等）
│   │   │   ├── Logger.ts         # 日志管理
│   │   │   ├── MathUtils.ts      # 数学计算工具
│   │   │   └── eventBus.ts       # 事件总线（mitt）
│   │   ├── index.ts              # Three.js 入口文件
│   │   └── three.d.ts            # Three.js 类型定义
│   ├── utils/                 # 全局工具方法
│   ├── views/                 # 页面视图（Vue 组件）
│   ├── App.vue                # Vue 入口组件
│   ├── main.ts                # 入口文件（挂载 Vue 应用）
│   ├── style.css              # 全局样式
│   └── vite-env.d.ts          # Vite 相关的 TypeScript 声明
│
├── README.md              # 项目说明文档
├── index.html             # 入口 HTML 文件
├── package-lock.json      # 依赖锁定文件
├── package.json           # 依赖管理文件
├── project_structure.md   # 生成的项目目录结构文件
├── tsconfig.app.json      # TypeScript 配置（应用层）
├── tsconfig.json          # TypeScript 全局配置
├── tsconfig.node.json     # Node.js 相关的 TS 配置
└── vite.config.ts         # Vite 配置文件
