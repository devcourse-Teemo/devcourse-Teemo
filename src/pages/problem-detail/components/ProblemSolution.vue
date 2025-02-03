<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";

const props = defineProps({
  answer: String,
  explanation: String,
  source: String,
});

const isOpen = ref(false);
const viewerRef = ref(null);
let viewer = null;

const initViewer = () => {
  try {
    if (props.explanation && viewerRef.value) {
      if (viewer) {
        viewer.destroy();
      }
      viewer = new Viewer({
        el: viewerRef.value,
        initialValue: props.explanation || "",
      });
    }
  } catch (error) {
    console.error("Viewer 초기화 실패:", error);
  }
};

const toggleAccordion = () => {
  isOpen.value = !isOpen.value;
};

onMounted(() => {
  if (props.explanation) {
    nextTick(() => {
      initViewer();
    });
  }
});

watch(
  () => props.explanation,
  () => {
    nextTick(() => {
      initViewer();
    });
  },
);

watch(isOpen, (newValue) => {
  if (newValue && props.explanation) {
    nextTick(() => {
      initViewer();
    });
  }
});
</script>

<template>
  <div class="w-full rounded-lg bg-black-3/15 px-4 mb-4 py-4">
    <div
      @click="toggleAccordion"
      class="cursor-pointer flex justify-between items-center"
    >
      <span class="text-lg font-semibold text-black-2">풀이와 답 보기</span>
      <svg
        :class="{
          'transform rotate-180': isOpen,
          'transform rotate-0': !isOpen,
        }"
        class="w-5 h-5 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </div>

    <div v-if="isOpen" class="p-4 border-t border-b border-gray-300 mt-4">
      <h4 class="text-lg font-semibold text-black-2 mb-4">정답</h4>
      <p class="text-gray-700">
        {{ answer || "답이 없습니다." }}
      </p>
    </div>
    <div v-if="isOpen" class="p-4 pb-0">
      <h4 class="text-lg font-semibold text-black-2 mb-4">문제 해설</h4>
      <div v-if="explanation" ref="viewerRef"></div>
      <p v-else class="text-gray-700">해설이 없습니다.</p>
    </div>
  </div>

  <!-- 출처  -->
  <p
    v-if="source"
    class="text-gray-500 mt-4 p-4 border-b border-gray-300 mb-10"
  >
    출처 | {{ source }}
  </p>
</template>
<style scoped>
:deep(.toastui-editor-contents) {
  font-family: "Pretendard";
}
:deep(p) {
  font-size: 16px;
}
</style>
