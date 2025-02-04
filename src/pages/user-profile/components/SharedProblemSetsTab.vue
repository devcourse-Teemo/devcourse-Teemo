<script setup>
// APIs
import { workbookAPI } from "@/api/workbook";

// Const
import { SORT, SORTS } from "@/const/sorts";

// Components
import EmptyText from "@/components/layout/EmptyText.vue";
import ProblemSet from "@/components/layout/ProblemSet.vue";

// Prime Vue
import { Paginator, Select } from "primevue";

// Vue Core
import { watch, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();
const { sort: sortFromQuery } = route.query;

const problemSets = ref([]);

const sorts = ref(SORTS);
const currentSort = sortFromQuery === SORT.likes ? SORTS[1] : SORTS[0];
const sort = ref(currentSort);

const first = ref(0);
const rows = ref(8);

const sortedProblemSets = computed(() => {
  const newProblemSets = [...problemSets.value];
  switch (sort.value?.value) {
    case SORT.latest:
      return newProblemSets
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(first.value, first.value + rows.value);
    case SORT.likes:
      return newProblemSets
        .sort((a, b) => (b.likes.length || 0) - (a.likes.length || 0))
        .slice(first.value, first.value + rows.value);
    default:
      return newProblemSets.slice(first.value, first.value + rows.value);
  }
});

watch(
  () => sort.value.value,
  async () => {
    router.replace({
      query: {
        ...route.query,
        sort: sort.value.value,
      },
    });
  },
);

watch(
  () => route.params.userId,
  async (userId) => {
    problemSets.value = await workbookAPI.getAllSharedByUserId(userId);
  },
  { immediate: true },
);
</script>
<template>
  <div class="flex items-center justify-between">
    <p class="text-xl font-semibold">{{ problemSets.length }} 문제집</p>
    <Select v-model="sort" :options="sorts" optionLabel="name" class="w-40" />
  </div>

  <div v-if="!problemSets.length" class="flex items-center justify-center h-40">
    <EmptyText>검색된 문제집이 없습니다...</EmptyText>
  </div>
  <div v-else class="grid grid-cols-4 gap-4">
    <ProblemSet
      v-for="problemSet in sortedProblemSets"
      :key="problemSet.id"
      :to="`/problem-set-board/${problemSet.id}`"
      :problemSet="problemSet"
    />
  </div>
  <Paginator
    v-model:first="first"
    :rows="rows"
    :totalRecords="problemSets.length"
  ></Paginator>
</template>
<style></style>
