<script setup>
import { ref, onMounted, provide } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { Dialog, ToggleSwitch } from "primevue";

import { authAPI } from "@/api/auth";
import { problemAPI } from "@/api/problem";
import { workbookAPI } from "@/api/workbook";
import Search from "@/components/layout/Search.vue";
import ProblemTable from "@/components/layout/ProblemTable.vue";
import pen from "@/assets/icons/my-problem-sets-update/pen.svg";
import share from "@/assets/icons/my-problem-sets-update/share.svg";

const route = useRoute();
const router = useRouter();

const uid = ref(null);
const title = ref(null);
const problems = ref([]);
const shared = ref(null);
const myProblems = ref([]);
const workbookId = ref(null);
const description = ref(null);
const addedProblems = ref([]);
const workbookProblem = ref([]);
const dialogVisible = ref(false);

const cancel = () => {
  router.go(-1);
};

const openDialog = () => {
  dialogVisible.value = true;
};

const problemAdd = (problem) => {
  const isAlreadyAdded = addedProblems.value.some(
    ({ id }) => id === problem.id,
  );
  if (isAlreadyAdded) {
    alert("이미 추가된 문제입니다!");
    return;
  }

  const realAdd = confirm("해당 문제를 문제집에 추가하시겠습니까?");
  if (realAdd) {
    addedProblems.value.push(problem);
    addedProblems.value = addedProblems.value.reduce((acc, current) => {
      if (acc.findIndex(({ id }) => id === current.id) === -1) {
        acc.push(current);
      }
      return acc;
    }, []);
  }
  return;
};
provide("problemAdd", problemAdd);

const addedProblemDelete = (problem) => {
  const realDelete = confirm("해당 문제를 현재 추가한 항목에서 뺴시겠습니까?");
  if (realDelete) {
    addedProblems.value = addedProblems.value.filter(
      ({ id }) => id !== problem.id,
    );
  }
};
provide("addedProblemDelete", addedProblemDelete);

const problemSetUpdate = async () => {
  await workbookAPI.update(
    {
      title: title.value,
      description: description.value,
      shared: shared.value,
    },
    workbookId.value,
  );
  router.push(`/problem-set-board-detail/${route.params.problemSetId}`);
};

const workbookProblemAdd = async () => {
  dialogVisible.value = false;
  workbookProblem.value = addedProblems.value.map(({ id }) => ({
    uid: uid.value,
    problem_id: id,
    workbook_id: route.params.problemSetId,
  }));
  await workbookAPI.workbookProblemAdd(workbookProblem.value);
  router.go(0);
};

onMounted(async () => {
  const workbookData = await workbookAPI.getOne(route.params.problemSetId);
  workbookId.value = workbookData["id"];
  shared.value = workbookData["shared"];
  title.value = workbookData["title"];
  description.value = workbookData["description"];

  const workbookProblemData = await workbookAPI.getWorkbookProblems(
    workbookData["id"],
  );
  problems.value = workbookProblemData;

  const userInfo = await authAPI.getCurrentUser();
  uid.value = userInfo.id;

  const myProblemsData = await problemAPI.getAllByUserId(userInfo.id);

  const filteredProblems = myProblemsData.filter(
    (problem) =>
      !workbookProblemData.some(
        (workbookProblem) => workbookProblem.id === problem.id,
      ),
  );

  myProblems.value = filteredProblems;
});
</script>
<template>
  <div class="flex mb-[82px] h-[206px]">
    <div class="w-[124px] h-[124px] mr-[21px]">
      <img :src="pen" />
    </div>

    <div class="flex flex-col justify-between mr-[34px]">
      <div class="flex flex-col justify-between h-[77px]">
        <div>
          <textarea
            v-model="title"
            class="w-[572px] h-[62px] resize-none border rounded-lg border-black-4 px-4 text-[36px] font-sans leading-[150%]"
          ></textarea>
        </div>
        <div>
          <textarea
            v-model="description"
            class="resize-none w-[572px] h-[80px] border rounded-lg border-black-4 px-4 py-2 text-[15px]"
          ></textarea>
        </div>
        <div class="mt-[10px] flex">
          <div class="flex items-center w-[78px] justify-between mr-[5px]">
            <img :src="share" alt="공개여부" /><span class="text-[14px]"
              >공개 여부</span
            >
          </div>
          <ToggleSwitch v-model="shared" />
        </div>
      </div>
    </div>

    <div class="w-[128px] h-[29px] flex justify-between">
      <button
        class="w-[60px] bg-black-5 rounded-3xl item-middle"
        @click="problemSetUpdate"
      >
        수정
      </button>
      <button
        class="w-[60px] bg-[#E74C3C] text-[#ffffff] rounded-3xl item-middle"
        @click="cancel"
      >
        취소
      </button>
    </div>
  </div>

  <ProblemTable
    :showAdd="true"
    :showDelete="true"
    :problems="problems"
    :showProblem="false"
    :showCheckbox="false"
    :showCategory="false"
    @open-dialog="openDialog"
    @problem-add="problemAdd"
    @added-problem-minus="addedProblemDelete"
    :workbookId="route.params.problemSetId"
    :showStatus="false"
  />

  <Dialog
    :closable="false"
    v-model:visible="dialogVisible"
    modal
    class="ml-[130px]"
  >
    <div class="w-[1100px] px-[82px]">
      <div class="text-[36px] h-[54px] font-bold my-8">문제 추가하기</div>
      <Search :show-status="true" class="my-8" />
      <ProblemTable
        :problems="myProblems"
        :showCheckbox="false"
        :showCategory="false"
        :showPlus="true"
        :showSelect="false"
      />
      <div class="my-7">
        <div class="text-[20px] mb-2 font-semibold">추가된 문제</div>
        <ProblemTable
          :problems="addedProblems"
          :showCheckbox="false"
          :showProblem="false"
          :showCategory="false"
          :showMinus="true"
          :showSelect="false"
          :showCount="false"
        />
      </div>
      <div class="flex justify-center">
        <div class="w-[186px] flex justify-between">
          <button
            @click="workbookProblemAdd"
            class="bg-black-4 w-[87px] h-[43px] item-middle rounded-[32px]"
          >
            수정하기
          </button>
          <button
            @click="dialogVisible = false"
            class="bg-[#E74C3C] w-[87px] h-[43px] item-middle text-white rounded-[32px]"
          >
            취소하기
          </button>
        </div>
      </div>
    </div>
  </Dialog>
</template>
<style scoped></style>
