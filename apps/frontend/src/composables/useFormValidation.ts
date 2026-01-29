import { ref, type Ref } from 'vue'
import type { FormInstance } from 'element-plus'

/**
 * 表单实时验证 Composable
 * 提供表单字段的实时验证功能
 */
export function useFormValidation(formRef: Ref<FormInstance | undefined>) {
  // 已验证通过的字段集合
  const validatedFields = ref<Set<string>>(new Set())

  // 字段错误信息映射
  const fieldErrors = ref<Map<string, string>>(new Map())

  /**
   * 验证单个字段
   * @param field 字段名称
   * @returns 验证是否通过
   */
  const validateField = async (field: string): Promise<boolean> => {
    if (!formRef.value) return false

    try {
      await formRef.value.validateField(field)
      validatedFields.value.add(field)
      fieldErrors.value.delete(field)
      return true
    } catch (error: any) {
      const errorMessage = error?.message || '验证失败'
      fieldErrors.value.set(field, errorMessage)
      validatedFields.value.delete(field)
      return false
    }
  }

  /**
   * 清除字段错误
   * @param field 字段名称
   */
  const clearFieldError = (field: string) => {
    fieldErrors.value.delete(field)
    validatedFields.value.delete(field)
  }

  /**
   * 检查字段是否验证通过
   * @param field 字段名称
   * @returns 是否验证通过
   */
  const isFieldValid = (field: string): boolean => {
    return validatedFields.value.has(field) && !fieldErrors.value.has(field)
  }

  /**
   * 获取字段错误信息
   * @param field 字段名称
   * @returns 错误信息
   */
  const getFieldError = (field: string): string | undefined => {
    return fieldErrors.value.get(field)
  }

  /**
   * 验证所有字段
   * @returns 验证是否通过
   */
  const validateAllFields = async (): Promise<boolean> => {
    if (!formRef.value) return false

    try {
      await formRef.value.validate()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 重置验证状态
   */
  const resetValidation = () => {
    validatedFields.value.clear()
    fieldErrors.value.clear()
    formRef.value?.resetFields()
  }

  /**
   * 清除所有验证
   */
  const clearValidation = () => {
    validatedFields.value.clear()
    fieldErrors.value.clear()
    formRef.value?.clearValidate()
  }

  /**
   * 获取所有错误字段
   * @returns 错误字段数组
   */
  const getErrorFields = (): string[] => {
    return Array.from(fieldErrors.value.keys())
  }

  /**
   * 检查是否有错误
   * @returns 是否有错误
   */
  const hasErrors = (): boolean => {
    return fieldErrors.value.size > 0
  }

  /**
   * 获取错误数量
   * @returns 错误数量
   */
  const getErrorCount = (): number => {
    return fieldErrors.value.size
  }

  return {
    // 状态
    validatedFields,
    fieldErrors,

    // 方法
    validateField,
    clearFieldError,
    isFieldValid,
    getFieldError,
    validateAllFields,
    resetValidation,
    clearValidation,
    getErrorFields,
    hasErrors,
    getErrorCount
  }
}
