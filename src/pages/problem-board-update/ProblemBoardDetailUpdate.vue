<script setup>
// Components
import ProblemBoardUpdateHeader from "./components/ProblemBoardUpdateHeader.vue";
import ProblemBoardUpdateContent from "./components/ProblemBoardUpdateContent.vue";
import ProblemBoardUpdateSolution from "./components/ProblemBoardUpdateSolution.vue";

// Prime Vue
import { ConfirmDialog } from "primevue";

// Store
import { useProblemStore } from "@/store/problemStore";
import { useProblemUpdateStore } from "@/store/problemUpdateStore";

// Vue Core
import { useRoute } from "vue-router";
import { watch, watchEffect } from "vue";

const route = useRoute();
const problemStore = useProblemStore();
const problemUpdateStore = useProblemUpdateStore();

// 라우트 파라미터 변경 감지 및 데이터 로드
watchEffect(async () => {
  const problemId = route.params.problemId;
  if (!problemId) return;

  try {
    await Promise.all([
      problemStore.loadProblem(problemId),
      problemUpdateStore.loadProblem(problemId),
    ]);
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
});

// problemId가 변경될 때마다 스토어 초기화
watch(
  () => route.params.problemId,
  () => problemUpdateStore.resetStore(),
  { immediate: true },
);
</script>

<template>
  <div class="max-w-4xl p-6 mx-auto">
    <ProblemBoardUpdateHeader
      :problem="problemStore.problem"
      :author="problemStore.author"
      :hasLiked="problemStore.hasLiked"
      :likeCount="likeCount"
      @toggle-like="handleToggleLike"
      @menu-action="handleMenuAction"
    />

    <ProblemBoardUpdateContent :problem="problemStore.problem" />

    <ProblemBoardUpdateSolution
      :answer="problemStore.problem?.answer"
      :explanation="problemStore.problem?.explanation"
      :source="problemStore.problem?.origin_source"
    />
  </div>
  <ConfirmDialog />
</template>
