import { useAuthStore } from "@/store/authStore.js";
import { supabase } from "./index.js";

const getAll = async () => {
  try {
    const { data, error } = await supabase.from("problem").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

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
      .select(
        `
        *,
        likes: problem_like(count),
        history:problem_history(
          status,
          created_at,
          uid
        )
      `,
      )
      .eq("uid", userId);

    if (error) throw error;

    const processedData = data.map((problem) => ({
      ...problem,
      likes: problem.likes[0]?.count || 0,
      latest_status:
        problem.history
          ?.filter((h) => h.uid === userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          ?.status || "none",
    }));

    return processedData;
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
    const { data, error } = await supabase.rpc("get_all_shared_problems", {
      user_id: userId,
    });

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
    const { data, error } = await supabase.rpc("search_problems", {
      user_id: userId,
      keyword,
      start_date: startDate,
      end_date: endDate,
      status,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @description 보관한 문제집 검색에 사용하는 API
 * @param {String} userId
 * @param {String} keyword 검색 키워드
 * @param {String} status 상태
 * @param {String} startDate YYYY-MM-DD
 * @param {String} endDate YYYY-MM-DD
 * @returns
 */
const searchForUser = async (userId, keyword, startDate, endDate, status) => {
  try {
    const { data, error } = await supabase.rpc("search_problems_for_user", {
      user_id: userId,
      keyword,
      start_date: startDate,
      end_date: endDate,
      status,
    });

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

    const newBody = { ...body };
    const { data, error } = await supabase
      .from("problem")
      .insert([newBody])
      .select();

    if (workbook_id) {
      await supabase
        .from("workbook_problem")
        .insert([{ workbook_id, problem_id: data[0].id }]);
    }

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
    const insertedData = data.filter(
      (item) => item.created_at === item.updated_at,
    );
    const insertedCount = insertedData.length;
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
        ),
        author:user_info (
          id,
          name,
          total_points,
          email,
          avatar_url
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
 * @description 사용자가 공유받은 문제들을 가져오는 API
 * @param {*} uid - 사용자 ID
 * @returns {Array} 사용자가 공유받은 문제들의 배열
 */
const getUserSharedProblems = async (uid) => {
  try {
    const { data, error } = await supabase
      .from("shared_problem")
      .select(
        `
        problem:problem_id (
          id,
          question,
          answer,
          explanation,
          created_at,
          updated_at,
          origin_source,
          problem_type,
          title,
          category_id,
          uid,
          image_src,
          option_one,
          option_two,
          option_three,
          option_four,
          shared,
          likes:problem_like(count),
          history:problem_history(
            status,
            created_at,
            uid
          )
        )
      `,
      )
      .eq("uid", uid);

    if (error) throw error;

    const processedData = data.map((item) => ({
      ...item.problem,
      likes: [{ count: item.problem.likes[0]?.count || 0 }],
      latest_status:
        item.problem.history
          ?.filter((h) => h.uid === uid)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          ?.status || "none",
    }));

    return processedData;
  } catch (error) {
    console.error("사용자의 공유된 문제를 가져오는 중 오류 발생:", error);
    return [];
  }
};

/**
 * @description 문제를 사용자의 북마크에 추가
 * @param {number} problem_id - 북마크할 문제 ID
 * @returns {object} 생성된 북마크 데이터
 */
const addShare = async (problem_id, uid) => {
  try {
    const { data, error } = await supabase
      .from("shared_problem")
      .insert([{ problem_id, uid }])
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

const getRandom = async () => {
  try {
    // 총 개수를 가져오기
    const { count, error: countError } = await supabase
      .from("problem")
      .select("*", { count: "exact", head: true })
      .eq("shared", true);

    if (countError) throw new Error(countError);

    if (!count || count === 0) {
      console.warn("No shared problems found.");
      return null;
    }

    // 랜덤한 인덱스 선택
    const randomIndex = Math.floor(Math.random() * count);

    // 해당 인덱스의 row 조회
    const { data, error } = await supabase
      .from("problem")
      .select("id")
      .eq("shared", true)
      .range(randomIndex, randomIndex)
      .single();

    if (error) throw new Error(error);

    return data.id;
  } catch (error) {
    console.error("Error fetching random problem:", error);
    return null;
  }
};

export const problemAPI = {
  getAll,
  getAllShared,
  getAllByUserId,
  getAllSharedByUserId,
  getById,
  search,
  searchForUser,
  add,
  addMultiple,
  update,
  deleteOne,
  checkIsShared,
  getUserSharedProblems,
  addShare,
  removeShare,
  getRandom,
};
