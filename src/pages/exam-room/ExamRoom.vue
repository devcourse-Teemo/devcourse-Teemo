<script setup>
// APIs
import { userAPI } from "@/api/user";
import { inviteAPI } from "@/api/invite";
import { testCenterAPI } from "@/api/testCenter";

// Components
import InvitedExamCard from "./components/InvitedExamCard.vue";

import ExamCard from "@/pages/exam-room/components/ExamCard.vue";

// Icons
import createIcon from "@/assets/icons/exam-room/edit_square.svg";

// PrimeVue
import { ConfirmDialog, useToast } from "primevue";

// Store
import { useAuthStore } from "@/store/authStore";

// Utils
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";

// Vue Core
import { useRouter } from "vue-router";
import { ref, computed, watchEffect } from "vue";

// Constants
const ITEMS_PER_PAGE = 4;

// Store & Composables instances
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Data Refs
const ongoingExams = ref([]);
const myExams = ref([]);
const invitedExams = ref([]);

// Display State Refs
const ongoingExamsDisplayCount = ref(ITEMS_PER_PAGE);
const myExamsDisplayCount = ref(ITEMS_PER_PAGE);
const invitedExamsDisplayCount = ref(ITEMS_PER_PAGE);

const isOngoingExamsExpanded = ref(false);
const isMyExamsExpanded = ref(false);
const isInvitedExamsExpanded = ref(false);

// Computed - Visible Items
const visibleOngoingExams = computed(() =>
  ongoingExams.value.slice(0, ongoingExamsDisplayCount.value),
);

const visibleMyExams = computed(() =>
  myExams.value.slice(0, myExamsDisplayCount.value),
);

const visiblePendingInvites = computed(() =>
  invitedExams.value.slice(0, invitedExamsDisplayCount.value),
);

// Computed - Show More Button
const showMoreButtons = computed(() => ({
  ongoing: ongoingExams.value.length > ITEMS_PER_PAGE,
  myExams: myExams.value.length > ITEMS_PER_PAGE,
  invited: invitedExams.value.length > ITEMS_PER_PAGE,
}));

// Methods - Toggle Display
const toggleOngoingExamsDisplay = () => {
  isOngoingExamsExpanded.value = !isOngoingExamsExpanded.value;
  ongoingExamsDisplayCount.value = isOngoingExamsExpanded.value
    ? ongoingExams.value.length
    : ITEMS_PER_PAGE;
};

const toggleMyExamsDisplay = () => {
  isMyExamsExpanded.value = !isMyExamsExpanded.value;
  myExamsDisplayCount.value = isMyExamsExpanded.value
    ? myExams.value.length
    : ITEMS_PER_PAGE;
};

const toggleInvitedExamsDisplay = () => {
  isInvitedExamsExpanded.value = !isInvitedExamsExpanded.value;
  invitedExamsDisplayCount.value = isInvitedExamsExpanded.value
    ? invitedExams.value.length
    : ITEMS_PER_PAGE;
};

const navigateToCreateExam = async () => {
  const user = await userAPI.getOne(authStore.user.id);
  const grade = getCurrentGradeInfo(user.total_points);

  const acceptedInviteExam =
    invitedExams.value.filter((invite) => invite.participate) || [];

  const currentExamsLength =
    myExams.value.length +
    ongoingExams.value.length +
    acceptedInviteExam.length;

  if (currentExamsLength >= grade.current.examLimit) {
    toast.add({
      severity: "error",
      summary: "시험 생성 실패",
      detail: "현재 등급에서의 시험 갯수 제한에 도달했습니다.",
      life: 3000,
    });
    return;
  }
  router.push("/create-exam-room");
};

// Methods - Data Fetching
const fetchExams = async () => {
  if (!authStore.user?.id) return;

  const now = new Date();
  try {
    // 1. 내가 만든 시험장 목록
    const testCenterResponse = await testCenterAPI.getAllFields(
      authStore.user.id,
    );

    // 2. 초대받은 시험장 목록
    const inviteResponse = await inviteAPI.getAll(authStore.user.id);
    const acceptedInvites =
      inviteResponse?.filter((invite) => invite.participate) || [];

    // 두 목록 합치기
    const allExams = [
      ...(testCenterResponse || []),
      ...acceptedInvites.map((invite) => ({
        ...invite.test_center,
        isInvited: true,
      })),
    ];

    // 시험 상태별 분류
    const categorizeExams = (exams) => {
      return exams.filter((exam) => {
        const startDate = new Date(exam.start_date);
        const endDate = new Date(exam.end_date);
        return now >= startDate && now <= endDate;
      });
    };

    ongoingExams.value = categorizeExams(allExams);

    // 진행중이 아닌 시험 필터링 (내가 만든 시험만)
    const ongoingExamIds = ongoingExams.value.map((exam) => exam.id);
    myExams.value =
      testCenterResponse?.filter((exam) => {
        const endDate = new Date(exam.end_date);
        return !ongoingExamIds.includes(exam.id) && endDate >= now;
      }) || [];

    // 초대된 시험 중 미응답 목록
    invitedExams.value =
      inviteResponse?.filter((invite) => !invite.participate) || [];
  } catch (error) {
    console.error("시험 데이터 로딩 실패:", error);
  }
};

// Watchers
watchEffect(fetchExams);
</script>

<template>
  <div class="w-full">
    <h1 class="mb-16 text-5xl font-medium font-laundry">내 시험장</h1>

    <!-- 진행중인 시험 섹션 -->
    <section class="w-full mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-medium text-gray-2">진행중인 시험</h2>
        <button
          v-if="showMoreButtons.ongoing"
          @click="toggleOngoingExamsDisplay"
          class="px-3 py-2 transition-colors rounded-full text-gray-1 hover:bg-gray-100"
        >
          {{ isOngoingExamsExpanded ? "접기" : "전체보기 +" }}
        </button>
      </div>

      <div
        v-if="ongoingExams.length === 0"
        class="w-full py-10 text-gray-500 item-middle"
      >
        현재 진행중인 시험이 없습니다.
      </div>

      <ul v-else class="flex flex-wrap gap-6">
        <li
          v-for="exam in visibleOngoingExams"
          :key="exam.id"
          class="basis-[calc(25%-1.2rem)]"
        >
          <div
            :class="{
              'cursor-not-allowed opacity-50': !(
                exam.uid === authStore.user?.id || exam.isInvited
              ),
            }"
          >
            <ExamCard
              v-bind="{
                ...exam,
                showEditButtons: false,
                isClickable: exam.uid === authStore.user?.id || exam.isInvited,
              }"
              @invite-accepted="fetchExams"
            />
          </div>
        </li>
      </ul>
    </section>

    <!-- 내가 만든 시험 섹션 -->
    <section class="w-full mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-medium text-gray-2">내가 만든 시험</h2>
        <button
          v-if="showMoreButtons.myExams"
          @click="toggleMyExamsDisplay"
          class="px-3 py-2 transition-colors rounded-full text-gray-1 hover:bg-gray-100"
        >
          {{ isMyExamsExpanded ? "접기" : "전체보기 +" }}
        </button>
      </div>

      <div
        v-if="myExams.length === 0"
        class="w-full py-10 text-gray-500 item-middle"
      >
        아직 만든 시험이 없습니다.
      </div>

      <ul v-else class="flex flex-wrap gap-6">
        <li
          v-for="exam in visibleMyExams"
          :key="exam.id"
          class="basis-[calc(25%-1.2rem)]"
        >
          <ExamCard
            v-bind="{
              ...exam,
              showEditButtons: true,
            }"
            @exam-deleted="fetchExams"
          />
        </li>
      </ul>
    </section>

    <!-- 초대받은 시험 섹션 -->
    <section class="w-full mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-medium text-gray-2">초대받은 시험</h2>
        <button
          v-if="showMoreButtons.invited"
          @click="toggleInvitedExamsDisplay"
          class="px-3 py-2 transition-colors rounded-full text-gray-1 hover:bg-gray-100"
        >
          {{ isInvitedExamsExpanded ? "접기" : "전체보기 +" }}
        </button>
      </div>

      <div
        v-if="invitedExams.length === 0"
        class="w-full py-10 text-gray-500 item-middle"
      >
        초대받은 시험이 없습니다.
      </div>

      <ul v-else class="flex flex-wrap gap-6">
        <li
          v-for="invite in visiblePendingInvites"
          :key="invite.id"
          class="basis-[calc(25%-1.2rem)]"
        >
          <InvitedExamCard
            :invite-data="invite"
            :test-center="invite.test_center"
            @exam-status-change="fetchExams"
          />
        </li>
      </ul>
    </section>
  </div>

  <button
    @click="navigateToCreateExam"
    class="fixed flex items-center justify-center w-16 h-16 rounded-full cursor-pointer bg-orange-1 right-20 bottom-20"
  >
    <img :src="createIcon" alt="새 시험장 만들기" class="w-8 h-8" />
  </button>

  <ConfirmDialog />
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  box-sizing: border-box;
}
</style>
