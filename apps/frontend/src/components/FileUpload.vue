<template>
  <div class="file-upload">
    <el-upload
      ref="uploadRef"
      :action="fullUploadUrl"
      :headers="uploadHeaders"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-progress="handleProgress"
      :show-file-list="false"
      :auto-upload="true"
      accept=".pdf,.jpg,.jpeg,.png"
      drag
    >
      <div class="upload-area">
        <el-icon class="upload-icon" :size="50">
          <UploadFilled />
        </el-icon>
        <div class="upload-text">
          <p>将文件拖拽到此处，或<em>点击上传</em></p>
          <p class="upload-tip">支持 PDF、JPG、JPEG、PNG 格式，文件大小不超过 10MB</p>
        </div>
      </div>
    </el-upload>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <el-progress :percentage="uploadProgress" :status="progressStatus" />
      <p class="progress-text">{{ progressText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadProps, UploadInstance } from 'element-plus'
import { API_CONFIG } from '@/api/config'

// Props
interface Props {
  uploadUrl: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Emits
interface Emits {
  (e: 'success', file: any): void
  (e: 'error', error: any): void
}

const emit = defineEmits<Emits>()

// Refs
const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
const uploadProgress = ref(0)

// Computed
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const fullUploadUrl = computed(() => {
  // 如果uploadUrl已经是完整URL，直接使用
  if (props.uploadUrl.startsWith('http')) {
    return props.uploadUrl
  }

  // 使用统一的API配置
  const baseURL = API_CONFIG.baseURL
  const url = props.uploadUrl.startsWith('/') ? props.uploadUrl : `/${props.uploadUrl}`

  // 如果baseURL是相对路径，直接拼接
  if (baseURL.startsWith('/')) {
    return `${baseURL}${url}`
  }

  // 如果baseURL是完整URL，直接拼接
  return `${baseURL}${url}`
})

const progressStatus = computed(() => {
  if (uploadProgress.value === 100) return 'success'
  if (uploadProgress.value > 0) return 'active'
  return 'normal'
})

const progressText = computed(() => {
  if (uploadProgress.value === 100) return '上传完成'
  if (uploadProgress.value > 0) return `上传中... ${uploadProgress.value}%`
  return '准备上传'
})

// Methods
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 检查文件类型
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型，仅支持 PDF、JPG、JPEG、PNG 格式')
    return false
  }

  // 检查文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }

  uploading.value = true
  uploadProgress.value = 0
  return true
}

const handleProgress: UploadProps['onProgress'] = (event) => {
  uploadProgress.value = Math.round(event.percent || 0)
}

const handleSuccess: UploadProps['onSuccess'] = (response, file) => {
  uploading.value = false
  uploadProgress.value = 100

  if (response.success) {
    ElMessage.success('文件上传成功')
    emit('success', response.data)
  } else {
    ElMessage.error(response.message || '上传失败')
    emit('error', response)
  }

  // 重置进度
  setTimeout(() => {
    uploadProgress.value = 0
  }, 2000)
}

const handleError: UploadProps['onError'] = (error) => {
  uploading.value = false
  uploadProgress.value = 0
  
  console.error('Upload error:', error)
  ElMessage.error('文件上传失败')
  emit('error', error)
}

// 暴露方法
defineExpose({
  clearFiles: () => uploadRef.value?.clearFiles(),
  submit: () => uploadRef.value?.submit(),
  abort: (file?: any) => uploadRef.value?.abort(file)
})
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-area {
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
}

.upload-progress {
  margin-top: 16px;
}

.progress-text {
  margin: 8px 0 0 0;
  text-align: center;
  color: #606266;
  font-size: 12px;
}

:deep(.el-upload-dragger) {
  border: none;
  background: transparent;
  padding: 0;
}

:deep(.el-upload-dragger:hover) {
  border: none;
}
</style>
