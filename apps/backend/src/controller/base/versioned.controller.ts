import { Controller, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';

/**
 * 版本化控制器基类
 * 提供通用的版本管理功能，支持动态版本路由
 */
export abstract class VersionedController {
  @Inject()
  protected ctx: Context;

  /**
   * 获取当前控制器的API版本
   */
  protected getApiVersion(): string {
    // 从路由路径中提取版本号
    const path = this.ctx.path;
    const match = path.match(/\/api\/(v\d+(?:\.\d+)?)\//);
    return match ? match[1] : 'v1';
  }

  /**
   * 检查版本兼容性
   */
  public checkVersionCompatibility(requiredVersion: string): boolean {
    const currentVersion = this.getApiVersion();
    return this.compareVersions(currentVersion, requiredVersion) >= 0;
  }

  /**
   * 比较版本号
   * @param version1 版本1
   * @param version2 版本2
   * @returns 1: version1 > version2, 0: 相等, -1: version1 < version2
   */
  protected compareVersions(version1: string, version2: string): number {
    const v1 = version1.replace('v', '').split('.').map(Number);
    const v2 = version2.replace('v', '').split('.').map(Number);

    // 补齐版本号长度
    while (v1.length < v2.length) v1.push(0);
    while (v2.length < v1.length) v2.push(0);

    for (let i = 0; i < v1.length; i++) {
      if (v1[i] > v2[i]) return 1;
      if (v1[i] < v2[i]) return -1;
    }

    return 0;
  }

  /**
   * 获取版本化的响应格式
   */
  protected createVersionedResponse(
    data: any,
    message: string,
    success = true
  ): any {
    const version = this.getApiVersion();

    const baseResponse = {
      success,
      message,
      version,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      baseResponse['data'] = data;
    } else {
      baseResponse['error'] = data;
    }

    // 根据版本添加额外字段
    if (this.compareVersions(version, 'v2') >= 0) {
      baseResponse['requestId'] = this.generateRequestId();
    }

    if (this.compareVersions(version, 'v3') >= 0) {
      baseResponse['apiVersion'] = version;
      baseResponse['deprecationWarnings'] =
        this.getDeprecationWarnings(version);
    }

    return baseResponse;
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取弃用警告
   */
  private getDeprecationWarnings(version: string): string[] {
    const warnings: string[] = [];

    // 可以根据版本添加相应的弃用警告
    if (this.compareVersions(version, 'v4') >= 0) {
      warnings.push('某些v1 API将在v5中移除，请考虑升级');
    }

    return warnings;
  }

  /**
   * 检查功能是否在当前版本中可用
   */
  public isFeatureAvailable(feature: string): boolean {
    const version = this.getApiVersion();
    const versionNumber = parseInt(version.replace('v', ''));

    // 定义功能的最低版本要求
    const featureVersions: Record<string, number> = {
      attachments: 2,
      notifications: 2,
      reports: 3,
      analytics: 3,
      webhooks: 3,
      'ai-insights': 4,
      automation: 4,
      integrations: 4,
      'mobile-api': 5,
      'real-time': 5,
      'advanced-search': 5,
    };

    const requiredVersion = featureVersions[feature];
    return requiredVersion ? versionNumber >= requiredVersion : true;
  }

  /**
   * 功能不可用时的响应
   */
  public featureNotAvailable(feature: string) {
    const version = this.getApiVersion();
    return this.createVersionedResponse(
      { feature, currentVersion: version },
      `功能 '${feature}' 在版本 ${version} 中不可用`,
      false
    );
  }

  /**
   * 版本不兼容时的响应
   */
  public versionNotSupported(requiredVersion: string) {
    const currentVersion = this.getApiVersion();
    return this.createVersionedResponse(
      { currentVersion, requiredVersion },
      `此操作需要API版本 ${requiredVersion} 或更高版本，当前版本为 ${currentVersion}`,
      false
    );
  }
}

/**
 * 版本化控制器装饰器工厂
 * 用于动态创建不同版本的控制器
 */
export function createVersionedController(version: string, basePath: string) {
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    // 动态设置控制器路径
    const controllerPath = `/api/${version}${basePath}`;

    // 应用Controller装饰器
    return Controller(controllerPath)(constructor);
  };
}

/**
 * 版本兼容性装饰器
 * 用于标记方法的最低版本要求
 */
export function RequireVersion(minVersion: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const controller = this as VersionedController;

      if (!controller.checkVersionCompatibility(minVersion)) {
        return controller.versionNotSupported(minVersion);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 功能可用性装饰器
 * 用于检查功能在当前版本中是否可用
 */
export function RequireFeature(feature: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const controller = this as VersionedController;

      if (!controller.isFeatureAvailable(feature)) {
        return controller.featureNotAvailable(feature);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
