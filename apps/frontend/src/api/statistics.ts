import apiClient from "./config";
import type { ApiResponse, DashboardStats } from "./types";
import { cache } from "@/utils/cache";
import { useKitStore } from "@/stores/kit";

export const statisticsApi = {
  /**
   * 获取仪表板统计数据（带缓存）
   */
  async getDashboardStats(
    year?: number,
    useCache: boolean = true,
  ): Promise<ApiResponse<DashboardStats>> {
    // 获取当前套账ID，确保缓存按套账隔离
    const kitStore = useKitStore();
    const kitId = kitStore.currentKitId;

    // 缓存key包含kitId，避免不同套账数据混淆
    const cacheKey = kitId
      ? (year ? `dashboard_stats_${kitId}_${year}` : `dashboard_stats_${kitId}`)
      : (year ? `dashboard_stats_${year}` : "dashboard_stats");

    // 尝试从缓存获取
    if (useCache) {
      const cachedData = cache.get(cacheKey, true);
      if (cachedData) {
        console.log(
          `Dashboard stats loaded from cache for kit ${kitId}${year ? ` (${year})` : ""}`,
        );
        return cachedData;
      }
    }

    console.log(
      `Fetching fresh dashboard stats from API for kit ${kitId}${year ? ` for year ${year}` : ""}`,
    );
    const startTime = Date.now();

    try {
      const response = await apiClient.get("/statistics/dashboard", {
        params: { year },
      });
      const result = response.data;

      const endTime = Date.now();
      console.log(`Dashboard stats API call took ${endTime - startTime}ms`);

      // 缓存结果，TTL为3分钟，持久化
      if (result.success) {
        cache.set(cacheKey, result, 180, true);
      }

      return result;
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      throw error;
    }
  },

  /**
   * 获取月度收入趋势（固定12个月）
   */
  getMonthlyRevenueTrend(year: number): Promise<ApiResponse<any[]>> {
    return apiClient
      .get("/statistics/revenue/trend", {
        params: { year },
      })
      .then((res) => res.data);
  },

  /**
   * 获取客户贡献统计
   */
  getCustomerContribution(
    year: number,
    limit?: number,
  ): Promise<ApiResponse<any[]>> {
    return apiClient
      .get("/statistics/customers/contribution", {
        params: { year, limit },
      })
      .then((res) => res.data);
  },

  /**
   * 获取合同状态分布
   */
  getContractStatusDistribution(year: number): Promise<ApiResponse<any[]>> {
    return apiClient
      .get("/statistics/contracts/status", {
        params: { year },
      })
      .then((res) => res.data);
  },

  /**
   * 获取发票状态分布
   */
  getInvoiceStatusDistribution(year: number): Promise<ApiResponse<any[]>> {
    return apiClient
      .get("/statistics/invoices/status", {
        params: { year },
      })
      .then((res) => res.data);
  },

  /**
   * 获取支付方式统计
   */
  getPaymentMethodStats(): Promise<ApiResponse<any[]>> {
    return apiClient
      .get("/statistics/payments/methods")
      .then((res) => res.data);
  },

  /**
   * 获取逾期发票提醒
   */
  getOverdueInvoicesAlert(): Promise<ApiResponse<any>> {
    return apiClient.get("/statistics/alerts/overdue").then((res) => res.data);
  },

  /**
   * 获取可用年份列表
   */
  getAvailableYears(): Promise<ApiResponse<number[]>> {
    return apiClient.get("/statistics/available-years").then((res) => res.data);
  },

  /**
   * 清除统计数据缓存
   */
  clearCache(year?: number): void {
    const kitStore = useKitStore();
    const kitId = kitStore.currentKitId;

    // 清除当前套账的缓存
    if (kitId) {
      if (year) {
        cache.delete(`dashboard_stats_${kitId}_${year}`);
      } else {
        cache.delete(`dashboard_stats_${kitId}`);
      }
      console.log(`Statistics cache cleared for kit ${kitId}`);
    } else {
      // 兜底：清除不带kitId的缓存
      if (year) {
        cache.delete(`dashboard_stats_${year}`);
      } else {
        cache.delete("dashboard_stats");
      }
      console.log("Statistics cache cleared");
    }
  },

  /**
   * 强制刷新仪表板数据
   */
  async refreshDashboardStats(
    year?: number,
  ): Promise<ApiResponse<DashboardStats>> {
    this.clearCache(year);
    return this.getDashboardStats(year, false);
  },

  /**
   * 获取账龄分析
   */
  getAgingAnalysis(year?: number): Promise<ApiResponse<any>> {
    return apiClient
      .get("/statistics/aging-analysis", {
        params: { year },
      })
      .then((res) => res.data);
  },
};

