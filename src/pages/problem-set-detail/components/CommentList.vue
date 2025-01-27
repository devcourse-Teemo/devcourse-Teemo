<script setup>
import { ref, onMounted, watch } from "vue";
import { Paginator } from "primevue";
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
  text.value = "";
};

onMounted(async () => {
  const userinfo = await authAPI.getCurrentUser();
  userId.value = userinfo.id;
});
</script>
<template>
  <div class="flex flex-col w-full">
    <div class="text-[24px] text-[#6A718B]">댓글</div>

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
