import { ref } from "vue";
import { defineStore } from "pinia";

export const useExamStore = defineStore(
  "exam",
  () => {
    const testCenter = ref(null);
    const problems = ref([]);
    const userAnswers = ref([]);

    function checkIsSameExam(currentTestCenterId) {
      return testCenter.value?.id === Number(currentTestCenterId);
    }

    function initExam(currentTestCenter, currentProblems, currentUserAnswers) {
      testCenter.value = currentTestCenter?.value;
      problems.value = currentProblems?.value;
      userAnswers.value = currentUserAnswers?.value;
    }

    function saveSelectedAnswers(currentUserAnswers) {
      userAnswers.value = currentUserAnswers.value;
    }

    return {
      testCenter,
      problems,
      userAnswers,
      initExam,
      checkIsSameExam,
      saveSelectedAnswers,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ["problems", "userAnswers", "testCenter"],
    },
  },
);
