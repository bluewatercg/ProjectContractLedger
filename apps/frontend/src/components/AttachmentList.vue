<template>
  <div class="attachment-list">
    <div class="list-header">
      <h4>附件列表</h4>
      <span class="attachment-count">{{ attachments.length }} 个文件</span>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="attachments.length === 0" class="empty-container">
      <el-empty description="暂无附件" />
    </div>

    <div v-else class="attachment-items">
      <div
        v-for="attachment in attachments"
        :key="attachment.attachment_id"
        class="attachment-item"
      >
        <div class="file-icon">
          <el-icon :size="24">
            <Document v-if="isPdf(attachment.file_name)" />
            <Picture v-else />
          </el-icon>
        </div>

        <div class="file-info">
          <div class="file-name" :title="attachment.file_name">
            {{ attachment.file_name }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(attachment.file_size) }}</span>
            <span class="upload-time">{{ formatDate(attachment.uploaded_at) }}</span>
          </div>
        </div>

        <div class="file-actions">
          <el-button
            type="primary"
            size="small"
            :icon="Download"
            @click="downloadFile(attachment)"
          >
            下载
          </el-button>
          <el-button
            v-if="showPreview(attachment.file_name)"
            type="info"
            size="small"
            :icon="View"
            @click="previewFile(attachment)"
          >
            预览
          </el-button>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            @click="deleteFile(attachment)"
            :disabled="deleting"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewFileData?.file_name"
      width="80%"
      :before-close="closePreview"
    >
      <div class="preview-container">
        <img
          v-if="previewType === 'image'"
          :src="previewUrl"
          alt="预览图片"
          class="preview-image"
        />
        <iframe
          v-else-if="previewType === 'pdf'"
          :src="previewUrl"
          class="preview-pdf"
          frameborder="0"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Picture, Download, View, Delete } from '@element-plus/icons-vue'

// Types
interface Attachment {
  attachment_id: number
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
  uploaded_at: string
}

// Props
interface Props {
  attachments: Attachment[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
interface Emits {
  (e: 'delete', attachmentId: number): void
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>()

// Refs
const deleting = ref(false)
const previewVisible = ref(false)
const previewFileData = ref<Attachment | null>(null)
const previewUrl = ref('')
const previewType = ref<'image' | 'pdf'>('image')

// Methods
const isPdf = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.pdf')
}

const isImage = (fileName: string): boolean => {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  return imageExts.some(ext => fileName.toLowerCase().endsWith(ext))
}

const showPreview = (fileName: string): boolean => {
  return isPdf(fileName) || isImage(fileName)
}

const formatFileSize = (size?: number): string => {
  if (!size) return '-'
  
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const downloadFile = async (attachment: Attachment) => {
  try {
    const response = await fetch(`/api/v1/attachments/${attachment.attachment_id}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('Download error:', error)
    ElMessage.error('文件下载失败')
  }
}

const previewFile = (attachment: Attachment) => {
  previewFileData.value = attachment
  previewType.value = isPdf(attachment.file_name) ? 'pdf' : 'image'
  previewUrl.value = `/api/v1/attachments/${attachment.attachment_id}/download`
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  previewFileData.value = null
  previewUrl.value = ''
}

const deleteFile = async (attachment: Attachment) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${attachment.file_name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    deleting.value = true
    emit('delete', attachment.attachment_id)
  } catch {
    // 用户取消删除
  }
}

// 暴露方法给父组件
defineExpose({
  refreshList: () => emit('refresh')
})
</script>

<style scoped>
.attachment-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.list-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.attachment-count {
  color: #909399;
  font-size: 12px;
}

.loading-container,
.empty-container {
  padding: 20px;
}

.attachment-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.attachment-item:hover {
  background-color: #f5f7fa;
  border-color: #c6e2ff;
}

.file-icon {
  margin-right: 12px;
  color: #409eff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.preview-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-pdf {
  width: 100%;
  height: 70vh;
}
</style>
