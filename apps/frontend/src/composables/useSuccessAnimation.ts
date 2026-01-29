import { ElMessage } from 'element-plus'
import type { MessageHandler } from 'element-plus'
import { h } from 'vue'
import { CircleCheck, CircleClose, Warning, InfoFilled, Loading } from '@element-plus/icons-vue'

export function useSuccessAnimation() {
  /**
   * 显示成功消息
   * @param message 消息内容
   * @param duration 显示时长（毫秒）
   */
  const showSuccess = (message: string, duration = 2000) => {
    ElMessage({
      message: h('div', {
        class: 'success-message-animated'
      }, [
        h('el-icon', { class: 'success-icon' }, [
          h(CircleCheck)
        ]),
        h('span', { class: 'success-text' }, message)
      ]),
      type: 'success',
      duration,
      showClose: true,
      customClass: 'animated-message'
    })
  }

  /**
   * 显示错误消息
   * @param message 消息内容
   * @param duration 显示时长（毫秒）
   */
  const showError = (message: string, duration = 3000) => {
    ElMessage({
      message: h('div', {
        class: 'success-message-animated'
      }, [
        h('el-icon', { class: 'success-icon', style: 'color: var(--color-danger)' }, [
          h(CircleClose)
        ]),
        h('span', { class: 'success-text' }, message)
      ]),
      type: 'error',
      duration,
      showClose: true,
      customClass: 'animated-message shake'
    })
  }

  /**
   * 显示警告消息
   * @param message 消息内容
   * @param duration 显示时长（毫秒）
   */
  const showWarning = (message: string, duration = 2500) => {
    ElMessage({
      message: h('div', {
        class: 'success-message-animated'
      }, [
        h('el-icon', { class: 'success-icon', style: 'color: var(--color-warning)' }, [
          h(Warning)
        ]),
        h('span', { class: 'success-text' }, message)
      ]),
      type: 'warning',
      duration,
      showClose: true,
      customClass: 'animated-message'
    })
  }

  /**
   * 显示信息消息
   * @param message 消息内容
   * @param duration 显示时长（毫秒）
   */
  const showInfo = (message: string, duration = 2000) => {
    ElMessage({
      message: h('div', {
        class: 'success-message-animated'
      }, [
        h('el-icon', { class: 'success-icon', style: 'color: var(--color-info)' }, [
          h(InfoFilled)
        ]),
        h('span', { class: 'success-text' }, message)
      ]),
      type: 'info',
      duration,
      showClose: true,
      customClass: 'animated-message'
    })
  }

  /**
   * 显示加载消息
   * @param message 消息内容
   * @returns 关闭函数
   */
  const showLoading = (message = '加载中...'): MessageHandler => {
    return ElMessage({
      message: h('div', {
        class: 'success-message-animated'
      }, [
        h('el-icon', { class: 'loading-rotate' }, [h(Loading)]),
        h('span', { class: 'success-text' }, message)
      ]),
      type: 'info',
      duration: 0,
      showClose: false,
      customClass: 'animated-message'
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  }
}
