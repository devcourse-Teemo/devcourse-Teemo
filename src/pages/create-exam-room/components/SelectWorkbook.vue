<script setup>
import { ref, computed, watchEffect, watch } from "vue";
import { useAuthStore } from "@/store/authStore";
import SearchBar from "@/components/layout/SearchBar.vue";
import MyWorkBook from "./MyWorkBook.vue";
import { workbookAPI } from "@/api/workbook";
import Paginator from "primevue/paginator";
import { useRoute } from "vue-router";
import { useWorkbookStore } from "@/store/workbookStore";

const props = defineProps({
  selectedWorkbook: {
    type: Object,
    default: null,
  },
});

const route = useRoute();
const emit = defineEmits(["update:selectedWorkbook"]);

// Store
const authStore = useAuthStore();
const workbookStore = useWorkbookStore();

// Constants
const itemsPerPage = 6;

// Data
const workbooks = ref([]);
const currentPage = ref(0);
const searchKeyword = ref("");

// Computed
const filteredWorkbooks = computed(() => {
  if (!searchKeyword.value) return workbooks.value;
  return workbooks.value.filter((book) =>
    book.title.toLowerCase().includes(searchKeyword.value.toLowerCase()),
  );
});

const paginatedWorkbooks = computed(() => {
  const start = currentPage.value * itemsPerPage;
  const result = filteredWorkbooks.value.slice(start, start + itemsPerPage);
  return result;
});

// Methods
const fetchWorkbooks = async () => {
  try {
    const userId = authStore.user.id;
    
    // 내 문제집과 공유받은 문제집을 동시에 로드
    await Promise.all([
      workbookAPI.getAllByUserId(userId),
      workbookStore.loadSharedWorkbooks(userId)
    ]);

    // 각 문제집의 문제 수 로드
    const myWorkbooks = await workbookAPI.getAllByUserId(userId);
    const sharedWorkbooks = workbookStore.sharedWorkbooks;
    
    // 모든 문제집에 대해 문제 수 로드
    const allWorkbooks = [...myWorkbooks, ...sharedWorkbooks];
    await Promise.all(
      allWorkbooks.map(async (workbook) => {
        await workbookStore.fetchProblemCount(workbook.id);
      })
    );

    // 문제 수가 0개인 문제집 필터링
    workbooks.value = allWorkbooks.filter(
      workbook => workbookStore.problemCounts[workbook.id] > 0
    );
  } catch (error) {
    console.error("문제집 로드 실패:", error);
  }
};

const handleSearch = (keyword) => {
  searchKeyword.value = keyword;
  currentPage.value = 0;
};

const handleWorkbookSelect = (workbook) => {
  emit("update:selectedWorkbook", workbook);
};

const onPageChange = (event) => {
  currentPage.value = event.page;
};

watch(workbooks, () => {
  if (!route.query?.problemSetId) return;

  const workbook = workbooks.value.find(
    (book) => book.id === Number(route.query.problemSetId),
  );
  if (workbook) {
    handleWorkbookSelect(workbook);
  }
});

// Watchers
watchEffect(() => {
  if (authStore.isAuthenticated && authStore.user?.id) {
    fetchWorkbooks();
  }
});
</script>

<template>
  <div class="w-full">
    <h2 class="text-2xl text-black-1 font-medium mb-6">문제집 선택하기</h2>

    <!-- 검색 바 -->
    <div class="mb-8">
      <SearchBar @search="handleSearch" />
    </div>

    <!-- 문제집 목록 -->
    <section class="flex flex-col gap-5">
      <div class="flex items-center gap-4">
        <h2 class="font-semibold text-xl">보관한 문제집</h2>
      </div>

      <div
        v-if="paginatedWorkbooks.length === 0"
        class="text-center py-8 text-gray-500"
      >
        보관한 문제집이 텅 비었습니다. <br />
        문제집을 생성한 후 시험장을 이용할 수 있습니다.
      </div>

      <MyWorkBook
        v-else
        :visibleMyBooks="paginatedWorkbooks"
        :selectedWorkbook="selectedWorkbook"
        @select-workbook="handleWorkbookSelect"
      />

      <!-- 페이지네이션 -->
      <Paginator
        v-if="filteredWorkbooks.length > itemsPerPage"
        :rows="itemsPerPage"
        :totalRecords="filteredWorkbooks.length"
        @page="onPageChange"
        class="mt-4"
      />
    </section>
  </div>
</template>

<style scoped>
:deep(.p-paginator) {
  background-color: transparent;
  border: none;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background-color: #f97316;
  color: white;
}
</style>
