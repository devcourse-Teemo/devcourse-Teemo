<script setup>
import { Avatar, AvatarGroup, Column, DataTable } from "primevue";
import { formatMsToHourMinute } from "@/utils/formatMsToHour";
import { formatDate } from "@/utils/formatDate";
import { RouterLink } from "vue-router";
import EmptyText from "@/components/layout/EmptyText.vue";

const { exams } = defineProps({
  exams: Array,
});
</script>
<template>
  <section class="flex flex-col gap-[18px]">
    <div class="flex justify-between items-center">
      <p class="font-semibold text-xl">{{ exams?.length }} 시험장</p>
    </div>

    <!-- 테이블 -->
    <div class="border border-black-5 rounded-2xl overflow-hidden">
      <DataTable
        :value="exams"
        dataKey="id"
        tableStyle="min-width: 50rem;"
        showGridlines
        removableSort
        paginator
        :rows="10"
      >
        <template #empty>
          <EmptyText class="py-6">검색된 시험 내역이 없습니다...</EmptyText>
        </template>
        <Column header="시험 결과">
          <template field="id" #body="slotProps">
            <RouterLink
              class="text-blue-500"
              :to="`/exam-result/${slotProps.data.id}`"
            >
              시험 결과 리포트
            </RouterLink>
          </template>
        </Column>
        <Column field="workbook.title" sortable header="사용한 문제집">
          <template #body="slotProps">
            <RouterLink
              :to="`/problem-set-board/${slotProps.data.workbook?.id}`"
            >
              {{ slotProps.data.workbook?.title }}
            </RouterLink>
          </template>
        </Column>
        <Column field="time" sortable header="소요 시간">
          <template #body="slotProps">
            {{ formatMsToHourMinute(slotProps.data.time) }}
          </template>
        </Column>
        <Column field="users" header="함께 푼 사람">
          <template #body="slotProps">
            <AvatarGroup>
              <Avatar
                v-for="{ user_info } in slotProps.data.users.slice(0, 3)"
                v-tooltip="user_info.name"
                :image="user_info.avatar_url"
                shape="circle"
              />
              <Avatar
                v-if="slotProps.data.users.length - 3 > 0"
                :label="`+${slotProps.data.users.length - 3}`"
                shape="circle"
              />
            </AvatarGroup>
          </template>
        </Column>
        <Column field="test_center.created_at" sortable header="응시 일시">
          <template #body="slotProps">
            {{ formatDate(new Date(slotProps.data.created_at)) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </section>
</template>
<style></style>
