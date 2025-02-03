<script setup>
import { userAPI } from "@/api/user";
import { workbookAPI } from "@/api/workbook";
import { useAuthStore } from "@/store/authStore";
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";
import { Form } from "@primevue/forms";
import { storeToRefs } from "pinia";
import {
  Button,
  InputText,
  Textarea,
  Listbox,
  ToggleSwitch,
  useToast,
} from "primevue";
import { onBeforeMount, ref, onBeforeUnmount, onMounted, computed } from "vue";

const {
  class: className,
  parentRef,
  showAddPopup,
  showProblemSet,
} = defineProps({
  class: String,
  parentRef: Object,
  showProblemSet: {
    type: Boolean,
    required: true,
  },
  showAddPopup: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  "update:showProblemSet",
  "update:showAddPopup",
  "clickProblemSet",
  "clickAddProblemSet",
]);

const toast = useToast();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const problemSets = ref([]);
const title = ref("");
const description = ref("");
const shared = ref(false);

const reversedProblemSets = computed(() => [...problemSets.value].reverse());

const resolver = ({ values }) => {
  const errors = { title: [] };

  if (!values.title.trim()) {
    errors.title.push({ type: "required", message: "제목은 필수입니다." });
  }

  if (values.title?.length > 20) {
    errors.title.push({
      type: "minimum",
      message: "제목은 최대 20글자까지 작성 가능합니다.",
    });
  }

  return {
    errors,
  };
};

const showAddProblemSetPopup = async () => {
  const currentUser = await userAPI.getOne(user.value.id);
  const grade = getCurrentGradeInfo(currentUser.total_points);
  if (problemSets.value.length >= grade.current.problemSetLimit) {
    toast.add({
      severity: "error",
      summary: "문제집 생성 실패",
      detail: "현재 등급에서의 문제집 갯수 제한에 도달했습니다.",
      life: 3000,
    });
    return;
  }

  emit("update:showAddPopup", true);
};

const closeAllPopups = () => {
  emit("update:showProblemSet", false);
  emit("update:showAddPopup", false);
};

const addProblemSet = async ({ valid }) => {
  if (!valid) return;

  const problemSet = await workbookAPI.add(
    title.value.trim(),
    description.value.trim(),
    shared.value,
  );

  title.value = "";
  description.value = "";
  shared.value = false;
  problemSets.value = [...problemSets.value, problemSet];
  emit("clickAddProblemSet", problemSet);
  emit("update:showAddPopup", false);
};

const clickListItem = (selectedProblemSet) => {
  emit("clickProblemSet", selectedProblemSet);
  closeAllPopups();
};

const handleClickOutside = (event) => {
  if (parentRef && !parentRef.contains(event.target)) {
    closeAllPopups();
  }
};

onBeforeMount(async () => {
  problemSets.value = await workbookAPI.getAll(user.value.id);
});

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
});
</script>
<template>
  <!-- 문제집 드롭다운용 컴포넌트 입니다. -->
  <!-- ProblemTableVue, ProblemEditorHeader -->
  <div @click.stop :class="className">
    <div v-if="showProblemSet" class="w-64">
      <Listbox
        :key="problemSets.length"
        :options="reversedProblemSets"
        filter
        optionLabel="title"
        listStyle="height: 14rem"
      >
        <template #option="slotProps">
          <div
            class="flex items-center w-full gap-2"
            @click="clickListItem(slotProps.option)"
          >
            <i class="pi pi-folder"></i>
            <div>{{ slotProps.option.title }}</div>
          </div>
        </template>
      </Listbox>
      <Button
        label="새로운 문제집 만들기"
        icon="pi pi-plus"
        class="w-[14.4rem]"
        @click="showAddProblemSetPopup"
      />
    </div>

    <Form
      v-if="showProblemSet && showAddPopup"
      @click.stop
      @submit="addProblemSet"
      :resolver
      class="w-64 absolute -bottom-0 -right-[17rem] cursor-default"
    >
      <div class="flex flex-col gap-4 px-4 py-2 bg-white border rounded-lg">
        <div class="flex flex-col gap-2">
          <label for="title" class="text-sm">문제집 이름 *</label>
          <InputText
            id="title"
            name="title"
            v-model="title"
            placeholder="문제집 이름을 입력해주세요"
            :maxlength="20"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="description" class="text-sm">문제집 설명</label>
          <Textarea
            v-model="description"
            id="description"
            class="border rounded-md resize-none font-sans px-2 py-1.5"
            rows="5"
            cols="30"
            placeholder="문제집 설명을 입력해주세요"
            :maxlength="200"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="shared" class="text-sm">게시판 공유 여부</label>
          <ToggleSwitch id="shared" v-model="shared" />
        </div>
      </div>
      <Button
        type="submit"
        label="문제집 추가하기"
        icon="pi pi-plus"
        class="w-[14.4rem]"
      />
    </Form>
  </div>
</template>
<style></style>
