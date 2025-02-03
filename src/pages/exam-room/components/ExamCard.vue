<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { formatterIntlKR } from "@/utils/formatterIntlKR.js";
import { formatMsToHourMinute } from "@/utils/formatMsToHour";
import { inviteAPI } from "@/api/invite";
import { testCenterAPI } from "@/api/testCenter";
import { workbookAPI } from "@/api/workbook";

// Icons
import calendarIcon from "@/assets/icons/exam-room/fi-rr-calendar.svg";
import userIcon from "@/assets/icons/exam-room/fi-rr-user.svg";
import folderIcon from "@/assets/icons/exam-room/fi-rr-folder.svg";
import timeFastIcon from "@/assets/icons/exam-room/fi-rr-time-fast.svg";
import trashIcon from "@/assets/icons/exam-room/fi-rr-trash.svg";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  workbook_id: {
    type: Number,
    required: true,
  },
  workbook: {
    type: Object,
    required: true,
    default: () => ({
      title: "",
      description: "",
      problems: [],
    }),
  },
  start_date: {
    type: String,
    required: true,
  },
  end_date: {
    type: String,
    required: true,
  },
  showEditButtons: {
    type: Boolean,
    default: false,
  },
  confirmed_count: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["delete-exam"]);
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Refs
const showExamInfo = ref(false);
const isProcessing = ref(false);
const participantCount = ref(0);
const problemCount = ref(0);
const creator = ref(null);
const participants = ref([]);

// Computed
const workbookTitle = computed(() => props.workbook?.title || "제목 없음");
const workbookDescription = computed(
  () => props.workbook?.description || "설명 없음",
);

const isOngoing = computed(() => {
  const now = new Date();
  const startDate = new Date(props.start_date);
  const endDate = new Date(props.end_date);
  return now >= startDate && now <= endDate;
});

const examDuration = computed(() => {
  if (!props.start_date || !props.end_date) return "";
  const diff = new Date(props.end_date) - new Date(props.start_date);
  return formatMsToHourMinute(diff);
});

const formattedDate = computed(() => {
  if (!props.start_date) return "";
  return formatterIntlKR.format(new Date(props.start_date));
});

// Methods
const handleExamStart = () => {
  router.push(`/exam/${props.id}`);
  showExamInfo.value = false;
};

const handleDelete = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    await testCenterAPI.deleteTestCenter(props.id);
    toast.add({
      severity: "success",
      summary: "삭제 완료",
      detail: "시험이 삭제되었습니다.",
      life: 3000,
    });
    emit("delete-exam");
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "삭제 실패",
      detail: "삭제 요청 처리 중 오류가 발생했습니다.",
      life: 3000,
    });
  } finally {
    isProcessing.value = false;
  }
};

const confirmDelete = (event) => {
  event.stopPropagation();
  confirm.require({
    message: "정말 이 시험을 삭제하시겠습니까?",
    header: "시험 삭제 확인",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "삭제",
    rejectLabel: "취소",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    accept: handleDelete,
    reject: () => {},
  });
};

const fetchProblemCount = async () => {
  try {
    problemCount.value = await workbookAPI.getWorkbookProblemCount(
      props.workbook_id,
    );
  } catch (error) {
    console.error("문제 수를 가져오는 데 실패했습니다:", error);
  }
};

// Watchers
watch(
  () => [props.id, props.workbook_id],
  async ([newId, newWorkbookId]) => {
    if (newId && newWorkbookId) {
      try {
        participantCount.value = await inviteAPI.getParticipantCount(props.id);
        await fetchProblemCount();
        const participantData = await testCenterAPI.getTestCenterParticipants(
          props.id,
        );
        creator.value = participantData.creator;
        participants.value = participantData.participants;
      } catch (error) {
        console.error("참가자 목록 로딩 실패:", error);
        participants.value = [];
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    @click="showExamInfo = true"
    class="bg-orange-3 rounded-lg p-4 w-full text-gray-2 cursor-pointer"
  >
    <div class="item-between mb-4">
      <h3
        class="font-medium text-lg line-clamp-1"
        v-tooltip.top="workbookTitle"
      >
        {{ workbookTitle }}
      </h3>
      <div v-if="showEditButtons" class="flex gap-2">
        <button
          class="flex items-center justify-center w-8 h-8 bg-black-1/5 rounded-full hover:bg-black-1/10"
          @click.stop="confirmDelete"
        >
          <img :src="trashIcon" alt="delete icon" class="w-4 h-4" />
        </button>
      </div>
    </div>
    <ul class="flex flex-col gap-2">
      <li class="flex items-center gap-2 text-sm">
        <img :src="userIcon" alt="user icon" class="w-3 h-3" />
        <span>{{ participantCount + 1 }}명</span>
      </li>
      <li class="flex items-center gap-2 text-sm">
        <img :src="calendarIcon" alt="calendar icon" class="w-3 h-3" />
        <span>{{ formattedDate }}</span>
      </li>
      <li class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm">
          <img :src="timeFastIcon" alt="time icon" class="w-3 h-3" />
          <span>{{ examDuration }} 소요</span>
        </div>
        <span class="font-semibold">{{ problemCount }}문제</span>
      </li>
    </ul>
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
      <!-- 참가자 정보 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="userIcon" alt="참가 인원" class="w-6 h-6" />
          참가자 {{ participantCount + 1 }}명
        </h4>
        <div class="text-black-2 ml-9">
          <p class="text-gray-600">
            <strong class="font-semibold">주최자</strong>
            {{ creator?.name || "알 수 없음" }}
          </p>
          <p class="text-gray-600">
            <strong class="font-semibold">참가자</strong>
            {{ participants.map((p) => p.name).join("  ") || "없음" }}
          </p>
        </div>
      </div>
      <!-- 시험 일정 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="calendarIcon" alt="시험 일정" class="w-6 h-6" />
          기간
        </h4>
        <p class="text-black-2 ml-9">
          {{ formatterIntlKR.format(new Date(props.start_date)) }} -
          {{ formatterIntlKR.format(new Date(props.end_date)) }}
        </p>
      </div>
      <!-- 소요 시간 -->
      <div>
        <h4 class="text-xl font-medium flex items-center gap-3 mb-1">
          <img :src="timeFastIcon" alt="소요 시간" class="w-6 h-6" />
          소요 시간
        </h4>
        <p class="text-black-2 ml-9">
          {{ examDuration }}
        </p>
      </div>
    </div>

    <template #footer>
      <Button
        v-if="isOngoing"
        label="시험장 입실하기"
        icon="pi pi-check"
        @click="handleExamStart"
        autofocus
      />
      <span v-else class="text-gray-500">아직 입실할 수 없습니다</span>
    </template>
  </Dialog>
</template>

<style scoped>
* {
  color: #4f4f4f;
}

.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.p-confirm-dialog .p-confirm-dialog-accept,
.p-confirm-dialog .p-confirm-dialog-reject {
  padding: 0.5rem 1.5rem !important;
  border: none;
}

:deep(.p-dialog-footer) {
  width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  text-align: center !important;
  padding: 1rem 0 !important;
}
</style>
