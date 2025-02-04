<script setup>
import Sidebar from "@/components/layout/Sidebar.vue";
import ExamResultHeader from "./components/ExamResultHeader.vue";
import ExamResultBody from "./components/ExamResultBody.vue";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <div class="flex h-auto w-full bg-beige-2">
    <Sidebar v-if="route.path !== '/'" class="relative z-40" />
    <div
      class="flex-1 flex flex-col justify-center py-6 pr-6 overflow-x-hidden"
    >
      <main class="rounded-3xl bg-white flex flex-col pb-20">
        <ExamResultHeader class="rounded-t-3xl bg-black-6 mx-auto" />
        <section class="w-[800px] py-8 mx-auto flex justify-center">
          <ExamResultBody class="w-full mt-[-104px] z-10" />
        </section>
      </main>
    </div>
  </div>
</template>
