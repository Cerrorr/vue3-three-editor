import { container } from '@/three/container/DIContainer'

import type { GUIManager } from '../manager/GUIManager'

export class DebugUI {
  private gui: any;  // GUIManager 的 pane
  private mainManager: any; // MainManager 或其他相关对象

  constructor(mainManager: any) {
    this.mainManager = mainManager
    this.gui = container.resolve<GUIManager>('GUIManager').pane; // 假设 GUIManager 中有 pane 对象来管理 UI
  }

  initDebugUI(): void {
    // 添加调试按钮
    this.gui.addButton({ title: "Debug" }).on('click', () => {
      console.log('Debug UI Button Clicked');
      // 在这里添加更多 debug 相关的交互
    });

    // 继续添加其他调试功能
  
  }
}
