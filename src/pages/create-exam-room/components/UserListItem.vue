<script setup>
// Utils
import { setDefaultAvatar } from "@/utils/imageUtils";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  showRemoveButton: {
    type: Boolean,
    default: false,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["add", "remove"]);
</script>

<template>
  <li
    class="flex items-center justify-between p-2 transition-colors rounded-lg hover:bg-gray-50"
  >
    <div class="flex items-center gap-2">
      <img
        :src="user.profileImage"
        :alt="user.nickname"
        @error="setDefaultAvatar"
        class="object-cover w-12 h-12 rounded-full"
      />
      <div class="flex flex-col">
        <strong class="font-medium">{{ user.email }}</strong>
        <div class="flex items-center gap-2">
          <span class="text-gray-1">{{ user.nickname }}</span>
          <span v-if="isOwner" class="text-sm text-orange-500">(주최자)</span>
        </div>
      </div>
    </div>

    <button
      v-if="showRemoveButton"
      @click="emit('remove', user)"
      class="px-2 py-1 text-red-500 rounded hover:text-red-600"
    >
      제거
    </button>
    <button
      v-else-if="!isOwner"
      @click="emit('add', user)"
      class="px-2 py-1 text-orange-500 rounded hover:text-orange-600"
    >
      추가
    </button>
  </li>
</template>

<style scoped>
.text-gray-1 {
  color: var(--gray-1, #666666);
}
</style>
