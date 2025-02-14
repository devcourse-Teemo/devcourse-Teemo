<script setup>
// APIs
import { authAPI } from "@/api/auth";
import { problemAPI } from "@/api/problem";
import { workbookAPI } from "@/api/workbook";

// Components
import Search from "@/components/layout/Search.vue";
import ProblemTable from "@/components/layout/ProblemTable.vue";
import ConfirmModal from "@/components/layout/ConfirmModal.vue";

// Icons
import pen from "@/assets/icons/my-problem-sets-update/pen.svg";
import share from "@/assets/icons/my-problem-sets-update/share.svg";

// Prime Vue
import { Dialog, ToggleSwitch, useConfirm, useToast } from "primevue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

// Utils
import { formatDate } from "@/utils/formatDate";

// Vue Core
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, provide, watch, nextTick } from "vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const uid = ref(null);
const title = ref(null);
const problems = ref([]);
const shared = ref(null);
const myProblems = ref([]);
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
    toast.add({
      severity: "error",
      summary: "문제집 추가 실패",
      detail: "이미 추가된 문제입니다!",
      life: 3000,
    });
    return;
  }

  confirm.require({
    group: "add",
    header: "해당 문제를 문제집에 추가하시겠습니까?",
    message: "추가하시려면 '추가' 버튼을 클릭하세요",
    accept: () => {
      addedProblems.value.push(problem);
      addedProblems.value = addedProblems.value.reduce((acc, current) => {
        if (acc.findIndex(({ id }) => id === current.id) === -1) {
          acc.push(current);
        }
        return acc;
      }, []);
    },
    reject: () => {},
  });
};
provide("problemAdd", problemAdd);

const addedProblemDelete = (problem) => {
  confirm.require({
    group: "addedListDelete",
    header: "해당 문제를 현재 추가한 항목에서 빼시겠습니까?",
    message: "문제를 빼시려면 '빼기' 버튼을 클릭하세요",
    accept: () => {
      addedProblems.value = addedProblems.value.filter(
        ({ id }) => id !== problem.id,
      );
    },
    reject: () => {},
  });
};
provide("addedProblemDelete", addedProblemDelete);

const problemDelete = async () => {
  const workbookProblemData = await workbookAPI.getWorkbookProblems(
    route.params.problemSetId,
  );
  problems.value = workbookProblemData;
};
provide("problemDelete", problemDelete);

const problemSetUpdate = async () => {
  if (!title.value.trim()) {
    toast.add({
      severity: "error",
      summary: "문제집 수정 실패",
      detail: "제목을 입력해주세요.",
      life: 3000,
    });
    return;
  }

  await workbookAPI.update(
    {
      title: title.value,
      description: description.value,
      shared: shared.value,
    },
    route.params.problemSetId,
  );
  router.push(`/problem-set-board/${route.params.problemSetId}`);
};

const workbookProblemAdd = async () => {
  dialogVisible.value = false;
  workbookProblem.value = addedProblems.value.map(({ id }) => ({
    uid: uid.value,
    problem_id: id,
    workbook_id: route.params.problemSetId,
  }));
  await workbookAPI.workbookProblemAdd(workbookProblem.value);
  workbookProblemDataUpdate();
  addedProblems.value = [];
  myProblemsDataUpdate();
};

const workbookProblemDataUpdate = async () => {
  const workbookProblemData = await workbookAPI.getWorkbookProblems(
    route.params.problemSetId,
  );
  problems.value = workbookProblemData;
};

const limitTitle = (event) => {
  const titleValue = event.target.value;
  const trimmedTitle = [...titleValue].slice(0, 20).join("");

  if (titleValue.length > 20) {
    title.value = trimmedTitle;
    toast.add({
      severity: "error",
      summary: "제목 수정 에러",
      detail: "제목은 20자를 초과하실 수 없습니다.",
      life: 3000,
    });
  } else {
    title.value = titleValue;
  }
};

const limitDescription = (event) => {
  const descriptionValue = event.target.value;
  const trimmedDescription = [...descriptionValue].slice(0, 200).join("");

  if (descriptionValue.length > 200) {
    description.value = trimmedDescription;
    toast.add({
      severity: "error",
      summary: "설명 수정 에러",
      detail: "설명은 200자를 초과하실 수 없습니다.",
      life: 3000,
    });
  } else {
    description.value = descriptionValue;
  }
};

const search = async (keyword, startDate, endDate, sort, status) => {
  myProblems.value = await problemAPI.search(
    user.value.id,
    keyword,
    startDate ? new Date(startDate).toISOString() : null,
    endDate ? new Date(endDate).toISOString() : null,
    status,
  );

  const newQuery = {
    ...route.query,
    keyword,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    status,
    sort,
    page: 1,
  };

  if (JSON.stringify(route.query) !== JSON.stringify(newQuery)) {
    router.replace({ query: newQuery });
  }
};

const fetchProblems = async () => {
  const { keyword, startDate, endDate, status } = route.query;
  const fetchedProblems = await problemAPI.search(
    user.value.id,
    keyword,
    startDate ? new Date(startDate).toISOString() : null,
    endDate ? new Date(endDate).toISOString() : null,
    status,
  );

  await nextTick(); // Vue가 반응형 데이터를 업데이트하고 난 후 렌더링하도록 설정
  myProblems.value = fetchedProblems.filter(
    (problem) =>
      !problems.value.some(
        (workbookProblem) => workbookProblem.id === problem.id,
      ),
  );
};

provide("fetchProblems", fetchProblems);

onMounted(async () => {
  const workbookData = await workbookAPI.getOne(route.params.problemSetId);

  shared.value = workbookData["shared"];
  title.value = workbookData["title"];
  description.value = workbookData["description"];

  const workbookProblemData = await workbookAPI.getWorkbookProblems(
    route.params.problemSetId,
  );
  problems.value = workbookProblemData;

  const userInfo = await authAPI.getCurrentUser();
  uid.value = userInfo.id;

  await fetchProblems();
});

watch(
  () => route.query,
  async (newQuery, oldQuery) => {
    if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      await fetchProblems();
    }
  },
  { deep: true },
);
</script>
<template>
  <div class="flex mb-[82px] h-[206px]">
    <div class="w-[124px] h-[124px] mr-[21px]">
      <img :src="pen" />
    </div>

    <div class="flex flex-col justify-between mr-[34px]">
      <div class="flex flex-col justify-between h-[77px]">
        <div class="w-[680px]">
          <textarea
            @input="limitTitle"
            v-model="title"
            class="w-full h-[62px] resize-none border rounded-lg border-black-4 px-4 text-[36px] font-sans leading-[150%]"
          ></textarea>
        </div>
        <div>
          <textarea
            @input="limitDescription"
            v-model="description"
            class="resize-none w-full h-[80px] border rounded-lg border-black-4 px-4 py-2 text-[15px]"
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
    :show-my-problem="false"
  />

  <Dialog
    :closable="false"
    v-model:visible="dialogVisible"
    modal
    class="ml-[130px]"
  >
    <div class="w-[1100px] px-[82px]">
      <div class="text-[36px] h-[54px] font-bold my-8">문제 추가하기</div>
      <Search :show-status="true" @search="search" />
      <ProblemTable
        :problems="myProblems"
        :showCheckbox="false"
        :showCategory="false"
        :showPlus="true"
        :showSelect="false"
        :show-my-problem="false"
        :show-problem="false"
        :new-tab="true"
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
          :show-my-problem="false"
          :new-tab="true"
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

  <ConfirmModal group="add" acceptButtonName="추가" />
  <ConfirmModal group="addedListDelete" acceptButtonName="빼기" />
</template>
<style scoped></style>
