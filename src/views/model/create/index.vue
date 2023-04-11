<script lang="ts" setup>
import { ref } from 'vue'
import type { FormItemRule, FormRules, UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NUpload,
  useMessage,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { createModel as createModelApi, prepareData } from '@/api/index'
import type { CancelModelRes } from '@/api/types'

const router = useRouter()
const message = useMessage()

const formData = ref({
  suffix: '',
  model: 'ada',
  n_epochs: 4,
  batch_size: 4,
  learning_rate_multiplier: 0.1,
  compute_classification_metrics: 0,
  training_file: null,
})

const rules: FormRules = {
  suffix: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (!value)
          return new Error('请填写模型名称')
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
  model: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (!value)
          return new Error('请选择基础模型')
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
  n_epochs: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (!value)
          formData.value.n_epochs = 4
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
  batch_size: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (!value)
          formData.value.batch_size = 4
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
  learning_rate_multiplier: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (!value)
          formData.value.learning_rate_multiplier = 0.1
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
  training_file: [
    {
      required: true,
    },
  ],
}

const modelOptions = [{
  label: 'ada',
  value: 'ada',
}, {
  label: 'babbage',
  value: 'babbage',
}, {
  label: 'curie',
  value: 'curie',
}, {
  label: 'davinci',
  value: 'davinci',
}]

const computeClassificationMetricsOptions = [
  {
    label: '是',
    value: 1,
  }, {
    label: '否',
    value: 0,
  },
]

const afterPreparedData = ref([])
const afterPreparedFileId = ref('')

const fileList = ref<UploadFileInfo[]>([])
const customRequest = ({
  file,
  onFinish,
  onError,
}: UploadCustomRequestOptions) => {
  const formData = new FormData()
  formData.append('file', file.file as File)
  fileList.value[0].status = 'uploading'
  fileList.value[0].percentage = 100
  prepareData<{ id: string; list: any }>(formData)
    .then((res) => {
      const { id, list } = res?.data as { id: string; list: any } || { id: '', list: [] }
      afterPreparedFileId.value = id
      afterPreparedData.value = list
      onFinish()
    })
    .catch(() => {
      onError()
    })
}

const showPreparedDataModal = ref(false)
const viewData = () => {
  showPreparedDataModal.value = true
}

const cancel = () => {
  router.go(-1)
}

const isLoading = ref(false)

const createModel = async () => {
  if (!formData.value.suffix.length) {
    return message.error(
      '请填写模型名称',
    )
  }

  if (!formData.value.model.length) {
    return message.error(
      '请选择基础模型',
    )
  }

  if (!fileList.value.length || fileList.value[0].status !== 'finished') {
    return message.error(
      '请检查上传文件',
    )
  }

  isLoading.value = true
  const { status, data } = await createModelApi<CancelModelRes>({
    model: formData.value.model,
    suffix: formData.value.suffix,
    training_file: afterPreparedFileId.value,
    validation_file: '',
    n_epochs: formData.value.n_epochs,
    batch_size: formData.value.batch_size,
    learning_rate_multiplier: formData.value.learning_rate_multiplier,
    prompt_loss_weight: 0.01,
    compute_classification_metrics: !!formData.value.compute_classification_metrics,
    classification_n_classes: null,
    classification_positive_class: null,
    classification_betas: null,
  })
  isLoading.value = false

  if (status !== 'Success' || data.error)
    return message.error(data.error?.message || '创建失败')

  message.success('创建成功')
  cancel()
}
</script>

<template>
  <div class="model-create w-full h-full">
    <div class="model-create__header">
      微调创建
    </div>
    <NSpin :show="isLoading" class="model-create__content w-full h-full">
      <div class="model-create__content-main">
        <NForm ref="formRef" :model="formData" :rules="rules">
          <NFormItem path="suffix" label="模型名称">
            <NInput v-model:value="formData.suffix" @keydown.enter.prevent />
          </NFormItem>
          <NFormItem
            label="基础模型"
            path="model"
          >
            <NSelect
              v-model:value="formData.model"
              :options="modelOptions"
            />
          </NFormItem>
          <NFormItem path="n_epochs" label="训练模型的时期数--n_epochs">
            <NInputNumber v-model:value="formData.n_epochs" :min="0" :precision="0" />
          </NFormItem>
          <NFormItem path="batch_size" label="批量大小--batch_size">
            <NInputNumber v-model:value="formData.batch_size" :min="0" :precision="0" />
          </NFormItem>
          <NFormItem path="learning_rate_multiplier" label="微调学习率--learning_rate_multiplier">
            <NInputNumber v-model:value="formData.learning_rate_multiplier" :min="0" :precision="2" />
          </NFormItem>
          <NFormItem path="compute_classification_metrics" label="compute_classification_metrics">
            <NSelect
              v-model:value="formData.compute_classification_metrics"
              :options="computeClassificationMetricsOptions"
            />
          </NFormItem>
          <NFormItem
            label="数据文件"
            path="training_file"
          >
            <NUpload
              v-model:file-list="fileList"
              :custom-request="customRequest"
              :max="1"
              accept=".csv, .tsv, .xlsx, .json, .jsonl"
            >
              <NButton>上传文件</NButton>
            </NUpload>
          </NFormItem>
          <div
            v-if="fileList.length && fileList[0].status === 'finished'"
            class="text-[#3366ff] hover:cursor-pointer"
            @click="viewData"
          >
            数据预览
          </div>
        </NForm>
      </div>
    </NSpin>
    <div class="model-create__footer">
      <NSpace>
        <NButton type="info" :disabled="isLoading" @click="createModel">
          创建
        </NButton>
        <NButton @click="cancel">
          取消
        </NButton>
      </NSpace>
    </div>
    <NModal
      v-model:show="showPreparedDataModal"
      preset="card"
      title="数据预览"
      :style="{ width: '800px' }"
      size="huge"
      :bordered="false"
    >
      <div class="h-[600px] overflow-auto">
        <JsonViewer v-for="(item, index) in afterPreparedData" :key="index" :value="item" copyable sort theme="jv-light" />
      </div>
    </NModal>
  </div>
</template>

<style lang="less" scoped>
.model-create {
  display: flex;
  flex-direction: column;
  background-color: #fbfbfb;

  &__header {
    height: 48px;
    font-weight: bold;
    box-shadow: inset 0 -1px #e1e5eb;
    padding: 0 16px;
    line-height: 48px;
    background-color: #fff;
  }

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    &-main {
      width: 800px;
      padding: 24px;
      border: 1px solid #e1e5eb;
      border-radius: 6px;
      background-color: #fff;
    }
  }
  &__footer {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 1px #e1e5eb;
      background-color: #fff;
  }
}
</style>
