<script setup>
// APIs
import { userAPI } from "@/api/user";
import { authAPI } from "@/api/auth";
import { workbookAPI } from "@/api/workbook";
import { testCenterAPI } from "@/api/testCenter";
import { workbookLikeAPI } from "@/api/workbookLike";

// Components
import ProblemTable from "@/components/layout/ProblemTable.vue";
import CommentList from "@/pages/problem-set-detail/components/CommentList.vue";

// Icons
import like from "@/assets/icons/problem-set-board-detail/like.svg";
import thumbsUp from "@/assets/icons/problem-set-board-detail/thumbs-up.svg";
import bookMark from "@/assets/icons/problem-set-board-detail/book-mark.svg";
import addOption from "@/assets/icons/problem-set-board-detail/add-option.svg";
import testCenterEnter from "@/assets/icons/problem-set-board-detail/test-center-enter.svg";

// PrimeVue
import { Menu, useToast } from "primevue";

// Vue Core
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const toast = useToast();
const route = useRoute();
const router = useRouter();

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
const workbookShared = ref(false);

const goToEditPage = () => {
  router.push(`/problem-set-board-update/${route.params.problemSetId}`);
};

const problemSetDelete = async () => {
  const testedProblemSet = await testCenterAPI.getAll();

  const foundItem = testedProblemSet.find((item) => {
    return String(item.workbook_id) === String(route.params.problemSetId);
  });

  if (foundItem) {
    toast.add({
      severity: "error",
      summary: "문제집 삭제 실패",
      detail: "해당 문제집은 시험내역이 있어 삭제에 실패 했습니다.",
      life: 3000,
    });
  } else {
    await workbookAPI.removeWorkbook(route.params.problemSetId);
    router.go(-1);
  }
};

const checkWorkbookShared = async () => {
  const userId = await authAPI.getCurrentUser();
  const sharedWorkbook = await workbookAPI.getSharedWorkbook(
    route.params.problemSetId,
    userId.id,
  );
  workbookShared.value = sharedWorkbook.length > 0;
};

const handleShare = async () => {
  if (workbookShared.value) {
    workbookShared.value = false;
    workbookAPI.sharedWorkbookDelete(uid.value, route.params.problemSetId);
    toast.add({
      severity: "success",
      summary: "문제집 공유 해제 성공",
      detail: "문제집을 성공적으로 공유 해제 했습니다.",
      life: 3000,
    });

    return;
  }

  if (share.value) {
    try {
      await workbookAPI.sharedWorkbookAdd([
        {
          workbook_id: route.params.problemSetId,
          uid: uid.value,
        },
      ]);
      workbookShared.value = true;
      toast.add({
        severity: "success",
        summary: "문제집 공유 성공",
        detail: "문제집을 성공적으로 공유받았습니다.",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "문제집 공유 실패",
        detail: "문제집 공유 중 오류가 발생했습니다.",
        life: 3000,
      });
    }
  } else {
    toast.add({
      severity: "error",
      summary: "문제집 공유 실패",
      detail: "해당 문제집은 제작자가 공유 설정을 하지 않으셨습니다.",
      life: 3000,
    });
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

const myMenu = ref(null);

const openMenu = (event) => {
  if (workbookUserCheck.value) myMenu.value.toggle(event);
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
    love.value = await workbookLikeAPI.getWorkbookLikeCount(
      route.params.problemSetId,
    );
    return;
  }

  problemSetLike.value = true;
  await workbookLikeAPI.add(uid.value, route.params.problemSetId);
  await workbookLikeFunction();
  love.value = await workbookLikeAPI.getWorkbookLikeCount(
    route.params.problemSetId,
  );
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

  if (workbookData.uid === userId.id) workbookUserCheck.value = true;
  else workbookUserCheck.value = false;

  await workbookLikeFunction();
  await fetchComments();
  await checkWorkbookShared();
});
</script>

<template>
  <div class="flex flex-col items-center w-full">
    <div class="h-[124px] flex items-center mb-[63px] w-full justify-between">
      <div class="flex items-center">
        <div
          class="w-[124px] h-[124px] mr-[21px]"
          v-if="workbookUserCheck || workbookShared"
        >
          <RouterLink
            :to="`/create-exam-room?problemSetId=${route.params.problemSetId}`"
          >
            <img :src="testCenterEnter" alt="시험장 입실" />
          </RouterLink>
        </div>

        <div class="flex flex-col justify-between">
          <div
            class="font-laundry text-[36px] -tracking[1.1%] font-semibold my-3"
          >
            {{ title }}
          </div>
          <div class="w-[650px] break-all">{{ description }}</div>
          <div class="w-[500px] flex h-[23px] justify-between">
            <div>작성자 | {{ name }}</div>
            <div>생성일 | {{ created_at }}</div>
            <div>수정일 | {{ updated_at }}</div>
            <div
              class="flex items-center gap-1 px-2 py-1 transition rounded-full"
            >
              <img
                :src="thumbsUp"
                alt="좋아요 아이콘"
                class="w-4 h-4"
                :class="{ 'opacity-50': !hasLiked }"
              />
              <span>{{ love }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="w-10 h-10">
        <button @click="openMenu" v-if="workbookUserCheck">
          <img :src="addOption" alt="문제집 추가 설정" />
        </button>
      </div>

      <div class="flex justify-between w-40" v-if="!workbookUserCheck">
        <button
          @click="handleLike"
          class="px-2 py-2 transition rounded-full item-middle w-14 h-14"
          :class="
            problemSetLike ? 'bg-orange-100 text-orange-1' : 'hover:bg-gray-100'
          "
        >
          <img
            :src="like"
            alt="좋아요"
            class="w-10 h-10"
            :class="{ 'opacity-50': !problemSetLike }"
          />
        </button>
        <button
          @click="handleShare"
          class="px-2 py-2 transition rounded-full item-middle w-14 h-14"
          :class="
            workbookShared ? 'bg-orange-100 text-orange-1' : 'hover:bg-gray-100'
          "
        >
          <img
            :src="bookMark"
            alt="공유받기"
            class="w-10 h-10"
            :class="{ 'opacity-50': !workbookShared }"
          />
        </button>
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
</template>

<style scoped></style>
