<script lang="ts" setup>
import { h, onMounted, ref } from 'vue'
import { NButton, NDataTable, NIcon, NModal, NSpace, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import ModelDetailTable from '../components/ModelDetailTable.vue'
import { ROUTER } from '@/router/const'
import { cancelModel as cancelModelApi, fetchList } from '@/api'
import type { CancelModelRes, HyperParam, TrainingFile } from '@/api/types'

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
  try {
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
  catch (error) {
    isTableLoading.value = false
    message.error('加载失败')
    list.value = []
  }
}

// const deleteModel = async (detail: TableListItem) => {
//   const { fine_tuned_model } = detail

//   try {
//     const { data } = await deleteModelApi<DeleteModelRes>({ fine_tuned_model })

//     if (data.error)
//       return message.error(data.error?.message || '删除失败')

//     message.success('删除成功')
//     loadModelList()
//   }
//   catch (error) {
//     message.error('删除失败')
//   }
// }

const calcelModel = async (detail: TableListItem) => {
  const { id } = detail

  try {
    const { data } = await cancelModelApi<CancelModelRes>({ id })

    if (data.error)
      return message.error(data.error?.message || '取消失败')

    message.success('取消成功')
    loadModelList()
  }
  catch (error: any) {
    message.error(error.message || '取消失败')
  }
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
  <div class="model-list h-full w-full dark:bg-[#24272e]">
    <div class="model-list__header dark:bg-[#24272e]">
      <div>
        <NButton @click="goBack">
          chat
        </NButton>
      </div>
      <NButton type="primary" ghost @click="toCreate">
        创建
      </NButton>
    </div>
    <div class="model-list__content">
      <NSpace class="model-list__content-toolbar">
        <NButton type="info" ghost @click="loadModelList">
          <template #icon>
            <NIcon><svg t="1681286324180" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5418" width="200" height="200"><path d="M981.314663 554.296783a681.276879 681.276879 0 0 1-46.986468 152.746388q-105.706098 230.734238-360.983096 242.19829a593.06288 593.06288 0 0 1-228.689008-33.853939v-1.022615l-31.808709 79.979258a55.759429 55.759429 0 0 1-20.506122 22.551352 40.043451 40.043451 0 0 1-21.04434 5.382184 51.076928 51.076928 0 0 1-19.483507-5.382184 95.210839 95.210839 0 0 1-13.347817-7.158305 52.314831 52.314831 0 0 1-5.382184-4.628679L71.671707 731.908862a57.427906 57.427906 0 0 1-7.158305-21.528737 46.932646 46.932646 0 0 1 1.022615-17.438277 35.952991 35.952991 0 0 1 7.158305-13.347816 74.435608 74.435608 0 0 1 10.279972-10.279972 60.495751 60.495751 0 0 1 11.248765-7.373593 50.431066 50.431066 0 0 1 8.18092-3.606063 6.189512 6.189512 0 0 0 3.067845-1.776121l281.003839-74.866183a91.497132 91.497132 0 0 1 35.899168-2.583448 122.337047 122.337047 0 0 1 22.174599 6.404799 21.528737 21.528737 0 0 1 12.325202 12.325202 76.157907 76.157907 0 0 1 4.628679 14.854829 47.63233 47.63233 0 0 1 0 14.370431 55.167388 55.167388 0 0 1-2.04523 10.764369 10.764368 10.764368 0 0 0-1.022615 3.606063l-32.831324 79.979258a677.50935 677.50935 0 0 0 164.264262 39.505232q77.395809 7.696523 131.809692-3.606063a358.507291 358.507291 0 0 0 101.023598-36.921784 381.27393 381.27393 0 0 0 73.951211-50.753997 352.64071 352.64071 0 0 0 48.708767-55.382676 410.391547 410.391547 0 0 0 26.910921-41.550462c3.767529-7.481236 6.673908-13.616926 8.719139-18.460892zM40.885614 449.667121a685.69027 685.69027 0 0 1 63.563595-176.427998q118.0313-212.273346 374.330913-207.160271a571.803252 571.803252 0 0 1 207.160271 39.989629l33.853939-78.956643A75.619688 75.619688 0 0 1 735.187378 9.189165a37.67529 37.67529 0 0 1 15.393047-8.234742 42.303968 42.303968 0 0 1 14.854829-0.538219 47.578509 47.578509 0 0 1 13.347817 3.606064 102.907362 102.907362 0 0 1 11.302586 6.13569 49.569917 49.569917 0 0 1 6.673909 4.628678l3.067845 3.067845 154.84544 276.913379a81.970666 81.970666 0 0 1 6.13569 22.712817 46.986468 46.986468 0 0 1-1.022615 17.438277 32.293105 32.293105 0 0 1-7.696523 13.347817 69.322533 69.322533 0 0 1-10.764369 9.741753 92.142994 92.142994 0 0 1-11.302587 6.673909l-8.18092 4.09046a7.104483 7.104483 0 0 1-3.067845 1.022615l-283.049068 67.546412a112.003254 112.003254 0 0 1-46.125319-1.022615c-11.571696-3.390776-19.160576-8.019454-22.551352-13.832214a41.173709 41.173709 0 0 1-5.382184-21.04434 97.256069 97.256069 0 0 1 1.291724-17.438277 24.381295 24.381295 0 0 1 3.067845-8.234742L600.632773 296.81309a663.730958 663.730958 0 0 0-164.102797-43.057474q-77.987849-9.203535-131.809692 0a348.227319 348.227319 0 0 0-101.292707 33.853938 368.571976 368.571976 0 0 0-75.350579 49.246986 383.31916 383.31916 0 0 0-50.269601 54.360061 408.507783 408.507783 0 0 0-28.740863 41.012244A113.025869 113.025869 0 0 0 40.885614 449.667121z m0 0" fill="#467CFD" p-id="5419" /></svg></NIcon>
          </template>
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
