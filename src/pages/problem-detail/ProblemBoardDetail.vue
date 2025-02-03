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
import CommentList from "./components/CommentList.vue";
import { problemAPI } from "@/api/problem";
import { ConfirmDialog } from "primevue";

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
const totalPages = ref(0);
const commentValue = ref("");
const commentCount = ref(0);

// 댓글 불러오기
const fetchComments = async (page = currentPage.value) => {
  try {
    isLoadingComments.value = true;
    const response = await commentAPI.getComments({
      problem_id: parseInt(route.params.problemId),
      page,
      pageSize: 10,
    });

    comments.value = response.data;
    currentPage.value = response.currentPage;
    totalPages.value = response.totalPages;
    commentCount.value = response.count; // 전체 댓글 수 저장
  } catch (error) {
    console.error("댓글 로딩 실패:", error);
  } finally {
    isLoadingComments.value = false;
  }
};

// 댓글 작성
const handleSubmitComment = async () => {
  if (!commentValue.value.trim()) return;

  try {
    await commentAPI.createComment({
      problem_id: parseInt(route.params.problemId),
      content: commentValue.value,
      uid: authStore.user.id,
    });

    commentValue.value = "";
    await fetchComments(currentPage.value); // 현재 페이지 새로고침
    toast.add({
      severity: "success",
      summary: "댓글 작성 완료",
      detail: "댓글이 성공적으로 등록되었습니다.",
      life: 3000,
    });
  } catch (error) {
    console.error("댓글 작성 실패:", error);
    toast.add({
      severity: "error",
      detail: "댓글 작성 중 오류가 발생했습니다.",
      life: 3000,
    });
  }
};

// 페이지 변경 핸들러
const handlePageChange = (page) => {
  fetchComments(page + 1);
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
  <div class="max-w-4xl mx-auto p-6">
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
      :answer="problemStore.problem?.answer"
      :explanation="problemStore.problem?.explanation"
      :source="problemStore.problem?.origin_source"
    />

    <CommentList
      :comments="comments"
      :isLoading="isLoadingComments"
      :currentPage="currentPage"
      :totalPages="totalPages"
      :totalComments="commentCount"
      :problemId="route.params.problemId"
      v-model:value="commentValue"
      @submit-comment="handleSubmitComment"
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
    <ConfirmDialog />
  </div>
</template>
