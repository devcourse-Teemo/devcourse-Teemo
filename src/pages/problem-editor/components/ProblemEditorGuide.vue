<script setup>
import { useCreateProblemStore } from "@/store/createProblemStore";

const createProblemStore = useCreateProblemStore();
</script>
<template>
  <div class="flex-grow flex place-items-center ml-[17rem]">
    <section
      class="bg-black-5/50 rounded-lg mx-6 my-6 px-6 py-6 text-center h-[14rem] w-[20rem] hover:scale-105 shadow-black-1"
      @click="createProblemStore.addProblem('4지선다')"
    >
      <p class="font-md leading-[11rem] font-medium text-3xl text-black-2">
        4지선다
      </p>
    </section>
    <section
      class="bg-black-5/50 rounded-lg mr-6 my-6 px-6 py-6 text-center h-[14rem] w-[20rem] hover:scale-105"
    >
      <p
        class="font-md leading-[11rem] font-medium text-3xl text-black-2"
        @click="createProblemStore.addProblem('O/X')"
      >
        O/X
      </p>
    </section>
  </div>
</template>
<style></style>
