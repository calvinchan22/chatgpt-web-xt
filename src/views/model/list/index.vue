<script lang="ts" setup>
import { h, onMounted, ref } from 'vue'
import { NButton, NDataTable, NModal, NSpace, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import ModelDetailTable from '../components/ModelDetailTable.vue'
import { ROUTER } from '@/router/const'
import { cancelModel as cancelModelApi, deleteModel as deleteModelApi, fetchList } from '@/api'
import type { CancelModelRes, DeleteModelRes, HyperParam, TrainingFile } from '@/api/types'

interface ListItem {
  created_at: number
  updated_at: number
  validation_files: TrainingFile[]
  hyperparams: HyperParam
  id: string
  fine_tuned_model: string
  model: string
  object: string
  organization_id: string
  result_files: TrainingFile[]
  status: string
  training_files: TrainingFile[]
}

interface TableListItem {
  created_at: string
  id: string
  fine_tuned_model: string
  model: string
  status: string
  super_param: string
}

const router = useRouter()
const message = useMessage()

const goBack = () => {
  router.push({
    name: ROUTER.name.root,
  })
}

const toCreate = () => {
  router.push({
    name: ROUTER.name.modelCreate,
  })
}

const detailModelId = ref('')
const showModal = ref(false)
const seeDetail = (detail: TableListItem) => {
  detailModelId.value = detail.id
  showModal.value = true
}

const list = ref<TableListItem[]>([])
const isTableLoading = ref(false)

const loadModelList = async () => {
  isTableLoading.value = true
  const { data } = await fetchList<ListItem[]>()
  isTableLoading.value = false
  list.value = data.map((item) => {
    return {
      id: item.id || '',
      fine_tuned_model: item.fine_tuned_model || '',
      model: item.model || '',
      created_at: dayjs.unix(item.created_at || 0).format('YYYY-MM-DD HH:mm:ss'),
      status: item.status || '',
      super_param: JSON.stringify(item.hyperparams),
    }
  }) as TableListItem[]
}

const deleteModel = async (detail: TableListItem) => {
  const { fine_tuned_model } = detail
  const { data, status } = await deleteModelApi<DeleteModelRes>({ fine_tuned_model })

  if (status === 'Fail' || data.error)
    return message.error(data.error?.message || '删除失败')

  message.success('删除成功')
  loadModelList()
}

const calcelModel = async (detail: TableListItem) => {
  const { id } = detail
  const { status, data } = await cancelModelApi<CancelModelRes>({ id })

  if (status === 'Fail' || data.error)
    return message.error(data.error?.message || '取消失败')

  message.success('取消成功')
  loadModelList()
}

const columns = [
  {
    title: '模型名称',
    key: 'fine_tuned_model',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '模型ID',
    key: 'id',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '基础模型',
    key: 'model',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '状态',
    key: 'status',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '超参数',
    key: 'super_param',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: TableListItem) {
      return h(
        'div',
        {},
        [h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'info',
            onClick: () => calcelModel(row),
          },
          { default: () => '取消' },
        ), h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'info',
            onClick: () => deleteModel(row),
          },
          { default: () => '删除' },
        ), h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'info',
            onClick: () => seeDetail(row),
          },
          { default: () => '查看详情' },
        )],
      )
    },
  },
]

onMounted(() => {
  loadModelList()
})
</script>

<template>
  <div class="model-list h-full w-full">
    <div class="model-list__header">
      <div>
        <NButton @click="goBack">
          chat
        </NButton>
      </div>
      <NButton type="info" @click="toCreate">
        创建
      </NButton>
    </div>
    <div class="model-list__content">
      <NSpace class="model-list__content-toolbar">
        <NButton type="primary" @click="loadModelList">
          刷新
        </NButton>
      </NSpace>
      <NDataTable
        :columns="columns"
        :data="list"
        :style="{ height: `calc(100% - 40px)` }"
        flex-height
        :bordered="false"
        :loading="isTableLoading"
      />
    </div>
    <NModal
      v-model:show="showModal"
      class="custom-card"
      preset="card"
      title="详情"
      :style="{ width: '800px' }"
      size="huge"
      :bordered="false"
    >
      <ModelDetailTable :id="detailModelId" />
    </NModal>
  </div>
</template>

<style lang="less" scoped>
.model-list {
    display: flex;
    flex-direction: column;
    background-color: #fbfbfb;
    &__header {
        box-shadow: inset 0 -1px #e1e5eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 16px 40px;
        background-color: #fff;
    }

    &__content {
        flex: 1;
        padding: 38px 100px 12px;

        &-toolbar {
          box-shadow: inset 0 -1px #e1e5eb;
          padding-bottom: 8px;
        }
    }

}
</style>
