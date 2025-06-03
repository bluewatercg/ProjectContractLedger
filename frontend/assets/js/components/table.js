/**
 * 表格组件
 * 支持排序、分页等功能
 */
import Component from './component.js';

class Table extends Component {
  /**
   * 构造函数
   * @param {string|HTMLElement} el - 表格容器元素或选择器
   * @param {Object} options - 配置选项
   */
  constructor(el, options = {}) {
    super(el);
    this.data = options.data || [];
    this.columns = options.columns || [];
    this.sortColumn = options.sortColumn || null;
    this.sortDirection = options.sortDirection || 'asc';
    this.onRowClick = options.onRowClick || null;
    this.currentPage = 1;
    this.pageSize = options.pageSize || 10;
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.emptyMessage = options.emptyMessage || '没有数据';
    this.loading = false;
  }

  initialize() {
    this.render();
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 表头点击排序
    this.on('click', 'th[data-sort]', (event, target) => {
      const column = target.dataset.sort;
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
      this.sortData();
      this.render();
    });

    // 行点击事件
    if (this.onRowClick) {
      this.on('click', 'tbody tr', (event, target) => {
        const index = parseInt(target.dataset.index, 10);
        const item = this.getPageData()[index];
        this.onRowClick(item, index);
      });
    }

    // 分页事件
    this.on('click', '.pagination button', (event, target) => {
      const page = target.dataset.page;
      if (page === 'prev' && this.currentPage > 1) {
        this.currentPage--;
      } else if (page === 'next' && this.currentPage < this.totalPages) {
        this.currentPage++;
      } else if (page) {
        this.currentPage = parseInt(page, 10);
      }
      this.render();
    });
  }

  /**
   * 排序数据
   */
  sortData() {
    if (!this.sortColumn) return;
    
    this.data.sort((a, b) => {
      const valueA = a[this.sortColumn];
      const valueB = b[this.sortColumn];
      
      // 处理不同类型的值
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * 获取当前页数据
   * @returns {Array} - 当前页数据
   */
  getPageData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  /**
   * 渲染表格
   */
  render() {
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    const pageData = this.getPageData();
    
    let html = '';
    
    if (this.loading) {
      html = `
        <div class="flex justify-center items-center p-8">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      `;
    } else if (this.data.length === 0) {
      html = `
        <div class="flex justify-center items-center p-8">
          <div class="text-gray-500">${this.emptyMessage}</div>
        </div>
      `;
    } else {
      html = `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                ${this.columns.map(col => `
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer' : ''}" ${col.sortable ? `data-sort="${col.key}"` : ''}>
                    ${col.label}
                    ${this.sortColumn === col.key ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${pageData.map((row, index) => `
                <tr data-index="${index}" class="hover:bg-gray-50 ${this.onRowClick ? 'cursor-pointer' : ''}">
                  ${this.columns.map(col => `
                    <td class="px-6 py-4 whitespace-nowrap ${col.className || ''}">
                      ${col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined ? row[col.key] : '')}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      // 添加分页
      if (this.totalPages > 1) {
        html += `
          <div class="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div class="pagination flex-1 flex justify-between sm:justify-end">
              <button data-page="prev" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                上一页
              </button>
              ${this.renderPageNumbers()}
              <button data-page="next" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === this.totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                下一页
              </button>
            </div>
          </div>
        `;
      }
    }
    
    this.el.innerHTML = html;
  }

  /**
   * 渲染页码
   * @returns {string} - 页码HTML
   */
  renderPageNumbers() {
    // 最多显示5个页码
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    let pageNumbers = '';
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers += `
        <button data-page="${i}" class="ml-3 relative inline-flex items-center px-4 py-2 border ${this.currentPage === i ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'} text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
          ${i}
        </button>
      `;
    }
    
    return pageNumbers;
  }

  /**
   * 设置加载状态
   * @param {boolean} isLoading - 是否加载中
   */
  setLoading(isLoading) {
    this.loading = isLoading;
    this.render();
  }

  /**
   * 更新数据
   * @param {Array} newData - 新数据
   */
  updateData(newData) {
    this.data = newData || [];
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.currentPage = 1;
    if (this.sortColumn) {
      this.sortData();
    }
    this.render();
  }
}

export default Table; 