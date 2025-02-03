<script setup>
import { useAuthStore } from "@/store/authStore";
import { useExamResultStore } from "@/store/ExamResultStore";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
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
  <header class="w-full pt-20 pb-10 h-full">
    <div class="flex items-center w-fit gap-8 mx-auto">
      <div class="flex items-center gap-8 mr-[30rem]">
        <div class="flex flex-col items-center justify-center space-y-1">
          <img
            :src="profileImage"
            alt="Profile"
            class="rounded-full w-32 h-32 object-cover"
          />
          <span class="font-bold text-base pt-2">{{ userName }}</span>
          <span class="text-sm text-gray-500">{{ userEmail }}</span>
        </div>
        <div class="pb-16 space-y-1">
          <h1 class="text-xl font-semibold">{{ workbookTitle }} 시험장</h1>
          <p class="font-laundry text-3xl font-semibold">시험 결과 리포트</p>
          <p class="text-sm text-gray-500">
            시험 결과 리포트는 지난 시험에서 다시 확인 할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped></style>
