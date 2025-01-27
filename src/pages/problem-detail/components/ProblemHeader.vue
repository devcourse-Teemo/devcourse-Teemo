<script setup>
import { ref, computed, watchEffect, onBeforeUnmount } from "vue";
import { Avatar } from "primevue";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "primevue/usetoast";
import { pointAPI } from "@/api/point";
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";
import { problemAPI } from "@/api/problem";
import { problemLikeAPI } from "@/api/problemLike";
import { supabase } from "@/api/index.js";
import { RouterLink } from "vue-router";
import shareIcon from "@/assets/icons/problem-board/fi-rr-share.svg";
import thumbsUpIcon from "@/assets/icons/problem-board/fi-rr-thumbs-up.svg";
import defaultProfileIMG from "@/assets/default-profile-image.svg";

const props = defineProps({
  problem: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  author: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  hasLiked: {
    type: Boolean,
    required: true,
    default: false,
  },
  likeCount: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["toggle-like", "menu-action"]);
const toast = useToast();
const userGrade = ref(null);
const showMenu = ref(false);
const authStore = useAuthStore();

const hasLiked = ref(false);
const likeCount = ref(0);
const isBookmarked = ref(false);

const getCurrentUserId = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id;
  } catch (error) {
    console.error("사용자 정보 가져오기 실패:", error);
    return null;
  }
};

const isAuthor = computed(() => {
  return props.author?.id === authStore.user?.id;
});

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const closeMenu = (event) => {
  const menu = document.querySelector(".menu-container");
  const button = document.querySelector(".menu-trigger");
  if (!menu?.contains(event.target) && !button?.contains(event.target)) {
    showMenu.value = false;
  }
};

const handleAvatarError = (e) => {
  e.target.src = defaultProfileIMG;
};

const fetchUserGrade = async () => {
  try {
    if (props.author?.id) {
      const pointData = await pointAPI.getAll(props.author.id);
      if (pointData && pointData.length > 0) {
        const totalPoints = pointData.reduce(
          (sum, point) => sum + point.point,
          0,
        );
        const gradeInfo = getCurrentGradeInfo(totalPoints);
        userGrade.value = gradeInfo.current;
      }
    }
  } catch (error) {
    console.error("등급 정보 조회 실패:", error);
  }
};

// 초기 좋아요 상태와 카운트 로드
const loadLikeStatus = async () => {
  const currentUserId = await getCurrentUserId();
  if (!props.problem?.id || !currentUserId) return;

  try {
    const [status, count] = await Promise.all([
      problemLikeAPI.getUserLikeStatus(currentUserId, props.problem.id),
      problemLikeAPI.getLikeCount(props.problem.id),
    ]);

    hasLiked.value = status;
    likeCount.value = count;
  } catch (error) {
    console.error("좋아요 상태 로딩 실패:", error);
  }
};

// 북마크 상태 로드
const loadBookmarkStatus = async () => {
  const currentUserId = await getCurrentUserId();
  if (!props.problem?.id || !currentUserId) return;

  try {
    const status = await problemAPI.checkIsShared(
      currentUserId,
      props.problem.id,
    );
    isBookmarked.value = status;
  } catch (error) {
    console.error("북마크 상태 로딩 실패:", error);
  }
};

// 좋아요 토글 핸들러
const handleToggleLike = async () => {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    toast.add({
      severity: "warn",
      summary: "로그인 필요",
      detail: "로그인 후 이용해주세요.",
      life: 3000,
    });
    return;
  }

  try {
    const result = await problemLikeAPI.toggle(currentUserId, props.problem.id);
    hasLiked.value = result.isLiked;
    likeCount.value += result.count;
  } catch (error) {
    console.error("좋아요 처리 실패:", error);
  }
};

// 북마크 토글 핸들러
const handleToggleBookmark = async () => {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    toast.add({
      severity: "warn",
      summary: "로그인 필요",
      detail: "로그인 후 이용해주세요.",
      life: 3000,
    });
    return;
  }

  try {
    if (isBookmarked.value) {
      await problemAPI.removeShare(props.problem.id);
    } else {
      await problemAPI.addShare(props.problem.id, currentUserId);
    }
    isBookmarked.value = !isBookmarked.value;

    toast.add({
      severity: isBookmarked.value ? "success" : "info",
      summary: isBookmarked.value ? "북마크 추가" : "북마크 해제",
      detail: isBookmarked.value
        ? "북마크에 추가되었습니다."
        : "북마크가 해제되었습니다.",
      life: 3000,
    });
  } catch (error) {
    console.error("북마크 처리 실패:", error);
    toast.add({
      severity: "error",
      summary: "처리 실패",
      detail: "북마크 처리 중 오류가 발생했습니다.",
      life: 3000,
    });
  }
};


watchEffect(() => {
  loadLikeStatus();
  loadBookmarkStatus();
  fetchUserGrade();
  document.addEventListener("click", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});

const routeConfig = computed(() => {
  if (!props.author?.id) return null;
  return {
    name: "UserProfile",
    params: { userId: props.author.id },
  };
});
</script>

<template>
  <div class="flex justify-between flex-col gap-10">
    <RouterLink
      v-if="routeConfig"
      :to="routeConfig"
      class="flex gap-2 items-center"
    >
      <Avatar
        :image="author?.avatar_url"
        @error="handleAvatarError"
        shape="circle"
        size="large"
      />
      <div>
        <p>
          <strong aria-label="닉네임">{{ author?.name || "닉네임" }}</strong>
          <span class="ml-2 text-black-3">
            {{ userGrade?.name || "등급 없음" }}
          </span>
        </p>
        <span class="text-black-3 text-sm" aria-label="최종 수정일">
          {{ new Date(problem?.updated_at).toLocaleString() }}
        </span>
      </div>
    </RouterLink>

    <div class="flex items-center gap-4 mb-10">
      <div class="flex-1">
        <h1 class="text-4xl font-bold mb-4">{{ problem?.title }}</h1>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span class="bg-gray-100 px-2 py-1 rounded">{{
            problem?.category?.name
          }}</span>
          <div class="flex items-center gap-1">
            <img :src="shareIcon" alt="공유 아이콘" class="w-4 h-4" />
            <span>{{ problem?.shared ? "공개됨" : "미공개" }}</span>
          </div>
          <button
            @click="handleToggleLike"
            class="flex items-center gap-1 px-2 py-1 rounded-full transition"
            :class="
              hasLiked ? 'bg-orange-100 text-orange-1' : 'hover:bg-gray-100'
            "
          >
            <img
              :src="thumbsUpIcon"
              alt="좋아요 아이콘"
              class="w-4 h-4"
              :class="{ 'opacity-50': !hasLiked }"
            />
            <span>{{ likeCount }}</span>
          </button>
          <button
            aria-label="북마크 버튼"
            v-if="!isAuthor"
            @click="handleToggleBookmark"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-gray-100 transition"
            :class="{ 'text-orange-1 bg-orange-100': isBookmarked }"
          >
            <i
              class="pi"
              :class="isBookmarked ? 'pi-bookmark-fill' : 'pi-bookmark'"
            ></i>
          </button>
        </div>
      </div>

      <div class="relative flex items-center justify-center">
        <button
          v-if="isAuthor"
          class="menu-trigger w-12 h-12 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
          @click="toggleMenu"
          aria-label="더보기"
        >
          <i class="pi pi-ellipsis-h"></i>
        </button>

        <div
          v-if="showMenu"
          class="menu-container absolute right-0 top-12 mt-2 flex bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex-col"
          style="z-index: 1000"
        >
          <button
            @click="emit('menu-action', 'edit')"
            class="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <i class="pi pi-pencil"></i>
            <span>수정하기</span>
          </button>
          <div class="border-b border-gray-200"></div>
          <button
            @click="emit('menu-action', 'delete')"
            class="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 active:bg-gray-200 transition-colors text-red-600"
          >
            <i class="pi pi-trash"></i>
            <span>삭제하기</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-container {
  min-width: 220px;
}
</style>
