// API版本管理模块
// 支持动态版本切换和向后兼容，无需硬编码版本号

export interface ApiVersionConfig {
  version: string
  baseURL: string
  deprecated?: boolean
  supportedUntil?: string
  features?: string[]
  minVersion?: string
  maxVersion?: string
}

// 动态版本配置生成器
const generateVersionConfig = (version: string): ApiVersionConfig => {
  return {
    version,
    baseURL: `/api/${version}`,
    deprecated: false,
    features: getVersionFeatures(version)
  }
}

// 根据版本号动态获取功能列表
const getVersionFeatures = (version: string): string[] => {
  const versionNumber = parseInt(version.replace('v', ''))
  const baseFeatures = ['auth', 'customers', 'contracts', 'invoices', 'payments', 'statistics']

  // 根据版本号动态添加功能
  const additionalFeatures: Record<number, string[]> = {
    2: ['attachments', 'notifications'],
    3: ['reports', 'analytics', 'webhooks'],
    4: ['ai-insights', 'automation', 'integrations'],
    5: ['mobile-api', 'real-time', 'advanced-search']
  }

  let allFeatures = [...baseFeatures]

  // 累积添加功能（向后兼容）
  for (let v = 2; v <= versionNumber; v++) {
    if (additionalFeatures[v]) {
      allFeatures = [...allFeatures, ...additionalFeatures[v]]
    }
  }

  return allFeatures
}

// 动态获取API版本配置
export const getApiVersionConfig = (version?: string): ApiVersionConfig => {
  const targetVersion = version || getCurrentApiVersion()
  return generateVersionConfig(targetVersion)
}

// 获取运行时配置
const getRuntimeConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__APP_CONFIG__) {
    return (window as any).__APP_CONFIG__
  }
  return {}
}

// 获取当前API版本
export const getCurrentApiVersion = (): string => {
  const runtimeConfig = getRuntimeConfig()

  // 1. 优先使用运行时配置的版本
  if (runtimeConfig.API_VERSION) {
    return normalizeVersion(runtimeConfig.API_VERSION)
  }

  // 2. 从API_BASE_URL中提取版本
  if (runtimeConfig.API_BASE_URL) {
    const version = extractVersionFromUrl(runtimeConfig.API_BASE_URL)
    if (version) return version
  }

  // 3. 使用构建时环境变量
  if (import.meta.env.VITE_API_VERSION) {
    return normalizeVersion(import.meta.env.VITE_API_VERSION)
  }

  // 4. 从构建时API_BASE_URL中提取
  if (import.meta.env.VITE_API_BASE_URL) {
    const version = extractVersionFromUrl(import.meta.env.VITE_API_BASE_URL)
    if (version) return version
  }

  // 5. 默认版本
  return 'v1'
}

// 从URL中提取版本号的通用函数
const extractVersionFromUrl = (url: string): string | null => {
  // 支持多种版本格式: v1, v2, v1.0, v2.1, etc.
  const match = url.match(/\/api\/(v\d+(?:\.\d+)?)/)
  return match ? normalizeVersion(match[1]) : null
}

// 标准化版本号格式
const normalizeVersion = (version: string): string => {
  // 确保版本号以 'v' 开头
  if (!version.startsWith('v')) {
    version = 'v' + version
  }

  // 如果只有主版本号，保持简单格式 (v1, v2, v3...)
  if (/^v\d+$/.test(version)) {
    return version
  }

  // 如果有子版本号，保持完整格式 (v1.0, v2.1...)
  if (/^v\d+\.\d+/.test(version)) {
    return version
  }

  // 默认返回v1
  return 'v1'
}

// 检查版本是否有效
export const isValidVersion = (version: string): boolean => {
  const normalized = normalizeVersion(version)
  // 支持 v1, v2, v3... 或 v1.0, v2.1... 格式
  return /^v\d+(\.\d+)?$/.test(normalized)
}

// 比较版本号大小
export const compareVersions = (version1: string, version2: string): number => {
  const v1 = normalizeVersion(version1).replace('v', '').split('.').map(Number)
  const v2 = normalizeVersion(version2).replace('v', '').split('.').map(Number)

  // 补齐版本号长度
  while (v1.length < v2.length) v1.push(0)
  while (v2.length < v1.length) v2.push(0)

  for (let i = 0; i < v1.length; i++) {
    if (v1[i] > v2[i]) return 1
    if (v1[i] < v2[i]) return -1
  }

  return 0
}

// 获取最新版本号
export const getLatestVersion = (): string => {
  // 可以从API获取，或者从配置中读取
  const runtimeConfig = getRuntimeConfig()
  return runtimeConfig.LATEST_API_VERSION || 'v1'
}

// 构建完整的API Base URL
export const buildApiBaseUrl = (version?: string): string => {
  const runtimeConfig = getRuntimeConfig()
  const versionConfig = getApiVersionConfig(version)
  
  // 1. 优先使用运行时配置
  if (runtimeConfig.API_BASE_URL) {
    return runtimeConfig.API_BASE_URL
  }
  
  // 2. 使用构建时环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 3. 生产环境动态配置
  if (import.meta.env.PROD) {
    const currentHost = window.location.hostname
    const currentPort = window.location.port
    const backendPort = runtimeConfig.BACKEND_PORT || '8080'
    
    // 前后端分离部署
    if (currentPort !== backendPort && backendPort !== '80') {
      return `${window.location.protocol}//${currentHost}:${backendPort}${versionConfig.baseURL}`
    }
    
    // 通过nginx代理
    return versionConfig.baseURL
  }
  
  // 4. 开发环境默认
  return versionConfig.baseURL
}

// 检查API版本兼容性
export const checkApiCompatibility = (requiredFeatures: string[], version?: string): boolean => {
  const versionConfig = getApiVersionConfig(version)
  return requiredFeatures.every(feature => versionConfig.features?.includes(feature))
}

// 获取版本支持的功能列表
export const getVersionFeatureList = (version?: string): string[] => {
  const versionConfig = getApiVersionConfig(version)
  return versionConfig.features || []
}

// 检查功能是否在指定版本中可用
export const isFeatureAvailable = (feature: string, version?: string): boolean => {
  const features = getVersionFeatureList(version)
  return features.includes(feature)
}

// 获取版本信息
export const getVersionInfo = () => {
  const currentVersion = getCurrentApiVersion()
  const config = getApiVersionConfig(currentVersion)
  const latestVersion = getLatestVersion()

  return {
    current: currentVersion,
    latest: latestVersion,
    baseURL: buildApiBaseUrl(),
    config,
    deprecated: config.deprecated,
    supportedUntil: config.supportedUntil,
    isLatest: compareVersions(currentVersion, latestVersion) === 0,
    canUpgrade: compareVersions(currentVersion, latestVersion) < 0,
    features: config.features || []
  }
}

// 版本迁移助手
export const createVersionMigrationHelper = () => {
  return {
    // 检查是否需要迁移
    needsMigration: (fromVersion: string, toVersion: string) => {
      return compareVersions(fromVersion, toVersion) !== 0 && isValidVersion(toVersion)
    },

    // 获取迁移指南
    getMigrationGuide: (fromVersion: string, toVersion: string) => {
      const fromFeatures = getVersionFeatureList(fromVersion)
      const toFeatures = getVersionFeatureList(toVersion)

      const newFeatures = toFeatures.filter(f => !fromFeatures.includes(f))
      const removedFeatures = fromFeatures.filter(f => !toFeatures.includes(f))

      return {
        from: fromVersion,
        to: toVersion,
        isUpgrade: compareVersions(fromVersion, toVersion) < 0,
        isDowngrade: compareVersions(fromVersion, toVersion) > 0,
        newFeatures,
        removedFeatures,
        breakingChanges: removedFeatures.length > 0 ? removedFeatures : [],
        compatible: removedFeatures.length === 0
      }
    },

    // 获取升级路径
    getUpgradePath: (fromVersion: string, toVersion: string) => {
      const from = parseInt(fromVersion.replace('v', ''))
      const to = parseInt(toVersion.replace('v', ''))

      if (from >= to) return []

      const path = []
      for (let v = from + 1; v <= to; v++) {
        path.push(`v${v}`)
      }

      return path
    }
  }
}

export default {
  getCurrentApiVersion,
  getApiVersionConfig,
  buildApiBaseUrl,
  checkApiCompatibility,
  getVersionInfo,
  createVersionMigrationHelper
}
