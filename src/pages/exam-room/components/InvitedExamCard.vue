<script setup>
// Icons
import calendarIcon from "@/assets/icons/exam-room/fi-rr-calendar.svg";
import userIcon from "@/assets/icons/exam-room/fi-rr-user.svg";
import folderIcon from "@/assets/icons/exam-room/fi-rr-folder.svg";
import timeFastIcon from "@/assets/icons/exam-room/fi-rr-time-fast.svg";

// Vue Core
import { ref, computed, watchEffect } from "vue";
import { useRouter } from "vue-router";

// PrimeVue
import { useToast } from "primevue/usetoast";
import Dialog from "primevue/dialog";

// API
import { inviteAPI } from "@/api/invite";
import { workbookAPI } from "@/api/workbook";
import { userAPI } from "@/api/user";
import { authAPI } from "@/api/auth";

// Utils
import { formatMsToHourMinute } from "@/utils/formatMsToHour";
import { formatterIntlKR } from "@/utils/formatterIntlKR.js";

const props = defineProps({
  inviteData: {
    type: Object,
    required: true,
  },
  testCenter: {
    type: Object,
    required: true,
  },
});

// Refs
const showExamInfo = ref(false);
const router = useRouter();
const isProcessing = ref(false);
const workbookTitle = ref("");
const workbookDescription = ref("");
const userName = ref("");
const userId = ref(null);
const emit = defineEmits(["exam-status-change"]);
const toast = useToast();
const isAccepted = ref(false);
const isRejected = ref(false);

const examDuration = computed(() => {
  if (!props.testCenter.start_date || !props.testCenter.end_date) return "";
  const diff =
    new Date(props.testCenter.end_date) - new Date(props.testCenter.start_date);
  return formatMsToHourMinute(diff);
});

const formattedDate = computed(() => {
  if (!props.testCenter.start_date) return "";
  return formatterIntlKR.format(new Date(props.testCenter.start_date));
});

const fetchWorkbookTitle = async () => {
  try {
    const workbook = await workbookAPI.getOne(props.testCenter.workbook_id);
    if (workbook) {
      workbookTitle.value = workbook.title;
      workbookDescription.value = workbook.description;
    } else {
      console.error("Workbook not found");
    }
  } catch (error) {
    console.error("문제집 제목을 가져오는 중 오류 발생:", error);
  }
};

const fetchUserName = async () => {
  try {
    const user = await userAPI.getOne(props.testCenter.uid);
    if (user) {
      userName.value = user.name;
    } else {
      console.error("User not found");
    }
  } catch (error) {
    console.error("사용자 이름을 가져오는 중 오류 발생:", error);
  }
};

const fetchCurrentUserId = async () => {
  try {
    const currentUser = await authAPI.getCurrentUser();
    if (currentUser) {
      userId.value = currentUser.id;
    } else {
      console.error("Current user not found");
    }
  } catch (error) {
    console.error("현재 사용자 정보를 가져오는 중 오류 발생:", error);
  }
};

const handleAccept = async () => {
  if (isProcessing.value || !userId.value) return;
  isProcessing.value = true;
  try {
    await inviteAPI.accept(userId.value, props.inviteData.id);
    isAccepted.value = true; // 승인 상태 저장
    toast.add({
      severity: "success",
      summary: "승인 완료",
      detail: "시험에 참여 승인되었습니다.",
      life: 3000,
    });
    emit("exam-status-change");
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "오류",
      detail: "승인 요청 처리 중 오류가 발생했습니다.",
      life: 3000,
    });
  } finally {
    isProcessing.value = false;
  }
};

const handleDeny = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    await inviteAPI.deny(props.inviteData.id);
    isRejected.value = true;
    toast.add({
      severity: "success",
      summary: "초대 거절",
      detail: "시험 초대를 거절했습니다.",
      life: 3000,
    });
    emit("exam-status-change");
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "삭제 실패",
      detail: "거절 요청 처리 중 오류가 발생했습니다.",
      life: 3000,
    });
  } finally {
    isProcessing.value = false;
  }
};

watchEffect(() => {
  fetchWorkbookTitle();
  fetchUserName();
  fetchCurrentUserId();
});
</script>

<template>
  <div
    @click="showExamInfo = true"
    v-if="!isRejected"
    class="bg-orange-3 rounded-lg p-4 w-full text-gray-2"
  >
    <!-- 문제집 제목 -->
    <div class="item-between" aria-label="title-wrapper">
      <h3 class="mb-4 font-medium text-lg">{{ workbookTitle }}</h3>
    </div>
    <!-- 시험장 생성자 -->
    <div class="flex items-center gap-2 mb-2 text-sm">
      <img :src="userIcon" alt="user icon" class="w-3 h-3" />
      <span>{{ userName }}</span>
    </div>
    <!-- 문제집 설명 -->
    <div class="flex items-center gap-2 mb-2 text-sm">
      <img :src="folderIcon" alt="folder icon" class="w-3 h-3" />
      <span>{{ workbookDescription }}</span>
    </div>
    <!-- 시작 시간 -->
    <div class="flex items-center gap-2 mb-2 text-sm">
      <img :src="calendarIcon" alt="calendar icon" class="w-3 h-3" />
      <span>{{ formattedDate }}</span>
    </div>
    <!-- 소요 시간 -->
    <div class="flex items-center gap-2 mb-4 text-sm">
      <img :src="timeFastIcon" alt="time icon" class="w-3 h-3" />
      <span>{{ examDuration }} 소요</span>
    </div>

    <div v-if="!isAccepted" class="flex gap-2">
      <button
        @click.stop="handleAccept"
        class="bg-black-1/10 text-white px-2 py-1 rounded-md font-medium hover:bg-black-1/20 w-1/2 flex justify-center items-center"
      >
        승인
      </button>
      <button
        @click.stop="handleDeny"
        class="bg-red-500/60 deny text-white px-2 py-1 rounded-md font-medium hover:bg-red-600/60 w-1/2 flex justify-center items-center"
      >
        거절
      </button>
    </div>
  </div>
  <Dialog
    v-model:visible="showExamInfo"
    modal
    header="시험장 입실"
    :style="{ width: '40rem' }"
  >
    <div class="flex flex-col gap-4">
      <!-- 문제집 이름 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="folderIcon" alt="문제집 이름" class="w-6 h-6" />
          {{ workbookTitle }}
        </h4>
        <p class="text-black-2 ml-9">{{ workbookDescription }}</p>
      </div>
      <!-- 초대자 정보 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="userIcon" alt="초대한 사람" class="w-6 h-6" />
          초대한 사람
        </h4>
        <p class="text-black-2 ml-9">{{ userName }}</p>
      </div>
      <!-- 시험 일정 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="calendarIcon" alt="시험 일정" class="w-6 h-6" />
          기간
        </h4>
        <p class="text-black-2 ml-9">
          {{ formatterIntlKR.format(new Date(testCenter.start_date)) }} -
          {{ formatterIntlKR.format(new Date(testCenter.end_date)) }}
        </p>
      </div>
      <!-- 소요 시간 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="timeFastIcon" alt="소요 시간" class="w-6 h-6" />
          소요 시간
        </h4>
        <p class="text-black-2 ml-9">
          {{
            formatMsToHourMinute(
              new Date(testCenter.end_date) - new Date(testCenter.start_date),
            )
          }}
        </p>
      </div>
    </div>

    <template #footer>
      <span class="text-gray-500">아직 입실할 수 없습니다</span>
    </template>
  </Dialog>
</template>

<style scoped>
* {
  color: #4f4f4f;
}

.deny {
  color: white;
}

:deep(.p-dialog-footer) {
  width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  text-align: center !important;
  padding: 1rem 0 !important;
}
</style>
