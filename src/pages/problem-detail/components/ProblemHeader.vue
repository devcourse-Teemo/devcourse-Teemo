<script setup>
// APIs
import { pointAPI } from "@/api/point";
import { supabase } from "@/api/index.js";
import { problemLikeAPI } from "@/api/problemLike";

// Icons
import defaultProfileIMG from "@/assets/default-profile-image.svg";
import thumbsUpIcon from "@/assets/icons/problem-board/fi-rr-thumbs-up.svg";

// Prime vue
import { Avatar } from "primevue";
import { useToast } from "primevue/usetoast";

// Store
import { useAuthStore } from "@/store/authStore";

// Utils
import { getCurrentGradeInfo } from "@/utils/getCurrentGradeInfo";

// Vue Core
import { RouterLink } from "vue-router";
import { ref, computed, watchEffect, onBeforeUnmount } from "vue";

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

      if (pointData && pointData.length > 0 && pointData[0].total) {
        const totalPoints = pointData[0].total;
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

watchEffect(() => {
  loadLikeStatus();
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
  <div class="flex flex-col justify-between gap-10">
    <RouterLink
      v-if="routeConfig"
      :to="routeConfig"
      class="inline-flex items-center gap-2 w-fit"
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
        <span class="text-sm text-black-3" aria-label="최종 수정일">
          {{ new Date(problem?.updated_at).toLocaleString() }}
        </span>
      </div>
    </RouterLink>

    <div class="flex items-center gap-4 mb-10">
      <div class="flex-1">
        <h1 class="mb-4 text-4xl font-bold">{{ problem?.title }}</h1>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span class="px-2 py-1 bg-gray-100 rounded">{{
            problem?.category?.name
          }}</span>
          <div
            class="flex items-center gap-1 px-2 py-1 transition rounded-full"
          >
            <img
              :src="thumbsUpIcon"
              alt="좋아요 아이콘"
              class="w-4 h-4"
              :class="{ 'opacity-50': !hasLiked }"
            />
            <span>{{ likeCount }}</span>
          </div>
        </div>
      </div>

      <div class="relative flex items-center justify-center">
        <button
          v-if="isAuthor"
          class="flex items-center justify-center w-12 h-12 transition-colors rounded-full menu-trigger hover:bg-gray-100"
          @click="toggleMenu"
          aria-label="더보기"
        >
          <i class="pi pi-ellipsis-h"></i>
        </button>
        <button
          v-else
          @click="handleToggleLike"
          class="gap-1 px-2 py-2 transition rounded-full item-middle w-14 h-14"
          :class="
            hasLiked ? 'bg-orange-100 text-orange-1' : 'hover:bg-gray-100'
          "
        >
          <img
            :src="thumbsUpIcon"
            alt="좋아요 아이콘"
            class="w-10 h-10"
            :class="{ 'opacity-50': !hasLiked }"
          />
        </button>

        <div
          v-if="showMenu"
          class="absolute right-0 flex flex-col mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg menu-container top-12"
          style="z-index: 1000"
        >
          <button
            @click="emit('menu-action', 'edit')"
            class="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <i class="pi pi-pencil"></i>
            <span>수정하기</span>
          </button>
          <div class="border-b border-gray-200"></div>
          <button
            @click="emit('menu-action', 'delete')"
            class="flex items-center gap-2 px-4 py-2 text-red-600 transition-colors hover:bg-gray-100 active:bg-gray-200"
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
