<script setup>
// APIs
import { testResultAPI } from "@/api/testResult";

// Components
import ExamHistoryTable from "./components/examHistoryTable.vue";

import Search from "@/components/layout/Search.vue";

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
const exams = ref([]);
const { keyword, startDate, endDate } = route.query;

const search = async (keyword, startDate, endDate) => {
  exams.value = await testResultAPI.search(
    user.value.id,
    keyword,
    startDate ? new Date(startDate).toISOString() : null,
    endDate ? new Date(endDate).toISOString() : null,
  );
  router.push({
    query: {
      keyword,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
  });
};

onBeforeMount(() => {
  search(keyword, startDate, endDate);
});
</script>
<template>
  <div class="relative flex flex-col gap-14">
    <h1 class="text-[42px] font-laundry">시험 내역</h1>
    <Search :show-status="false" @search="search" />
    <ExamHistoryTable :exams="exams" />
  </div>
</template>
<style scoped></style>
