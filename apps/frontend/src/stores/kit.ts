import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Kit } from '@/api/kit'
import { getUserKits } from '@/api/kit'

export const useKitStore = defineStore('kit', () => {
    // 状态
    const kits = ref<Kit[]>([])
    const currentKit = ref<Kit | null>(null)
    const isLoading = ref(false)

    // 计算属性
    const currentKitId = computed(() => currentKit.value?.id || null)
    const hasMultipleKits = computed(() => kits.value.length > 1)

    // 设置用户的套装列表
    const setKits = (kitList: Kit[]) => {
        kits.value = kitList
    }

    // 设置当前套装
    const setCurrentKit = (kit: Kit | null) => {
        currentKit.value = kit
        if (kit) {
            localStorage.setItem('currentKitId', String(kit.id))
            localStorage.setItem('currentKit', JSON.stringify(kit))
        } else {
            localStorage.removeItem('currentKitId')
            localStorage.removeItem('currentKit')
        }
    }

    // 切换套装
    const switchKit = (kitId: number) => {
        const kit = kits.value.find(k => k.id === kitId)
        if (kit) {
            setCurrentKit(kit)
            return true
        }
        return false
    }

    // 初始化套装状态
    const initializeKit = (kitList: Kit[], defaultKit: Kit | null) => {
        setKits(kitList)

        // 尝试从本地存储恢复上次选择的套装
        const savedKitId = localStorage.getItem('currentKitId')
        if (savedKitId) {
            const savedKit = kitList.find(k => k.id === parseInt(savedKitId))
            if (savedKit) {
                setCurrentKit(savedKit)
                return
            }
        }

        // 使用默认套装
        if (defaultKit) {
            setCurrentKit(defaultKit)
        } else if (kitList.length > 0) {
            setCurrentKit(kitList[0])
        }
    }

    // 刷新套装列表（从服务器获取最新数据）
    const refreshKits = async (userId: number) => {
        isLoading.value = true
        try {
            const kitList = await getUserKits(userId)
            setKits(kitList || [])

            // 尝试从 localStorage 恢复之前选择的套装
            const savedKitId = localStorage.getItem('currentKitId')
            let restoredKit: Kit | undefined = undefined

            if (savedKitId) {
                restoredKit = kitList?.find((k: Kit) => k.id === parseInt(savedKitId))
            }

            if (restoredKit) {
                // 恢复之前的选择
                setCurrentKit(restoredKit)
            } else if (currentKit.value) {
                // 如果当前选中的套装不在新列表中，则重置选择
                const stillExists = kitList?.find((k: Kit) => k.id === currentKit.value?.id)
                if (!stillExists && kitList?.length > 0) {
                    setCurrentKit(kitList[0])
                } else if (!stillExists) {
                    setCurrentKit(null)
                }
            } else if (kitList?.length > 0) {
                setCurrentKit(kitList[0])
            }

            return kitList
        } catch (error) {
            console.error('Failed to refresh kits:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    // 清空套装状态
    const clearKits = () => {
        kits.value = []
        currentKit.value = null
        localStorage.removeItem('currentKitId')
        localStorage.removeItem('currentKit')
    }

    return {
        // 状态
        kits,
        currentKit,
        isLoading,

        // 计算属性
        currentKitId,
        hasMultipleKits,

        // 方法
        setKits,
        setCurrentKit,
        switchKit,
        initializeKit,
        refreshKits,
        clearKits,
    }
})

