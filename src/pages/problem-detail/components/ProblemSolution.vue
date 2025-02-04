<script setup>
import { ref, onMounted, watch, nextTick, watchEffect } from "vue";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";
import { chatCompletion } from "@/api/openai";
import { useToast } from "primevue/usetoast";

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
const toast = useToast();
const isRateLimited = ref(false);

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
    isRateLimited.value = false;

    const prompt = `다음 문제를 풀이해주세요:
    제목: ${props.title}
    문제: ${props.question}
    보기:
    1번: ${props.options?.option_one || ""}
    2번: ${props.options?.option_two || ""}
    3번: ${props.options?.option_three || ""}
    4번: ${props.options?.option_four || ""}
    정답: ${props.answer}
    
    풀이 방법과 해설을 자세히 제공해주세요.
    같은 문제에 대해서는 항상 같은 풀이를 제공해야 합니다.
    정확한 근거에 의해 풀이 방법과 해설을 제공하고, 근거를 찾을 수 없는 경우 추측됩니다 등의 내용을 포함해주세요.
    정답은 항상 ${props.answer}와 같아야 합니다.`;

    const response = await chatCompletion([{ role: "user", content: prompt }]);
    gptExplanation.value = response.content;
  } catch (error) {
    console.error("GPT 설명 로드 실패:", error);

    if (error.status === 429) {
      isRateLimited.value = true;
      toast.add({
        severity: "warn",
        summary: "API 사용량 초과",
        detail: "현재 많은 사용자가 이용 중입니다. 잠시 후 다시 시도해주세요.",
        life: 5000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "오류 발생",
        detail: "설명을 불러오는 중 문제가 발생했습니다.",
        life: 3000,
      });
    }
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
  console.log("Props 데이터:", {
    title: props.title,
    question: props.question,
    options: props.options,
    answer: props.answer,
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
      <div
        v-if="explanation"
        ref="viewerRef"
        class="text-gray-700 min-h-4 mb-10"
      ></div>
      <p v-else class="text-gray-700">해설이 없습니다.</p>

      <!-- GPT 풀이 섹션 -->
      <div class="mt-8 border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-black-2">AI 해설</h4>
          <button
            @click="getGptExplanation"
            class="px-4 py-2 bg-orange-1 text-white rounded-lg hover:bg-orange-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isGptLoading || isRateLimited"
          >
            {{
              isGptLoading
                ? "로딩 중..."
                : isRateLimited
                ? "사용량 초과"
                : "GPT 풀이 보기"
            }}
          </button>
        </div>
        <div v-if="gptExplanation" class="prose max-w-none">
          <div class="whitespace-pre-wrap text-gray-700">
            {{ gptExplanation }}
          </div>
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
