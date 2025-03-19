/**
 * 要求方法在调用前必须先初始化的装饰器
 * 适用于检查对象上有initialized属性的情况
 */
export function requiresInit(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    // 使用any类型绕过私有属性访问限制
    if (!(this as any).initialized) {
      throw new Error('请先调用 init 方法初始化后再使用此功能')
    }
    console.log(this)
    return originalMethod.apply(this, args)
  }

  return descriptor
}
