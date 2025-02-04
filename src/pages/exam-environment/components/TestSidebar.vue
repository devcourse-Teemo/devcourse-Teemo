<script setup>
// PrimeVue
import { Button, ConfirmDialog, useConfirm } from "primevue";

const { userAnswers, remainedTime } = defineProps({
  userAnswers: Array,
  remainedTime: Object,
});
const emit = defineEmits(["submitAnswers", "setCurrentProblemIndex"]);

const confirm = useConfirm();

const requireConfirmation = () => {
  confirm.require({
    group: "headless",
    header: "정말 제출하시겠습니까?",
    message: "제출하시려면 '제출' 버튼을 클릭하세요",
    accept: () => {
      emit("submitAnswers");
    },
    reject: () => {},
  });
};
</script>
<template>
  <aside
    class="sticky top-0 flex flex-col h-screen bg-white border-l min-w-72 w-72 border-black-4"
  >
    <div class="flex flex-col items-center justify-center h-16 bg-black-5">
      <p class="text-xl font-semibold">남은 시간</p>
    </div>
    <div class="flex items-center justify-center h-24">
      <div class="flex gap-4 text-3xl">
        <div class="flex flex-col items-center">
          <span>{{ remainedTime.hours }}</span>
          <span class="text-sm text-gray-3">시간</span>
        </div>
        <span class="text-gray-3">:</span>
        <div class="flex flex-col items-center">
          <span>{{ remainedTime.minutes }}</span>
          <span class="text-sm text-gray-3">분</span>
        </div>
        <span class="text-gray-3">:</span>
        <div class="flex flex-col items-center">
          <span>{{ remainedTime.seconds }}</span>
          <span class="text-sm text-gray-3">초</span>
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center h-16 bg-black-5">
      <p class="text-xl font-semibold">문제</p>
    </div>
    <div class="flex items-center justify-center gap-6 my-4">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-black-4"></div>
        <span class="text-sm">안 푼 문제</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-orange-1"></div>
        <span class="text-sm">푼 문제</span>
      </div>
    </div>

    <div class="grid h-full grid-cols-5 gap-2 auto-rows-max px-7">
      <button
        v-for="(userAnswer, index) in userAnswers"
        @click="emit('setCurrentProblemIndex', index)"
        type="button"
        :class="[
          'flex justify-center items-center w-10 h-10 rounded-l-lg rounded-tr-lg text-white',
          userAnswer ? 'bg-orange-1' : 'bg-black-4',
        ]"
      >
        {{ index + 1 }}
      </button>
    </div>

    <Button
      @click="requireConfirmation"
      label="제출하기"
      class="mx-auto mb-5 w-44 h-9"
      size="large"
      rounded
    />
    <ConfirmDialog group="headless">
      <template #container="{ message, acceptCallback, rejectCallback }">
        <div
          class="flex flex-col items-center px-20 py-8 rounded bg-surface-0 dark:bg-surface-900"
        >
          <span class="block mb-2 text-2xl font-bold">{{
            message.header
          }}</span>
          <p class="mb-0">{{ message.message }}</p>
          <div class="flex items-center gap-2 mt-6">
            <Button @click="acceptCallback" label="제출" class="w-20"></Button>
            <Button
              @click="rejectCallback"
              label="취소"
              outlined
              class="w-20"
            ></Button>
          </div>
        </div>
      </template>
    </ConfirmDialog>
  </aside>
</template>
<style scoped></style>
