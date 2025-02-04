<script setup>
// APIs
import { testCenterAPI } from "@/api/testCenter";
import { testResultAPI } from "@/api/testResult";
import { problemHistoryAPI } from "@/api/problemHistory";

// Components
import TestProblem from "./components/TestProblem.vue";
import TestSidebar from "./components/TestSidebar.vue";

// PrimeVue
import { useToast } from "primevue";

// Stores
import { storeToRefs } from "pinia/dist/pinia";

import { useExamStore } from "@/store/examStore";
import { useAuthStore } from "@/store/authStore";

// Vue Core
import { useRouter, useRoute } from "vue-router";
import { ref, computed, onMounted, onBeforeUnmount, onBeforeMount } from "vue";

let intervalId;
const toast = useToast();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const examStore = useExamStore();
const { user } = storeToRefs(authStore);
const {
  testCenter: prevTestCenter,
  problems: prevProblems,
  userAnswers: prevUserAnswers,
} = storeToRefs(examStore);

const problems = ref([]);
const testCenter = ref();
const elapsedTime = ref(0);
const currentProblemIndex = ref(0);
const userAnswers = ref([]);

const remainedTime = computed(() => {
  if (!testCenter.value) return { hours: "00", minutes: "00", seconds: "00" };
  const startTime = new Date(testCenter.value.start_date).getTime();
  const endTime = new Date(testCenter.value.end_date).getTime();

  const remainedMilliseconds = endTime - (startTime + elapsedTime.value);
  const remainedSeconds = Math.floor(remainedMilliseconds / 1000);
  const hours = String(Math.floor(remainedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remainedSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(remainedSeconds % 60).padStart(2, "0");
  return { hours, minutes, seconds };
});

const currentProblem = computed(
  () => problems.value[currentProblemIndex.value].problem,
);

const setCurrentProblemIndex = (index) => {
  currentProblemIndex.value = index;
};

const setNextProblemIndex = () => {
  if (currentProblemIndex.value === problems.value.length - 1) return;
  currentProblemIndex.value += 1;
};

const setPrevProblemIndex = () => {
  if (currentProblemIndex.value === 0) return;
  currentProblemIndex.value -= 1;
};

const selectAnswer = (num) => {
  userAnswers.value[currentProblemIndex.value] = num;
  examStore.saveSelectedAnswers(userAnswers);
};

const submitAnswers = async () => {
  let correctCount = 0;

  const problemHistoryPromise = problems.value.map(
    async ({ problem }, index) => {
      const myOption = userAnswers.value[index];
      const corrected = problem.answer === myOption;
      if (corrected) correctCount += 1;

      await problemHistoryAPI.add({
        problem_id: problem.id,
        test_center_id: testCenter.value.id,
        status: corrected ? "corrected" : "wrong",
        my_option: myOption,
      });
    },
  );

  const testResult = await testResultAPI.add({
    test_center_id: testCenter.value.id,
    correct_count: correctCount,
    total_count: problems.value.length,
    time: elapsedTime.value,
  });

  examStore.initExam();
  await Promise.all(problemHistoryPromise, testResult);

  if (problems.value.length >= 10) {
    if (problems.value.length === correctCount) {
      toast.add({
        severity: "info",
        summary: "🎉시험 만점 포인트 지급🎉",
        detail: "시험 만점으로 10포인트를 획득했습니다.",
        life: 3000,
      });
    } else {
      toast.add({
        severity: "info",
        summary: "시험 완료 포인트 지급",
        detail: "시험 완료로 9포인트를 획득했습니다.",
        life: 3000,
      });
    }
  }

  router.push(`/exam-result/${testResult.id}`);
};

const updateElapsedTime = () => {
  if (
    remainedTime.value.hours === "00" &&
    remainedTime.value.minutes === "00" &&
    remainedTime.value.seconds === "00"
  ) {
    submitAnswers();
    return;
  }
  const startDate = new Date(testCenter.value?.start_date);
  elapsedTime.value = new Date().getTime() - startDate.getTime();
};

onBeforeMount(async () => {
  const testCenterId = route.params.examId;

  const isAuthorized = await testCenterAPI.checkIsAuthorized(
    user.value.id,
    testCenterId,
  );
  if (!isAuthorized) {
    toast.add({
      severity: "error",
      summary: "시험 입장 오류",
      detail: "해당 시험에 대한 권한이 없습니다.",
      life: 3000,
    });
    return router.replace("/exam-room");
  }

  const isSubmitted = await testResultAPI.checkIsSubmitted(
    user.value.id,
    testCenterId,
  );
  if (isSubmitted) {
    toast.add({
      severity: "error",
      summary: "시험 입장 오류",
      detail: "이미 제출한 시험입니다.",
      life: 3000,
    });
    return router.replace("/exam-room");
  }

  const testCenterData = await testCenterAPI.getAllByTestCenterId(testCenterId);
  if (
    new Date(testCenterData.start_date) > new Date() ||
    new Date(testCenterData.end_date) < new Date()
  ) {
    toast.add({
      severity: "error",
      summary: "시험 입장 오류",
      detail: "시험 시간이 아닙니다.",
      life: 3000,
    });
    return router.replace("/exam-room");
  }

  if (examStore.checkIsSameExam(testCenterId)) {
    testCenter.value = prevTestCenter.value;
    problems.value = prevProblems.value;
    userAnswers.value = prevUserAnswers.value;
  } else {
    testCenter.value = testCenterData;
    problems.value = testCenterData.problems;
    userAnswers.value = Array(problems.value.length).fill("");
    examStore.initExam(testCenter, problems, userAnswers);
  }

  updateElapsedTime();
});

onMounted(() => {
  intervalId = setInterval(updateElapsedTime, 1000); // 1초마다 경과시간 업데이트
});

onBeforeUnmount(() => {
  clearInterval(intervalId);
});
</script>
<template>
  <main class="relative flex h-auto">
    <section class="flex flex-col justify-between w-full">
      <div class="flex flex-col">
        <div
          class="flex items-center justify-center w-full h-16 bg-black-6 mb-14"
        >
          <h1 class="text-xl font-semibold">
            {{ testCenter?.workbook?.title }} 시험장
          </h1>
        </div>
        <TestProblem
          v-if="problems.length"
          :problem="currentProblem"
          :userAnswer="userAnswers[currentProblemIndex]"
          :currentProblemIndex="currentProblemIndex"
          @selectAnswer="selectAnswer"
        />
      </div>
      <div class="flex items-center w-full h-16 bg-black-6">
        <div class="flex w-[1000px] mx-auto gap-2">
          <button
            @click="setPrevProblemIndex"
            type="button"
            class="w-20 h-8 text-center text-white rounded-r-sm bg-navy-3 rounded-l-2xl"
          >
            이전
          </button>
          <button
            @click="setNextProblemIndex"
            type="button"
            class="w-20 h-8 text-center text-white rounded-l-sm bg-navy-3 rounded-r-2xl"
          >
            다음
          </button>
        </div>
      </div>
    </section>
    <TestSidebar
      :remainedTime="remainedTime"
      :userAnswers="userAnswers"
      @submitAnswers="submitAnswers"
      @setCurrentProblemIndex="setCurrentProblemIndex"
    />
  </main>
</template>
<style scoped></style>
