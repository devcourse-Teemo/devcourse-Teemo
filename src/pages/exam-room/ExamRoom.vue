<script setup>
// Vue Core
import { ref, computed, watchEffect } from "vue";
import { RouterLink, useRouter } from "vue-router";

// Components
import ExamCard from "@/pages/exam-room/components/ExamCard.vue";
import InvitedExamCard from "./components/InvitedExamCard.vue";

// Icons
import createIcon from "@/assets/icons/exam-room/edit_square.svg";

// APIs
import { testCenterAPI } from "@/api/testCenter";
import { inviteAPI } from "@/api/invite";

// Store & Composables
import { useAuthStore } from "@/store/authStore";
import { useConfirm } from "primevue/useconfirm";
import { ConfirmDialog } from 'primevue';

// Constants
const ITEMS_PER_PAGE = 4;

// Store & Composables instances
const authStore = useAuthStore();
const confirm = useConfirm();
const router = useRouter();

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
  ongoingExams.value.slice(0, ongoingExamsDisplayCount.value)
);

const visibleMyExams = computed(() =>
  myExams.value.slice(0, myExamsDisplayCount.value)
);

const visiblePendingInvites = computed(() =>
  invitedExams.value.slice(0, invitedExamsDisplayCount.value)
);

// Computed - Show More Button
const showMoreButtons = computed(() => ({
  ongoing: ongoingExams.value.length > ITEMS_PER_PAGE,
  myExams: myExams.value.length > ITEMS_PER_PAGE,
  invited: invitedExams.value.length > ITEMS_PER_PAGE
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

// Methods - Data Fetching
const fetchExams = async () => {
  if (!authStore.user?.id) return;

  const now = new Date();
  try {
    // 1. 내가 만든 시험장 목록
    const testCenterResponse = await testCenterAPI.getAllFields(authStore.user.id);

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

    // 초대된 시험 중 미응답이면서 종료일이 지나지 않은 시험만 표시
    invitedExams.value = inviteResponse?.filter((invite) => {
      const endDate = new Date(invite.test_center.end_date);
      return !invite.participate && endDate >= now;  // 종료일이 현재보다 이후인 시험만 필터링
    }) || [];
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
            />
          </div>
        </li>
      </ul>
    </section>

    <!-- 내가 만든 시험 섹션 -->
    <section class="w-full mb-8">
      <div class="flex gap-2 items-center mb-4">
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
          />
        </li>
      </ul>
    </section>

    <!-- 초대받은 시험 섹션 -->
    <section class="w-full mb-8">
      <div class="flex gap-2 items-center mb-4">
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
          />
        </li>
      </ul>
    </section>
  </div>

  <RouterLink
    to="/create-exam-room"
    class="fixed flex items-center justify-center w-16 h-16 rounded-full cursor-pointer bg-orange-1 right-20 bottom-20"
  >
    <img :src="createIcon" alt="새 시험장 만들기" class="w-8 h-8" />
  </RouterLink>

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