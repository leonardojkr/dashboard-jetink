<script setup lang="ts">
import VChart from 'vue-echarts'
import { use, registerMap } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart,
  MapChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  GeoComponent,
  VisualMapComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import brazilMap from '@/assets/maps/brazil-states.json'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  GeoComponent,
  VisualMapComponent,
])

registerMap('brazil', brazilMap as never)

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
    :update-options="{ notMerge: true }"
    :autoresize="autoresize"
    :style="{ height }"
    class="w-full"
  />
</template>
