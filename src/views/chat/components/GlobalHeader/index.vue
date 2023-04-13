<script lang="ts" setup>
import { NButton, NSpace } from 'naive-ui'
import { useRouter } from 'vue-router'
import { ROUTER } from '@/router/const'

const router = useRouter()

const jumpToModel = () => {
  router.push({
    name: ROUTER.name.model,
  })
}
</script>

<template>
  <div class="global-header">
    <NSpace>
      <NButton @click="jumpToModel">
        {{ $t('fineTunes.fineTunes') }}
      </NButton>
    </NSpace>
  </div>
</template>

<style lang="less" scoped>
.global-header {
  padding: 4px 24px;
}
</style>
