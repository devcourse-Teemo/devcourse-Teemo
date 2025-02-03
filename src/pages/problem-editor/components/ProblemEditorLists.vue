<script setup>
import plusPath from "@/assets/icons/problem-editor/plus.svg";
import { storeToRefs } from "pinia";
import { useCreateProblemStore } from "@/store/createProblemStore";

const createProblemStore = useCreateProblemStore();
const { createdProblems, targetProblem } = storeToRefs(createProblemStore);

const onClickProblem = (idx) => {
  createProblemStore.setTargetProblem(idx);
};
</script>

<template>
  <aside class="border-black-5 border bg-beige-2 flex flex-col p-4 gap-2">
    <p
      class="header font-semibold text-md text-black-2 flex justify-between items-center mb-2"
    >
      <!-- 문제 (props.problemLists.length) -->
      <!-- <span>문제 ({{ props.problemList.length }})</span> -->

      <span>문제 ({{ createdProblems.problemLists.length }})</span>
      <!-- <span
        role="button"
        class="bg-white border border-black-3 p-1 rounded-full w-8 h-8 grid place-items-center cursor-pointer hover:scale-110"
        @click="emits('addProblem')"
      > -->
      <span
        role="button"
        class="bg-white border border-black-3 p-1 rounded-full w-8 h-8 grid place-items-center cursor-pointer hover:scale-110"
        @click="createProblemStore.addProblem()"
      >
        <img :src="plusPath" alt="아이템 추가하기" class="h-4 align-center" />
      </span>
    </p>

    <!-- <section
      v-for="(problem, idx) in props.problemList"
      :key="idx"
      @click="onClickProblem(idx)"
      :class="[
        'flex flex-col gap-3 p-2 rounded-lg font-medium cursor-pointer hover:scale-[102%]',
        targetProblemIdx == idx ? 'bg-black-5' : 'bg-white',
        !problem.isValid && problem.visited
          ? 'border border-red-1'
          : 'border border-black-5',
      ]"
    > -->
    <section
      v-for="(problem, idx) in createdProblems.problemLists"
      :key="idx"
      @click="onClickProblem(idx)"
      :class="[
        'flex flex-col gap-3 p-2 rounded-lg font-medium cursor-pointer hover:scale-[102%]',
        targetProblem.idx == idx ? 'bg-black-5' : 'bg-white',
        !problem.isValid && problem.visited
          ? 'border border-red-1'
          : 'border border-black-5',
      ]"
    >
      <p class="text-sm text-black-1 truncate">
        <span class="mr-1">{{ idx + 1 }}.</span>
        <span>{{ problem.title }}</span>
      </p>
      <!-- 태그 길이 글씨에 맞게 조정 -->
      <p
        class="text-xs rounded-md px-2 py-0.5 text-white font-regular"
        :class="[problem.type ? 'bg-navy-4' : '']"
        style="width: fit-content"
      >
        {{ problem.type }}
      </p>
    </section>
  </aside>
</template>
<style scoped>
.header::after {
  width: 100%;
  height: 1px;
  background: #b1b1b1;
}
</style>
