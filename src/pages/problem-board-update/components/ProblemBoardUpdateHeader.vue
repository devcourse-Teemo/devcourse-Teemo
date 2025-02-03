<script setup>
import { ref, computed, onMounted, watchEffect } from "vue";
import { Avatar, ToggleSwitch, MultiSelect, Button } from "primevue";
import { useToast } from "primevue/usetoast";
import { pointAPI } from "@/api/point";
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";
import { RouterLink } from "vue-router";
import defaultProfileIMG from "@/assets/default-profile-image.svg";
import { categoryAPI } from "@/api/category";
import { useProblemUpdateStore } from "@/store/problemUpdateStore";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useProblemStore } from "@/store/problemStore";
import { toRaw } from "vue";
import { useConfirm } from "primevue/useconfirm";

const props = defineProps({
  problem: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const emit = defineEmits(["toggle-like", "menu-action"]);
const toast = useToast();
const problemStore = useProblemStore();
const problemUpdateStore = useProblemUpdateStore();
const router = useRouter();
const categories = ref([]);
const filteredCategory = ref("");
const { editedProblem } = storeToRefs(problemUpdateStore);
const confirm = useConfirm();

// author 정보 가져오기
const author = computed(() => problemStore.author);

// 사용자 등급 정보
const userGrade = computed(() =>
  getCurrentGradeInfo(author.value?.total_points || 0),
);

// 라우트 설정
const routeConfig = computed(() => {
  if (!author.value?.id) return null;

  return {
    name: "UserProfile",
    params: { userId: author.value.id },
  };
});

// Avatar 에러 핸들링
const handleAvatarError = (e) => {
  e.target.src = defaultProfileIMG;
};

// 카테고리 관련 상태관리
const selectedCategory = ref(
  props.problem?.category ? [props.problem.category] : [],
);

// 제목 변경 감지
const handleTitleChange = (event) => {
  problemUpdateStore.updateField("title", event.target.value);
};

// 카테고리 변경 감지
const handleCategoryChange = (event) => {
  const rawValue = toRaw(event?.value || []);
  
  if (!rawValue.length) {
    problemUpdateStore.updateField("category", null);
    return;
  }

  const selectedCat = rawValue[0];
  problemUpdateStore.updateField("category", selectedCat.id);
};

// 공개 여부 변경 감지
const handleSharedChange = (value) => {
  problemUpdateStore.updateField("shared", value);
};

const doesCategoryExist = computed(() => {
  return categories.value.some(
    (cat) => cat.name?.toLowerCase() === filteredCategory.value?.toLowerCase(),
  );
});

const onFilterCategory = (event) => {
  filteredCategory.value = event.value;
};

const createCategory = async () => {
  if (!filteredCategory.value.trim()) {
    toast.add({
      severity: "error",
      summary: "오류",
      detail: "카테고리 이름은 비워둘 수 없습니다.",
      life: 3000,
    });
    return;
  }

  try {
    const newCategory = await categoryAPI.createCategory({
      name: filteredCategory.value.trim(),
    });

    categories.value.push(newCategory);
    props.problem.category = newCategory;
    selectedCategory.value = [newCategory];
    filteredCategory.value = "";

    toast.add({
      severity: "success",
      summary: "성공",
      detail: "새 카테고리가 생성되었습니다.",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "오류",
      detail: error.message || "카테고리 생성에 실패했습니다.",
      life: 3000,
    });
  }
};

// 수정 완료 핸들러
const handleUpdate = async () => {
  try {
    const category = editedProblem.value.category;
    const normalizedCategoryId = category
      ? typeof category === "object"
        ? toRaw(category)?.id || category.id
        : category
      : null;

    editedProblem.value.category = normalizedCategoryId;

    const success = await problemUpdateStore.saveProblem();
    if (success) {
      router.push(`/problem-board/${props.problem.id}`);
    }
  } catch (error) {
    console.error("수정 실패:", error);
  }
};

// 취소 핸들러
const handleCancel = () => {
  problemUpdateStore.cancelEdit();
  confirm.require({
    message:
      "정말 수정을 취소하시겠습니까? \n 지금까지 수정한 내용은 저장되지 않습니다.",
    header: "수정 취소 확인",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      problemUpdateStore.cancelEdit();
      router.back();
    },
  });
};

const fetchUserGrade = async () => {
  try {
    if (props.author?.id) {
      const pointData = await pointAPI.getAll(props.author.id);
      if (pointData && pointData.length > 0) {
        const totalPoints = pointData.reduce(
          (sum, point) => sum + point.point,
          0,
        );
        const gradeInfo = getCurrentGradeInfo(totalPoints);
        userGrade.value = gradeInfo.current;
      }
    }
  } catch (error) {
    console.error("등급 정보 조회 실패:", error);
  }
};

watchEffect(() => {
  fetchUserGrade();
});

onMounted(async () => {
  try {
    const categoryData = await categoryAPI.getAll();
    categories.value = categoryData;

    // 기존 카테고리가 있으면 선택
    if (props.problem?.category) {
      const existingCategory = categoryData.find(
        (cat) => cat.id === props.problem.category.id,
      );
      if (existingCategory) {
        selectedCategory.value = [existingCategory];
        props.problem.category = existingCategory;
      }
    }
  } catch (error) {
    console.error("카테고리 로드 실패:", error);
    toast.add({
      severity: "error",
      summary: "오류",
      detail: "카테고리 목록을 불러오는데 실패했습니다.",
      life: 3000,
    });
  }
});
</script>

<template>
  <div class="w-full item-between mb-8">
    <RouterLink
      v-if="author?.id && routeConfig"
      :to="routeConfig"
      class="flex gap-2 items-center"
    >
      <Avatar
        :image="author?.avatar_url"
        @error="handleAvatarError"
        shape="circle"
        size="large"
      />
      <div>
        <p>
          <strong aria-label="닉네임">{{ author?.name || "닉네임" }}</strong>
          <span class="ml-2 text-black-3">
            {{ userGrade?.current?.name || "등급 없음" }}
          </span>
        </p>
        <span class="text-black-3 text-sm" aria-label="최종 수정일">
          {{ new Date(problem?.updated_at).toLocaleString() }}
        </span>
      </div>
    </RouterLink>

    <nav class="item-middle gap-2">
      <button @click="handleCancel" class="bg-black-5 px-4 py-1 rounded-full">
        취소
      </button>
      <button
        @click="handleUpdate"
        class="bg-orange-1 text-white px-4 py-1 rounded-full"
      >
        수정
      </button>
    </nav>
  </div>

  <div class="flex items-center gap-4 mb-10">
    <form class="flex-1">
      <input
        type="text"
        class="text-4xl font-bold mb-4 border border-gray-300 rounded p-2 w-full"
        :maxlength="20"
        v-model="problem.title"
        required
        @change="handleTitleChange"
      />
      <div class="flex items-center gap-2 text-sm">
        <fieldset class="flex items-center gap-2 w-full mb-4">
          <label for="category" class="mr-1">카테고리</label>
          <MultiSelect
            v-model="selectedCategory"
            display="chip"
            :options="categories"
            optionLabel="name"
            filter
            :selection-limit="1"
            class="md:h-9 items-center md:w-60 font-regular text-sm py-2 mr-2"
            @filter="onFilterCategory"
            @change="handleCategoryChange"
          >
            <template #footer>
              <div class="p-3 flex justify-between">
                <Button
                  label="카테고리 추가"
                  severity="secondary"
                  text
                  size="small"
                  icon="pi pi-plus"
                  :disabled="doesCategoryExist"
                  @click="createCategory"
                />
              </div>
            </template>
          </MultiSelect>
        </fieldset>
      </div>
    </form>
  </div>
</template>

<style scoped>
.addDivider::after {
  width: 100%;
  height: 1px;
  background-color: #d4d4d4;
  margin-top: 12px;
  content: "";
  display: block;
}
</style>
