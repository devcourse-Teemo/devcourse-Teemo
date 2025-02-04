<script setup>
// PrimeVue
import { Avatar } from "primevue";

// Vue Core
import { RouterLink } from "vue-router";

const { problemSet } = defineProps({
  problemSet: Object,
});
</script>
<template>
  <RouterLink class="max-h-40">
    <article
      class="flex flex-col justify-between w-full h-full bg-orange-3 gap-[50px] px-4 py-3 rounded-lg"
    >
      <div class="min-h-12">
        <p class="text-lg break-all font-pretend line-clamp-1">
          {{ problemSet?.title }}
        </p>
        <p class="text-sm text-gray-1 line-clamp-2">
          {{ problemSet?.description }}
        </p>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <Avatar
            :image="problemSet?.user?.avatar_url"
            class="mr-2 max-w-7 max-h-7"
            shape="circle"
          />
          <span>{{ problemSet?.user?.name }}</span>
        </div>
        <p class="font-medium">{{ problemSet?.problems?.length }}문제</p>
      </div>
    </article>
  </RouterLink>
</template>
<style scoped></style>
