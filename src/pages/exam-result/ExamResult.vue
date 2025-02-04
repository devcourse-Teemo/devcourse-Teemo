<script setup>
// Components
import ExamResultBody from "./components/ExamResultBody.vue";
import ExamResultHeader from "./components/ExamResultHeader.vue";

import Sidebar from "@/components/layout/Sidebar.vue";

// Vue Core
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <div class="flex w-full h-auto bg-beige-2">
    <Sidebar v-if="route.path !== '/'" class="relative z-40" />
    <div
      class="flex flex-col justify-center flex-1 py-6 pr-6 overflow-x-hidden"
    >
      <main class="flex flex-col pb-20 bg-white rounded-3xl">
        <ExamResultHeader class="mx-auto rounded-t-3xl bg-black-6" />
        <section class="w-[800px] py-8 mx-auto flex justify-center">
          <ExamResultBody class="w-full mt-[-104px] z-10" />
        </section>
      </main>
    </div>
  </div>
</template>
