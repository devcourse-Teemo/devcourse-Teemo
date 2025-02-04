<script setup>
// APIs
import { inviteAPI } from "@/api/invite";
import { testCenterAPI } from "@/api/testCenter";

// Components
import SelectionChip from "./components/SelectionChip.vue";
import SelectWorkbook from "./components/SelectWorkbook.vue";
import SelectDateTime from "./components/SelectDateTime.vue";
import SelectParticipants from "./components/SelectParticipants.vue";

// Icons
import leftArrow from "@/assets/icons/create-exam-room/left-arrow.svg";
import rightArrow from "@/assets/icons/create-exam-room/right-arrow.svg";

// PrimeVue
import { Dialog, Button } from "primevue";
import { useToast } from "primevue/usetoast";

// Store
import { useAuthStore } from "@/store/authStore";

// Swiper
import "swiper/css";
import "swiper/css/effect-cards";
import { EffectCards } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";

// Vue Core
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const swiperInstance = ref(null);
const currentTab = ref(0);
const router = useRouter();
const toast = useToast();
const showConfirmDialog = ref(false);
const authStore = useAuthStore();

const tabs = [
  { label: "문제집", icon: "pi pi-book" },
  { label: "시간", icon: "pi pi-clock" },
  { label: "초대", icon: "pi pi-user-plus" },
];

// 시험 생성에 필요한 데이터
const examData = ref({
  selectedWorkbook: null,
  examDateTime: null,
  duration: null,
  participants: [],
});

// 완료 버튼 활성화 여부
const isCompleteEnabled = computed(() => {
  return (
    examData.value.selectedWorkbook &&
    examData.value.examDateTime &&
    examData.value.duration
  );
});

const dateTimeChip = computed(() => {
  if (!examData.value.examDateTime) return "";
  const startDate = new Date(examData.value.examDateTime);
  const durationInMs = examData.value.duration * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationInMs);
  return `${startDate.toLocaleString()} ~ ${endDate.toLocaleString()}`;
});

const participantsChip = computed(() => {
  const participants = examData.value.participants;
  if (!participants.length) return "";
  return `시험 인원 ${participants.length}명`;
});

const onSwiper = (swiper) => {
  swiperInstance.value = swiper;
};

const onSlideChange = () => {
  if (swiperInstance.value) {
    currentTab.value = swiperInstance.value.activeIndex;
  }
};

const setTab = (id) => {
  currentTab.value = id;
  if (swiperInstance.value) {
    swiperInstance.value.slideTo(id);
  }
};

const prevSlide = () => {
  if (swiperInstance.value && currentTab.value > 0) {
    swiperInstance.value.slidePrev();
  }
};

const nextSlide = () => {
  if (swiperInstance.value && currentTab.value < tabs.length - 1) {
    swiperInstance.value.slideNext();
  }
};

const resetDateTime = () => {
  examData.value.examDateTime = null;
  examData.value.duration = null;
};

const handleSubmit = () => {
  showConfirmDialog.value = true;
};

// 시험장 생성 요청
const submitExam = async () => {
  try {
    const currentUser = authStore.user;

    const body = {
      uid: currentUser?.id,
      workbook_id: examData.value.selectedWorkbook?.id,
      start_date: examData.value.examDateTime,
      end_date: new Date(
        examData.value.examDateTime.getTime() + examData.value.duration * 60000,
      ),
    };

    const result = await testCenterAPI.add(body);

    // 시험장 생성이 성공하면 초대 생성
    if (result && result.id) {
      const invites = examData.value.participants
        .filter((participant) => participant.email !== currentUser.email) // 로그인한 계정 제외
        .map((participant) => ({
          target_uid: participant.uid,
          test_center_id: result.id,
        }));

      const inviteResult = await inviteAPI.add(invites);

      if (inviteResult) {
        router.push("/exam-room");
      } else {
        throw new Error("초대 생성 실패");
      }
    } else {
      console.error(
        "시험장 생성 실패: result 객체가 유효하지 않습니다.",
        result,
      );
      throw new Error("시험장 생성 실패");
    }
  } catch (error) {
    console.error("시험장 생성 실패:", error);
    toast.add({
      severity: "error",
      summary: "시험장 생성 실패",
      detail: error.message || "시험장 생성 중 문제가 발생했습니다.",
      life: 3000,
    });
  }
};
</script>

<template>
  <h1 class="mb-8 text-5xl font-medium font-laundry">시험장 만들기</h1>

  <!-- Swiper -->
  <div class="relative h-[700px] overflow-visible pr-12">
    <Swiper
      :effect="'cards'"
      :modules="[EffectCards]"
      :grabCursor="true"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
      class="overflow-visible mySwiper"
    >
      <!-- 문제집 슬라이드 -->
      <SwiperSlide
        :class="{ 'active-slide': currentTab === 0 }"
        class="border border-beige-2"
      >
        <div class="relative px-16 py-6">
          <!-- Chips Container -->
          <div class="flex flex-wrap gap-2 mb-4">
            <SelectionChip
              v-if="examData.selectedWorkbook"
              :label="`${examData.selectedWorkbook.title}`"
              icon="pi pi-book"
              @remove="examData.selectedWorkbook = null"
              removable
            />
            <SelectionChip
              v-if="examData.examDateTime"
              :label="dateTimeChip"
              icon="pi pi-clock"
              @remove="resetDateTime"
              removable
            />
            <SelectionChip
              v-if="examData.participants.length"
              :label="participantsChip"
              icon="pi pi-users"
              @remove="examData.participants = []"
              removable
            />
          </div>

          <SelectWorkbook
            v-model:selectedWorkbook="examData.selectedWorkbook"
          />
          <div
            class="absolute z-20 transition-all duration-300 top-8"
            :style="{ right: '-3rem' }"
            @click="setTab(0)"
          >
            <div
              class="flex items-center gap-2 p-4 rounded-r-lg cursor-pointer bg-orange-2"
              :class="{ 'bg-orange-500': currentTab === 0 }"
            >
              <i class="text-white pi pi-book"></i>
            </div>
          </div>
        </div>
        <div class="absolute flex gap-4 bottom-6 right-6">
          <button
            @click="nextSlide"
            class="flex items-center gap-2 px-6 py-2 transition rounded text-gray-3 hover:text-gray-2"
          >
            다음으로
            <img :src="rightArrow" alt="다음으로 가기" />
          </button>
        </div>
      </SwiperSlide>

      <!-- 시간 선택 슬라이드 -->
      <SwiperSlide
        :class="{ 'active-slide': currentTab === 1 }"
        class="border border-beige-2"
      >
        <div class="relative px-16 py-6">
          <!-- Chips Container -->
          <div class="flex flex-wrap gap-2 mb-4">
            <SelectionChip
              v-if="examData.selectedWorkbook"
              :label="`${examData.selectedWorkbook.title}`"
              icon="pi pi-book"
              @remove="examData.selectedWorkbook = null"
              removable
            />
            <SelectionChip
              v-if="examData.examDateTime"
              :label="dateTimeChip"
              icon="pi pi-clock"
              @remove="resetDateTime"
              removable
            />
            <SelectionChip
              v-if="examData.participants.length"
              :label="participantsChip"
              icon="pi pi-users"
              @remove="examData.participants = []"
              removable
            />
          </div>

          <SelectDateTime
            v-model:examDateTime="examData.examDateTime"
            v-model:duration="examData.duration"
          />
          <div
            class="absolute z-20 transition-all duration-300 top-16"
            :style="{ right: '-3rem' }"
            @click="setTab(1)"
          >
            <div
              class="flex items-center gap-2 p-4 rounded-r-lg cursor-pointer bg-orange-2"
              :class="{ 'bg-orange-500': currentTab === 1 }"
            >
              <i class="text-white pi pi-clock"></i>
            </div>
          </div>
        </div>
        <div class="absolute flex gap-4 bottom-6 right-6">
          <button
            @click="prevSlide"
            class="flex items-center gap-2 px-6 py-2 transition rounded text-gray-3 hover:text-gray-2"
          >
            <img :src="leftArrow" alt="이전으로 가기" />
            이전으로
          </button>
          <button
            @click="nextSlide"
            class="flex items-center gap-2 px-6 py-2 transition rounded text-gray-3 hover:text-gray-2"
          >
            다음으로
            <img :src="rightArrow" alt="다음으로 가기" />
          </button>
        </div>
      </SwiperSlide>

      <!-- 참가자 선택 슬라이드 -->
      <SwiperSlide
        :class="{ 'active-slide': currentTab === 2 }"
        class="border border-beige-2"
      >
        <div class="relative px-16 py-6">
          <!-- Chips Container -->
          <div class="flex flex-wrap gap-2 mb-4">
            <SelectionChip
              v-if="examData.selectedWorkbook"
              :label="`${examData.selectedWorkbook.title}`"
              icon="pi pi-book"
              @remove="examData.selectedWorkbook = null"
              removable
            />
            <SelectionChip
              v-if="examData.examDateTime"
              :label="dateTimeChip"
              icon="pi pi-clock"
              @remove="resetDateTime"
              removable
            />
            <SelectionChip
              v-if="examData.participants.length"
              :label="participantsChip"
              icon="pi pi-users"
              @remove="examData.participants = []"
              removable
            />
          </div>

          <SelectParticipants v-model:participants="examData.participants" />
          <div
            class="absolute z-20 transition-all duration-300 top-32"
            :style="{ right: '-3rem' }"
            @click="setTab(2)"
          >
            <div
              class="flex items-center gap-2 p-4 rounded-r-lg cursor-pointer bg-orange-2"
              :class="{ 'bg-orange-500': currentTab === 2 }"
            >
              <i class="text-white pi pi-user-plus"></i>
            </div>
          </div>
        </div>
        <div class="absolute flex gap-4 bottom-6 right-6">
          <button
            @click="prevSlide"
            class="flex items-center gap-2 px-6 py-2 transition rounded text-gray-3 hover:text-gray-2"
          >
            <img :src="leftArrow" alt="이전으로 가기" />
            이전으로
          </button>
          <button
            @click="handleSubmit"
            :disabled="!isCompleteEnabled"
            class="px-10 py-2 text-white bg-orange-500 rounded-full hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            완료하기
          </button>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>

  <!-- 확인 다이얼로그 -->
  <Dialog
    v-model:visible="showConfirmDialog"
    header="시험장 생성 확인"
    :modal="true"
    class="w-[500px]"
  >
    <div class="space-y-4">
      <h3 class="text-lg font-medium">설정한 시험장 환경은 다음과 같습니다.</h3>
      <div class="space-y-2">
        <p>
          <span class="font-medium">선택한 문제집:</span>
          {{ examData.selectedWorkbook?.title }}
        </p>
        <p>
          <span class="font-medium">날짜:</span>
          {{ examData.examDateTime?.toLocaleDateString() }}
        </p>
        <p>
          <span class="font-medium">시작 시간:</span>
          {{ examData.examDateTime?.toLocaleTimeString() }}
        </p>
        <p>
          <span class="font-medium">시험 응시 시간:</span>
          {{ examData.duration }}분
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="취소"
          @click="showConfirmDialog = false"
          class="p-button-text"
        />
        <Button
          label="확인"
          @click="submitExam"
          class="bg-orange-500 border-orange-500"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.mySwiper {
  width: 100%;
  height: 100% !important;
}

:deep(.swiper) {
  overflow: visible !important;
}

:deep(.swiper-wrapper) {
  height: 100%;
}

:deep(.swiper-slide) {
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  height: 100%;
  background-color: #f3f4f6;
  transition: all 0.3s ease;
  overflow: visible !important;
  position: relative;
}

:deep(.swiper-slide-shadow) {
  background: #faf8f1 !important;
}

:deep(.swiper-slide-active),
.active-slide {
  background-color: white !important;
}

:deep(.swiper-slide:not(.swiper-slide-active):not(.active-slide)) {
  background-color: #faf8f1 !important;
}

:deep(.pi) {
  color: white !important;
}
</style>
