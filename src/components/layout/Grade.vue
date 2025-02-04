<script setup>
// APIs
import { userAPI } from "@/api/user";

// PrimeVue
import { ProgressBar } from "primevue";

// Utils
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";

// Vue Core
import { ref, watchEffect } from "vue";

const { userId } = defineProps({
  userId: String,
});

const points = ref(0);
const gradeInfo = ref();

const getUserPoint = async () => {
  if (!userId) return;
  const { total_points } = await userAPI.getOne(userId);
  points.value = total_points;
  gradeInfo.value = getCurrentGradeInfo(total_points);
};

watchEffect(() => {
  getUserPoint();
});
</script>
<template>
  <div
    class="flex justify-between w-full h-56 px-8 py-6 bg-beige-2 rounded-2xl"
  >
    <div class="flex flex-col justify-between">
      <div>
        <p class="mb-8 text-2xl font-semibold text-black-2">
          현재 등급은
          <span>"</span>
          <span class="text-orange-1">
            {{ gradeInfo?.current?.name }}
          </span>
          <span>"</span>
        </p>
        <p class="text-lg">
          현재 포인트
          <span class="ml-1 font-semibold text-orange-1">{{ points }}</span>
        </p>
        <ProgressBar
          class="min-w-[30rem] min-h-10"
          :value="(points / gradeInfo?.next?.point) * 100"
          v-tooltip.top="`${points} / ${gradeInfo?.next?.point}`"
          type="text"
        >
          {{}}
        </ProgressBar>
      </div>
      <div class="flex items-center gap-4">
        <p class="flex gap-2 text-sm">
          <span class="font-semibold">현재 권한:</span>
          <span>시험장 {{ gradeInfo?.current?.examLimit }}개</span>
          <span>|</span>
          <span>문제집 {{ gradeInfo?.current?.problemSetLimit }}개</span>
        </p>
        <span class="pi pi-arrow-right" style="font-size: 14px"></span>
        <p class="flex gap-2 text-sm">
          <span class="font-semibold">다음 권한:</span>
          <span>시험장 {{ gradeInfo?.next?.examLimit }}개</span>
          <span>|</span>
          <span>문제집 {{ gradeInfo?.next?.problemSetLimit }}개</span>
        </p>
      </div>
    </div>
    <img :src="gradeInfo?.current?.imgSrc" alt="초보" />
  </div>
</template>
<style></style>
