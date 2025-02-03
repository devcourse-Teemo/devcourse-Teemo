<script setup>
import { ref, onMounted } from "vue";
import { Paginator, useToast } from "primevue";
import Comment from "@/components/layout/Comment.vue";
import { commentAPI } from "@/api/comment";
import { authAPI } from "@/api/auth";

const props = defineProps({
  comments: {
    type: Array,
    required: true,
  },
  workbookId: {
    type: [String, Number],
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  totalRecords: {
    type: Number,
    required: true,
  },
  itemsPerPage: {
    type: Number,
    required: true,
  },
});

const toast = useToast();
const emit = defineEmits(["page-change", "comment-change"]);
const text = ref("");
const userId = ref(null);

const onCommentChange = () => {
  emit("comment-change");
};

const onPageChange = (event) => {
  emit("page-change", event.page + 1);
};

const handleKeyPress = async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await handleSubmitComment();
    emit("comment-change");
  }
};
const handleSubmitComment = async () => {
  if (!text.value.trim()) return;
  await commentAPI.createComment({
    workbook_id: props.workbookId,
    comment: text.value,
    uid: userId.value,
  });

  toast.add({
    severity: "info",
    summary: "댓글 작성 포인트 지급",
    detail: "댓글 작성으로 2포인트를 획득했습니다.",
    life: 3000,
  });

  text.value = "";
};

onMounted(async () => {
  const userinfo = await authAPI.getCurrentUser();
  userId.value = userinfo.id;
});
</script>
<template>
  <div class="flex flex-col w-full">
    <h3 class="text-2xl text-gray-700 mb-6">댓글</h3>

    <div class="w-full">
      <Comment
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        @comment-change="onCommentChange"
      />
    </div>

    <textarea
      v-model="text"
      @keypress="handleKeyPress"
      class="w-full h-[133px] resize-none pt-3 px-6 rounded-lg pretend text-[14px] bg-[#f0f0f0] border-[#d4d4d4]"
      placeholder="문제집에 대해 어떻게 생각하시나요?"
    ></textarea>
  </div>
  <Paginator
    :rows="itemsPerPage"
    :totalRecords="totalRecords"
    :first="(currentPage - 1) * itemsPerPage"
    @page="onPageChange"
  />
</template>
<style scoped></style>
