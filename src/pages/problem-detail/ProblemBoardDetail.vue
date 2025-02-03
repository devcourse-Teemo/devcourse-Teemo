<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Dialog, Button } from "primevue";
import { useProblemStore } from "@/store/problemStore";
import { useAuthStore } from "@/store/authStore";
import { problemLikeAPI } from "@/api/problemLike";
import { commentAPI } from "@/api/comment";
import { useToast } from "primevue/usetoast";

import ProblemHeader from "./components/ProblemHeader.vue";
import ProblemContent from "./components/ProblemContent.vue";
import ProblemSolution from "./components/ProblemSolution.vue";
import CommentList from "../problem-set-detail/components/CommentList.vue";
import { problemAPI } from "@/api/problem";
import ConfirmModal from "@/components/layout/ConfirmModal.vue";

const itemsPerPage = 10;

const route = useRoute();
const router = useRouter();
const problemStore = useProblemStore();
const authStore = useAuthStore();
const toast = useToast();

// 상태 관리
const showConfirmDialog = ref(false);
const hasLiked = ref(false);
const likeCount = ref(0);

// 댓글 관련 상태
const comments = ref([]);
const isLoadingComments = ref(false);
const currentPage = ref(1);
const totalRecords = ref(0);

// 댓글 불러오기
const fetchComments = async (page = 1) => {
  try {
    isLoadingComments.value = true;

    const response = await commentAPI.problemCommentInfo(
      route.params.problemId,
      page,
      itemsPerPage,
    );

    comments.value = response.data;
    totalRecords.value = response.totalCount;
  } catch (error) {
    console.error("댓글 로딩 실패:", error);
  } finally {
    isLoadingComments.value = false;
  }
};

// 페이지 변경 핸들러
const handlePageChange = async (newPage) => {
  currentPage.value = newPage;
  await fetchComments(newPage);
};

// 좋아요 토글
const handleToggleLike = async () => {
  if (!authStore.user?.id) {
    alert("로그인이 필요한 기능입니다.");
    return;
  }

  try {
    await problemLikeAPI.add(
      authStore.user.id,
      parseInt(route.params.problemId),
    );
    hasLiked.value = !hasLiked.value;
    likeCount.value = hasLiked.value
      ? likeCount.value + 1
      : likeCount.value - 1;
  } catch (error) {
    console.error("좋아요 토글 실패:", error);
  }
};

// 메뉴 액션 처리
const handleMenuAction = (action) => {
  switch (action) {
    case "edit":
      router.push(`/problem-board-update/${route.params.problemId}`);
      break;
    case "delete":
      showConfirmDialog.value = true;
      break;
    default:
      break;
  }
};

const handleDelete = async () => {
  try {
    await problemAPI.deleteOne(route.params.problemId);
    toast.add({
      severity: "success",
      summary: "삭제 완료",
      detail: "문제가 삭제되었습니다.",
      life: 3000,
    });
    router.push("/problem-board"); // 변경된 리디렉션 경로
  } catch (error) {
    console.error("문제 삭제 실패:", error);
    toast.add({
      severity: "error",
      summary: "오류",
      detail: "문제 삭제 중 오류가 발생했습니다.",
      life: 3000,
    });
  } finally {
    showConfirmDialog.value = false;
  }
};

// 초기 데이터 로딩
onMounted(async () => {
  await Promise.all([
    problemStore.loadProblem(route.params.problemId),
    fetchComments(1),
  ]);
});
</script>

<template>
  <div class="max-w-4xl p-6 mx-auto">
    <ProblemHeader
      :problem="problemStore.problem"
      :author="problemStore.author"
      :hasLiked="problemStore.hasLiked"
      :likeCount="likeCount"
      @toggle-like="handleToggleLike"
      @menu-action="handleMenuAction"
    />

    <ProblemContent :problem="problemStore.problem" />

    <ProblemSolution
      :title="problemStore.problem?.title"
      :question="problemStore.problem?.question"
      :answer="problemStore.problem?.answer"
      :explanation="problemStore.problem?.explanation"
      :source="problemStore.problem?.origin_source"
      :options="{
        option_one: problemStore.problem?.option_one,
        option_two: problemStore.problem?.option_two,
        option_three: problemStore.problem?.option_three,
        option_four: problemStore.problem?.option_four,
      }"
    />

    <CommentList
      :comments="comments"
      :problemId="route.params.problemId"
      :totalRecords="totalRecords"
      :currentPage="currentPage"
      :itemsPerPage="itemsPerPage"
      @page-change="handlePageChange"
      @comment-change="fetchComments"
    />

    <!-- 삭제 확인 다이얼로그 -->
    <Dialog
      v-model:visible="showConfirmDialog"
      header="삭제 확인"
      :modal="true"
    >
      <p>정말로 이 게시물을 삭제하시겠습니까?</p>
      <template #footer>
        <Button
          label="취소"
          severity="secondary"
          @click="showConfirmDialog = false"
        />
        <Button label="삭제" severity="danger" @click="handleDelete" />
      </template>
    </Dialog>
    <ConfirmModal group="delete" acceptButtonName="제거" />
  </div>
</template>
