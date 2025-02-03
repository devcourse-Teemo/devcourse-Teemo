<script setup>
import { ref, watch, watchEffect } from "vue";
import { useAuthStore } from "@/store/authStore";
import { commentAPI } from "@/api/comment";
import { formatDateForComment } from "@/utils/formatDateForComment";
import { supabase } from "@/api/index.js";
import { useToast } from "primevue/usetoast";
import { RouterLink } from "vue-router";
import { Paginator } from "primevue";
import { useConfirm } from "primevue/useconfirm";

const toast = useToast();
const props = defineProps({
  comments: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  totalComments: {
    type: Number,
    required: true,
  },
  value: {
    type: String,
    default: "",
  },
  problemId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "update:value",
  "submit-comment",
  "page-change",
  "comment-change",
]);

const authStore = useAuthStore();
const userId = ref(authStore.user?.id);
const formattedComments = ref([]);
const editingCommentId = ref(null);
const editingContent = ref("");
const textareaValue = ref("");
const confirm = useConfirm();

const isCommentAuthor = (commentUid) => {
  return commentUid === authStore.user?.id;
};

watch(
  () => authStore.user,
  (newUser) => {
    userId.value = newUser?.id;
  },
  { immediate: true },
);

const getUserProfile = async (uid) => {
  const { data, error } = await supabase
    .from("user_info")
    .select("avatar_url, name")
    .eq("id", uid)
    .single();

  if (error) {
    console.error("프로필 로딩 실패:", error);
    return { avatar_url: "", name: "Unknown" };
  }
  return data;
};

watchEffect(async () => {
  if (props.comments) {
    const formattedNewComments = await Promise.all(
      props.comments.map(async (comment) => {
        const userProfile = await getUserProfile(comment.uid);
        return {
          ...comment,
          avatar_url: userProfile.avatar_url,
          name: userProfile.name,
          formattedDate: formatDateForComment(new Date(comment.created_at)),
        };
      }),
    );
    formattedComments.value = formattedNewComments;
  }
});

const handleKeyPress = async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await handleSubmitComment();
  }
};

const handleSubmitComment = async () => {
  if (!textareaValue.value.trim()) return;
  if (!authStore.user?.id) {
    toast.add({
      severity: "error",
      summary: "로그인 필요",
      detail: "댓글을 작성하려면 로그인이 필요합니다.",
      life: 3000,
    });
    return;
  }

  if (textareaValue.value.length > 500) {
    toast.add({
      severity: "error",
      summary: "글자 수 초과",
      detail: "댓글은 500자를 초과할 수 없습니다.",
      life: 3000,
    });
    return;
  }

  try {
    await commentAPI.createComment({
      problem_id: props.problemId,
      comment: textareaValue.value,
      uid: userId.value,
    });

    textareaValue.value = "";
    emit("comment-change");

    toast.add({
      severity: "success",
      summary: "댓글 작성 완료",
      detail: "댓글이 등록되었습니다.",
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

const handleDeleteComment = async (id) => {
  confirm.require({
    message: "정말 댓글을 삭제하시겠습니까?",
    header: "댓글 삭제 확인",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "삭제",
    rejectLabel: "취소",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    accept: async () => {
      try {
        await commentAPI.deleteComment(id);
        emit("comment-change");

        toast.add({
          severity: "success",
          summary: "삭제 완료",
          detail: "댓글이 삭제되었습니다.",
          life: 3000,
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast.add({
          severity: "error",
          detail: "댓글 삭제 중 오류가 발생했습니다.",
          life: 3000,
        });
      }
    },
  });
};

const handleEditComment = (comment) => {
  editingCommentId.value = comment.id;
  editingContent.value = comment.comment;
};

const handleEditSubmit = async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (editingContent.value.length > 500) {
      toast.add({
        severity: "error",
        summary: "글자 수 초과",
        detail: "댓글은 500자를 초과할 수 없습니다.",
        life: 3000,
      });
      return;
    }

    try {
      const response = await commentAPI.updateComment(editingCommentId.value, {
        comment: editingContent.value,
      });

      if (response) {
        editingCommentId.value = null;
        editingContent.value = "";
        emit("comment-change");

        toast.add({
          severity: "success",
          summary: "수정 완료",
          detail: "댓글이 수정되었습니다.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Edit error:", error);
      toast.add({
        severity: "error",
        detail: "댓글 수정 중 오류가 발생했습니다.",
        life: 3000,
      });
    }
  }
};

const handleEditCancel = (event) => {
  if (event.key === "Escape") {
    editingCommentId.value = null;
    editingContent.value = "";
  }
};

const onPageChange = (event) => {
  emit("page-change", event.page);
};
</script>

<template>
  <div class="w-full max-w-full">
    <div v-if="isLoading" class="flex justify-center py-4">
      <i class="pi pi-spinner pi-spin"></i>
    </div>

    <div v-else class="w-full max-w-full">
      <div class="flex items-center gap-2 mb-6">
        <h3 class="text-gray-700 text-2xl">댓글</h3>
        <strong class="text-gray-700 text-xl">{{ totalComments }}</strong>
      </div>

      <div v-if="!comments?.length" class="text-center text-gray-500 py-4 mb-8">
        첫 번째 댓글을 작성해보세요.
      </div>

      <div
        v-else
        v-for="comment in formattedComments"
        :key="comment.id"
        class="mb-10 max-w-full break-words"
      >
        <div class="flex justify-between items-center mb-2">
          <RouterLink
            :to="{ name: 'UserProfile', params: { userId: comment.uid } }"
            aria-label="유저 프로필"
            class="inline-flex items-center gap-2 w-fit"
          >
            <img :src="comment.avatar_url" class="rounded-full w-7 h-7" />
            <span class="font-bold">{{ comment.name }}</span>
            <span class="text-gray-400 text-sm">{{
              comment.formattedDate
            }}</span>
          </RouterLink>

          <div
            v-if="isCommentAuthor(comment.uid)"
            class="flex gap-2 flex-shrink-0"
          >
            <button
              class="w-8 h-8 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
              @click="handleEditComment(comment)"
            >
              <i class="pi pi-pencil text-gray-400"></i>
            </button>
            <button
              class="w-8 h-8 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
              @click="handleDeleteComment(comment.id)"
            >
              <i class="pi pi-trash text-gray-400"></i>
            </button>
          </div>
        </div>

        <textarea
          v-if="editingCommentId === comment.id"
          v-model="editingContent"
          @keypress="handleEditSubmit"
          @keydown.esc="handleEditCancel"
          maxlength="500"
          class="w-full min-h-[80px] resize-none pt-3 px-4 rounded-lg text-sm bg-gray-100 border border-gray-300"
        ></textarea>
        <p v-else class="text-gray-500 break-words">{{ comment.comment }}</p>
      </div>
    </div>

    <textarea
      v-model="textareaValue"
      @keypress="handleKeyPress"
      maxlength="500"
      class="w-full max-w-full h-32 resize-none pt-3 px-6 rounded-lg text-sm bg-gray-100 border border-gray-300"
      placeholder="문제집에 대해 어떻게 생각하시나요?"
    ></textarea>

    <Paginator
      v-if="totalPages > 1"
      :rows="10"
      :totalRecords="totalComments"
      :first="(currentPage - 1) * 10"
      @page="onPageChange"
      class="mt-4"
    />
  </div>
</template>
