<script setup>
// APIs
import { workbookAPI } from "@/api/workbook";

// Components
import ProblemSetPopUp from "@/components/layout/ProblemSetPopUp.vue";

// Icons
import folderPath from "@/assets/icons/problem-editor/folder.svg";
import arrowTopPath from "@/assets/icons/problem-editor/arrow-top.svg";
import arrowLeftPath from "@/assets/icons/problem-editor/arrow-left.svg";

// PrimeVue
import { Button } from "primevue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";
import { useCreateProblemStore } from "@/store/createProblemStore";

// Vue Core
import { ref, reactive, watchEffect, onMounted } from "vue";

const props = defineProps({
  storedFolder: {
    type: Object,
  },
});

const { user } = useAuthStore();

const popup = ref(null);

const createProblemStore = useCreateProblemStore();
const { createdProblems } = storeToRefs(createProblemStore);

// 팝업 열림 상태
const isFolderOpen = ref(false);
const isCreateNewFolder = ref(false);

const emits = defineEmits(["submitProblems", "onGoingBack"]);

// 선택된 폴더
const selectedFolder = ref("");

//폴더 토글 버튼 조작
const onClickFolder = () => {
  isFolderOpen.value = !isFolderOpen.value;
  isCreateNewFolder.value = false;
};

const problemSets = reactive([]);

//폴더 지정 함수
const setFolder = (folder) => {
  selectedFolder.value = folder.title;
  createProblemStore.setProblemFolder(folder);
};

const onCreateNewFolder = async (selectedFolder) => {
  setFolder(selectedFolder);
  problemSets.push(selectedFolder);
};

const setFolderFromList = (value) => {
  if (!value) {
    setFolder({ id: "", title: "문제집을 선택하세요" });
  } else {
    setFolder(value);
  }
  isFolderOpen.value = false;
};

watchEffect(() => {
  const folder = createdProblems.value.folder || {
    id: "",
    title: "문제집을 선택하세요",
  };
  setFolder(folder);
});

const fetchProblemSets = async () => {
  if (!user || !user.id) {
    console.error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
    return;
  }

  try {
    const userId = user.id;
    const userFolderData = await workbookAPI.getUid(userId);
    problemSets.push(...userFolderData);

    const sharedFolderData = await workbookAPI.getShared(userId);
    problemSets.push(...sharedFolderData);
  } catch (error) {
    console.error("폴더 데이터를 가져오는 중 오류 발생:", error);
  }
};

onMounted(() => {
  fetchProblemSets();
});
</script>
<template>
  <header
    class="top-0 left-0 p-2.5 border-b border-black-5 flex items-center justify-between"
  >
    <Button @click="emits('onGoingBack')" style="padding: 8px 8px">
      <img
        :src="arrowLeftPath"
        alt="뒤로가기"
        class="items-center align-middle"
      />
    </Button>
    <div
      ref="popup"
      class="relative flex items-center rounded cursor-pointer"
      @click="onClickFolder"
    >
      <p class="p-1.5 bg-orange-1 rounded mr-4">
        <img :src="folderPath" alt="폴더" class="align-middle" />
      </p>
      <span class="mr-4 text-xl font-medium">{{
        createdProblems.folder.title
      }}</span>
      <img
        :src="arrowTopPath"
        :alt="isFolderOpen ? '폴더 토글 닫힘' : '폴더 토글 열림'"
        :class="[
          isFolderOpen ? 'rotate-180' : 'rotate-0',
          'transform transition-transform duration-300',
        ]"
      />

      <!-- 팝업 -->
      <ProblemSetPopUp
        :parent-ref="popup"
        v-model:show-problem-set="isFolderOpen"
        v-model:show-add-popup="isCreateNewFolder"
        @clickProblemSet="setFolderFromList"
        @clickAddProblemSet="onCreateNewFolder"
        class="absolute z-50 w-64 mt-3 -translate-x-1/2 top-full left-1/2"
      />
    </div>
    <Button label="저장하기" @click="emits('submitProblems')"></Button>
  </header>
</template>
<style scoped></style>
