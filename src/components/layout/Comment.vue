<script setup>
import { ref, onMounted, nextTick } from "vue";

import { authAPI } from "@/api/auth";
import { commentAPI } from "@/api/comment";
import { formatDateForComment } from "@/utils/formatDateForComment";
import { RouterLink } from "vue-router";
import { supabase } from "@/api";

const { comment } = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

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
    await commentAPI.updateComment(comment.id, {
      comment: text.value,
      updated_at: new Date().toISOString(),
    });
    emit("comment-change");
  }

  // 편집 모드가 활성화될 때 높이 조절
  await nextTick();
  adjustTextareaHeight();
};

const commentDelete = async () => {
  const realDelete = confirm("정말 삭제하시겠습니까?");
  if (realDelete) {
    isVisible.value = false;
    await commentAPI.deleteComment(comment.id);
    emit("comment-change");
  }
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

// 입력 이벤트 처리 함수 (글자 수 제한)
const handleInput = () => {
  // 입력된 글자 수 체크
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
          class="flex items-center gap-2 flex-grow"
        >
          <img
            :src="avatar_url"
            alt="사용자 프로필 사진"
            class="rounded-full w-7 h-7"
          />
          <div class="text-[16px] font-bold">{{ comment.user_name }}</div>
        </RouterLink>

        <div class="text-[12px] text-[#b1b1b1] ml-[5px] mt-[1px]">
          {{ formatDateForComment(new Date(comment.updated_at)) }}
        </div>
      </div>

      <div class="flex w-[72px] justify-between" v-if="userId === commentUid">
        <button
          @click="commentUpdate"
          class="w-8 h-8 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
        >
          <i class="pi pi-pencil text-gray-400"></i>
        </button>

        <button
          @click="commentDelete"
          class="w-8 h-8 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
        >
          <i class="pi pi-trash text-gray-400"></i>
        </button>
      </div>
    </div>
    <div>
      <textarea
        ref="textareaRef"
        v-model="text"
        @input="handleInput"
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
