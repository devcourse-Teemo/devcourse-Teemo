<script setup>
import { ref, onMounted, watch, nextTick, watchEffect } from "vue";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";
import { chatCompletion } from "@/api/openai";

const props = defineProps({
  title: String,
  question: String,
  answer: String,
  explanation: String,
  source: String,
  options: Object,
});

const isOpen = ref(false);
const viewerRef = ref(null);
const gptExplanation = ref("");
const isGptLoading = ref(false);
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

const getGptExplanation = async () => {
  try {
    isGptLoading.value = true;
    const prompt = `다음 문제를 풀이해주세요:
    제목: ${props.title}
    문제: ${props.question}
    보기:
    1번: ${props.options?.option_one || ''}
    2번: ${props.options?.option_two || ''}
    3번: ${props.options?.option_three || ''}
    4번: ${props.options?.option_four || ''}
    정답: ${props.answer}
    
    풀이 방법과 해설을 자세히 제공해주세요.`;

    const response = await chatCompletion([
      { role: "user", content: prompt }
    ]);
    gptExplanation.value = response.content;
  } catch (error) {
    console.error("GPT 설명 로드 실패:", error);
  } finally {
    isGptLoading.value = false;
  }
};

const toggleAccordion = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      initViewer();
    });
  }
};

onMounted(() => {
  if (isOpen.value) {
    initViewer();
  }
});

watch(() => props.explanation, initViewer);

watchEffect(() => {
  console.log('Props 데이터:', {
    title: props.title,
    question: props.question,
    options: props.options,
    answer: props.answer
  });
});
</script>

<template>
  <div class="w-full rounded-lg bg-black-3/15 px-4 mb-4 py-6">
    <div
      @click="toggleAccordion"
      class="cursor-pointer flex justify-between items-center"
    >
      <span class="text-lg font-semibold text-black-2">풀이와 답</span>
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
      <p class="text-gray-700">{{ answer || "답이 없습니다." }}</p>
    </div>
    <div v-if="isOpen" class="p-4">
      <h4 class="text-lg font-semibold text-black-2 mb-4">문제 해설</h4>
      <div v-if="explanation" ref="viewerRef" class="text-gray-700 min-h-4 mb-10"></div>
      <p v-else class="text-gray-700">해설이 없습니다.</p>

      <!-- GPT 풀이 섹션 -->
      <div class="mt-8 border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-black-2">AI 해설</h4>
          <button
            @click="getGptExplanation"
            class="px-4 py-2 bg-orange-1 text-white rounded-lg hover:bg-orange-2 disabled:opacity-50"
            :disabled="isGptLoading"
          >
            {{ isGptLoading ? "로딩 중..." : "GPT 풀이 보기" }}
          </button>
        </div>
        <div v-if="gptExplanation" class="prose max-w-none">
          <div class="whitespace-pre-wrap text-gray-700">{{ gptExplanation }}</div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="source"
    class="text-gray-500 mt-4 p-4 border-b border-gray-300 mb-10 flex items-start gap-2"
  >
    <span class="flex-shrink-0 mt-1">출처 |</span>
    <p class="text-gray-700">{{ source }}</p>
  </div>
</template>

<style scoped>
.prose {
  font-size: 1rem;
  line-height: 1.75;
}
</style>