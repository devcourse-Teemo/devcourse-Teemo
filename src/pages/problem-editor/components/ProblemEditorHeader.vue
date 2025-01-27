<script setup>
import { ref, reactive, onBeforeMount } from "vue";
import arrowLeftPath from "@/assets/icons/problem-editor/arrow-left.svg";
import folderPath from "@/assets/icons/problem-editor/folder.svg";
import arrowTopPath from "@/assets/icons/problem-editor/arrow-top.svg";
import { Listbox, InputText, Textarea, Button } from "primevue";
import { workbookAPI } from "@/api/workbook";
import { useAuthStore } from "@/store/authStore";
const props = defineProps({
  storedFolder: {
    type: Object,
  },
});
const emits = defineEmits([
  "submitProblems",
  "onGoingBack",
  "setProblemFolder",
]);

const { user } = useAuthStore();

// 팝업 열림 상태
const isFolderOpen = ref(false);
const isCreateNewFolder = ref(false);
// 선택된 폴더
const selectedFolder = ref("");
const createdNewFolder = reactive({ title: "", description: "" });

// 폴더 토글 버튼 조작
const onClickFolder = () => {
  isFolderOpen.value = !isFolderOpen.value;
};

const onSubmit = () => {
  emits("submitProblems");
};

const showNewFolderPopup = () => {
  isCreateNewFolder.value = true;
};

// 초기값은 API에서 불러오기
// my problemsets
const problemSets = reactive([]);
const selectedProblemSet = ref({});

const closeAllPopups = () => {
  isCreateNewFolder.value = false;
  isFolderOpen.value = false;
};

//폴더 지정 함수
const setFolder = (folder) => {
  selectedFolder.value = folder.title;
  emits("setProblemFolder", folder);
  console.log(selectedFolder);
  closeAllPopups();
};

const onCreateNewFolder = async ({ title, description }) => {
  try {
    const data = await workbookAPI.add(title, description);
    setFolder(data);
    problemSets.push(data);
    selectedProblemSet.value = data;
  } catch (error) {
    console.error("문제집 생성에 실패했습니다.");
  }
};

const setFolderFromList = () => {
  if (!selectedProblemSet.value) {
    setFolder({});
  } else setFolder(selectedProblemSet.value);
};

onBeforeMount(async () => {
  const folder = props.storedFolder || "";
  if (folder) {
    setFolder(folder);
  }

  // problemSet 불러오기
  // 사용자 UID 기반 경로 설정
  // TODO: 로그아웃 안했는데 user이 null이 됨 -> token 갱신 이슈?
  if (!user) {
    throw new Error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
  }
  const userId = user.id;
  const userFolderData = await workbookAPI.getUid(userId);
  console.log(userFolderData);
  problemSets.push(...userFolderData);

  const sharedFolderData = await workbookAPI.getShared(userId);
  console.log(sharedFolderData);
  problemSets.push(...sharedFolderData);
});
</script>
<template>
  <header
    class="top-0 left-0 p-2.5 border-black-5 border flex items-center justify-between"
  >
    <Button @click="emits('onGoingBack')" style="padding: 8px 8px">
      <img
        :src="arrowLeftPath"
        alt="뒤로가기"
        class="align-middle items-center"
      />
    </Button>
    <div
      class="overlay flex items-center cursor-pointer relative"
      @click="onClickFolder"
    >
      <p class="p-1.5 bg-orange-1 rounded mr-4">
        <img :src="folderPath" alt="폴더" class="align-middle" />
      </p>
      <span class="text-xl font-medium mr-4">{{ selectedFolder }}</span>
      <img
        :src="arrowTopPath"
        :alt="isFolderOpen ? '폴더 토글 닫힘' : '폴더 토글 열림'"
        :class="[
          isFolderOpen ? 'rotate-180' : 'rotate-0',
          'transform transition-transform duration-300',
        ]"
      />
      <!-- 팝업 -->
      <div
        v-if="isFolderOpen"
        class="absolute top-full left-0 mt-3"
        @click.stop
      >
        <Listbox
          v-model="selectedProblemSet"
          :options="problemSets"
          filter
          optionLabel="title"
          listStyle="max-height: 14rem"
          @change="setFolderFromList(selectedProblemSet)"
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <i class="pi pi-folder"></i>
              <div>{{ slotProps.option.title }}</div>
            </div>
          </template>
          <template #footer>
            <div class="flex justify-center">
              <Button
                label="새로운 문제집 만들기"
                icon="pi pi-plus"
                @click="showNewFolderPopup"
                class="w-[12rem] mx-1 mb-2"
              />
            </div>
          </template>
        </Listbox>
      </div>

      <div
        v-if="isCreateNewFolder && isFolderOpen"
        class="w-64 absolute top-full mt-3 left-[240px]"
        @click.stop
      >
        <!-- TODO: 무조건 이름 입력해야 클릭 가능 -->
        <div class="flex flex-col gap-4 px-4 py-2 bg-white border rounded-lg">
          <div class="flex flex-col gap-2">
            <label for="title" class="text-sm">문제집 이름</label>
            <InputText
              id="title"
              v-model="createdNewFolder.title"
              placeholder="문제집 이름을 입력해주세요"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="description" class="text-sm">문제집 설명</label>
            <Textarea
              v-model="createdNewFolder.description"
              id="description"
              class="border rounded-md resize-none font-sans px-2 py-1.5"
              rows="5"
              cols="30"
              placeholder="문제집 설명을 입력해주세요"
            />
          </div>
          <Button
            label="문제집 추가하기"
            icon="pi pi-plus"
            @click="onCreateNewFolder(createdNewFolder)"
          />
        </div>
      </div>
    </div>
    <Button label="저장하기" @click="emits('submitProblems')"></Button>
    <!-- 팝업 -->
  </header>
</template>
<style scoped>
::v-deep(.overlay) {
  z-index: 9999 !important;
}
</style>
