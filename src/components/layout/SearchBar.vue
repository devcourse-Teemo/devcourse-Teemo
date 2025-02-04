<script setup>
// Icons
import searchIcon from "@/assets/icons/problem-set-board/search.svg";

// PrimeVue
import { Chip } from "primevue";

// Vue Core
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["search", "update:modelValue"]);
const searchTerm = ref(props.modelValue);
const showChip = ref(false);

const handleSearch = () => {
  if (searchTerm.value.trim()) {
    showChip.value = true;
    emit("search", searchTerm.value);
  }
};

const removeChip = () => {
  showChip.value = false;
  searchTerm.value = "";
  emit("search", "");
};

watch(
  () => props.modelValue,
  (newValue) => {
    searchTerm.value = newValue;
  },
);
</script>

<template>
  <div
    class="relative flex items-center justify-between h-12 px-3 py-4 border bg-beige-2 rounded-xl border-black-4"
  >
    <input
      v-if="!showChip"
      v-model="searchTerm"
      type="text"
      class="w-full bg-transparent"
      placeholder="제목, 설명으로 검색"
      @keyup.enter="handleSearch"
    />
    <Chip
      v-else
      :label="searchTerm"
      removable
      @remove="removeChip"
      class="flex-1 !w-fit"
    />
    <button @click="handleSearch" class="ml-2 bg-transparent item-middle">
      <img :src="searchIcon" alt="검색 아이콘" />
    </button>
  </div>
</template>

<style scoped>
:deep(.p-chip) {
  background: rgba(0, 0, 0, 0.05);
  max-width: max-content !important;
}

:deep(.p-chip-text) {
  width: auto !important;
  max-width: none !important;
}
</style>
