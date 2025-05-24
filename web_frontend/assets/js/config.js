/**
 * 客户合同管理系统 - 前端配置文件
 */

const CONFIG = {
    // API基础URL
    API_BASE_URL: 'http://localhost:8080/api/v1',
    
    // 页面刷新间隔（毫秒）
    REFRESH_INTERVAL: 60000,
    
    // 日期格式
    DATE_FORMAT: 'YYYY-MM-DD',
    
    // 货币格式
    CURRENCY_FORMAT: 'CNY',
    
    // 分页设置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
    },
    
    // 状态颜色映射
    STATUS_COLORS: {
        '草稿': 'gray',
        '履行中': 'blue',
        '已完成': 'green',
        '已逾期': 'red',
        '待处理': 'yellow',
        '待开票': 'purple',
        '已开票': 'blue',
        '已收款': 'green',
        'pending': 'yellow',
        'completed': 'green'
    }
};

// 防止配置被修改
Object.freeze(CONFIG);