<script setup>
import { RouterLink } from "vue-router";
import { ref, onMounted, nextTick } from "vue";
import { useConfirm, useToast } from "primevue";

import { supabase } from "@/api";
import { authAPI } from "@/api/auth";
import { commentAPI } from "@/api/comment";
import { formatDateForComment } from "@/utils/formatDateForComment";

const { comment } = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

const toast = useToast();
const confirm = useConfirm();
const emit = defineEmits(["comment-change"]);

const text = ref(null);
const userId = ref(null);
const isReadOnly = ref(true);
const commentUid = ref(null);
const isVisible = ref(true);
const avatar_url = ref(null);
const textareaRef = ref(null);

const maxLength = 500; // 최대 글자 수

const commentUpdate = async () => {
  isReadOnly.value = !isReadOnly.value;

  if (isReadOnly.value) {
    if (comment.comment === text.value) {
      return;
    }
    await commentAPI.updateComment(comment.id, {
      comment: text.value,
      updated_at: new Date().toISOString(),
    });
    emit("comment-change");
    toast.add({
      severity: "success",
      summary: "댓글 수정",
      detail: "댓글이 수정 되었습니다.",
      life: 3000,
    });
  }

  // 편집 모드가 활성화될 때 높이 조절
  await nextTick();
  adjustTextareaHeight();
};

const commentDelete = async () => {
  console.log(comment.id);

  confirm.require({
    group: "delete",
    header: "해당 댓글을 제거 하시겠습니까?",
    message: "댓글을 제거하시려면 '제거' 버튼을 클릭하세요",
    accept: async () => {
      isVisible.value = false;
      await commentAPI.deleteComment(comment.id);
      emit("comment-change");
      toast.add({
        severity: "success",
        summary: "댓글 삭제",
        detail: "댓글이 삭제 되었습니다.",
        life: 3000,
      });
    },
    reject: () => {},
  });
};

const getUserProfile = async (uid) => {
  const { data, error } = await supabase
    .from("user_info")
    .select("avatar_url")
    .eq("id", uid)
    .single();

  if (error) {
    console.error("프로필 로딩 실패:", error);
    return { avatar_url: "", name: "Unknown" };
  }

  return data;
};

// 높이 자동 조절 함수
const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto"; // 초기화
    textareaRef.value.style.height = textareaRef.value.scrollHeight + "px"; // 실제 높이로 설정
  }
};

const handleInput = async () => {
  if (text.value.length > maxLength) {
    text.value = text.value.slice(0, maxLength); // 500자 초과 시 자른다
  }

  // 높이 조정
  adjustTextareaHeight();
};

onMounted(async () => {
  const userinfo = await authAPI.getCurrentUser();
  userId.value = userinfo.id;
  commentUid.value = comment.uid;
  text.value = comment.comment;

  const userProfile = await getUserProfile(comment.uid);
  avatar_url.value = userProfile.avatar_url;

  await nextTick();
  adjustTextareaHeight();
});
</script>

<template>
  <div class="mb-3" v-if="isVisible">
    <div class="flex justify-between">
      <div class="flex items-center mb-1">
        <RouterLink
          :to="{ name: 'UserProfile', params: { userId: comment.uid } }"
          aria-label="유저 프로필"
          class="flex items-center flex-grow gap-2"
        >
          <img
            :src="avatar_url"
            alt="사용자 프로필 사진"
            class="rounded-full w-7 h-7"
          />
          <div class="text-[16px] font-bold">{{ comment.name }}</div>
        </RouterLink>

        <div class="text-[12px] text-[#b1b1b1] ml-[5px] mt-[1px]">
          {{ formatDateForComment(new Date(comment.updated_at)) }}
        </div>
      </div>

      <div class="flex w-[72px] justify-between" v-if="userId === commentUid">
        <button
          @click="commentUpdate"
          class="flex items-center justify-center w-8 h-8 transition rounded-full hover:bg-gray-200"
        >
          <i class="text-gray-400 pi pi-pencil"></i>
        </button>

        <button
          @click="commentDelete"
          class="flex items-center justify-center w-8 h-8 transition rounded-full hover:bg-gray-200"
        >
          <i class="text-gray-400 pi pi-trash"></i>
        </button>
      </div>
    </div>
    <div>
      <textarea
        ref="textareaRef"
        v-model="text"
        @input="handleInput"
        @keydown.enter.exact="commentUpdate"
        :class="
          isReadOnly
            ? 'text-gray-500 resize-none w-full overflow-hidden'
            : 'text-gray-500 resize-none border border-solid border-black w-full '
        "
        :readonly="isReadOnly"
      ></textarea>
    </div>
  </div>
</template>
