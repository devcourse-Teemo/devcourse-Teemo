<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Menu, useConfirm, useToast } from "primevue";

import { userAPI } from "@/api/user";
import { authAPI } from "@/api/auth";
import { workbookAPI } from "@/api/workbook";
import { workbookLikeAPI } from "@/api/workbookLike";
import ProblemTable from "@/components/layout/ProblemTable.vue";
import like from "@/assets/icons/problem-set-board-detail/like.svg";
import thumbsUp from "@/assets/icons/problem-set-board-detail/thumbs-up.svg";
import addOption from "@/assets/icons/problem-set-board-detail/add-option.svg";
import CommentList from "@/pages/problem-set-detail/components/CommentList.vue";
import testCenterEnter from "@/assets/icons/problem-set-board-detail/test-center-enter.svg";
import ConfirmModal from "@/components/layout/ConfirmModal.vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

const itemsPerPage = 10;

const uid = ref(null);
const love = ref(null);
const name = ref(null);
const title = ref(null);
const share = ref(null);
const comments = ref([]);
const problems = ref([]);
const currentPage = ref(1);
const totalRecords = ref(0);
const created_at = ref(null);
const updated_at = ref(null);
const description = ref(null);
const problemSetLike = ref(null);
const workbookUserCheck = ref(null);
const workbookAnotherUserCheck = ref(null);

const goToEditPage = () => {
  router.push(`/problem-set-board-update/${route.params.problemSetId}`);
};

const problemSetDelete = async () => {
  await workbookAPI.removeWorkbook(route.params.problemSetId);
  router.go(-1);
};
const problemSetShare = async () => {
  if (workbookAnotherUserCheck.value) {
    toast.add({
      severity: "error",
      summary: "문제집 공유 실패",
      detail: "이미 공유 받으신 문제집입니다.",
      life: 3000,
    });
    return;
  } else {
    if (share.value) {
      confirm.require({
        group: "share",
        header: "해당 문제집을 공유 받으시겠습니까?",
        message: "공유 받으시려면 '공유 받기' 버튼을 클릭하세요",
        accept: async () => {
          await workbookAPI.sharedWorkbookAdd([
            {
              workbook_id: route.params.problemSetId,
              uid: uid.value,
            },
          ]);
          router.push("/my-problem-sets");
        },
        reject: () => {},
      });
    } else {
      toast.add({
        severity: "error",
        summary: "문제집 공유 실패",
        detail: "해당 문제집은 제작자가 공유 설정을 하지 않으셨습니다.",
        life: 3000,
      });
      return;
    }
  }
};

const myMenuItems = [
  {
    label: "수정하기",
    icon: "pi pi-pencil",
    command: goToEditPage,
  },
  {
    label: "삭제하기",
    icon: "pi pi-trash",
    command: problemSetDelete,
  },
];

const otherMenuItems = [
  {
    label: "공유받기",
    icon: "pi pi-bookmark",
    command: problemSetShare,
  },
];

const myMenu = ref(null);
const otherMenu = ref(null);

const openMenu = (event) => {
  if (workbookUserCheck.value) myMenu.value.toggle(event);
  else otherMenu.value.toggle(event);
};

const fetchComments = async (page = 1) => {
  const result = await workbookAPI.workbookCommentInfo(
    route.params.problemSetId,
    page,
    itemsPerPage,
  );
  comments.value = result.data;
  totalRecords.value = result.totalCount;
};

const handlePageChange = async (newPage) => {
  currentPage.value = newPage;
  await fetchComments(newPage);
};

const handleLike = async () => {
  if (problemSetLike.value) {
    problemSetLike.value = false;
    await workbookLikeAPI.remove(uid.value, route.params.problemSetId);
    await workbookLikeFunction();
    return;
  }

  problemSetLike.value = true;
  await workbookLikeAPI.add(uid.value, route.params.problemSetId);
  await workbookLikeFunction();
};

const workbookLikeFunction = async () => {
  const result = await workbookLikeAPI.getWorkbookLike(
    uid.value,
    route.params.problemSetId,
  );
  if (result.length === 1) problemSetLike.value = true;
  else problemSetLike.value = false;
};

onMounted(async () => {
  const workbookData = await workbookAPI.getOne(route.params.problemSetId);
  title.value = workbookData.title;
  description.value = workbookData.description;
  created_at.value = workbookData.created_at.split("T")[0];
  updated_at.value = workbookData.updated_at.split("T")[0];
  share.value = workbookData.shared;

  const workbookProblemData = await workbookAPI.getWorkbookProblems(
    workbookData.id,
  );
  problems.value = workbookProblemData;

  const userInfo = await userAPI.getOne(workbookData.uid);
  name.value = userInfo.name;

  love.value = await workbookLikeAPI.getWorkbookLikeCount(workbookData.id);

  const userId = await authAPI.getCurrentUser();
  uid.value = userId.id;

  const anotherUserId = await workbookAPI.getSharedWorkbook(
    route.params.problemSetId,
    userId.id,
  );

  if (workbookData.uid === userId.id) workbookUserCheck.value = true;
  else workbookUserCheck.value = false;

  if (anotherUserId.length) {
    workbookAnotherUserCheck.value = true;
  } else workbookAnotherUserCheck.value = false;

  await workbookLikeFunction();
  await fetchComments();
});
</script>

<template>
  <div class="flex flex-col items-center w-full">
    <div class="h-[124px] flex items-center mb-[63px] w-full justify-between">
      <div
        class="w-[124px] h-[124px] mr-[21px]"
        v-if="workbookUserCheck || workbookAnotherUserCheck"
      >
        <RouterLink
          :to="`/create-exam-room?problemSetId=${route.params.problemSetId}`"
        >
          <img :src="testCenterEnter" alt="시험장 입실" />
        </RouterLink>
      </div>
      <div class="h-[124px] mr-[196px] flex flex-col justify-between">
        <div class="flex flex-col justify-between h-[77px]">
          <div class="font-laundry text-[36px] -tracking[1.1%] font-semibold">
            {{ title }}
          </div>
          <div class="h-[23px]">{{ description }}</div>
        </div>
        <div class="flex w-[473px] h-[23px] ml-[7px] justify-between">
          <div>작성자 | {{ name }}</div>
          <div>생성일 | {{ created_at }}</div>
          <div>수정일 | {{ updated_at }}</div>
          <div class="flex justify-between w-8">
            <div>
              <img :src="thumbsUp" alt="좋아요" />
            </div>
            <div>{{ love }}</div>
          </div>
        </div>
      </div>
      <div class="flex items-center">
        <div class="w-8 h-8" v-if="!workbookUserCheck">
          <button @click="handleLike">
            <img
              :src="like"
              alt="좋아요"
              :class="problemSetLike ? 'bg-orange-1' : ''"
            />
          </button>
        </div>
        <div class="w-10 h-10 ml-[26px]">
          <button @click="openMenu">
            <img :src="addOption" alt="문제집 추가 설정" />
          </button>
        </div>
      </div>
    </div>
    <ProblemTable
      :problems="problems"
      :showCheckbox="false"
      :showMyProblem="false"
      :showProblem="false"
      :showSharedProblem="false"
    />
    <hr class="w-full mb-10 border border-[#d4d4d4]" />
    <CommentList
      class="w-full"
      :comments="comments"
      :workbookId="route.params.problemSetId"
      :totalRecords="totalRecords"
      :currentPage="currentPage"
      :itemsPerPage="itemsPerPage"
      @page-change="handlePageChange"
      @comment-change="fetchComments"
    />
  </div>
  <Menu
    :model="myMenuItems"
    ref="myMenu"
    popup
    appendTo="body"
    class="p-menu w-[200px] font-pretend"
  />
  <Menu
    :model="otherMenuItems"
    ref="otherMenu"
    popup
    appendTo="body"
    class="p-menu w-[200px] font-pretend"
  />

  <ConfirmModal group="share" accept-button-name="공유 받기" />
  <ConfirmModal group="like" accept-button-name="좋아요" />
</template>

<style scoped></style>
