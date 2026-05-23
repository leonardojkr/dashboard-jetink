<script setup lang="ts">
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
])

interface Props {
  option: EChartsOption
  height?: string
  autoresize?: boolean
}

withDefaults(defineProps<Props>(), {
  height: '320px',
  autoresize: true,
})
</script>

<template>
  <VChart
    :option="option"
    :autoresize="autoresize"
    :style="{ height }"
    class="w-full"
  />
</template>
