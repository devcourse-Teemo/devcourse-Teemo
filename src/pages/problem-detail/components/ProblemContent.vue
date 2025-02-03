<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
});

const viewer = ref(null);
const viewerEl = ref(null);

const initViewer = async () => {
  try {
    if (viewerEl.value && props.problem?.question) {
      // 기존 viewer가 있다면 제거
      if (viewer.value) {
        viewer.value.destroy();
        viewer.value = null;
      }

      // 새로운 viewer 초기화
      viewer.value = new Viewer({
        el: viewerEl.value,
        initialValue: props.problem.question,
        height: "100%",
      });
    }
  } catch (error) {
    console.error("Viewer 초기화 실패:", error);
  }
};

onMounted(async () => {
  await nextTick();
  await initViewer();
});

watch(
  () => props.problem?.question,
  async (newQuestion) => {
    if (newQuestion) {
      await nextTick();
      await initViewer();
    }
  },
);

onBeforeUnmount(() => {
  if (viewer.value) {
    viewer.value.destroy();
    viewer.value = null;
  }
});
</script>

<template>
  <div class="mb-8">
    <div ref="viewerEl" class="text-gray-700 min-h-4 mb-10 w-full"></div>

    <!-- 객관식 보기 -->
    <div
      v-if="props.problem?.problem_type === 'multiple_choice'"
      class="space-y-4"
    >
      <ol class="list-decimal space-y-2 text-gray-700">
        <li v-if="props.problem.option_one" class="flex items-center gap-2">
          <strong class="text-xs rounded-full bg-black-6 w-7 h-7 item-middle"
            >1</strong
          >
          <span>{{ props.problem.option_one }}</span>
        </li>
        <li v-if="props.problem.option_two" class="flex items-center gap-2">
          <strong class="text-xs rounded-full bg-black-6 w-7 h-7 item-middle"
            >2</strong
          >
          <span>{{ props.problem.option_two }}</span>
        </li>
        <li v-if="props.problem.option_three" class="flex items-center gap-2">
          <strong class="text-xs rounded-full bg-black-6 w-7 h-7 item-middle"
            >3</strong
          >
          <span>{{ props.problem.option_three }}</span>
        </li>
        <li v-if="props.problem.option_four" class="flex items-center gap-2">
          <strong class="text-xs rounded-full bg-black-6 w-7 h-7 item-middle"
            >4</strong
          >
          <span>{{ props.problem.option_four }}</span>
        </li>
      </ol>
    </div>

    <!-- OX 보기 -->
    <div
      v-if="props.problem?.problem_type === 'ox'"
      class="space-y-4 w-fit items-center mx-auto"
    >
      <ul class="flex gap-4 w-full">
        <li
          class="flex items-center gap-2 rounded-md w-40 h-18 text-2xl font-extrabold item-middle px-4 py-2 bg-black-6 text-gray-1 shadow-sm transition"
        >
          O
        </li>
        <li
          class="flex items-center gap-2 rounded-md w-40 h-18 text-2xl font-extrabold item-middle px-4 py-2 bg-black-6 text-gray-1 shadow-sm transition"
        >
          X
        </li>
      </ul>
    </div>
  </div>
</template>
<style scoped>
:deep(.toastui-editor-contents) {
  font-family: "Pretendard";
}
:deep(p) {
  font-size: 16px;
}
</style>
