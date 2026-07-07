<template>
  <div class="contract-history">
    <el-alert
      v-if="hasRelationshipWarning"
      class="history-alert"
      type="warning"
      show-icon
      :closable="false"
      title="部分续签关系不完整，请检查合同关联关系"
    />

    <section v-if="contractChains.length > 0" class="history-section">
      <div class="section-subheader">
        <h4>续签合同</h4>
        <span>{{ contractChains.length }} 条续签链</span>
      </div>
      <div class="chain-list">
        <div v-for="chain in contractChains" :key="chain.chainId" class="chain-card">
          <div class="chain-summary">
            <div>
              <div class="chain-title">
                {{ chain.items[0]?.contract_number }} 至 {{ chain.items[chain.items.length - 1]?.contract_number }}
              </div>
              <div class="chain-meta">
                {{ chain.contractCount }} 份合同 · 累计 ¥{{ formatCurrency(chain.totalAmount) }} · 执行中 ¥{{ formatCurrency(chain.activeAmount) }}
              </div>
            </div>
            <div class="chain-tags">
              <el-tag v-if="chain.latestContractId" size="small" type="info">
                最新 #{{ chain.latestContractId }}
              </el-tag>
              <el-tag v-if="chain.hasBrokenLink || chain.hasCycle" size="small" type="warning">
                需检查
              </el-tag>
            </div>
          </div>
          <ContractTimeline :items="chain.items" @view="id => emit('view', id)" />
        </div>
      </div>
    </section>

    <section v-if="standaloneContracts.length > 0" class="history-section">
      <div class="section-subheader">
        <h4>一次性合同</h4>
        <span>{{ standaloneContracts.length }} 份</span>
      </div>
      <div class="standalone-grid">
        <ContractCard
          v-for="contract in standaloneContracts"
          :key="contract.id"
          :contract="contract"
          @view="id => emit('view', id)"
          @edit="id => emit('edit', id)"
          @invoice="id => emit('invoice', id)"
          @payment="id => emit('payment', id)"
          @delete="id => emit('delete', id)"
        />
      </div>
    </section>

    <el-empty
      v-if="contractChains.length === 0 && standaloneContracts.length === 0"
      description="该客户暂无合同历史"
      :image-size="150"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Contract, ContractChain } from '@/api/types'
import ContractCard from '@/components/ContractCard.vue'
import ContractTimeline from '@/components/ContractTimeline.vue'

const props = defineProps<{
  contractChains: ContractChain[]
  standaloneContracts: Contract[]
}>()

const emit = defineEmits<{
  view: [id: number]
  edit: [id: number]
  invoice: [id: number]
  payment: [id: number]
  delete: [id: number]
}>()

const hasRelationshipWarning = computed(() => {
  return props.contractChains.some(chain => chain.hasBrokenLink || chain.hasCycle)
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(Number(amount || 0))
}
</script>

<style scoped>
.contract-history {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.history-alert {
  margin-bottom: 2px;
}

.history-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-subheader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.section-subheader h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.section-subheader span {
  color: #909399;
  font-size: 13px;
}

.chain-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chain-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.chain-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.chain-title {
  font-weight: 700;
  color: #303133;
}

.chain-meta {
  margin-top: 4px;
  font-size: 13px;
  color: #606266;
}

.chain-tags {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  flex-shrink: 0;
}

.standalone-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

@media (max-width: 767px) {
  .chain-summary {
    flex-direction: column;
  }

  .standalone-grid {
    grid-template-columns: 1fr;
  }
}
</style>
