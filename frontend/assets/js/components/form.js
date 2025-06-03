/**
 * 表单组件
 * 支持表单验证和提交
 */
import Component from './component.js';

class Form extends Component {
  /**
   * 构造函数
   * @param {string|HTMLElement} el - 表单元素或选择器
   * @param {Object} options - 配置选项
   */
  constructor(el, options = {}) {
    super(el);
    this.fields = options.fields || [];
    this.submitHandler = options.onSubmit || null;
    this.resetHandler = options.onReset || null;
    this.validateOnChange = options.validateOnChange !== undefined ? options.validateOnChange : true;
    this.validateOnBlur = options.validateOnBlur !== undefined ? options.validateOnBlur : true;
    this.values = options.initialValues || {};
    this.errors = {};
  }

  initialize() {
    if (!(this.el instanceof HTMLFormElement)) {
      throw new Error('Form component requires a form element');
    }
    
    this.bindEvents();
    this.setInitialValues();
  }

  /**
   * 设置初始值
   */
  setInitialValues() {
    Object.keys(this.values).forEach(name => {
      const field = this.el.elements[name];
      if (field) {
        if (field.type === 'checkbox') {
          field.checked = !!this.values[name];
        } else if (field.type === 'radio') {
          const radio = Array.from(this.el.elements[name]).find(r => r.value === this.values[name]);
          if (radio) {
            radio.checked = true;
          }
        } else {
          field.value = this.values[name];
        }
      }
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 表单提交
    this.el.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // 表单重置
    this.el.addEventListener('reset', (e) => {
      e.preventDefault();
      this.handleReset();
    });

    // 字段变化验证
    if (this.validateOnChange) {
      this.el.addEventListener('change', (e) => {
        const field = e.target;
        const name = field.name;
        if (name) {
          this.validateField(name);
        }
      });
    }

    // 字段失焦验证
    if (this.validateOnBlur) {
      this.el.addEventListener('blur', (e) => {
        const field = e.target;
        const name = field.name;
        if (name) {
          this.validateField(name);
        }
      }, true);
    }
  }

  /**
   * 获取表单值
   * @returns {Object} - 表单值
   */
  getValues() {
    const formData = new FormData(this.el);
    const values = {};
    
    for (const [name, value] of formData.entries()) {
      // 处理数组字段
      if (name.endsWith('[]')) {
        const key = name.slice(0, -2);
        if (!values[key]) {
          values[key] = [];
        }
        values[key].push(value);
      } else {
        values[name] = value;
      }
    }
    
    // 处理复选框
    Array.from(this.el.elements).forEach(field => {
      if (field.type === 'checkbox' && !field.checked && !field.name.endsWith('[]')) {
        values[field.name] = false;
      }
    });
    
    return values;
  }

  /**
   * 设置表单值
   * @param {Object} values - 表单值
   */
  setValues(values) {
    this.values = { ...this.values, ...values };
    this.setInitialValues();
  }

  /**
   * 验证表单
   * @returns {boolean} - 是否验证通过
   */
  validate() {
    this.errors = {};
    let isValid = true;
    
    this.fields.forEach(field => {
      const { name, validators = [] } = field;
      const value = this.getFieldValue(name);
      
      validators.forEach(validator => {
        const error = validator(value, this.getValues());
        if (error) {
          if (!this.errors[name]) {
            this.errors[name] = [];
          }
          this.errors[name].push(error);
          isValid = false;
        }
      });
    });
    
    this.showErrors();
    return isValid;
  }

  /**
   * 验证单个字段
   * @param {string} name - 字段名
   * @returns {boolean} - 是否验证通过
   */
  validateField(name) {
    const field = this.fields.find(f => f.name === name);
    if (!field) return true;
    
    const { validators = [] } = field;
    const value = this.getFieldValue(name);
    
    // 清除字段错误
    this.errors[name] = [];
    
    let isValid = true;
    validators.forEach(validator => {
      const error = validator(value, this.getValues());
      if (error) {
        if (!this.errors[name]) {
          this.errors[name] = [];
        }
        this.errors[name].push(error);
        isValid = false;
      }
    });
    
    this.showFieldError(name);
    return isValid;
  }

  /**
   * 获取字段值
   * @param {string} name - 字段名
   * @returns {*} - 字段值
   */
  getFieldValue(name) {
    const field = this.el.elements[name];
    if (!field) return undefined;
    
    if (field.type === 'checkbox') {
      return field.checked;
    } else if (field.type === 'radio') {
      const checked = Array.from(this.el.elements[name]).find(r => r.checked);
      return checked ? checked.value : undefined;
    } else if (field.type === 'select-multiple') {
      return Array.from(field.selectedOptions).map(option => option.value);
    } else {
      return field.value;
    }
  }

  /**
   * 显示错误
   */
  showErrors() {
    // 清除所有错误
    const errorElements = this.el.querySelectorAll('.form-error');
    errorElements.forEach(el => el.remove());
    
    // 显示新错误
    Object.keys(this.errors).forEach(name => {
      this.showFieldError(name);
    });
  }

  /**
   * 显示字段错误
   * @param {string} name - 字段名
   */
  showFieldError(name) {
    const field = this.el.elements[name];
    if (!field) return;
    
    // 获取字段容器
    const container = field.closest('.form-group') || field.parentNode;
    
    // 移除旧错误
    const oldError = container.querySelector('.form-error');
    if (oldError) {
      oldError.remove();
    }
    
    // 添加新错误
    const errors = this.errors[name];
    if (errors && errors.length > 0) {
      const errorElement = document.createElement('div');
      errorElement.className = 'form-error text-red-500 text-sm mt-1';
      errorElement.textContent = errors[0];
      container.appendChild(errorElement);
      
      // 添加错误样式
      field.classList.add('border-red-500');
    } else {
      // 移除错误样式
      field.classList.remove('border-red-500');
    }
  }

  /**
   * 处理表单提交
   */
  handleSubmit() {
    const isValid = this.validate();
    if (isValid && this.submitHandler) {
      this.submitHandler(this.getValues());
    }
  }

  /**
   * 处理表单重置
   */
  handleReset() {
    this.el.reset();
    this.errors = {};
    this.showErrors();
    
    if (this.resetHandler) {
      this.resetHandler();
    }
  }

  /**
   * 提交表单
   */
  submit() {
    this.handleSubmit();
  }

  /**
   * 重置表单
   */
  reset() {
    this.handleReset();
  }
}

export default Form; 