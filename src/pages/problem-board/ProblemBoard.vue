<script setup>
import { problemAPI } from "@/api/problem";
import ProblemTable from "@/components/layout/ProblemTable.vue";
import Search from "@/components/layout/Search.vue";
import { ref, onMounted } from "vue";
import { formatDate } from "@/utils/formatDate";
import { useAuthStore } from "@/store/authStore";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { SORT } from "@/const/sorts";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const problems = ref([]);
const queries = router.currentRoute.value.query;
const { keyword, startDate, endDate, status, sort } = queries;

const search = async (
  keyword,
  startDate,
  endDate,
  sort = SORT.latest,
  status,
) => {
  problems.value = await problemAPI.search(
    user.value.id,
    keyword,
    startDate ? new Date(startDate).toISOString() : null,
    endDate ? new Date(endDate).toISOString() : null,
    status,
  );
  router.push({
    query: {
      keyword,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      status,
      sort,
    },
  });
};

onMounted(() => {
  search(keyword, startDate, endDate, sort, status);
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
