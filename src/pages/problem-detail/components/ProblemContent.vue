<script setup>
// toastui
import "@toast-ui/editor/dist/toastui-editor-viewer.css";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";

// Vue Core
import { ref, watch, nextTick, onBeforeUnmount } from "vue";

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
});

const viewer = ref(null);
const viewerEl = ref(null);
const isLoading = ref(true);

const destroyViewer = () => {
  isLoading.value = true;
  if (viewer.value) {
    viewer.value.destroy();
    viewer.value = null;
    viewerEl.value.innerHTML = "";
  }
};

const initViewer = async () => {
  isLoading.value = true;
  try {
    isLoading.value = true;
    // 기존 viewer 정리
    destroyViewer();

    if (viewerEl.value && props.problem?.question) {
      await nextTick();
      viewer.value = new Viewer({
        el: viewerEl.value,
        initialValue: props.problem.question,
        height: "100%",
      });
      // 뷰어가 완전히 렌더링될 때까지 약간의 지연시간 두기
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  } catch (error) {
    console.error("Viewer 초기화 실패:", error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.problem?.question,
  async (newQuestion) => {
    if (newQuestion) {
      await initViewer();
    } else {
      destroyViewer();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  destroyViewer();
});
</script>

<template>
  <div class="mb-8">
    <div ref="viewerEl" class="w-full mb-10 text-gray-700 min-h-4"></div>

    <!-- 객관식 보기 -->
    <div
      v-if="props.problem?.problem_type === 'multiple_choice'"
      class="space-y-4"
    >
      <ol class="space-y-2 text-gray-700 list-decimal">
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
      class="items-center mx-auto space-y-4 w-fit"
    >
      <ul class="flex w-full gap-4">
        <li
          class="flex items-center w-40 gap-2 px-4 py-2 text-2xl font-extrabold transition rounded-md shadow-sm h-18 item-middle bg-black-6 text-gray-1"
        >
          O
        </li>
        <li
          class="flex items-center w-40 gap-2 px-4 py-2 text-2xl font-extrabold transition rounded-md shadow-sm h-18 item-middle bg-black-6 text-gray-1"
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
