<script setup>
// Const
import { SORT } from "@/const/sorts";

// Components
import FollowingTab from "./FollowingTab.vue";
import SharedProblemTab from "./SharedProblemTab.vue";
import SharedProblemSetsTab from "./SharedProblemSetsTab.vue";

// Vue Core
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const { tab, sort } = route.query;

const TABS = ["팔로잉 목록", "공유한 문제", "공유한 문제집"];

let prevSort = null;
const currentTab = ref(tab || TABS[0]);
const currentSort = ref(sort || SORT.latest);
const changeTab = (tab) => {
  // 팔로잉 목록은 정렬이 필요없음
  if (tab === TABS[0]) {
    prevSort = currentSort.value;
    router.push({ query: { tab } });
  } else {
    router.push({ query: { tab, sort: currentSort.value } });
  }
};

watch(
  () => route.query.tab,
  async (newTab) => {
    currentTab.value = newTab || TABS[0];
  },
  {
    immediate: true,
  },
);

watch(
  () => route.query.sort,
  async (newSort) => {
    if (prevSort) {
      currentSort.value = prevSort;
      prevSort = null;
    } else {
      currentSort.value = newSort || SORT.latest;
    }
  },
  {
    immediate: true,
  },
);
</script>
<template>
  <section class="flex flex-col gap-6">
    <div class="flex gap-8 text-xl font-semibold text-black-2">
      <button
        v-for="tab in TABS"
        @click="changeTab(tab)"
        :key="tab"
        :class="
          currentTab === tab
            ? 'text-orange-1'
            : 'hover:text-gray-1 transition-colors'
        "
      >
        {{ tab }}
      </button>
    </div>

    <!-- 팔로잉 목록 탭 -->
    <div v-if="currentTab === TABS[0]">
      <FollowingTab />
    </div>

    <!-- 공유한 문제 탭 -->
    <div v-else-if="currentTab === TABS[1]">
      <SharedProblemTab />
    </div>

    <!-- 공유한 문제집 탭  -->
    <section
      v-else-if="currentTab === TABS[2]"
      class="flex flex-col gap-[18px]"
    >
      <SharedProblemSetsTab />
    </section>
  </section>
</template>
<style scoped></style>
