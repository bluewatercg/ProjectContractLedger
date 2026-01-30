import apiClient from "./config";
import type {
  ApiResponse,
  ReportQueryParams,
  ContractReportData,
  InvoiceReportData,
  PaymentReportData,
  ReconciliationReportData,
  FinancialSummaryData,
  ExportReportDto,
} from "./types";

export const reportApi = {
  /**
   * 获取合同报表
   */
  getContractReport(
    params: ReportQueryParams,
  ): Promise<ApiResponse<ContractReportData>> {
    return apiClient
      .get("/reports/contracts", { params })
      .then((res) => res.data);
  },

  /**
   * 获取发票报表
   */
  getInvoiceReport(
    params: ReportQueryParams,
  ): Promise<ApiResponse<InvoiceReportData>> {
    return apiClient
      .get("/reports/invoices", { params })
      .then((res) => res.data);
  },

  /**
   * 获取支付报表
   */
  getPaymentReport(
    params: ReportQueryParams,
  ): Promise<ApiResponse<PaymentReportData>> {
    return apiClient
      .get("/reports/payments", { params })
      .then((res) => res.data);
  },

  /**
   * 获取对账报表
   */
  getReconciliationReport(
    params: ReportQueryParams,
  ): Promise<ApiResponse<ReconciliationReportData>> {
    return apiClient
      .get("/reports/reconciliations", { params })
      .then((res) => res.data);
  },

  /**
   * 获取财务汇总报表
   */
  getFinancialSummary(
    params: ReportQueryParams,
  ): Promise<ApiResponse<FinancialSummaryData>> {
    return apiClient
      .get("/reports/financial-summary", { params })
      .then((res) => res.data);
  },

  /**
   * 导出报表
   */
  async exportReport(dto: ExportReportDto): Promise<Blob> {
    const response = await apiClient.post("/reports/export", dto, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * 清除报表缓存
   */
  clearCache(): Promise<ApiResponse> {
    return apiClient.post("/reports/cache/clear").then((res) => res.data);
  },
};
