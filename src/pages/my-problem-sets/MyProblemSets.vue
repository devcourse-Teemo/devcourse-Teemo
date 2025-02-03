<script setup>
import shareIcon from "@/assets/icons/my-problem-sets/share.svg";
import createWorkbook from "@/assets/icons/my-problem-sets/createWorkbook.svg";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { Avatar, useToast, ToggleSwitch } from "primevue";
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/store/authStore";
import { useWorkbookStore } from "@/store/workbookStore";
import { storeToRefs } from "pinia";
import { workbookAPI } from "@/api/workbook";
import { useRouter } from "vue-router";
import { userAPI } from "@/api/user";
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";

const authStore = useAuthStore();
const workbookStore = useWorkbookStore();
const router = useRouter();
const {
  workbooks,
  sharedWorkbooks,
  problemCounts,
  title,
  description,
  shared,
  isMyBooksViewAll,
  isSharedBooksViewAll,
} = storeToRefs(workbookStore);

//모달
const toast = useToast();
const showDialog = ref(false);
const isTitleWarning = ref(false);
const isDescriptionWarning = ref(false);

// 전체보기 토글
const toggleMyBooksViewAll = () => {
  isMyBooksViewAll.value = !isMyBooksViewAll.value;
};
const toggleSharedBooksViewAll = () => {
  isSharedBooksViewAll.value = !isSharedBooksViewAll.value;
};

const visibleSharedBooks = computed(() => {
  return isSharedBooksViewAll.value
    ? sharedWorkbooks.value
    : sharedWorkbooks.value.slice(0, 4);
});
// 문제집이 없을 때 표시할 메시지
const noWorkbooksMessage = computed(() => {
  return workbooks.value.length === 0
    ? "현재 보관 중인 문제집이 없습니다."
    : "";
});

//문제 수를 개별적으로 가져오는 함수
const fetchCountsForAllWorkbooks = async () => {
  const allBooks = [...workbooks.value, ...sharedWorkbooks.value];

  for (const book of allBooks) {
    await workbookStore.fetchProblemCount(book.id);
  }
};

// 문제집 상세 페이지로 이동하는 함수
const goToProblemSet = (bookId) => {
  router.push(`/problem-set-board/${bookId}`);
};

//입력 필드 리셋
const resetFormFields = () => {
  title.value = "";
  description.value = "";
  shared.value = false;
};

//제목 & 설명 길이 제한
const titleLength = computed(() => title.value?.length || 0);
const descriptionLength = computed(() => description.value?.length || 0);

const openAddDialog = async () => {
  const currentUser = await userAPI.getOne(authStore.user.id);
  const grade = getCurrentGradeInfo(currentUser.total_points);
  if (workbooks.value.length >= grade.current.problemSetLimit) {
    toast.add({
      severity: "error",
      summary: "문제집 생성 실패",
      detail: "현재 등급에서의 문제집 갯수 제한에 도달했습니다.",
      life: 3000,
    });
    return;
  }

  showDialog.value = true;
};

//문제집 추가
const addWorkbook = async () => {
  if (!title.value.trim() || !description.value.trim()) {
    toast.add({
      severity: "warn",
      summary: "경고",
      detail: "제목과 설명을 입력해주세요.",
      life: 2000,
    });
    return;
  }
  try {
    await workbookAPI.add(title.value, description.value, shared.value);

    workbookStore.updateWorkbook({
      title: title.value,
      description: description.value,
      shared: shared.value,
    });

    toast.add({
      severity: "success",
      summary: "성공",
      detail: "문제집이 성공적으로 추가되었습니다!",
      life: 2000,
    });

    await workbookStore.loadWorkbooks(authStore.user.id);
    await fetchCountsForAllWorkbooks();

    showDialog.value = false;
  } catch (error) {
    console.error("문제집 생성에 실패했습니다:", error);
    toast.add({
      severity: "error",
      summary: "오류",
      detail: "문제집 생성에 실패했습니다.",
      life: 2000,
    });
  }
};

watch(
  () => authStore.user,
  async (newUser) => {
    if (newUser && newUser.id) {
      try {
        await workbookStore.loadWorkbooks(newUser.id);
        await workbookStore.loadSharedWorkbooks(newUser.id);
        await fetchCountsForAllWorkbooks(newUser.id);
      } catch (error) {
        console.error("데이터 로드 중 오류:", error);
      }
    } else {
      workbookStore.resetViewState();
    }
  },
  { immediate: true, deep: true },
);

watch(title, (newValue) => {
  if (newValue === "") return;
  if (newValue.length > 20) {
    if (!isTitleWarning.value) {
      isTitleWarning.value = true;
    }
    title.value = newValue.substring(0, 20);
  }
});

watch(description, (newValue) => {
  if (newValue === "") return;
  if (newValue.length > 200) {
    if (!isDescriptionWarning.value) {
      isDescriptionWarning.value = true;
    }
    description.value = newValue.substring(0, 200);
  }
});

watch(showDialog, (newVal) => {
  if (!newVal) {
    resetFormFields();
  }
});
</script>

<template>
  <section class="flex flex-col gap-16 w-[1000px] mx-auto">
    <h1 class="text-[42px] font-laundry">보관한 문제집</h1>
    <section class="flex flex-col gap-[18px] relative">
      <div class="flex items-center gap-[16px]">
        <h2 class="font-semibold text-xl">내가 만든 문제집</h2>
        <button
          v-if="workbooks.length > 4"
          @click="toggleMyBooksViewAll"
          class="px-3 py-2 transition-colors rounded-full text-gray-1 hover:bg-gray-100"
        >
          {{ isMyBooksViewAll ? "접기" : "전체보기 +" }}
        </button>
      </div>
      <div v-if="workbooks.length === 0" class="text-gray-500 text-center py-6">
        {{ noWorkbooksMessage }}
      </div>
      <div class="grid grid-cols-4 gap-4">
        <article
          v-for="book in workbooks.slice(0, 4)"
          :key="book.id"
          class="flex flex-col justify-between w-full h-40 bg-orange-3 gap-[50px] px-4 py-3 rounded-lg cursor-pointer"
          @click="goToProblemSet(book.id)"
        >
          <div class="min-h-12">
            <p class="font-pretend text-lg line-clamp-1 break-all">
              {{ book.title }}
            </p>
            <p class="text-sm text-gray-1 line-clamp-2">
              {{ book.description }}
            </p>
          </div>
          <div class="flex justify-between items-center">
            <img
              v-if="book.shared"
              :src="shareIcon"
              alt="공유됨"
              class="w-5 h-5"
              :class="{ 'opacity-0': !book.shared }"
            />
            <span v-else class="w-5 h-5"></span>
            <p class="font-medium">{{ problemCounts[book.id] || 0 }}문제</p>
          </div>
        </article>
      </div>

      <div v-if="isMyBooksViewAll" class="grid grid-cols-4 gap-4 mt-4">
        <article
          v-for="book in workbooks.slice(4)"
          :key="book.id"
          class="flex flex-col justify-between w-full h-40 bg-orange-3 gap-[50px] px-4 py-3 rounded-lg cursor-pointer"
          @click="goToProblemSet(book.id)"
        >
          <div class="min-h-12">
            <p class="font-pretend text-lg line-clamp-1 break-all">
              {{ book.title }}
            </p>
            <p class="text-sm text-gray-1 line-clamp-2">
              {{ book.description }}
            </p>
          </div>
          <div class="flex justify-between items-center">
            <img
              v-if="book.shared"
              :src="shareIcon"
              alt="공유됨"
              class="w-5 h-5"
              :class="{ 'opacity-0': !book.shared }"
            />
            <span v-else class="w-5 h-5"></span>
            <p class="font-medium">{{ problemCounts[book.id] || 0 }}문제</p>
          </div>
        </article>
      </div>

      <section class="flex flex-col gap-[18px] mt-16">
        <div class="flex items-center gap-[16px]">
          <h2 class="font-semibold text-xl">공유 받은 문제집</h2>
          <button
            v-if="sharedWorkbooks.length > 4"
            @click="toggleSharedBooksViewAll"
            class="px-3 py-2 transition-colors rounded-full text-gray-1 hover:bg-gray-100"
          >
            {{ isSharedBooksViewAll ? "접기" : "전체보기 +" }}
          </button>
        </div>
        <div
          v-if="sharedWorkbooks.length === 0"
          class="text-gray-500 text-center py-6"
        >
          현재 공유 받은 문제집이 없습니다.
        </div>
        <div class="grid grid-cols-4 gap-4">
          <article
            v-for="book in visibleSharedBooks"
            :key="book.id"
            class="flex flex-col justify-between w-full h-40 bg-orange-3 gap-[50px] px-4 py-3 rounded-lg cursor-pointer"
            @click="goToProblemSet(book.id)"
          >
            <div class="min-h-12">
              <p class="font-pretend text-lg line-clamp-1 break-all">
                {{ book.title }}
              </p>
              <p class="text-sm text-gray-1 line-clamp-2">
                {{ book.description }}
              </p>
            </div>
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <Avatar
                  :image="book.user.avatar_url"
                  class="mr-2 max-w-7 max-h-7"
                  shape="circle"
                />
                <span>{{ book.user.name }}</span>
              </div>
              <p class="font-medium">{{ problemCounts[book.id] || 0 }}문제</p>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>

  <!-- 아래의 img가 모달을 나오게 해주는 버튼 -->
  <img
    :src="createWorkbook"
    alt="createWorkbook"
    class="fixed flex items-center justify-center w-16 h-16 rounded-full cursor-pointer bg-orange-1 right-20 bottom-20"
    @click="openAddDialog"
  />
  <Dialog
    v-model:visible="showDialog"
    modal
    :closable="false"
    class="custom-dialog w-[500px]"
  >
    <template #header>
      <div class="flex justify-between items-center w-full border-gray-200">
        <span class="font-bold text-lg text-gray-800 flex-shrink-0"
          >문제집 추가하기</span
        >
        <button
          @click="showDialog = false"
          class="font-medium flex justify-center items-center w-8 h-8 rounded-full bg-transparent hover:bg-[#F0F0F0] transition-colors duration-300 text-xl"
        >
          X
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div>
        <label for="title" class="block text-sm font-medium">문제집 제목</label>
        <input
          id="title"
          type="text"
          class="w-full border rounded px-2 py-1"
          v-model="title"
        />
        <p class="text-xs text-gray-500 mt-1 text-right">
          {{ titleLength }} / 20
        </p>
      </div>
      <div>
        <label for="description" class="block text-sm font-medium"
          >문제집 설명</label
        >
        <textarea
          id="description"
          rows="4"
          class="w-full border rounded px-2 py-1 resize-none"
          v-model="description"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1 text-right">
          {{ descriptionLength }} / 200
        </p>
      </div>

      <div class="flex items-center gap-2">
        <label for="shared" class="text-sm font-medium">공개 여부</label>
        <ToggleSwitch v-model="shared" name="shared" />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="문제집 추가하기" class="p-button" @click="addWorkbook" />
        <Button
          label="취소"
          class="group p-button-text button-cancel"
          @click="showDialog = false"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.material-icons {
  font-size: 16px;
  vertical-align: middle;
}
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.custom-dialog .button-cancel:hover {
  background-color: #ffa500;
  color: #ffffff;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
