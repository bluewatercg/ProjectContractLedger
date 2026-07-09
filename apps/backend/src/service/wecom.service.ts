import { Provide, Init, Config, App, Scope, ScopeEnum } from '@midwayjs/core';
import { IMidwayApplication } from '@midwayjs/core';
import { StatisticsService } from './statistics.service';
import { ReminderService } from './reminder.service';
import { SubscriptionService, DueSubscription } from './subscription.service';
import * as https from 'https';
import * as http from 'http';

export interface WecomSection {
  key: string;
  label: string;
  enabled: boolean;
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class WecomService {
  @App()
  app: IMidwayApplication;

  @Config('wecom')
  wecomConfig: {
    enabled: boolean;
    webhookUrl: string;
    webhookKey: string;
    cron: string;
    kitId: number;
    sections: WecomSection[];
  };

  private cronJob: any = null;
  private lastSubscriptionItems: DueSubscription[] = [];
  private isPushing = false;

  /**
   * 获取完整的 webhook URL
   */
  private getWebhookUrl(): string {
    if (this.wecomConfig?.webhookUrl) {
      return this.wecomConfig.webhookUrl;
    }
    if (this.wecomConfig?.webhookKey) {
      return `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${this.wecomConfig.webhookKey}`;
    }
    return '';
  }

  @Init()
  async init() {
    const url = this.getWebhookUrl();
    if (!this.wecomConfig?.enabled || !url) {
      console.log('[WecomService] WeCom push is disabled (missing webhookUrl/webhookKey or enabled=false)');
      console.log('[WecomService] Config:', JSON.stringify({
        enabled: this.wecomConfig?.enabled,
        hasWebhookUrl: !!this.wecomConfig?.webhookUrl,
        hasWebhookKey: !!this.wecomConfig?.webhookKey,
        cron: this.wecomConfig?.cron,
        kitId: this.wecomConfig?.kitId,
      }));
      return;
    }

    // Start cron job
    this.startCronJob();
    console.log('[WecomService] WeCom push initialized, cron:', this.wecomConfig.cron);
    console.log('[WecomService] Webhook URL masked:', url.replace(/key=\w+/, 'key=***'));
  }

  private startCronJob() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cron = require('node-cron');
      this.cronJob = cron.schedule(this.wecomConfig.cron, async () => {
        console.log('[WecomService] Running scheduled WeCom push');
        if (this.isPushing) {
          console.warn('[WecomService] Previous push is still running, skip current schedule');
          return;
        }
        this.isPushing = true;
        try {
          const markdown = await this.generateMarkdown();
          await this.pushToWeCom(markdown);
          await this.markSubscriptionPushLogs();
        } catch (error) {
          console.error('[WecomService] Scheduled push failed:', error);
        } finally {
          this.isPushing = false;
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
    const url = this.getWebhookUrl();
    if (!this.wecomConfig?.enabled || !url) {
      return { success: false, message: '企业微信推送未配置，请设置 WECOM_WEBHOOK_KEY 或 WECOM_WEBHOOK_URL' };
    }

    const targetKitId = kitId || this.wecomConfig?.kitId || 1;
    console.log(`[WecomService] Manual push triggered for kit ${targetKitId}`);

    if (this.isPushing) {
      return { success: false, message: '已有推送任务正在执行，请稍后重试' };
    }

    this.isPushing = true;
    try {
      const markdown = await this.generateMarkdown(targetKitId);
      await this.pushToWeCom(markdown);
      await this.markSubscriptionPushLogs();
      return { success: true, message: '推送成功' };
    } catch (error: any) {
      console.error('[WecomService] Manual push failed:', error);
      return { success: false, message: error.message || '推送失败' };
    } finally {
      this.isPushing = false;
    }
  }

  // ======================== Markdown 生成 ========================

  private async generateMarkdown(kitId?: number): Promise<string> {
    const targetKitId = kitId || this.wecomConfig.kitId;
    const today = new Date().toISOString().split('T')[0];
    const sections = this.getEnabledSections();

    // 通过 applicationContext 获取 request-scoped 服务
    const statisticsService = await this.app.getApplicationContext().getAsync<StatisticsService>('statisticsService');
    const reminderService = await this.app.getApplicationContext().getAsync<ReminderService>('reminderService');
    const subscriptionService = await this.app.getApplicationContext().getAsync<SubscriptionService>('subscriptionService');

    const [dashboard, aging, reminders, subscriptionReminders] = await Promise.all([
      sections.includes('overview') ? statisticsService.getDashboardStats(undefined, targetKitId) : null,
      sections.includes('aging') ? statisticsService.getAgingAnalysis(undefined, targetKitId) : null,
      sections.includes('renewals') || sections.includes('tasks') ? reminderService.getAllReminders(targetKitId) : null,
      sections.includes('subscriptions') ? subscriptionService.getDueSubscriptionsForPush(targetKitId) : null,
    ]);

    this.lastSubscriptionItems = subscriptionReminders || [];

    const lines: string[] = [];

    lines.push(`# 📊 合同管理日报`);
    lines.push('');
    lines.push(`> 数据日期：${today} | 套账：套账${targetKitId}`);
    lines.push('');

    if (sections.includes('overview') && dashboard) {
      lines.push('');
      lines.push('---');
      lines.push('');
      this.buildOverviewSection(lines, dashboard);
    }

    if (sections.includes('aging') && aging) {
      lines.push('');
      lines.push('---');
      lines.push('');
      this.buildAgingSection(lines, aging);
    }

    if (sections.includes('renewals') && reminders) {
      const renewals = reminders.items.filter(i => i.type === 'contract_renewal');
      if (renewals.length > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
        this.buildRenewalSection(lines, renewals);
      }
    }

    if (sections.includes('tasks') && reminders) {
      const nonRenewal = reminders.items.filter(i => i.type !== 'contract_renewal');
      if (nonRenewal.length > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
        this.buildTasksSection(lines, nonRenewal);
      }
    }

    if (sections.includes('subscriptions') && subscriptionReminders && subscriptionReminders.length > 0) {
      lines.push('');
      lines.push('---');
      lines.push('');
      this.buildSubscriptionSection(lines, subscriptionReminders);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('_此消息由合同管理系统自动推送_');

    return lines.join('\n');
  }

  private getEnabledSections(): string[] {
    return (this.wecomConfig.sections || [])
      .filter(s => s.enabled)
      .map(s => s.key);
  }

  // ======================== 各板块构建 ========================

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


  private buildSubscriptionSection(lines: string[], items: DueSubscription[]) {
    lines.push(`**🔔 订阅到期提醒（${items.length}项）**`);
    lines.push('');
    for (const item of items.slice(0, 10)) {
      const days = item.daysUntilExpiry ?? 0;
      const status = days < 0 ? `<font color="warning">⚠️ 已逾期 ${Math.abs(days)} 天</font>` : `剩余 ${days} 天`;
      const ownerName = item.owner_name || item.owner?.full_name || item.owner?.username || '未填写';
      const typeName = item.type?.name || '-';
      const renewUrl = item.renewal_url ? ` | [续费入口](${item.renewal_url})` : '';
      lines.push(`- **${item.name}** | ${typeName} | ${item.subject} | 到期日：${this.formatDateText(item.current_expiry_date)} | ${status} | 责任人：<@${ownerName}>${renewUrl}`);
    }
    lines.push('');
    lines.push('> 请责任人在台账中点击“已续费”完成闭环，系统将自动滚动下一到期日。');
    lines.push('');
  }

  private async markSubscriptionPushLogs(): Promise<void> {
    if (this.lastSubscriptionItems.length === 0) {
      return;
    }
    const subscriptionService = await this.app.getApplicationContext().getAsync<SubscriptionService>('subscriptionService');
    await subscriptionService.markSubscriptionsPushed(this.lastSubscriptionItems);
    this.lastSubscriptionItems = [];
  }

  private formatDateText(value: Date | string): string {
    if (!value) return '-';
    if (typeof value === 'string') return value.split('T')[0];
    return value.toISOString().split('T')[0];
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

  private pushToWeCom(content: string): Promise<void> {
    const url = this.getWebhookUrl();
    if (!url) {
      return Promise.reject(new Error('webhook URL 未配置'));
    }

    return new Promise((resolve, reject) => {
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

  getConfig() {
    return {
      enabled: this.wecomConfig?.enabled || false,
      cron: this.wecomConfig?.cron || '0 9 * * 1-5',
      kitId: this.wecomConfig?.kitId || 1,
      sections: this.wecomConfig?.sections || [],
    };
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('[WecomService] Cron job stopped');
    }
  }
}
