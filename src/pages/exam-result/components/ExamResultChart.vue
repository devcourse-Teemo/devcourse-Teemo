<script setup>
// PrimeVue
import Chart from "primevue/chart";

// Store
import { useExamResultStore } from "@/store/ExamResultStore";

// Vue Core
import { ref, watch } from "vue";

const examResultStore = useExamResultStore();

const chartData = ref({
  labels: ["내 점수", "평균 점수"],
  datasets: [
    {
      backgroundColor: ["#F6C085", "#8992B5"],
      data: [examResultStore.correctCount, examResultStore.averageCount],
    },
  ],
});
// 차트 옵션
const chartOptions = ref({
  responsive: true, // 부모 래핑 박스 크기에 맞춤
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      max: examResultStore.totalCount, // 최대 점수
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        display: false,
      },
    },
  },
});

watch(
  () => [
    examResultStore.correctCount,
    examResultStore.averageCount,
    examResultStore.totalCount,
  ],
  ([newCorrect, newAverage, newTotal]) => {
    chartData.value.datasets[0].data = [newCorrect, newAverage];
    chartOptions.value.scales.x.max = newTotal;
  },
);
</script>

<template>
  <div class="w-full h-full">
    <!-- Bar Chart -->
    <Chart type="bar" :data="chartData" :options="chartOptions" />
  </div>
</template>
