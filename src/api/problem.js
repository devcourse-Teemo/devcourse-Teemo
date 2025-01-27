import { useAuthStore } from "@/store/authStore.js";
import { supabase } from "./index.js";

/**
 * @description 게시판에서 사용되는 API
 * @param {*} userId
 * @returns
 */
const getAllShared = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("problem")
      .select(
        "*, category(*), history: problem_history(*), likes: problem_like(*)",
      )
      .eq("shared", true)
      .filter("history.uid", "eq", userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

const getAllByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("problem")
      .select("*")
      .eq("uid", userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 * @description 특정 유저가 공유한 문제를 가져올 때 사용하는 API
 * @param {*} userId
 * @returns
 */
const getAllSharedByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("problem")
      .select("*")
      .eq("uid", userId)
      .eq("shared", true);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @description 게시판 검색에 사용하는 API
 * @param {String} userId
 * @param {String} keyword 검색 키워드
 * @param {String} status 상태
 * @param {String} startDate YYYY-MM-DD
 * @param {String} endDate YYYY-MM-DD
 * @returns
 */
const search = async (userId, keyword, startDate, endDate, status) => {
  try {
    let query = supabase
      .from("problem")
      .select(
        "*, category(*), history: problem_history(*), likes: problem_like(*)",
      );

    if (keyword) {
      query.or(`title.ilike.%${keyword}%,question.ilike.%${keyword}%`);
    }
    if (startDate) {
      query.gte("created_at", startDate); // 시작 날짜 조건
    }
    if (endDate) {
      query.lte("created_at", endDate);
    }

    let { data, error } = await query;

    if (status === "푼 문제") {
      const { data: historyData } = await supabase
        .from("problem_history")
        .select("*, user_info(*)")
        .eq("uid", userId);

      data = data.filter((problem) =>
        historyData.some((history) => history.problem_id === problem.id),
      );
    } else if (status === "안 푼 문제") {
      const { data: historyData } = await supabase
        .from("problem_history")
        .select("*, user_info(*)")
        .eq("uid", userId);

      data = data.filter((problem) =>
        historyData.every((history) => history.problem_id !== problem.id),
      );
    } else if (status === "틀린 문제") {
      const { data: historyData } = await supabase
        .from("problem_history")
        .select("*, user_info(*)")
        .eq("uid", userId)
        .order("created_at", { ascending: false })
        .single();

      data = data.filter(
        (problem) =>
          problem.id === historyData.problem_id && history.status === "wrong",
      );
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @description problem_type = "multiple_choice" | "ox"
 * @param {Number} workbook_id 문제집의 id
 * @param {object} body title, question, answer, explanation, origin_source, problem_type, category_id, image_src, option_one, option_two, option_three, option_four, shared
 * @returns
 */
const add = async (workbook_id, body) => {
  try {
    const {
      title,
      problem_type,
      option_one,
      option_two,
      option_three,
      option_four,
    } = body;
    if (problem_type === "multiple_choice") {
      if (!option_one) throw new Error(`${title}: 1번 보기가 비어있습니다.`);
      if (!option_two) throw new Error(`${title}: 2번 보기가 비어있습니다.`);
      if (!option_three) throw new Error(`${title}: 3번 보기가 비어있습니다.`);
      if (!option_four) throw new Error(`${title}: 4번 보기가 비어있습니다.`);
    }

    const { user } = useAuthStore();
    const newBody = { ...body, uid: user.id }; // user_id 추가
    const { data, error } = await supabase
      .from("problem")
      .insert([newBody])
      .select();

    await supabase
      .from("workbook_problem")
      .insert([{ workbook_id, problem_id: data[0].id }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @param {Number} workbook_id 문제집의 id
 * @param {Array} problemIds 문제 id의 배열
 * @returns
 */
const addMultiple = async (workbook_id, problemIds) => {
  try {
    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      throw new Error("problemIds 배열이 비어있거나 유효하지 않습니다.");
    }

    const problemDataPromises = problemIds.map(async (problemId) => {
      const { data, error } = await supabase
        .from("problem")
        .select("*")
        .eq("id", problemId)
        .single();

      if (error)
        throw new Error(
          `문제를 가져오는 중 오류 발생 (ID: ${problemId}): ${error.message}`,
        );

      return data;
    });

    const problems = await Promise.all(problemDataPromises);

    const workbookProblems = problems.map((problem) => {
      const {
        title,
        problem_type,
        option_one,
        option_two,
        option_three,
        option_four,
      } = problem;

      if (problem_type === "multiple_choice") {
        if (!option_one) throw new Error(`${title}: 1번 보기가 비어있습니다.`);
        if (!option_two) throw new Error(`${title}: 2번 보기가 비어있습니다.`);
        if (!option_three)
          throw new Error(`${title}: 3번 보기가 비어있습니다.`);
        if (!option_four) throw new Error(`${title}: 4번 보기가 비어있습니다.`);
      }

      return { workbook_id, problem_id: problem.id };
    });

    const { data, error } = await supabase
      .from("workbook_problem")
      .upsert(workbookProblems, { onConflict: ["workbook_id", "problem_id"] })
      .select();

    if (error) throw new Error(`데이터 삽입 중 오류 발생: ${error.message}`);

    // 추가된 행의 개수 계산
    const existingSet = new Set(
      workbookProblems.map((wp) => `${wp.workbook_id}-${wp.problem_id}`),
    );
    const insertedCount = data.filter(
      (wp) => !existingSet.has(`${wp.workbook_id}-${wp.problem_id}`),
    ).length;
    return { data, insertedCount };
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * @description 아래의 속성을 모두 다 넣을 필요는 없고, 바꾸고 싶은 값만 사용하시면 됩니다
 * @param {object} body title, question, answer, explanation, origin_source, problem_type, category, image_src, option_one, option_two, option_three, option_four, shared
 * @returns
 */
const update = async (id, body) => {
  try {
    const { data, error } = await supabase
      .from("problem")
      .update(body)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

const deleteOne = async (id) => {
  try {
    const { data, error } = await supabase
      .from("problem")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 * @description 한 문제만 가져오기
 * @param {*} id - 문제 id
 * @returns
 */
const getById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("problem")
      .select(
        `
        *,
        category (
          id,
          name
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * @description 특정 문제가 사용자의 북마크에 있는지 확인
 * @param {string} uid - 사용자 ID
 * @param {number} problem_id - 문제 ID
 * @returns {boolean} 북마크 여부 (true: 북마크됨, false: 북마크되지 않음)
 */
const checkIsShared = async (uid, problem_id) => {
  try {
    const { data, error } = await supabase
      .from("shared_problem")
      .select("id")
      .eq("uid", uid)
      .eq("problem_id", problem_id)
      .single();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("북마크 상태 확인 실패:", error);
    return false;
  }
};

/**
 * @description 문제를 사용자의 북마크에 추가
 * @param {number} problem_id - 북마크할 문제 ID
 * @returns {object} 생성된 북마크 데이터
 */
const addShare = async (problem_id) => {
  try {
    const { data, error } = await supabase
      .from("shared_problem")
      .insert([{ problem_id }])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("북마크 추가 실패:", error);
    throw error;
  }
};

/**
 * @description 문제를 사용자의 북마크에서 제거
 * @param {number} problem_id - 삭제할 북마크의 문제 ID
 * @returns {boolean} 삭제 성공 여부
 */
const removeShare = async (problem_id) => {
  try {
    const { error } = await supabase
      .from("shared_problem")
      .delete()
      .eq("problem_id", problem_id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("북마크 삭제 실패:", error);
    throw error;
  }
};

export const problemAPI = {
  getAllShared,
  getAllByUserId,
  getAllSharedByUserId,
  getById,
  search,
  add,
  addMultiple,
  update,
  deleteOne,
  checkIsShared,
  addShare,
  removeShare,
};
