<script setup>
// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";
import { useExamResultStore } from "@/store/ExamResultStore";

// Vue Core
import { useRoute } from "vue-router";
import { computed, watch } from "vue";

const authStore = useAuthStore();
const examResultStore = useExamResultStore();
const route = useRoute();
const testResultId = computed(() => route.params.examResultId);
const { user } = storeToRefs(authStore);
const { workbooks } = storeToRefs(examResultStore);

// 사용자 정보
const userName = computed(
  () => user.value?.user_metadata?.full_name || "사용자님",
);
const userEmail = computed(() => user.value?.email || "이메일 정보 없음");
const profileImage = computed(
  () => user.value?.user_metadata?.avatar_url || "@/assets/harp seal.jpg",
);

// 문제집 이름
const workbookTitle = computed(() => {
  return workbooks.value.length > 0 ? workbooks.value[0].title : "시험 제목"; // 기본값
});

async function initializeAuth() {
  if (!user.value) {
    try {
      await authStore.initializeAuth();
    } catch (error) {
      console.error("Failed to initialize auth:", error);
    }
  }
}

watch(
  testResultId,
  async (newTestResultId) => {
    if (newTestResultId) {
      try {
        await examResultStore.fetchAndStoreWorkbook(newTestResultId);
      } catch (error) {
        console.error("Failed to fetch workbook data:", error);
      }
    }
  },
  { immediate: true },
);

initializeAuth();
</script>
<template>
  <header class="w-full h-full pt-20 pb-10">
    <div class="flex items-center gap-8 mx-auto -translate-x-32 w-fit">
      <div class="flex items-center gap-8 mr-[23rem]">
        <div class="flex flex-col items-center justify-center space-y-1">
          <img
            :src="profileImage"
            alt="Profile"
            class="object-cover w-32 h-32 rounded-full"
          />
          <span class="pt-2 text-base font-bold">{{ userName }}</span>
          <span class="text-sm text-gray-500">{{ userEmail }}</span>
        </div>
        <div class="pb-16 space-y-1">
          <h1 class="text-xl font-semibold">{{ workbookTitle }} 시험장</h1>
          <p class="text-3xl font-semibold font-laundry">시험 결과 리포트</p>
          <p class="text-sm text-gray-500">
            시험 결과 리포트는 지난 시험에서 다시 확인 할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped></style>
