import { createRouter, createWebHistory } from "vue-router";
import DefaultLayout from "@/components/layout/DefaultLayout.vue";

// 페이지 컴포넌트 가져오기
import MyProblemSets from "@/pages/MyProblemSets.vue";
import MyProblems from "@/pages/my-problems/MyProblems.vue";
import ProblemBoard from "@/pages/problem-board/ProblemBoard.vue";
import ProblemSetBoard from "@/pages/problem-set-board/ProblemSetBoard.vue";
import ExamRoom from "@/pages/exam-room/ExamRoom.vue";
import LandingPage from "@/pages/LandingPage.vue";
import ExamHistory from "@/pages/exam-history/ExamHistory.vue";
import ProblemSetBoardDetail from "@/pages/ProblemSetBoardDetail.vue";
import CreateExamRoom from "@/pages/create-exam-room/CreateExamRoom.vue";
import ProblemBoardDetail from "@/pages/problem-detail/ProblemBoardDetail.vue";
import MyProblemsDetail from "@/pages/MyProblemsDetail.vue";
import ExamMake from "@/pages/ExamMake.vue";
import MyProblemSetsDetail from "@/pages/MyProblemSetsDetail.vue";
import MyProblemSetsUpdate from "@/pages/MyProblemSetsUpdate.vue";
import Mypage from "@/pages/Mypage/Mypage.vue";
import ProblemBoardDetailUpdate from "@/pages/ProblemBoardDetailUpdate.vue";
import UserProfile from "@/pages/user-profile/UserProfile.vue";
import Home from "@/pages/Home.vue";
import NotFound from "@/pages/NotFound.vue";
import { authAPI } from "@/api/auth";

const routes = [
  // 레이아웃이 필요없는 페이지들
  {
    path: "/",
    name: "LandingPage",
    component: LandingPage,
    meta: { landing: true },
  },
  {
    path: "/problem-editor",
    name: "ProblemEditor",
    component: () => import("@/pages/problem-editor/ProblemEditor.vue"),
  },
  {
    path: "/exam",
    name: "ExamEnvironment",
    component: () => import("@/pages/exam-environment/ExamEnvironment.vue"),
  },
  {
    path: "/exam-result/:examResultId",
    name: "ExamResult",
    component: () => import("@/pages/exam-result/ExamResult.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },

  // DefaultLayout을 사용하는 페이지들
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "home",
        name: "Home",
        component: Home,
        meta: { requiresAuth: true },
      },
      {
        path: "mypage",
        name: "mypage",
        component: Mypage,
        meta: { requiresAuth: true },
      },
      {
        path: "my-problems",
        name: "MyProblems",
        component: MyProblems,
        meta: { requiresAuth: true },
      },
      {
        path: "my-problems/:myProblemId",
        name: "MyProblemsDetail",
        component: MyProblemsDetail,
        meta: { requiresAuth: true },
      },
      {
        path: "my-problem-sets",
        name: "MyProblemSets",
        component: MyProblemSets,
        meta: { requiresAuth: true },
      },
      {
        path: "my-problem-sets-update/:problemSetId",
        name: "MyProblemSetsUpdate",
        component: MyProblemSetsUpdate,
        meta: { requiresAuth: true },
      },
      {
        path: "my-problem-sets/:problemSetId",
        name: "MyProblemSetsDetail",
        component: MyProblemSetsDetail,
        meta: { requiresAuth: true },
      },
      {
        path: "problem-board",
        name: "ProblemBoard",
        component: ProblemBoard,
        meta: { requiresAuth: true },
      },
      {
        path: "problem-set-board",
        name: "ProblemSetBoard",
        component: ProblemSetBoard,
        meta: { requiresAuth: true },
      },
      {
        path: "exam-room",
        name: "ExamRoom",
        component: ExamRoom,
        meta: { requiresAuth: true },
      },
      {
        path: "create-exam-room",
        name: "CreateExamRoom",
        component: CreateExamRoom,
        meta: { requiresAuth: true },
      },
      {
        path: "exam-history",
        name: "ExamHistory",
        component: ExamHistory,
        meta: { requiresAuth: true },
      },
      {
        path: "exam-make/:problemSetId",
        name: "ExamMake",
        component: ExamMake,
        meta: { requiresAuth: true },
      },
      {
        path: "problem-set-board/:problemSetId",
        name: "ProblemSetBoardDetail",
        component: ProblemSetBoardDetail,
        meta: { requiresAuth: true },
      },
      {
        path: "problem-board/:problemId",
        name: "ProblemBoardDetail",
        component: ProblemBoardDetail,
        meta: { requiresAuth: true },
      },

      {
        path: "problem-board-update/:problemId",
        name: "ProblemBoardDetailUpdate",
        component: ProblemBoardDetailUpdate,
        meta: { requiresAuth: true },
      },
      {
        path: "users/:userId",
        name: "UserProfile",
        component: UserProfile,
        meta: { requiresAuth: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _, next) => {
  const session = await authAPI.getSession();
  console.log(session);

  if (!session && to.meta.requiresAuth) {
    next("/");
  } else if (session && to.meta.landing) {
    next("/home");
  } else {
    next();
  }
});
export default router;
