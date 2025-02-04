<script setup>
// Apis
import { problemAPI } from "@/api/problem";

// Components
import Search from "@/components/layout/Search.vue";
import ProblemTable from "@/components/layout/ProblemTable.vue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

// Utils
import { formatDate } from "@/utils/formatDate";

// Vue Core
import { ref, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const problems = ref([]);

const search = async (keyword, startDate, endDate, sort, status) => {
  problems.value = await problemAPI.search(
    user.value.id,
    keyword,
    startDate ? new Date(startDate).toISOString() : null,
    endDate ? new Date(endDate).toISOString() : null,
    status,
  );
  router.replace({
    query: {
      ...route.query,
      keyword,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      status,
      sort,
      page: 1,
    },
  });
};

const fetchProblems = async () => {
  const { keyword, startDate, endDate, status } = route.query;
  problems.value = await problemAPI.search(
    user.value.id,
    keyword,
    startDate ? new Date(startDate).toISOString() : null,
    endDate ? new Date(endDate).toISOString() : null,
    status,
  );
  router.replace({
    query: { ...route.query },
  });
};

onBeforeMount(() => {
  fetchProblems();
});
</script>
<template>
  <div class="relative flex flex-col gap-14">
    <h1 class="text-[42px] font-laundry">문제 게시판</h1>
    <Search :show-status="true" @search="search" />
    <ProblemTable
      :problems="problems"
      :show-my-problem="false"
      :show-problem="false"
      :show-shared-problem="false"
    />
  </div>
</template>
<style scoped></style>
