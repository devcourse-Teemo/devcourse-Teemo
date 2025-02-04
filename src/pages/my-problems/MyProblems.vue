<script setup>
// APIs
import { problemAPI } from "@/api/problem";
import { categoryAPI } from "@/api/category";
import { againViewProblemAPI } from "@/api/againViewProblem";

// Const
import { SORT } from "@/const/sorts";

// Components
import Search from "@/components/layout/Search.vue";
import ProblemTable from "@/components/layout/ProblemTable.vue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

// Prime Vue
import { useToast } from "primevue/usetoast";

// Utils
import { formatDate } from "@/utils/formatDate";

// Vue Core
import { useRouter, useRoute } from "vue-router";
import { ref, watch, onBeforeMount, computed } from "vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const problems = ref([]);
const initialProblems = ref([]);
const loading = ref(false);
const error = ref(null);
const toast = useToast();
const filterType = ref("all"); // 'all', 'againView', 'myProblems'

const handleFilterChange = (type) => {
  filterType.value = type;
};

const filteredProblems = computed(() => {
  if (filterType.value === "all") {
    return problems.value;
  } else if (filterType.value === "againView") {
    return problems.value.filter((problem) => problem.againView);
  }
});

const loadProblems = async (userId) => {
  if (!userId) return;

  loading.value = true;
  error.value = null;

  try {
    const [againViewProblems, userProblems, categories] = await Promise.all([
      againViewProblemAPI.getAllByUserId(userId),
      problemAPI.getAllByUserId(userId),
      categoryAPI.getAll(),
    ]);

    const problemsMap = new Map();

    userProblems.forEach((problem) => {
      problemsMap.set(problem.id, {
        ...problem,
        isOwner: true,
        againView: false,
        latest_status: problem.latest_status,
        category_name: categories.find((c) => c.id === problem.category_id)
          ?.name,
      });
    });

    againViewProblems.forEach((againViewProblem) => {
      const existingProblem = problemsMap.get(againViewProblem.id);
      if (existingProblem) {
        existingProblem.againView = true;
      } else {
        problemsMap.set(againViewProblem.id, {
          ...againViewProblem,
          isOwner: false,
          againView: true,
          latest_status: againViewProblem.latest_status,
          category_name: categories.find(
            (c) => c.id === againViewProblem.category_id,
          )?.name,
        });
      }
    });

    const mergedProblems = Array.from(problemsMap.values());
    problems.value = mergedProblems;
    initialProblems.value = mergedProblems;
  } catch (err) {
    error.value = err;
    console.error("문제 로드 실패:", err);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "문제를 불러오는데 실패했습니다.",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const search = async (
  keyword,
  startDate,
  endDate,
  sort = SORT.latest,
  status,
) => {
  if (!user.value?.id) return;

  loading.value = true;
  try {
    let filteredProblems = [...initialProblems.value];

    if (status) {
      filteredProblems = filteredProblems.filter((problem) => {
        switch (status) {
          case "푼 문제":
            return ["wrong", "corrected"].includes(problem.latest_status);
          case "틀린 문제":
            return problem.latest_status === "wrong";
          case "안 푼 문제":
            return problem.latest_status === "none" || !problem.latest_status;
          default:
            return true;
        }
      });
    }

    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      filteredProblems = filteredProblems.filter(
        (problem) =>
          problem.title?.toLowerCase().includes(searchTerm) ||
          problem.question?.toLowerCase().includes(searchTerm),
      );
    }

    if (startDate || endDate) {
      filteredProblems = filteredProblems.filter((problem) => {
        const problemDate = new Date(problem.created_at);
        const start = startDate ? new Date(startDate) : null;
        let end = endDate ? new Date(endDate) : null;

        if (end) {
          end.setDate(end.getDate() + 1);
        }

        return (!start || problemDate >= start) && (!end || problemDate <= end);
      });
    }

    problems.value = filteredProblems;

    router.replace({
      query: {
        ...(keyword && { keyword }),
        ...(startDate && { startDate: formatDate(startDate) }),
        ...(endDate && { endDate: formatDate(startDate) }),
        ...(status && { status }),
        sort,
      },
    });
  } catch (err) {
    console.error("검색 실패:", err);
    error.value = "검색 중 오류가 발생했습니다";
  } finally {
    loading.value = false;
  }
};

onBeforeMount(() => {
  loadProblems(user.value.id);
});

watch(
  () => route.query,
  (newQuery) => {
    filterType.value = newQuery.type || "all";
  },
  { immediate: true },
);
</script>

<template>
  <section class="flex flex-col w-[1000px] mx-auto relative">
    <h1 class="text-[42px] font-laundry mb-16">보관한 문제</h1>
    <div class="flex flex-col gap-16">
      <Search :show-status="true" @search="search" />
      <div v-if="loading" class="text-center">로딩 중...</div>
      <ProblemTable
        v-else
        :problems="filteredProblems"
        :show-my-problem="true"
        :show-shared-problem="true"
        :show-problem="true"
        @filter-change="handleFilterChange"
      />
    </div>
  </section>
</template>
