<script lang="ts" setup>
import { ref } from 'vue'
import type { FormItemRule, FormRules, UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NPopover,
  NSelect,
  NSpace,
  NSpin,
  NUpload,
  useMessage,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { createModel as createModelApi, prepareData } from '@/api/index'
import type { CancelModelRes } from '@/api/types'

const n_epochs_tip = '默认为 4。训练模型的时期数。一个纪元指的是训练数据集的一个完整周期。'
const batch_size_tip = '默认为训练集中示例数量的 0.2%，上限为 256。批量大小是用于训练单个正向和反向传递的训练示例数。总的来说，我们发现更大的批次大小往往更适用于更大的数据集。'
const learning_rate_multiplier_tip = '默认为 0.05、0.1 或 0.2，具体取决于 final batch_size。微调学习率是用于预训练的原始学习率乘以该乘数。我们建议使用 0.02 到 0.2 范围内的值进行试验，以查看产生最佳结果的值。根据经验，我们发现较大的学习率通常在较大的批量大小下表现更好。'
const compute_classification_metrics_tip = '默认为False。如果为 True，为了对分类任务进行微调，在每个 epoch 结束时在验证集上计算特定于分类的指标（准确性、F-1 分数等）。'

const router = useRouter()
const message = useMessage()

const formData = ref({
  suffix: '',
  model: 'ada',
  n_epochs: null,
  batch_size: null,
  learning_rate_multiplier: null,
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
    .catch((err) => {
      message.error(err.message, {
        keepAliveOnHover: true,
      })
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
  try {
    await createModelApi<CancelModelRes>({
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

    message.success('创建成功')
    cancel()
  }
  catch (error: any) {
    isLoading.value = false
    message.error(error?.message || '创建失败！', {
      keepAliveOnHover: true,
    })
  }
}
</script>

<template>
  <div class="model-create w-full h-full">
    <div class="model-create__header">
      微调创建
    </div>
    <NSpin :show="isLoading" class="model-create__content w-full">
      <div class="model-create__content-main">
        <NForm ref="formRef" :model="formData" :rules="rules">
          <NFormItem path="suffix" label="模型名称">
            <NInput v-model:value="formData.suffix" size="small" @keydown.enter.prevent />
          </NFormItem>
          <NFormItem
            label="基础模型"
            path="model"
          >
            <NSelect
              v-model:value="formData.model"
              :options="modelOptions"
              size="small"
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
            class="text-[#3366ff] hover:cursor-pointer mb-4"
            @click="viewData"
          >
            数据预览
          </div>
          <NCollapse>
            <NCollapseItem title="高级设置" name="1">
              <NFormItem path="n_epochs">
                <NInputNumber v-model:value="formData.n_epochs" :min="0" :precision="0" size="small" />
                <template #label>
                  <span>训练模型的时期数--n_epochs</span>
                  <NPopover trigger="hover" style="width: 500px">
                    <template #trigger>
                      <NIcon size="12" class="ml-4">
                        <svg t="1681266249014" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2280" width="200" height="200"><path d="M512 960A448 448 0 1 0 512 64a448 448 0 0 0 0 896z m0-64A384 384 0 1 1 512 128a384 384 0 0 1 0 768z m19.2-576a12.8 12.8 0 0 0 12.8-12.48V268.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V307.2a12.8 12.8 0 0 0 12.48 12.8H531.2z m0 448a12.8 12.8 0 0 0 12.8-12.48V396.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V755.2a12.8 12.8 0 0 0 12.48 12.8H531.2z" fill="#458FFF" p-id="2281" /></svg>
                      </NIcon>
                    </template>
                    <span>{{ n_epochs_tip }}</span>
                  </NPopover>
                </template>
              </NFormItem>
              <NFormItem path="batch_size">
                <NInputNumber v-model:value="formData.batch_size" :min="0" :precision="0" size="small" />
                <template #label>
                  <span>批量大小--batch_size</span>
                  <NPopover trigger="hover" style="width: 500px">
                    <template #trigger>
                      <NIcon size="12" class="ml-4">
                        <svg t="1681266249014" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2280" width="200" height="200"><path d="M512 960A448 448 0 1 0 512 64a448 448 0 0 0 0 896z m0-64A384 384 0 1 1 512 128a384 384 0 0 1 0 768z m19.2-576a12.8 12.8 0 0 0 12.8-12.48V268.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V307.2a12.8 12.8 0 0 0 12.48 12.8H531.2z m0 448a12.8 12.8 0 0 0 12.8-12.48V396.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V755.2a12.8 12.8 0 0 0 12.48 12.8H531.2z" fill="#458FFF" p-id="2281" /></svg>
                      </NIcon>
                    </template>
                    <span>{{ batch_size_tip }}</span>
                  </NPopover>
                </template>
              </NFormItem>
              <NFormItem path="learning_rate_multiplier">
                <NInputNumber v-model:value="formData.learning_rate_multiplier" :min="0.02" :max="0.2" size="small" />
                <template #label>
                  <span>微调学习率--learning_rate_multiplier</span>
                  <NPopover trigger="hover" style="width: 500px">
                    <template #trigger>
                      <NIcon size="12" class="ml-4">
                        <svg t="1681266249014" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2280" width="200" height="200"><path d="M512 960A448 448 0 1 0 512 64a448 448 0 0 0 0 896z m0-64A384 384 0 1 1 512 128a384 384 0 0 1 0 768z m19.2-576a12.8 12.8 0 0 0 12.8-12.48V268.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V307.2a12.8 12.8 0 0 0 12.48 12.8H531.2z m0 448a12.8 12.8 0 0 0 12.8-12.48V396.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V755.2a12.8 12.8 0 0 0 12.48 12.8H531.2z" fill="#458FFF" p-id="2281" /></svg>
                      </NIcon>
                    </template>
                    <span>{{ learning_rate_multiplier_tip }}</span>
                  </NPopover>
                </template>
              </NFormItem>
              <NFormItem path="compute_classification_metrics">
                <NSelect
                  v-model:value="formData.compute_classification_metrics"
                  size="small"
                  :options="computeClassificationMetricsOptions"
                />
                <template #label>
                  <span>计算分类指标--compute_classification_metrics</span>
                  <NPopover trigger="hover" style="width: 500px">
                    <template #trigger>
                      <NIcon size="12" class="ml-4">
                        <svg t="1681266249014" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2280" width="200" height="200"><path d="M512 960A448 448 0 1 0 512 64a448 448 0 0 0 0 896z m0-64A384 384 0 1 1 512 128a384 384 0 0 1 0 768z m19.2-576a12.8 12.8 0 0 0 12.8-12.48V268.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V307.2a12.8 12.8 0 0 0 12.48 12.8H531.2z m0 448a12.8 12.8 0 0 0 12.8-12.48V396.8a12.8 12.8 0 0 0-12.48-12.8H492.8a12.8 12.8 0 0 0-12.8 12.48V755.2a12.8 12.8 0 0 0 12.48 12.8H531.2z" fill="#458FFF" p-id="2281" /></svg>
                      </NIcon>
                    </template>
                    <span>{{ compute_classification_metrics_tip }}</span>
                  </NPopover>
                </template>
              </NFormItem>
            </NCollapseItem>
          </NCollapse>
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
    justify-content: center;
    height: calc(100% - 128px);
    overflow-y: auto;
    padding-top: 50px;

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
