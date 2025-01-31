<script setup>
import ProblemTable from "@/components/layout/ProblemTable.vue";
import Search from "@/components/layout/Search.vue";
import { ref, watch } from "vue";
import { SORT } from "@/const/sorts";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore";
import { storeToRefs } from "pinia";
import { againViewProblemAPI } from "@/api/againViewProblem";
import { problemAPI } from "@/api/problem";
import { categoryAPI } from "@/api/category";
import { useToast } from "primevue/usetoast";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const problems = ref([]);
const initialProblems = ref([]);
const loading = ref(false);
const error = ref(null);
const toast = useToast();
const filterType = ref("all"); // 'all', 'againView', 'myProblems', 'sharedProblems'

const handleFilterChange = (type) => {
  filterType.value = type;
};

const filterProblems = () => {
  if (filterType.value === "all") {
    problems.value = initialProblems.value;
  } else if (filterType.value === "againView") {
    problems.value = initialProblems.value.filter(
      (problem) => problem.againView,
    );
  } else if (filterType.value === "myProblems") {
    problems.value = initialProblems.value.filter((problem) => problem.isOwner);
  } else if (filterType.value === "sharedProblems") {
    problems.value = initialProblems.value.filter(
      (problem) => problem.isShared,
    );
  }
};

const loadProblems = async (userId) => {
  if (!userId) return;

  loading.value = true;
  error.value = null;

  try {
    const [againViewProblems, userProblems, sharedProblems] = await Promise.all(
      [
        againViewProblemAPI.getAllByUserId(userId),
        problemAPI.getAllByUserId(userId),
        problemAPI.getUserSharedProblems(userId),
      ],
    );

    const mergedProblems = [
      ...(againViewProblems?.length
        ? againViewProblems.map((p) => ({
            ...(p.problem || p), // againViewProblems는 problem 객체 안에 데이터가 있음
            againView: true,
            latest_status: p.status || p.history?.[0]?.status || "none",
          }))
        : []),
      ...(userProblems?.length
        ? userProblems.map((p) => ({
            ...p,
            isOwner: true,
            latest_status: p.history?.[0]?.status || "none",
          }))
        : []),
      ...(sharedProblems?.length
        ? sharedProblems.map((p) => ({
            ...(p.problem || p), // sharedProblems도 problem 객체 안에 데이터가 있음
            isShared: true,
            latest_status: p.history?.[0]?.status || "none",
          }))
        : []),
    ];

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

    // 상태별 필터링
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

    // 기존 필터링 로직 유지
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

    router.push({
      query: {
        ...(keyword && { keyword }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
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

watch(
  () => user.value?.id,
  (newUserId) => {
    if (newUserId) {
      loadProblems(newUserId);
    }
  },
  { immediate: true },
);

// 필터 변경 감시
watch(filterType, filterProblems);
</script>

<template>
  <section class="flex flex-col w-[1000px] mx-auto relative">
    <Toast />
    <h1 class="text-[42px] font-laundry mb-16">보관한 문제</h1>
    <div class="flex flex-col gap-16">
      <Search :show-status="true" @search="search" />
      <div v-if="loading" class="text-center">로딩 중...</div>
      <ProblemTable
        v-else
        :problems="problems"
        :show-my-problem="true"
        :show-shared-problem="true"
        :show-problem="true"
        @filter-change="handleFilterChange"
      />
    </div>
  </section>
</template>
