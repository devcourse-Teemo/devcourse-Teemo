<script setup>
// APIs
import { pointAPI } from "@/api/point";
import { followAPI } from "@/api/follow";

// Const
import { GRADES } from "@/const/grades";
import { PointType } from "@/const/PointType";

// Components
import EmptyText from "@/components/layout/EmptyText.vue";

// Prime Vue
import { Column, DataTable } from "primevue";

// Store
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/store/authStore";

// Utils
import { formatDate } from "@/utils/formatDate";

// Vue Core
import { ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const pointHistories = ref([]);
const followers = ref([]);
const followings = ref([]);
const TAB = {
  following: "팔로잉 목록",
  follower: "팔로워 목록",
  point: "포인트 내역",
};
const TABS = [TAB.following, TAB.follower, TAB.point];

const currentTab = ref(route.query.tab || TABS[0]);

const getMessageFromPointType = (pointType) => {
  switch (pointType) {
    case PointType.problem:
      return "새로운 문제를 생성하셨군요! 5포인트를 획득했습니다.";
    case PointType.comment:
      return "댓글을 작성하셨군요! 2포인트를 획득했습니다.";
    case PointType.test_complete:
      return "시험을 완료하셨군요! 9포인트를 획득했습니다.";
    case PointType.test_correct_all:
      return "시험에서 문제를 다 맞히셨군요! 10포인트를 획득했습니다.";
    default:
      break;
  }
};

watch(
  () => route.query.tab,
  async (tab) => {
    currentTab.value = tab || TAB.following;

    if (tab === TAB.follower) {
      const followerData = await followAPI.getFollowers(user.value.id);
      followers.value = followerData;
    } else if (tab === TAB.point) {
      const pointData = await pointAPI.getAll(user.value.id);
      pointHistories.value = pointData;
    } else {
      const followingData = await followAPI.getFollowing(user.value.id);
      followings.value = followingData;
    }
  },
  { immediate: true },
);
</script>
<template>
  <section class="flex flex-col gap-6">
    <div class="flex gap-8 text-xl font-semibold text-black-2">
      <RouterLink
        v-for="tab in TABS"
        :to="`${route.path}?tab=${tab}`"
        :key="tab"
        :class="
          currentTab === tab
            ? 'text-orange-1'
            : 'hover:text-gray-1 transition-colors'
        "
        replace
      >
        {{ tab }}
      </RouterLink>
    </div>

    <!-- 팔로잉 목록 탭 -->
    <div v-if="currentTab === '팔로잉 목록'">
      <div
        v-if="!followings.length"
        class="flex items-center justify-center h-40"
      >
        <EmptyText>팔로잉한 유저가 없습니다...</EmptyText>
      </div>
      <div v-else class="grid grid-cols-6 gap-4">
        <RouterLink
          v-for="{ following } in followings"
          :to="`/users/${following.id}`"
          class="flex flex-col items-center justify-center h-40 gap-4 px-2 py-5 rounded-lg w-36 bg-black-6/20"
        >
          <p v-if="!following" class="">아직 팔로잉한 사람이 없어요...</p>
          <img
            class="w-16 h-16 border rounded-full border-black-4"
            :src="following.avatar_url"
            alt="프로필 이미지"
          />
          <div class="flex flex-col items-center gap-1">
            <p class="text-sm font-semibold">{{ following.name }}</p>
            <p class="text-xs font-medium text-black-3">
              {{ following.email }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- 팔로워 목록 탭 -->
    <div v-else-if="currentTab === '팔로워 목록'">
      <div
        v-if="!followers.length"
        class="flex items-center justify-center h-40"
      >
        <EmptyText>아직 나를 팔로우 한 유저가 없습니다...</EmptyText>
      </div>
      <div v-else class="grid grid-cols-6 gap-4">
        <RouterLink
          v-for="{ follower } in followers"
          :to="`/users/${follower.id}`"
          class="flex flex-col items-center justify-center h-40 gap-4 px-2 py-5 rounded-lg w-36 bg-black-6/20"
        >
          <img
            class="w-16 h-16 border rounded-full border-black-4"
            :src="follower.avatar_url"
            alt="프로필 이미지"
          />
          <div class="flex flex-col items-center gap-1">
            <p class="text-sm font-semibold">{{ follower.name }}</p>
            <p class="text-xs font-medium text-black-3">{{ follower.email }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- 포인트 내역 탭 -->
    <div v-else class="flex flex-col gap-6">
      <div class="flex h-full gap-3">
        <div
          v-for="grade in [GRADES.one, GRADES.two, GRADES.three]"
          class="flex gap-4 w-[50rem] bg-black-6 p-4 rounded-lg"
        >
          <div class="flex items-center justify-center">
            <img
              :src="grade.imgSrc"
              class="object-cover w-16 h-20"
              alt="등급 이미지"
            />
          </div>
          <div class="flex flex-col justify-center gap-4">
            <div class="flex flex-col">
              <p class="mr-2 font-semibold">{{ grade.name }}</p>
              <p class="text-sm text-[10px]">{{ grade.point }}포인트</p>
            </div>
            <div>
              <p class="text-sm">
                <span
                  class="mr-2 pi pi-circle-fill"
                  style="font-size: 6px"
                ></span>
                <span>시험장 {{ grade.examLimit }}개</span>
              </p>
              <p class="text-sm">
                <span
                  class="mr-2 pi pi-circle-fill"
                  style="font-size: 6px"
                ></span>
                <span>문제집 {{ grade.problemSetLimit }}개</span>
              </p>
            </div>
          </div>
        </div>
        <div
          class="flex flex-col justify-between w-full gap-2 px-6 py-4 rounded-lg bg-black-6"
        >
          <p>포인트 획득</p>
          <div class="flex flex-col gap-1 text-sm">
            <p>
              <span>문제 생성 : </span>
              <span class="ml-1 font-semibold">5 포인트</span>
            </p>
            <p>
              <span>댓글 작성 : </span>
              <span class="ml-1 font-semibold">2 포인트</span>
            </p>
            <div>
              <p>
                <span>시험 완료 (10문제 이상) :</span>
                <span class="ml-1 font-semibold">9 포인트</span>
              </p>
              <p class="flex items-center">
                <span
                  class="mr-2 pi pi-circle-fill"
                  style="font-size: 6px"
                ></span>
                <span>모두 정답 :</span>
                <span class="mx-1 font-semibold">1 포인트</span> 추가 획득
              </p>
            </div>
          </div>
        </div>
      </div>
      <DataTable
        :value="pointHistories"
        dataKey="id"
        tableStyle="min-width: 50rem;"
        showGridlines
        paginator
        :rows="10"
      >
        <template #empty>아직 적립된 포인트가 없어요...</template>
        <Column field="point_type" header="종류">
          <template #body="slotProps">
            <span
              v-if="slotProps.data.point_type === PointType.problem"
              class="pi pi-pencil"
            ></span>
            <span
              v-else-if="slotProps.data.point_type === PointType.comment"
              class="pi pi-comment"
            ></span>
            <span
              v-else-if="slotProps.data.point_type === PointType.test_complete"
              class="pi pi-stopwatch"
            ></span>
            <span
              v-else-if="
                slotProps.data.point_type === PointType.test_correct_all
              "
              class="pi pi-stopwatch text-orange-1"
            ></span>
          </template>
        </Column>
        <Column field="point_type" header="메시지">
          <template #body="slotProps">
            {{ getMessageFromPointType(slotProps.data.point_type) }}
          </template>
        </Column>
        <Column field="change_value" header="획득 포인트"></Column>
        <Column field="total" header="총 포인트"></Column>
        <Column field="created_at" header="날짜">
          <template #body="slotProps">
            {{ formatDate(new Date(slotProps.data.created_at)) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </section>
</template>
<style scoped></style>
