<script setup>
// APIs
import { problemAPI } from "@/api/problem";

// Components
import ProblemTable from "@/components/layout/ProblemTable.vue";

// Vue Core
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const problems = ref([]);

watch(
  () => route.params.userId,
  async (userId) => {
    problems.value = await problemAPI.getAllSharedByUserId(userId);
  },
  { immediate: true },
);
</script>
<template>
  <ProblemTable
    :problems="problems"
    :show-my-problem="false"
    :show-problem="false"
    :show-shared-problem="false"
  />
</template>
<style></style>
