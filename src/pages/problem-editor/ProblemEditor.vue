<script setup>
// APIs
import { problemAPI } from "@/api/problem";

// Components
import ProblemEditorMain from "./components/ProblemEditorMain.vue";
import ProblemEditorLists from "./components/ProblemEditorLists.vue";
import ProblemEditorGuide from "./components/ProblemEditorGuide.vue";
import ProblemEditorHeader from "./components/ProblemEditorHeader.vue";

// PrimeVue
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";

// Store
import { storeToRefs } from "pinia";

import { useCreateProblemStore } from "@/store/createProblemStore";

// Vue Core
import { useRouter } from "vue-router";
import { ref, toRaw, watch, nextTick } from "vue";

const toast = useToast();
const router = useRouter();
const confirm = useConfirm();
const isSubmitClicked = ref(false);

const createProblemStore = useCreateProblemStore();
const { targetProblem, createdProblems } = storeToRefs(createProblemStore);

const deleteProblem = () => {
  confirm.require({
    message: "정말로 문제를 삭제하시겠습니까?",
    header: "문제 삭제 확인",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "삭제",
    rejectLabel: "취소",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    accept: () => {
      createProblemStore.deleteProblem();
    },
  });
};

const submitProblems = async () => {
  isSubmitClicked.value = true;

  const hasInvalidProblems = createdProblems.value.problemLists.some(
    (problem) => !problem.isValid,
  );

  if (hasInvalidProblems || createdProblems.value.problemLists.length === 0) {
    toast.add({
      severity: "error",
      summary: "문제 생성 실패",
      detail:
        "필수 항목이 누락되어 제출할 수 없습니다.\n필수항목 누락 여부를 확인해주세요.",
      life: 4000,
    });
    return;
  }

  const workbookId = createdProblems.value.folder.id;

  const uploadPromises = createdProblems.value.problemLists.map(
    async (problem, idx) => {
      try {
        const categoryRaw = toRaw(problem.category);

        const problemForSubmission = {
          title: problem?.title || "",
          question: problem?.question || "",
          answer: problem?.answer || "",
          explanation: problem?.explanation || "",
          origin_source: problem?.origin_source || "",
          problem_type: problem?.type === "4지선다" ? "multiple_choice" : "ox",
          category_id: categoryRaw[0]?.id || 0,
          option_one: problem?.option_one || null,
          option_two: problem?.option_two || null,
          option_three: problem?.option_three || null,
          option_four: problem?.option_four || null,
          shared: true,
        };

        await problemAPI.add(workbookId, problemForSubmission);
        return {
          success: true,
          problemTitle: problem?.title || `문제 ${idx + 1}`,
        };
      } catch (error) {
        console.error(
          `문제 제출 실패 (제목: ${problem?.title || "제목 없음"}):`,
          error,
        );
        return {
          success: false,
          problemTitle: problem?.title || `문제 ${idx + 1}`,
        };
      }
    },
  );

  try {
    const uploadResults = await Promise.allSettled(uploadPromises);

    // 실패한 문제 찾기
    const failedProblems = uploadResults
      .filter(
        (result) => result.status === "fulfilled" && !result.value.success,
      )
      .map((result) => result.value.problemTitle);

    if (failedProblems.length > 0) {
      throw new Error(
        ` ${
          failedProblems.length
        }개의 문제가 제출되지 않았습니다: ${failedProblems.join(", ")}`,
      );
    }

    toast.add({
      severity: "success",
      summary: "문제 제출 완료",
      detail: "모든 문제가 성공적으로 제출되었습니다!",
      life: 4000,
    });
    router.push("/my-problems");
    createProblemStore.$reset();
    sessionStorage.removeItem("createProblem");
  } catch (error) {
    console.error("문제 업로드 중 오류 발생:", error);
    toast.add({
      severity: "error",
      summary: "문제 제출 중 오류 발생",
      detail:
        error.message || "서버 오류가 발생했습니다. 나중에 다시 시도해주세요.",
      life: 5000,
    });
  }
};

const onGoingBack = () => {
  window.history.length > 2 ? router.go(-1) : router.push("/");
};

// 새로운 문제로 이동시 -> 스크롤 상단 고정
watch(
  () => targetProblem.idx,
  async () => {
    await nextTick(); // Vue가 DOM을 업데이트할 때까지 기다림
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); // 상단으로 스크롤 이동
  },
);
</script>
<template>
  <div class="flex flex-col w-full h-screen">
    <!-- Confirm 창 -->
    <ConfirmDialog />
    <ProblemEditorHeader
      @submit-problems="submitProblems"
      @on-going-back="onGoingBack"
    />
    <div class="flex flex-row flex-grow w-screen h-min-screen">
      <ProblemEditorLists class="w-2/12" />
      <ProblemEditorMain
        v-if="targetProblem.idx !== -1"
        :key="targetProblem.idx"
        @delete-problem="deleteProblem"
      />
      <ProblemEditorGuide v-else />
    </div>
  </div>
</template>
<style></style>
