import { Provide, Inject, Init, Config } from '@midwayjs/core';
import { StatisticsService } from './statistics.service';
import { ReminderService } from './reminder.service';
import * as https from 'https';
import * as http from 'http';

export interface WecomSection {
  key: string;
  label: string;
  enabled: boolean;
}

@Provide()
export class WecomService {
  @Inject()
  statisticsService: StatisticsService;

  @Inject()
  reminderService: ReminderService;

  @Config('wecom')
  wecomConfig: {
    enabled: boolean;
    webhookKey: string;
    cron: string;
    kitId: number;
    sections: WecomSection[];
  };

  private cronJob: any = null;

  @Init()
  async init() {
    if (!this.wecomConfig?.enabled || !this.wecomConfig?.webhookKey) {
      console.log('[WecomService] WeCom push is disabled (missing webhookKey or enabled=false)');
      return;
    }

    // Start cron job
    this.startCronJob();
    console.log('[WecomService] WeCom push initialized, cron:', this.wecomConfig.cron);
  }

  /**
   * 启动定时任务
   */
  private startCronJob() {
    // 动态导入 node-cron（如果未安装则跳过）
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cron = require('node-cron');
      this.cronJob = cron.schedule(this.wecomConfig.cron, async () => {
        console.log('[WecomService] Running scheduled WeCom push');
        try {
          const markdown = await this.generateMarkdown();
          await this.pushToWeCom(markdown);
        } catch (error) {
          console.error('[WecomService] Scheduled push failed:', error);
        }
      });
    } catch (e) {
      console.warn('[WecomService] node-cron not installed, scheduled push disabled');
    }
  }

  /**
   * 手动触发推送
   */
  async triggerPush(kitId?: number): Promise<{ success: boolean; message: string }> {
    const targetKitId = kitId || this.wecomConfig?.kitId || 1;
    console.log(`[WecomService] Manual push triggered for kit ${targetKitId}`);

    try {
      const markdown = await this.generateMarkdown(targetKitId);
      await this.pushToWeCom(markdown);
      return { success: true, message: '推送成功' };
    } catch (error: any) {
      console.error('[WecomService] Manual push failed:', error);
      return { success: false, message: error.message || '推送失败' };
    }
  }

  /**
   * 生成 Markdown 内容
   */
  private async generateMarkdown(kitId?: number): Promise<string> {
    const targetKitId = kitId || this.wecomConfig.kitId;
    const today = new Date().toISOString().split('T')[0];
    const sections = this.getEnabledSections();

    // 并行获取数据
    const [dashboard, aging, reminders] = await Promise.all([
      sections.includes('overview') ? this.statisticsService.getDashboardStats(undefined, targetKitId) : null,
      sections.includes('aging') ? this.statisticsService.getAgingAnalysis(undefined, targetKitId) : null,
      sections.includes('renewals') || sections.includes('tasks') ? this.reminderService.getAllReminders(targetKitId) : null,
    ]);

    const lines: string[] = [];

    // ---- Header ----
    lines.push(`# 📊 合同管理日报`);
    lines.push('');
    lines.push(`> 数据日期：${today} | 套账：套账${targetKitId}`);
    lines.push('');

    // ---- Section 1: 财务总览 ----
    if (sections.includes('overview') && dashboard) {
      lines.push('');
      lines.push('---');
      lines.push('');
      this.buildOverviewSection(lines, dashboard);
    }

    // ---- Section 2: 账龄分析 ----
    if (sections.includes('aging') && aging) {
      lines.push('');
      lines.push('---');
      lines.push('');
      this.buildAgingSection(lines, aging);
    }

    // ---- Section 3: 续签提醒 ----
    if (sections.includes('renewals') && reminders) {
      const renewals = reminders.items.filter(i => i.type === 'contract_renewal');
      if (renewals.length > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
        this.buildRenewalSection(lines, renewals);
      }
    }

    // ---- Section 4: 待处理事项 ----
    if (sections.includes('tasks') && reminders) {
      const nonRenewal = reminders.items.filter(i => i.type !== 'contract_renewal');
      if (nonRenewal.length > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
        this.buildTasksSection(lines, nonRenewal);
      }
    }

    // ---- Footer ----
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('_此消息由合同管理系统自动推送_');

    return lines.join('\n');
  }

  /**
   * 获取启用的板块
   */
  private getEnabledSections(): string[] {
    return (this.wecomConfig.sections || [])
      .filter(s => s.enabled)
      .map(s => s.key);
  }

  // ======================== 各板块构建方法 ========================

  private buildOverviewSection(lines: string[], dashboard: any) {
    const s = dashboard.summary || {};
    lines.push(`**签署合同总额**  ${this.fmt(s.totalRevenue)}`);
    lines.push('');
    lines.push(`**已开发票**  ${this.fmt(s.invoicedAmount)}  开票率 ${this.pct(s.invoicedAmount, s.totalRevenue)}`);
    lines.push('');
    lines.push(`**实际收款**  ${this.fmt(s.paidAmount)}  回款率 ${this.pct(s.paidAmount, s.invoicedAmount)}`);
    lines.push('');
    lines.push('');
    lines.push(`- 待开票余额：${this.fmt(s.uninvoicedAmount)}`);
    lines.push(`- 待收款/应收账款：${this.fmt(s.unpaidAmount)}`);
    lines.push(`- 活跃客户数：${s.activeCustomers || 0} 家`);
    lines.push(`- 执行中合同：${s.activeContracts || 0} 份`);
    lines.push('');
  }

  private buildAgingSection(lines: string[], aging: any) {
    const totalUnpaid = aging.totalUnpaid || 0;
    const totalInvoices = aging.totalInvoices || 0;
    const totalCustomers = aging.totalCustomers || 0;
    const buckets = aging.summary || [];

    lines.push(`**应收账款总额**  ${this.fmt(totalUnpaid)}  |  未收发票 ${totalInvoices} 张  |  涉及客户 ${totalCustomers} 家`);
    lines.push('');

    const riskMap: Record<string, string> = { low: '🟢低', medium: '🟡中', high: '🔴高' };
    for (const b of buckets) {
      const rl = riskMap[b.riskLevel] || b.riskLevel;
      lines.push(`**${b.bucketLabel}**  ${this.fmt(b.amount)}  占比${b.percentage?.toFixed(1) || '0.0'}%  发票${b.invoiceCount}张  ${rl}`);
      lines.push('');
    }
  }

  private buildRenewalSection(lines: string[], items: any[]) {
    lines.push(`**📌 合同续签提醒（${items.length}项）**`);
    lines.push('');
    for (const item of items) {
      const days = item.daysUntilDue || 0;
      const status = days <= 0 ? `已过期${Math.abs(days)}天 ⚠️` : `剩余${days}天`;
      lines.push(`- ${item.contractNumber || '-'} | ${item.customerName || '-'} | ${this.fmt(item.amount)} | ${status}`);
    }
    lines.push('');
  }

  private buildTasksSection(lines: string[], items: any[]) {
    lines.push(`**待处理事项（${items.length}项）**`);
    lines.push('');

    const catLabels: Record<string, string> = { fulfillment: '合同履约类', invoice: '财务开票类', payment: '财务收款类' };
    const byCat: Record<string, any[]> = {};
    for (const item of items) {
      const cat = item.category || 'other';
      (byCat[cat] ||= []).push(item);
    }

    for (const catKey of ['fulfillment', 'invoice', 'payment']) {
      const catItems = byCat[catKey] || [];
      if (catItems.length === 0) continue;
      const label = catLabels[catKey] || catKey;
      lines.push(`**${label}（${catItems.length}项）**`);
      lines.push('');
      for (let i = 0; i < Math.min(catItems.length, 5); i++) {
        const item = catItems[i];
        const extra = item.contractNumber || item.invoiceNumber || '';
        const days = item.daysUntilDue || 0;
        const dayStr = days <= 0 ? `已过期${Math.abs(days)}天` : `${days}天`;
        lines.push(`${i + 1}. **${item.title}** | ${item.customerName || '-'} | ${extra} | ${this.fmt(item.amount)} | ${dayStr}`);
      }
      lines.push('');
    }
  }

  // ======================== 工具方法 ========================

  private fmt(n: number | null | undefined): string {
    if (n == null) return '¥0.00';
    return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private pct(n: number | null | undefined, d: number | null | undefined): string {
    if (!n || !d) return '0.0%';
    return `${((n / d) * 100).toFixed(1)}%`;
  }

  /**
   * 推送 Markdown 到企业微信群机器人
   */
  private pushToWeCom(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${this.wecomConfig.webhookKey}`;
      const body = JSON.stringify({
        msgtype: 'markdown_v2',
        markdown_v2: { content },
      });

      const isHttps = url.startsWith('https');
      const lib = isHttps ? https : http;
      const parsed = new URL(url);

      const req = lib.request(
        {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try {
              const resp = JSON.parse(data);
              if (resp.errcode === 0) {
                console.log('[WecomService] Push succeeded');
                resolve();
              } else {
                reject(new Error(`WeCom API error: ${data}`));
              }
            } catch (e) {
              reject(new Error(`Failed to parse WeCom response: ${data}`));
            }
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  /**
   * 获取配置
   */
  getConfig() {
    return {
      enabled: this.wecomConfig?.enabled || false,
      cron: this.wecomConfig?.cron || '0 9 * * 1-5',
      kitId: this.wecomConfig?.kitId || 1,
      sections: this.wecomConfig?.sections || [],
    };
  }

  /**
   * 停止定时任务
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('[WecomService] Cron job stopped');
    }
  }
}
