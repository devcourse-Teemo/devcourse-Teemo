<script setup>
// Icons
import search from "@/assets/icons/problem-set-board/search.svg";
import dropdownDown from "@/assets/icons/problem-set-board/dropdown-down.svg";

// PrimeVue
import { Chip, DatePicker, RadioButton } from "primevue";

// Utils
import { formatDate } from "@/utils/formatDate";

// Vue Core
import { useRoute } from "vue-router";
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

const STATUSES = ["안 푼 문제", "푼 문제", "틀린 문제"];
const route = useRoute();
const { showStatus } = defineProps({
  showStatus: {
    type: Boolean,
    required: true,
  },
});
const {
  keyword: keywordFromQuery,
  startDate: startDateFromQuery,
  endDate: endDateFromQuery,
  status: statusFromQuery,
} = route.query;

const keyword = ref(keywordFromQuery);
const isOpen = ref(false);
const status = ref(statusFromQuery);
const dropdown = ref(null);

const startDate = ref(startDateFromQuery);
const endDate = ref(endDateFromQuery);

const emit = defineEmits(["search"]);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event) => {
  if (dropdown.value && !dropdown.value.contains(event.target)) {
    isOpen.value = false;
  }
};

watch(status, (newStatus) => {
  emit(
    "search",
    keyword.value,
    startDate.value,
    endDate.value,
    route.query.sort,
    newStatus,
  );
});

watch(startDate, (newStartDate) => {
  emit(
    "search",
    keyword.value,
    newStartDate,
    endDate.value,
    route.query.sort,
    status.value,
  );
});

watch(endDate, (newEndDate) => {
  emit(
    "search",
    keyword.value,
    startDate.value,
    newEndDate,
    route.query.sort,
    status.value,
  );
});

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
});
</script>
<template>
  <div class="flex flex-col gap-2">
    <form
      @submit.prevent="
        emit('search', keyword, startDate, endDate, sort, status)
      "
      class="flex justify-between items-center bg-beige-2 has-[:focus]:border-orange-1 rounded-lg h-12 p-4 border border-black-4"
    >
      <input
        v-model="keyword"
        type="text"
        class="w-full bg-transparent"
        placeholder="제목, 문제로 검색"
      />
      <button class="bg-transparent item-middle">
        <img :src="search" alt="검색 아이콘" />
      </button>
    </form>
    <div class="flex h-10 gap-6">
      <div v-if="showStatus" class="relative z-50" ref="dropdown">
        <button
          @click="toggleDropdown"
          :class="[
            'flex justify-between items-center w-[210px] px-4 py-2 bg-beige-2 border border-solid border-black-4 rounded-lg',
            isOpen ? 'border-orange-1' : '',
          ]"
        >
          상태
          <img :src="dropdownDown" alt="드롭다운 아이콘" />
        </button>

        <div
          v-if="isOpen"
          class="absolute left-0 w-full mt-2 border rounded-md shadow-lg bg-beige-2"
        >
          <ul>
            <li
              v-for="STATUS in STATUSES"
              :key="STATUS"
              class="flex items-center px-4 py-2 transition-colors cursor-pointer hover:bg-beige-1"
            >
              <RadioButton
                v-model="status"
                :inputId="STATUS"
                :value="STATUS"
                class="mr-2"
              />
              <label :for="STATUS" class="w-full h-full cursor-pointer">{{
                STATUS
              }}</label>
            </li>
          </ul>
        </div>
      </div>
      <div class="w-full h-10 px-4 border rounded-lg bg-beige-2 border-black-4">
        <div class="flex items-center h-10 gap-4 card">
          <span>검색 기간</span>
          <span>|</span>
          <span>시작일</span>
          <DatePicker
            v-model="startDate"
            class="w-[116px] h-6"
            id="startTime"
            :max-date="endDate ? new Date(endDate) : new Date()"
            dateFormat="yy-mm-dd"
            showButtonBar
          />
          <span>종료일</span>
          <DatePicker
            v-model="endDate"
            class="w-[116px] h-6"
            id="endTime"
            :minDate="new Date(startDate)"
            dateFormat="yy-mm-dd"
            showButtonBar
          />
        </div>
      </div>
    </div>
    <div class="flex gap-3">
      <Chip
        v-if="status"
        @remove="status = null"
        :label="`상태: ${status}`"
        class="w-fit"
        removable
      />
      <Chip
        v-if="startDate"
        @remove="startDate = null"
        :label="`시작일: ${formatDate(startDate)}`"
        class="w-fit"
        removable
      />
      <Chip
        v-if="endDate"
        @remove="endDate = null"
        :label="`종료일: ${formatDate(endDate)}`"
        class="w-fit"
        removable
      />
    </div>
  </div>
</template>
<style scoped></style>
