<script setup>
import { Avatar } from "primevue";
import { RouterLink } from "vue-router";

const { problemSet } = defineProps({
  problemSet: Object,
});
</script>
<template>
  <RouterLink>
    <article
      class="flex flex-col justify-between w-full h-[146px] bg-orange-3 gap-[50px] px-4 py-3 rounded-lg"
    >
      <div>
        <p class="font-pretend text-lg">{{ problemSet?.title }}</p>
        <p class="text-sm text-gray-1">{{ problemSet?.description }}</p>
      </div>
      <div class="flex justify-between items-center">
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
