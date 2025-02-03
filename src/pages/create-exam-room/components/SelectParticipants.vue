<script setup>
import { ref, watchEffect } from "vue";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "@/store/authStore";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import UserListItem from "./UserListItem.vue";
import searchIcon from "@/assets/icons/search-icon.svg";
import { followAPI } from "@/api/follow";
import { userAPI } from "@/api/user";

const props = defineProps({
  participants: {
    type: Array,

    required: true,
  },
});

const emit = defineEmits(["update:participants"]);

const toast = useToast();
const newParticipant = ref("");
const selectedUsers = ref([]);
const followingUsers = ref([]);
const searchResults = ref([]);
const authStore = useAuthStore();
const isSearching = ref(false);

const fetchFollowing = async () => {
  try {
    if (authStore.user?.id) {
      const followData = await followAPI.getFollowing(authStore.user.id);

      // followingUsers 값 생성
      followingUsers.value = followData.map((item) => ({
        email: item.following.email,
        nickname: item.following.name || item.following.email.split("@")[0],
        profileImage: item.following.avatar_url,
        uid: item.following.id, // uid 값을 올바르게 설정
      }));
    }
  } catch (error) {
    console.error("팔로잉 목록 불러오기 실패:", error);
    followingUsers.value = []; // 에러 발생 시 빈 배열로 초기화
    toast.add({
      severity: "error",
      summary: "불러오기 실패",
      detail: "팔로잉 목록을 불러오는데 실패했습니다.",
      life: 3000,
    });
  }
};

const searchUserByEmail = async () => {
  if (!newParticipant.value) {
    searchResults.value = [];
    return;
  }

  try {
    isSearching.value = true;
    const results = await userAPI.searchUsersByEmail(newParticipant.value);

    // 현재 로그인한 사용자와 이미 초대된 사용자 제외
    searchResults.value = results
      .filter(
        (user) =>
          user.id !== authStore.user?.id &&
          !selectedUsers.value.some(
            (selected) => selected.email === user.email,
          ),
      )
      .map((user) => ({
        email: user.email,
        nickname: user.name || user.email.split("@")[0],
        profileImage: user.avatar_url,
        uid: user.id,
      }));

    if (searchResults.value.length === 0) {
      toast.add({
        severity: "info",
        summary: "검색 결과 없음",
        detail: "해당 이메일의 사용자를 찾을 수 없습니다.",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("사용자 검색 중 오류:", error);
    toast.add({
      severity: "error",
      summary: "검색 실패",
      detail: "사용자 검색 중 문제가 발생했습니다.",
      life: 3000,
    });
  } finally {
    isSearching.value = false;
  }
};

const handleUserAdd = (user) => {
  if (!selectedUsers.value.some((selected) => selected.email === user.email)) {
    selectedUsers.value.push(user);
    emit("update:participants", selectedUsers.value);
    searchResults.value = []; // 사용자 추가 후 검색 결과 초기화
  }
};

const handleUserRemove = (user) => {
  if (user.isOwner) {
    toast.add({
      severity: "warn",
      summary: "삭제 불가",
      detail: "시험 주최자는 삭제할 수 없습니다.",
      life: 3000,
    });
    return;
  }
  selectedUsers.value = selectedUsers.value.filter(
    (selected) => selected.email !== user.email,
  );
  emit("update:participants", selectedUsers.value);
};

const addParticipantByEmail = async () => {
  if (!newParticipant.value) return;

  const session = JSON.parse(
    localStorage.getItem(
      "sb-" + import.meta.env.VITE_SUPABASE_PROJECT_REF + "-auth-token",
    ),
  );
  if (session?.user?.email === newParticipant.value) {
    toast.add({
      severity: "warn",
      summary: "추가 불가",
      detail: "자기 자신은 추가할 수 없습니다.",
      life: 3000,
    });
    return;
  }

  await searchUserByEmail();
  newParticipant.value = "";
};

// 초기화 및 감시
watchEffect(() => {
  if (authStore.isAuthenticated) {
    fetchFollowing();
  }
});

watchEffect(() => {
  selectedUsers.value = props.participants;
});

// 사용자 정보 설정
watchEffect(() => {
  try {
    const storageKeys = Object.keys(localStorage);
    const supabaseAuthKey = storageKeys.find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token"),
    );

    if (supabaseAuthKey) {
      const sessionStr = localStorage.getItem(supabaseAuthKey);
      if (!sessionStr) return;

      const session = JSON.parse(sessionStr);
      if (session?.user) {
        const user = session.user;
        const hasOwner = selectedUsers.value.some((u) => u.isOwner);

        if (!hasOwner) {
          selectedUsers.value = [
            {
              email: user.email,
              nickname:
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "시험 주최자",
              profileImage: user.user_metadata?.avatar_url || "",
              isOwner: true,
            },
          ];
          emit("update:participants", selectedUsers.value);
        }
      }
    }
  } catch (error) {
    console.error("세션 정보 파싱 중 에러 발생:", error);
  }
});

watchEffect(() => {
  selectedUsers.value = props.participants.map((user) => ({
    ...user,
    uid: user.uid || user.id, // uid 값을 올바르게 설정
  }));
});
</script>

<template>
  <h2 class="text-2xl text-black-1 font-medium mb-6">시험장 초대하기</h2>

  <div class="flex justify-center gap-6 h-[400px] mb-6">
    <!-- 검색 및 팔로잉 목록 -->
    <div class="w-full h-full flex-col flex gap-6">
      <div class="flex shrink-0 relative">
        <InputText
          v-model="newParticipant"
          placeholder="이메일 주소를 입력하세요"
          class="flex-1 w-full pr-[80px]"
          @keyup.enter="addParticipantByEmail"
        />
        <Button
          label="추가"
          @click="addParticipantByEmail"
          class="absolute right-2 top-1/2 -translate-y-1/2 !rounded-l-none !bg-orange-1"
        >
          <img :src="searchIcon" alt="검색" class="w-4 h-4" />
        </Button>
      </div>

      <section
        class="rounded-xl bg-beige-1 w-full px-5 py-3 h-full flex-1 overflow-y-auto"
      >
        <!-- 검색 결과 -->
        <div v-if="searchResults?.length" class="mb-4">
          <h4 class="font-semibold mb-4">검색 결과</h4>
          <ul class="divide-y divide-gray-100">
            <UserListItem
              v-for="user in searchResults"
              :key="user.email"
              :user="user"
              :show-add-button="
                !selectedUsers.some((selected) => selected.email === user.email)
              "
              :show-remove-button="false"
              @add="handleUserAdd"
            />
          </ul>
        </div>

        <!-- 팔로잉 목록 -->
        <h4 class="font-semibold mb-4">팔로잉</h4>
        <div class="overflow-auto">
          <div
            v-if="followingUsers.length === 0"
            class="text-center text-gray-500 py-4 h-[80%] w-full item-middle"
          >
            팔로잉 목록이 비었습니다.
          </div>
          <ul v-else class="divide-y divide-gray-100">
            <UserListItem
              v-for="user in followingUsers"
              :key="user.email"
              :user="user"
              :show-add-button="
                !selectedUsers.some((selected) => selected.email === user.email)
              "
              :show-remove-button="
                selectedUsers.some((selected) => selected.email === user.email)
              "
              @add="handleUserAdd"
              @remove="handleUserRemove"
            />
          </ul>
        </div>
      </section>
    </div>

    <!-- 초대된 참가자 목록 -->
    <section
      class="rounded-xl bg-beige-1 w-full px-5 py-3 h-full flex flex-col"
    >
      <h4 class="font-medium mb-4">초대된 참가자</h4>
      <ul class="overflow-auto divide-y divide-gray-100 flex-grow">
        <UserListItem
          v-for="user in selectedUsers"
          :key="user.email"
          :user="user"
          :show-remove-button="!user.isOwner"
          :is-owner="user.isOwner"
          @remove="handleUserRemove"
        />
      </ul>
    </section>
  </div>
</template>
