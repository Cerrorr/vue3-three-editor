// 依赖注入容器
class DIContainer {
  private services = new Map<string, any>()

  register<T>(name: string, instance: T): void {
    this.services.set(name, instance)
  }

  resolve<T>(name: string): T {
    const instance = this.services.get(name)
    if (!instance) {
      throw new Error(`Service "${name}" is not registered.`)
    }
    return instance
  }
}

export const container = new DIContainer()
