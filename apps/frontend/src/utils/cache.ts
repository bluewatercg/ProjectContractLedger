/**
 * 前端缓存工具类
 * 支持内存缓存和 localStorage 持久化缓存
 */

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem>();
  private readonly prefix = 'app_cache_';

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttlSeconds TTL（秒）
   * @param persistent 是否持久化到 localStorage
   */
  set(key: string, data: any, ttlSeconds: number = 300, persistent: boolean = false): void {
    const item: CacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };

    // 内存缓存
    this.memoryCache.set(key, item);

    // 持久化缓存
    if (persistent) {
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @param checkPersistent 是否检查持久化缓存
   */
  get(key: string, checkPersistent: boolean = false): any | null {
    // 先检查内存缓存
    let item = this.memoryCache.get(key);

    // 如果内存缓存没有，检查持久化缓存
    if (!item && checkPersistent) {
      try {
        const stored = localStorage.getItem(this.prefix + key);
        if (stored) {
          item = JSON.parse(stored);
          // 恢复到内存缓存
          if (item) {
            this.memoryCache.set(key, item);
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      // 缓存过期，清理
      this.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear();
    
    // 清理 localStorage 中的缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * 获取缓存信息
   */
  getInfo(): { memorySize: number; persistentKeys: string[] } {
    const persistentKeys: string[] = [];
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          persistentKeys.push(key.replace(this.prefix, ''));
        }
      });
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
    }

    return {
      memorySize: this.memoryCache.size,
      persistentKeys
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    
    // 清理内存缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // 清理持久化缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const item = JSON.parse(stored);
              if (now - item.timestamp > item.ttl) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // 如果解析失败，删除该项
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

// 创建全局缓存实例
export const cache = new CacheManager();

// 定期清理过期缓存（每5分钟）
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export default cache;
