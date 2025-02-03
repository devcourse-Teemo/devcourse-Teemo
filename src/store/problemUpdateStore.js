import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { problemAPI } from "@/api/problem";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

const emptyProblem = {
  title: "",
  question: "",
  answer: "",
  explanation: "",
  origin_source: "",
  problem_type: "",
  category: null,
  image_src: "",
  option_one: "",
  option_two: "",
  option_three: "",
  option_four: "",
  shared: false,
};

const FIELD_NAMES = {
  title: "제목",
  question: "문제 내용",
  answer: "정답",
  explanation: "해설",
  origin_source: "출처",
  category: "카테고리"
};

const validateField = (field, value) => {
  if (typeof value === "string") {
    if (!value || value.trim() === "") {
      return {
        isValid: false,
        message: `${FIELD_NAMES[field]}을(를) 입력해주세요.`
      };
    }
  } else if (!value) {
    return {
      isValid: false,
      message: `${FIELD_NAMES[field]}을(를) 입력해주세요.`
    };
  }

  return { isValid: true };
};

export const useProblemUpdateStore = defineStore("problemUpdate", () => {
  const toast = useToast();
  const confirm = useConfirm();
  const isLoading = ref(false);
  const originalProblem = ref(null);
  const editedProblem = ref({ ...emptyProblem });
  const validationErrors = ref({});

  const hasChanges = computed(() => {
    if (!originalProblem.value) return false;

    return Object.keys(emptyProblem).some((key) => {
      if (key === "category") {
        return (
          JSON.stringify(editedProblem.value[key]) !==
          JSON.stringify(originalProblem.value[key])
        );
      }
      return editedProblem.value[key] !== originalProblem.value[key];
    });
  });

  const loadProblem = async (problemId) => {
    try {
      isLoading.value = true;
      const data = await problemAPI.getById(problemId);
      if (data) {
        originalProblem.value = { ...data };
        editedProblem.value = { ...data };
      }
    } catch (error) {
      console.error("문제 로딩 실패:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  function updateField(field, value) {
    if (field in editedProblem.value) {
      editedProblem.value[field] = value;
      return true;
    } else {
      console.warn(`Unknown field: ${field}`);
      return false;
    }
  }

  function validateRequiredFields() {
    const requiredFields = ["title", "question", "answer", "explanation", "origin_source", "category"];
    const missingFields = [];

    for (const field of requiredFields) {
      const value = editedProblem.value[field];
      const validation = validateField(field, value);
      if (!validation.isValid) {
        missingFields.push(FIELD_NAMES[field]);
      }
    }

    if (missingFields.length > 0) {
      confirm.require({
        message: `필수 항목이 누락되었습니다 : ${missingFields.join(", ")}`,
        header: "필수 입력 확인",
        rejectVisible: false, 
        accept: () => {},
      });
      return false;
    }

    return true;
  }

  async function saveProblem() {
    try {
      if (!validateRequiredFields()) {
        return false;
      }

      isLoading.value = true;
      const {
        id,
        title,
        question,
        answer,
        explanation,
        origin_source,
        problem_type,
        category,
        option_one,
        option_two,
        option_three,
        option_four,
        shared,
      } = editedProblem.value;

      const updateData = {
        title: title.trim(),
        question: question.trim(),
        answer: answer.trim(),
        explanation: explanation?.trim(),
        origin_source: origin_source?.trim(),
        problem_type,
        category_id: category,
        option_one: option_one?.trim(),
        option_two: option_two?.trim(),
        option_three: option_three?.trim(),
        option_four: option_four?.trim(),
        shared,
      };

      const data = await problemAPI.update(id, updateData);
      if (data) {
        toast.add({
          severity: "success",
          summary: "수정 완료",
          detail: "문제가 성공적으로 수정되었습니다.",
          life: 3000,
        });
        return true;
      }
    } catch (error) {
      console.error("문제 수정 실패:", error);
      toast.add({
        severity: "error",
        summary: "수정 실패",
        detail: "문제 수정 중 오류가 발생했습니다.",
        life: 3000,
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function cancelEdit() {
    if (originalProblem.value) {
      editedProblem.value = { ...originalProblem.value };
    } else {
      editedProblem.value = { ...emptyProblem };
    }
    validationErrors.value = {};
  }

  function resetStore() {
    isLoading.value = false;
    originalProblem.value = null;
    editedProblem.value = { ...emptyProblem };
    validationErrors.value = {};
  }

  return {
    isLoading,
    editedProblem,
    validationErrors,
    hasChanges,
    loadProblem,
    updateField,
    saveProblem,
    cancelEdit,
    resetStore,
  };
});