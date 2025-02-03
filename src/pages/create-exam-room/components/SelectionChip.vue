<script setup>
import { Chip } from "primevue";

defineProps({
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "pi pi-check",
  },
  show: {
    type: Boolean,
    default: true,
  },
  removable: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["remove"]);
</script>

<template>
  <div v-if="show" class="flex items-center mb-4">
    <Chip
      :label="label"
      :removable="false"
      @remove="$emit('remove')"
      class="bg-orange-50 text-orange-500 border border-orange-200"
    >
      <template #content>
        <span class="flex items-center">
          <i :class="icon" class="text-orange-500"></i>
          {{ label }}
        </span>
      </template>
    </Chip>
  </div>
</template>

<style scoped>
:deep(.p-chip) {
  background-color: rgb(255 237 213);
  border: 1px solid rgb(251 146 60);
  color: rgb(249 115 22);
}

:deep(.p-chip .p-chip-remove-icon) {
  color: rgb(249 115 22);
}

:deep(.p-chip .p-chip-remove-icon:hover) {
  color: rgb(234 88 12);
}
</style>
