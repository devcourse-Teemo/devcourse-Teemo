<script setup>
import { Button, useToast } from "primevue";
import { storeToRefs } from "pinia";
import { watch, computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useExamResultStore } from "@/store/ExamResultStore";
import { useAuthStore } from "@/store/authStore";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";
import { chatCompletion } from "@/api/openai";

const route = useRoute();
const toast = useToast();

// AI 해설 관련 상태
const gptExplanation = ref("");
const isGptLoading = ref(false);
const isRateLimited = ref(false);

// Pinia Store 설정
const examResultStore = useExamResultStore();
const authStore = useAuthStore();
const {
  fetchMyOption,
  fetchProblems,
  toggleAgainViewProblem,
  checkAgainViewStatus,
} = examResultStore;
const {
  currentProblem,
  problems,
  myOption,
  status,
  againViewProblems,
  isFetchingProblems,
} = storeToRefs(examResultStore);

const testResultId = computed(() => route.params.examResultId);
const userId = computed(() => authStore.user?.id);

// 계산된 값
const selectedMyOption = computed(() => {
  const problem = myOption.value.find(
    (item) => item.problem_id === currentProblem.value?.id,
  );
  return problem ? problem.my_option : "";
});

const selectedStatus = computed(() => {
  if (!currentProblem.value) return null;
  const statusForCurrentProblem = status.value.find(
    (item) => item.problem_id === currentProblem.value.id,
  );
  return statusForCurrentProblem || null;
});

// 초기 데이터 로드
const loadInitialData = async () => {
  if (isFetchingProblems.value) return;

  try {
    if (!userId.value || !testResultId.value) {
      console.warn("유효하지 않은 userId 또는 testResultId");
      return;
    }
    isFetchingProblems.value = true;
    await fetchProblems(userId, testResultId);
    // 첫 번째 문제를 기본 선택
    if (problems.value.length > 0 && !currentProblem.value) {
      examResultStore.selectProblem(problems.value[0]);
    }
  } catch (error) {
    console.error("초기 데이터 로드 실패:", error);
    toast.add({
      severity: "error",
      summary: "데이터 로드 실패",
      detail: "문제 및 선택 데이터를 불러오는 데 실패했습니다.",
      life: 3000,
    });
  } finally {
    isFetchingProblems.value = false;
  }
};

// 문제 상태 토글
const toggleProblemStatus = async () => {
  if (!currentProblem.value?.id || !userId.value) {
    toast.add({
      severity: "error",
      summary: "오류 발생",
      detail: "유효하지 않은 문제 또는 사용자 ID입니다.",
      life: 3000,
    });
    return;
  }

  try {
    await toggleAgainViewProblem(userId.value, currentProblem.value.id, toast);
  } catch (error) {
    console.error("문제 상태 토글 실패:", error);
  }
};

const getGptExplanation = async () => {
  try {
    isGptLoading.value = true;
    isRateLimited.value = false;

    const prompt = `다음 문제를 풀이해주세요:
    제목: ${currentProblem.value.title}
    문제: ${currentProblem.value.question}
    보기:
    1번: ${currentProblem.value.options[0] || ""}
    2번: ${currentProblem.value.options[1] || ""}
    3번: ${currentProblem.value.options[2] || ""}
    4번: ${currentProblem.value.options[3] || ""}
    정답: ${currentProblem.value.answer}
    
    풀이 방법과 해설을 자세히 제공해주세요.
    같은 문제에 대해서는 항상 같은 풀이를 제공해야 합니다.
    정확한 근거에 의해 풀이 방법과 해설을 제공하고, 근거를 찾을 수 없는 경우 추측됩니다 등의 내용을 포함해주세요.
    정답은 항상 ${currentProblem.value.answer}와 같아야 합니다.`;

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

// 현재 문제 변경 시 상태 확인
watch(
  currentProblem,
  async (newProblem) => {
    if (!newProblem || !userId.value) {
      console.warn("currentProblem이 없거나 userId가 유효하지 않습니다.");
      return;
    }
    try {
      await checkAgainViewStatus(userId.value, newProblem.id);
    } catch (error) {
      console.error("checkAgainViewStatus 실행 중 오류 발생:", error);
    }
  },
  { immediate: true },
);

watch(
  () => route.params.examResultId,
  (newExamResultId) => {
    if (newExamResultId) {
      loadInitialData();
      fetchMyOption(newExamResultId, userId.value);
    }
  },
  { immediate: true },
);

let viewer, explanationViewer;

onMounted(() => {
  viewer = new Viewer({
    el: document.querySelector("#viewer"),
    initialValue: currentProblem.value?.question || "",
  });
  explanationViewer = new Viewer({
    el: document.querySelector("#explanationViewer"),
    initialValue: currentProblem.value?.explanation || "",
  });
});

watch(
  () => currentProblem.value?.question,
  (newQuestion) => {
    if (viewer) {
      viewer.setMarkdown(newQuestion || "");
    }
  },
);
watch(
  () => currentProblem.value?.explanation,
  (newExplanation) => {
    if (explanationViewer) {
      explanationViewer.setMarkdown(newExplanation || "");
    }
  },
);

watch(
  () => currentProblem.value,
  () => {
    gptExplanation.value = "";  // 새로운 문제 선택시 AI 해설 초기화
    isGptLoading.value = false;
    isRateLimited.value = false;
  }
);
</script>

<template>
  <div class="bg-white p-6 rounded-lg w-full mx-auto">
    <template v-if="examResultStore.isLoading">
      <div class="text-center py-10 text-gray-500">
        문제를 불러오는 중입니다...
      </div>
    </template>

    <template v-else-if="examResultStore.error">
      <div class="text-red-500 text-center py-10">
        {{ examResultStore.error }}
      </div>
    </template>

    <template v-else>
      <div v-if="examResultStore.currentProblem">
        <div v-if="(currentProblem = examResultStore.currentProblem)">
          <div
            class="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-300"
          >
            <div class="flex items-center justify-between gap-4">
              <span class="text-xl font-bold"
                >문제 {{ currentProblem.number }}</span
              >
              <span class="text-xl font-bold text-gray-900">
                {{ examResultStore.currentProblem.title }}
              </span>
            </div>

            <Button
              :label="'다시 풀 문제'"
              icon="pi pi-flag"
              size="small"
              severity="secondary"
              :class="[
                'text-sm',
                againViewProblems.includes(currentProblem?.id)
                  ? '!bg-orange-3 !text-orange-500'
                  : 'text-white bg-navy-4',
              ]"
              @click="toggleProblemStatus"
            />
          </div>

          <div id="viewer" class="text-gray-700 min-h-4 mb-10 w-full"></div>

          <div v-if="currentProblem.image_src" class="flex justify-center mb-6">
            <img
              :src="currentProblem.image_src"
              :alt="`문제 ${currentProblem.number} 이미지`"
              loading="lazy"
              class="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>

          <div
            v-if="currentProblem.problem_type === 'multiple_choice'"
            class="space-y-4"
          >
            <ol class="list-decimal text-gray-700">
              <li
                v-if="currentProblem.options[0]"
                class="flex items-center gap-2 mb-8 last:mb-0"
              >
                <span
                  class="font-medium text-lg rounded-full bg-black-6 w-8 h-8 item-middle"
                  >1</span
                >
                <span>{{ currentProblem.options[0] }}</span>
              </li>
              <li
                v-if="currentProblem.options[1]"
                class="flex items-center gap-2 mb-8 last:mb-0"
              >
                <span
                  class="font-medium text-lg rounded-full bg-black-6 w-8 h-8 item-middle"
                  >2</span
                >
                <span>{{ currentProblem.options[1] }}</span>
              </li>
              <li
                v-if="currentProblem.options[2]"
                class="flex items-center gap-2 mb-8 last:mb-0"
              >
                <span
                  class="font-medium text-lg rounded-full bg-black-6 w-8 h-8 item-middle"
                  >3</span
                >
                <span>{{ currentProblem.options[2] }}</span>
              </li>
              <li
                v-if="currentProblem.options[3]"
                class="flex items-center gap-2 mb-8 last:mb-0"
              >
                <span
                  class="font-medium text-lg rounded-full bg-black-6 w-8 h-8 item-middle"
                  >4</span
                >
                <span>{{ currentProblem.options[3] }}</span>
              </li>
            </ol>
          </div>

          <div class="mt-8">
            <h3 class="font-bold text-lg mb-2">내 선택</h3>
            <div class="flex items-center gap-4 border-b pb-4">
              <template v-if="currentProblem">
                <div
                  class="font-medium w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-black"
                >
                  {{ selectedMyOption }}
                </div>

                <span
                  v-if="selectedStatus && selectedStatus.status === 'corrected'"
                  class="text-green-500"
                >
                  정답
                </span>
                <span
                  v-else-if="
                    selectedStatus && selectedStatus.status === 'wrong'
                  "
                  class="text-[#F60505]"
                >
                  오답
                </span>
                <p v-else class="text-gray-800 flex-grow">
                  아직 답안을 선택하지 않았습니다.
                </p>
              </template>
            </div>
          </div>

          <div class="mt-4">
            <h3 class="font-bold text-lg mb-3">정답</h3>
            <div class="flex items-start gap-3">
              <span
                class="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-3 text-red-1 font-bold"
                :class="{
                  'w-10 h-10': currentProblem.answer >= 10,
                  'text-sm': currentProblem.answer >= 10,
                }"
              >
                {{ currentProblem.answer }}
              </span>

              <div class="flex-1">
                <p class="text-gray-800 font-medium leading-relaxed">
                  {{ currentProblem.options[currentProblem.answer - 1] }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="currentProblem.explanation"
            class="bg-gray-50 p-4 mt-4 rounded-lg"
          >
            <h3 class="font-bold text-lg mb-2 text-gray-700">상세 풀이</h3>
            <div
              id="explanationViewer"
              class="text-gray-600 leading-relaxed"
            ></div>

            <!-- AI 해설 섹션 추가 -->
            <div class="mt-8 border-t border-gray-200 pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg text-gray-700">AI 해설</h3>
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
                <div class="whitespace-pre-wrap text-gray-600">
                  {{ gptExplanation }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-10 text-gray-500">
        표시할 문제가 없습니다
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 다시 풀 문제 활성 상태 */
.again-view-active {
  background-color: #f1a140 !important;
  color: #ffffff !important;
  border-color: transparent !important;
}

/* 다시 풀 문제 비활성 상태 */
.again-view-inactive {
  background-color: #8992b5 !important;
  color: #ffffff !important;
  border-color: transparent !important;
}

:deep(.toastui-editor-contents) {
  font-family: "Pretendard";
}
:deep(p) {
  font-size: 16px;
}
</style>
