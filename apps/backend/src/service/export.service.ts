import { Provide } from '@midwayjs/core';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Provide()
export class ExportService {
  /**
   * 导出为Excel格式
   */
  async exportToExcel(data: any, reportType: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('报表数据');

    // 设置标题
    worksheet.addRow([this.getReportTitle(reportType)]);
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // 添加空行
    worksheet.addRow([]);

    // 根据报表类型添加不同的内容
    switch (reportType) {
      case 'contract':
        this.addContractDataToExcel(worksheet, data);
        break;
      case 'invoice':
        this.addInvoiceDataToExcel(worksheet, data);
        break;
      case 'payment':
        this.addPaymentDataToExcel(worksheet, data);
        break;
      case 'reconciliation':
        this.addReconciliationDataToExcel(worksheet, data);
        break;
      case 'financial':
        this.addFinancialDataToExcel(worksheet, data);
        break;
    }

    // 自动调整列宽
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // 生成Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出为PDF格式
   */
  async exportToPdf(data: any, reportType: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 添加标题
      doc.fontSize(20).text(this.getReportTitle(reportType), {
        align: 'center',
      });
      doc.moveDown();

      // 根据报表类型添加不同的内容
      switch (reportType) {
      case 'contract':
        this.addContractDataToPdf(doc, data);
        break;
      case 'invoice':
        this.addInvoiceDataToPdf(doc, data);
        break;
      case 'payment':
        this.addPaymentDataToPdf(doc, data);
        break;
      case 'reconciliation':
        this.addReconciliationDataToPdf(doc, data);
        break;
      case 'financial':
        this.addFinancialDataToPdf(doc, data);
        break;
    }

      doc.end();
    });
  }

  /**
   * 导出为CSV格式
   */
  async exportToCsv(data: any, reportType: string): Promise<Buffer> {
    let csvContent = '';

    // 添加标题行
    csvContent += this.getReportTitle(reportType) + '\n\n';

    // 根据报表类型添加不同的内容
    switch (reportType) {
      case 'contract':
        csvContent += this.getContractCsvContent(data);
        break;
      case 'invoice':
        csvContent += this.getInvoiceCsvContent(data);
        break;
      case 'payment':
        csvContent += this.getPaymentCsvContent(data);
        break;
      case 'reconciliation':
        csvContent += this.getReconciliationCsvContent(data);
        break;
      case 'financial':
        csvContent += this.getFinancialCsvContent(data);
        break;
    }

    // 添加BOM以支持中文
    const bom = '\uFEFF';
    return Buffer.from(bom + csvContent, 'utf-8');
  }

  /**
   * 获取报表标题
   */
  private getReportTitle(reportType: string): string {
    const titles = {
      contract: '合同报表',
      invoice: '发票报表',
      payment: '支付报表',
      reconciliation: '对账报表',
      financial: '财务汇总报表',
    };
    return titles[reportType] || '报表';
  }

  /**
   * 添加合同数据到Excel
   */
  private addContractDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    // 添加汇总信息
    worksheet.addRow(['汇总信息']);
    worksheet.addRow(['合同总数', data.summary.totalCount]);
    worksheet.addRow(['合同总额', data.summary.totalAmount.toFixed(2)]);
    worksheet.addRow(['执行中合同', data.summary.activeCount]);
    worksheet.addRow(['已完成合同', data.summary.completedCount]);
    worksheet.addRow(['平均合同金额', data.summary.averageAmount.toFixed(2)]);
    worksheet.addRow([]);

    // 添加趋势数据
    worksheet.addRow(['趋势数据']);
    worksheet.addRow(['周期', '数量', '金额']);
    data.trend.forEach(item => {
      worksheet.addRow([item.periodLabel, item.count, item.amount.toFixed(2)]);
    });
    worksheet.addRow([]);

    // 添加状态分布
    worksheet.addRow(['状态分布']);
    worksheet.addRow(['状态', '数量', '金额', '占比']);
    data.statusDistribution.forEach(item => {
      worksheet.addRow([
        item.statusLabel,
        item.count,
        item.amount.toFixed(2),
        item.percentage.toFixed(2) + '%',
      ]);
    });
  }

  /**
   * 添加发票数据到Excel
   */
  private addInvoiceDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    // 添加汇总信息
    worksheet.addRow(['汇总信息']);
    worksheet.addRow(['发票总数', data.summary.totalCount]);
    worksheet.addRow(['发票总额', data.summary.totalAmount.toFixed(2)]);
    worksheet.addRow(['已支付数量', data.summary.paidCount]);
    worksheet.addRow(['已支付金额', data.summary.paidAmount.toFixed(2)]);
    worksheet.addRow(['未支付金额', data.summary.unpaidAmount.toFixed(2)]);
    worksheet.addRow(['逾期数量', data.summary.overdueCount]);
    worksheet.addRow(['逾期金额', data.summary.overdueAmount.toFixed(2)]);
    worksheet.addRow([]);

    // 添加趋势数据
    worksheet.addRow(['趋势数据']);
    worksheet.addRow(['周期', '数量', '金额']);
    data.trend.forEach(item => {
      worksheet.addRow([item.periodLabel, item.count, item.amount.toFixed(2)]);
    });
    worksheet.addRow([]);

    // 添加状态分布
    worksheet.addRow(['状态分布']);
    worksheet.addRow(['状态', '数量', '金额', '占比']);
    data.statusDistribution.forEach(item => {
      worksheet.addRow([
        item.statusLabel,
        item.count,
        item.amount.toFixed(2),
        item.percentage.toFixed(2) + '%',
      ]);
    });
  }

  /**
   * 添加支付数据到Excel
   */
  private addPaymentDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    // 添加汇总信息
    worksheet.addRow(['汇总信息']);
    worksheet.addRow(['支付总数', data.summary.totalCount]);
    worksheet.addRow(['支付总额', data.summary.totalAmount.toFixed(2)]);
    worksheet.addRow(['已完成数量', data.summary.completedCount]);
    worksheet.addRow(['已完成金额', data.summary.completedAmount.toFixed(2)]);
    worksheet.addRow(['平均支付金额', data.summary.averageAmount.toFixed(2)]);
    worksheet.addRow([]);

    // 添加趋势数据
    worksheet.addRow(['趋势数据']);
    worksheet.addRow(['周期', '数量', '金额']);
    data.trend.forEach(item => {
      worksheet.addRow([item.periodLabel, item.count, item.amount.toFixed(2)]);
    });
    worksheet.addRow([]);

    // 添加支付方式分布
    worksheet.addRow(['支付方式分布']);
    worksheet.addRow(['支付方式', '数量', '金额', '占比']);
    data.methodDistribution.forEach(item => {
      worksheet.addRow([
        item.methodLabel,
        item.count,
        item.amount.toFixed(2),
        item.percentage.toFixed(2) + '%',
      ]);
    });
  }

  /**
   * 添加对账数据到Excel
   */
  private addReconciliationDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    // 添加汇总信息
    worksheet.addRow(['汇总信息']);
    worksheet.addRow(['对账总数', data.summary.totalCount]);
    worksheet.addRow(['已匹配数量', data.summary.matchedCount]);
    worksheet.addRow(['未匹配数量', data.summary.unmatchedCount]);
    worksheet.addRow(['差异总额', data.summary.totalDifference.toFixed(2)]);
    worksheet.addRow([]);

    // 添加趋势数据
    worksheet.addRow(['趋势数据']);
    worksheet.addRow(['周期', '数量']);
    data.trend.forEach(item => {
      worksheet.addRow([item.periodLabel, item.count]);
    });
    worksheet.addRow([]);

    // 添加状态分布
    worksheet.addRow(['状态分布']);
    worksheet.addRow(['状态', '数量', '占比']);
    data.statusDistribution.forEach(item => {
      worksheet.addRow([
        item.statusLabel,
        item.count,
        item.percentage.toFixed(2) + '%',
      ]);
    });
  }

  /**
   * 添加财务汇总数据到Excel
   */
  private addFinancialDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    // 添加财务健康度指标
    worksheet.addRow(['财务健康度指标']);
    worksheet.addRow([
      '合同履约率',
      data.financialHealth.contractFulfillmentRate.toFixed(2) + '%',
    ]);
    worksheet.addRow([
      '发票支付率',
      data.financialHealth.invoicePaymentRate.toFixed(2) + '%',
    ]);
    worksheet.addRow([
      '回款效率',
      data.financialHealth.collectionEfficiency.toFixed(2) + '%',
    ]);
    worksheet.addRow([
      '对账准确率',
      data.financialHealth.reconciliationAccuracy.toFixed(2) + '%',
    ]);
    worksheet.addRow([]);

    // 添加各模块汇总
    worksheet.addRow(['合同汇总']);
    worksheet.addRow(['合同总数', data.contracts.summary.totalCount]);
    worksheet.addRow(['合同总额', data.contracts.summary.totalAmount.toFixed(2)]);
    worksheet.addRow([]);

    worksheet.addRow(['发票汇总']);
    worksheet.addRow(['发票总数', data.invoices.summary.totalCount]);
    worksheet.addRow(['发票总额', data.invoices.summary.totalAmount.toFixed(2)]);
    worksheet.addRow([]);

    worksheet.addRow(['支付汇总']);
    worksheet.addRow(['支付总数', data.payments.summary.totalCount]);
    worksheet.addRow(['支付总额', data.payments.summary.totalAmount.toFixed(2)]);
    worksheet.addRow([]);

    worksheet.addRow(['对账汇总']);
    worksheet.addRow(['对账总数', data.reconciliations.summary.totalCount]);
    worksheet.addRow(['已匹配数量', data.reconciliations.summary.matchedCount]);
  }

  /**
   * 添加合同数据到PDF
   */
  private addContractDataToPdf(doc: typeof PDFDocument, data: any) {
    doc.fontSize(14).text('汇总信息', { underline: true });
    doc.fontSize(12);
    doc.text(`合同总数: ${data.summary.totalCount}`);
    doc.text(`合同总额: ${data.summary.totalAmount.toFixed(2)}`);
    doc.text(`执行中合同: ${data.summary.activeCount}`);
    doc.text(`已完成合同: ${data.summary.completedCount}`);
    doc.text(`平均合同金额: ${data.summary.averageAmount.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('状态分布', { underline: true });
    doc.fontSize(12);
    data.statusDistribution.forEach(item => {
      doc.text(
        `${item.statusLabel}: ${item.count} (${item.percentage.toFixed(2)}%)`
      );
    });
  }

  /**
   * 添加发票数据到PDF
   */
  private addInvoiceDataToPdf(doc: typeof PDFDocument, data: any) {
    doc.fontSize(14).text('汇总信息', { underline: true });
    doc.fontSize(12);
    doc.text(`发票总数: ${data.summary.totalCount}`);
    doc.text(`发票总额: ${data.summary.totalAmount.toFixed(2)}`);
    doc.text(`已支付数量: ${data.summary.paidCount}`);
    doc.text(`已支付金额: ${data.summary.paidAmount.toFixed(2)}`);
    doc.text(`未支付金额: ${data.summary.unpaidAmount.toFixed(2)}`);
    doc.text(`逾期数量: ${data.summary.overdueCount}`);
    doc.text(`逾期金额: ${data.summary.overdueAmount.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('状态分布', { underline: true });
    doc.fontSize(12);
    data.statusDistribution.forEach(item => {
      doc.text(
        `${item.statusLabel}: ${item.count} (${item.percentage.toFixed(2)}%)`
      );
    });
  }

  /**
   * 添加支付数据到PDF
   */
  private addPaymentDataToPdf(doc: typeof PDFDocument, data: any) {
    doc.fontSize(14).text('汇总信息', { underline: true });
    doc.fontSize(12);
    doc.text(`支付总数: ${data.summary.totalCount}`);
    doc.text(`支付总额: ${data.summary.totalAmount.toFixed(2)}`);
    doc.text(`已完成数量: ${data.summary.completedCount}`);
    doc.text(`已完成金额: ${data.summary.completedAmount.toFixed(2)}`);
    doc.text(`平均支付金额: ${data.summary.averageAmount.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('支付方式分布', { underline: true });
    doc.fontSize(12);
    data.methodDistribution.forEach(item => {
      doc.text(
        `${item.methodLabel}: ${item.count} (${item.percentage.toFixed(2)}%)`
      );
    });
  }

  /**
   * 添加对账数据到PDF
   */
  private addReconciliationDataToPdf(doc: typeof PDFDocument, data: any) {
    doc.fontSize(14).text('汇总信息', { underline: true });
    doc.fontSize(12);
    doc.text(`对账总数: ${data.summary.totalCount}`);
    doc.text(`已匹配数量: ${data.summary.matchedCount}`);
    doc.text(`未匹配数量: ${data.summary.unmatchedCount}`);
    doc.text(`差异总额: ${data.summary.totalDifference.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('状态分布', { underline: true });
    doc.fontSize(12);
    data.statusDistribution.forEach(item => {
      doc.text(
        `${item.statusLabel}: ${item.count} (${item.percentage.toFixed(2)}%)`
      );
    });
  }

  /**
   * 添加财务汇总数据到PDF
   */
  private addFinancialDataToPdf(doc: typeof PDFDocument, data: any) {
    doc.fontSize(14).text('财务健康度指标', { underline: true });
    doc.fontSize(12);
    doc.text(
      `合同履约率: ${data.financialHealth.contractFulfillmentRate.toFixed(2)}%`
    );
    doc.text(
      `发票支付率: ${data.financialHealth.invoicePaymentRate.toFixed(2)}%`
    );
    doc.text(
      `回款效率: ${data.financialHealth.collectionEfficiency.toFixed(2)}%`
    );
    doc.text(
      `对账准确率: ${data.financialHealth.reconciliationAccuracy.toFixed(2)}%`
    );
    doc.moveDown();

    doc.fontSize(14).text('各模块汇总', { underline: true });
    doc.fontSize(12);
    doc.text(`合同总数: ${data.contracts.summary.totalCount}`);
    doc.text(`发票总数: ${data.invoices.summary.totalCount}`);
    doc.text(`支付总数: ${data.payments.summary.totalCount}`);
    doc.text(`对账总数: ${data.reconciliations.summary.totalCount}`);
  }

  /**
   * 获取合同CSV内容
   */
  private getContractCsvContent(data: any): string {
    let content = '汇总信息\n';
    content += `合同总数,${data.summary.totalCount}\n`;
    content += `合同总额,${data.summary.totalAmount.toFixed(2)}\n`;
    content += `执行中合同,${data.summary.activeCount}\n`;
    content += `已完成合同,${data.summary.completedCount}\n`;
    content += `平均合同金额,${data.summary.averageAmount.toFixed(2)}\n\n`;

    content += '趋势数据\n';
    content += '周期,数量,金额\n';
    data.trend.forEach(item => {
      content += `${item.periodLabel},${item.count},${item.amount.toFixed(2)}\n`;
    });
    content += '\n';

    content += '状态分布\n';
    content += '状态,数量,金额,占比\n';
    data.statusDistribution.forEach(item => {
      content += `${item.statusLabel},${item.count},${item.amount.toFixed(2)},${item.percentage.toFixed(2)}%\n`;
    });

    return content;
  }

  /**
   * 获取发票CSV内容
   */
  private getInvoiceCsvContent(data: any): string {
    let content = '汇总信息\n';
    content += `发票总数,${data.summary.totalCount}\n`;
    content += `发票总额,${data.summary.totalAmount.toFixed(2)}\n`;
    content += `已支付数量,${data.summary.paidCount}\n`;
    content += `已支付金额,${data.summary.paidAmount.toFixed(2)}\n`;
    content += `未支付金额,${data.summary.unpaidAmount.toFixed(2)}\n`;
    content += `逾期数量,${data.summary.overdueCount}\n`;
    content += `逾期金额,${data.summary.overdueAmount.toFixed(2)}\n\n`;

    content += '趋势数据\n';
    content += '周期,数量,金额\n';
    data.trend.forEach(item => {
      content += `${item.periodLabel},${item.count},${item.amount.toFixed(2)}\n`;
    });
    content += '\n';

    content += '状态分布\n';
    content += '状态,数量,金额,占比\n';
    data.statusDistribution.forEach(item => {
      content += `${item.statusLabel},${item.count},${item.amount.toFixed(2)},${item.percentage.toFixed(2)}%\n`;
    });

    return content;
  }

  /**
   * 获取支付CSV内容
   */
  private getPaymentCsvContent(data: any): string {
    let content = '汇总信息\n';
    content += `支付总数,${data.summary.totalCount}\n`;
    content += `支付总额,${data.summary.totalAmount.toFixed(2)}\n`;
    content += `已完成数量,${data.summary.completedCount}\n`;
    content += `已完成金额,${data.summary.completedAmount.toFixed(2)}\n`;
    content += `平均支付金额,${data.summary.averageAmount.toFixed(2)}\n\n`;

    content += '趋势数据\n';
    content += '周期,数量,金额\n';
    data.trend.forEach(item => {
      content += `${item.periodLabel},${item.count},${item.amount.toFixed(2)}\n`;
    });
    content += '\n';

    content += '支付方式分布\n';
    content += '支付方式,数量,金额,占比\n';
    data.methodDistribution.forEach(item => {
      content += `${item.methodLabel},${item.count},${item.amount.toFixed(2)},${item.percentage.toFixed(2)}%\n`;
    });

    return content;
  }

  /**
   * 获取对账CSV内容
   */
  private getReconciliationCsvContent(data: any): string {
    let content = '汇总信息\n';
    content += `对账总数,${data.summary.totalCount}\n`;
    content += `已匹配数量,${data.summary.matchedCount}\n`;
    content += `未匹配数量,${data.summary.unmatchedCount}\n`;
    content += `差异总额,${data.summary.totalDifference.toFixed(2)}\n\n`;

    content += '趋势数据\n';
    content += '周期,数量\n';
    data.trend.forEach(item => {
      content += `${item.periodLabel},${item.count}\n`;
    });
    content += '\n';

    content += '状态分布\n';
    content += '状态,数量,占比\n';
    data.statusDistribution.forEach(item => {
      content += `${item.statusLabel},${item.count},${item.percentage.toFixed(2)}%\n`;
    });

    return content;
  }

  /**
   * 获取财务汇总CSV内容
   */
  private getFinancialCsvContent(data: any): string {
    let content = '财务健康度指标\n';
    content += `合同履约率,${data.financialHealth.contractFulfillmentRate.toFixed(2)}%\n`;
    content += `发票支付率,${data.financialHealth.invoicePaymentRate.toFixed(2)}%\n`;
    content += `回款效率,${data.financialHealth.collectionEfficiency.toFixed(2)}%\n`;
    content += `对账准确率,${data.financialHealth.reconciliationAccuracy.toFixed(2)}%\n\n`;

    content += '各模块汇总\n';
    content += `合同总数,${data.contracts.summary.totalCount}\n`;
    content += `合同总额,${data.contracts.summary.totalAmount.toFixed(2)}\n`;
    content += `发票总数,${data.invoices.summary.totalCount}\n`;
    content += `发票总额,${data.invoices.summary.totalAmount.toFixed(2)}\n`;
    content += `支付总数,${data.payments.summary.totalCount}\n`;
    content += `支付总额,${data.payments.summary.totalAmount.toFixed(2)}\n`;
    content += `对账总数,${data.reconciliations.summary.totalCount}\n`;
    content += `已匹配数量,${data.reconciliations.summary.matchedCount}\n`;

    return content;
  }
}
