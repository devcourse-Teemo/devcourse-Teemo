<script setup>
import { Button, ConfirmDialog } from "primevue";

const props = defineProps({
  group: String,
  acceptButtonName: String,
});
</script>
<template>
  <ConfirmDialog :group="props.group">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div
        class="flex flex-col items-center px-20 py-8 rounded bg-surface-0 dark:bg-surface-900"
      >
        <span class="block mb-2 text-2xl font-bold">{{ message.header }}</span>
        <p class="mb-0">{{ message.message }}</p>
        <div class="flex items-center gap-2 mt-6">
          <Button
            @click="acceptCallback"
            :label="props.acceptButtonName"
            class="w-20"
          ></Button>
          <Button
            @click="rejectCallback"
            label="취소"
            outlined
            class="w-20"
          ></Button>
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
<style scoped></style>
