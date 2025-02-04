<script setup>
// PrimeVue
import Calendar from "primevue/calendar";

// Vue Core
import { ref, watch, computed } from "vue";

const props = defineProps({
  examDateTime: {
    default: null,
  },
  duration: {
    default: null,
  },
});

const emit = defineEmits(["update:examDateTime", "update:duration"]);

const now = new Date();
const selectedDate = ref(new Date());
const startHours = ref(now.getHours());
const startMinutes = ref(now.getMinutes());
const durationHours = ref(0);
const durationMinutes = ref(0);

const startDateTime = computed(() => {
  if (!selectedDate.value) return null;
  try {
    const date = new Date(selectedDate.value);
    date.setHours(startHours.value || 0, startMinutes.value || 0, 0);
    return date;
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
});

// 숫자 입력값 유효성 검사 함수
const validateNumberInput = (value, min, max) => {
  const num = parseInt(value);
  if (isNaN(num) || num < min || num > max) {
    return 0;
  }
  return num;
};

// 시간(시) 입력 처리 함수
const handleHoursChange = (e, type) => {
  const value = validateNumberInput(e.target.value, 0, 23);
  if (type === "start") {
    startHours.value = value;
  } else {
    durationHours.value = value;
  }
};

// 시간(분) 입력 처리 함수
const handleMinutesChange = (e, type) => {
  const value = validateNumberInput(e.target.value, 0, 59);
  if (type === "start") {
    startMinutes.value = value;
  } else {
    durationMinutes.value = value;
  }
};

watch([selectedDate, startHours, startMinutes], () => {
  if (startDateTime.value) {
    emit("update:examDateTime", startDateTime.value);
  }
});

watch([durationHours, durationMinutes], () => {
  const totalMinutes = durationHours.value * 60 + durationMinutes.value;
  if (totalMinutes <= 1440) {
    emit("update:duration", totalMinutes);
    emit("update:examDateTime", startDateTime.value);
  }
});
</script>

<template>
  <h2 class="mb-6 text-2xl font-medium text-black-1">시간 선택하기</h2>
  <div class="flex w-full gap-20">
    <div class="flex flex-col gap-2 align-top">
      <h3 class="text-lg font-medium">시작 날짜</h3>
      <Calendar
        v-model="selectedDate"
        :showIcon="true"
        :minDate="new Date()"
        dateFormat="yy-mm-dd"
        class="w-full"
        :inline="true"
        showButtonBar
      />
    </div>
    <div class="flex flex-col gap-8 w-fit">
      <!-- 시작 시간 -->
      <div class="flex flex-col w-full gap-4">
        <h3 class="text-lg font-medium shrink-0">시작 시간</h3>
        <div class="flex items-center gap-2">
          <input
            type="number"
            v-model="startHours"
            :min="0"
            :max="23"
            placeholder="0"
            @input="(e) => handleHoursChange(e, 'start')"
            class="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm"
          />
          <label class="block text-lg text-gray-600 shrink-0">시</label>
          <input
            type="number"
            v-model="startMinutes"
            :min="0"
            :max="59"
            placeholder="0"
            step="5"
            @input="(e) => handleMinutesChange(e, 'start')"
            class="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm"
          />
          <label class="block text-lg text-gray-600 shrink-0">분</label>
          <span class="text-lg text-gray-600 shrink-0">부터</span>
        </div>
      </div>
      <!-- 지속 시간 -->
      <div class="flex flex-col w-full gap-4">
        <h3 class="w-full text-lg font-medium">지속 시간 설정</h3>
        <div class="flex items-center w-full gap-2">
          <input
            type="number"
            v-model="durationHours"
            :min="0"
            :max="23"
            placeholder="0"
            @input="(e) => handleHoursChange(e, 'duration')"
            class="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm"
          />
          <label class="block text-lg text-gray-600 shrink-0">시간</label>
          <input
            type="number"
            v-model="durationMinutes"
            :min="0"
            :max="59"
            placeholder="0"
            step="5"
            @input="(e) => handleMinutesChange(e, 'duration')"
            class="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm"
          />
          <label class="block text-lg text-gray-600 shrink-0">분</label>
          <span class="text-lg text-gray-600 shrink-0">동안</span>
        </div>
      </div>
    </div>
  </div>
</template>
