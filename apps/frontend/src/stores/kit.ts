import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Kit } from '@/api/kit'
import { getUserKits } from '@/api/kit'

export const useKitStore = defineStore('kit', () => {
    // 状态
    const kits = ref<Kit[]>([])
    const currentKit = ref<Kit | null>(null)
    const isLoading = ref(false)
    const viewAllKits = ref(false) // 是否查看全部套账

    // 计算属性
    const currentKitId = computed(() => {
        // 如果查看全部套账，返回 0
        if (viewAllKits.value) return 0
        return currentKit.value?.id || null
    })
    const hasMultipleKits = computed(() => kits.value.length > 1)

    // 设置用户的套装列表
    const setKits = (kitList: Kit[]) => {
        kits.value = kitList
    }

    // 设置当前套装
    const setCurrentKit = (kit: Kit | null) => {
        currentKit.value = kit
        viewAllKits.value = false // 切换到具体套账时，关闭查看全部
        if (kit) {
            localStorage.setItem('currentKitId', String(kit.id))
            localStorage.setItem('currentKit', JSON.stringify(kit))
            localStorage.removeItem('viewAllKits')
        } else {
            localStorage.removeItem('currentKitId')
            localStorage.removeItem('currentKit')
        }
    }

    // 设置查看全部套账
    const setViewAllKits = (value: boolean) => {
        viewAllKits.value = value
        if (value) {
            localStorage.setItem('viewAllKits', 'true')
        } else {
            localStorage.removeItem('viewAllKits')
        }
    }

    // 切换套装
    const switchKit = (kitId: number) => {
        // 如果 kitId 为 0，表示查看全部套账
        if (kitId === 0) {
            setViewAllKits(true)
            return true
        }

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

        // 检查是否之前选择了"查看全部"
        const savedViewAll = localStorage.getItem('viewAllKits')
        if (savedViewAll === 'true' && kitList.length > 1) {
            setViewAllKits(true)
            return
        }

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
        viewAllKits.value = false
        localStorage.removeItem('currentKitId')
        localStorage.removeItem('currentKit')
        localStorage.removeItem('viewAllKits')
    }

    return {
        // 状态
        kits,
        currentKit,
        isLoading,
        viewAllKits,

        // 计算属性
        currentKitId,
        hasMultipleKits,

        // 方法
        setKits,
        setCurrentKit,
        setViewAllKits,
        switchKit,
        initializeKit,
        refreshKits,
        clearKits,
    }
})

