<script setup>
import Sidebar from "@/components/layout/Sidebar.vue";

import { RouterView } from "vue-router";
import { useRoute } from "vue-router";
import Header from "./Header.vue";

const route = useRoute();
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar v-if="route.path !== '/'" class="relative z-40" />
    <div class="flex flex-col flex-1 py-6 pr-6 bg-beige-2">
      <Header v-if="route.path !== '/'" class="bg-white rounded-t-3xl" />
      <main class="flex-1 overflow-y-auto bg-white rounded-b-3xl">
        <section class="max-w-[1000px] mx-auto py-8">
          <RouterView />
        </section>
      </main>
    </div>
  </div>
</template>
