import { supabase } from ".";

// CREATE
/**
 *
 * @param {object} body test_center_id, correct_count, total_count, time
 * @returns
 */
const add = async (body) => {
  try {
    const { data, error } = await supabase
      .from("test_result")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

// READ
/**
 * @description 시험내역에 사용되는 API
 * @param {*} userId
 * @returns
 */
const getAllByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("test_result")
      .select("*, test_center(*, workbook(id, title, description))")
      .eq("uid", userId);

    const results = await Promise.all(
      data.map(async (test_result) => {
        const { data: users, error } = await supabase
          .from("test_result")
          .select("user_info(name, avatar_url)")
          .eq("test_center_id", test_result.test_center_id);

        if (error) throw error;
        return {
          ...test_result,
          users,
          workbook: test_result.test_center.workbook,
        };
      }),
    );

    if (error) throw error;
    return results;
  } catch (error) {
    console.error(error);
  }
};

/**
 * @description 시험 제출 여부 확인
 * @param {String} userId
 * @param {Number} testCenterId
 * @returns
 */
const checkIsSubmitted = async (userId, testCenterId) => {
  try {
    const { data, error } = await supabase
      .from("test_result")
      .select("*")
      .eq("uid", userId)
      .eq("test_center_id", testCenterId);

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @description 시험 내역 검색에 사용하는 API
 * @param {String} userId
 * @param {String} keyword 검색 키워드
 * @param {String} startDate YYYY-MM-DD
 * @param {String} endDate YYYY-MM-DD
 * @returns
 */
const search = async (userId, keyword, startDate, endDate) => {
  try {
    const query = supabase
      .from("test_result")
      .select("*, test_center(*, workbook(id, title, description))")
      .eq("uid", userId)
      .not("test_center", "is", null)
      .order("created_at", { ascending: false });

    if (keyword) {
      const { data: workbooks, error: workbookError } = await supabase
        .from("workbook")
        .select("id")
        .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);

      if (workbookError) throw workbookError;

      const workbookIds = workbooks.map((workbook) => workbook.id);
      query.in("test_center.workbook_id", workbookIds);
    }
    if (startDate) {
      query.gte("created_at", startDate);
    }
    if (endDate) {
      query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const results = await Promise.all(
      data.map(async (test_result) => {
        const { data: users, error } = await supabase
          .from("test_result")
          .select("user_info(name, avatar_url)")
          .eq("test_center_id", test_result.test_center_id);

        if (error) throw error;
        return {
          ...test_result,
          users,
          workbook: test_result.test_center.workbook,
        };
      }),
    );

    return results;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// 내 시험 점수
const getScore = async (testResultId) => {
  try {
    if (!testResultId) {
      console.error("유효하지 않은 testResultId:", testResultId);
      return { total: 0, correct: 0 };
    }

    const { data, error } = await supabase
      .from("test_result")
      .select("correct_count, total_count")
      .eq("id", testResultId);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("데이터가 없습니다. testResultId:", testResultId);
      return { total: 0, correct: 0 };
    }

    const result = data.reduce(
      (acc, row) => {
        acc.total += row.total_count || 0;
        acc.correct += row.correct_count || 0;
        return acc;
      },
      { total: 0, correct: 0 },
    );

    return result;
  } catch (error) {
    console.error("Error fetching score:", error);
    return;
  }
};

// 평균값 계산
const getAverage = async (testResultId) => {
  try {
    const { data: testResultData, error: testResultError } = await supabase
      .from("test_result")
      .select("test_center_id")
      .eq("id", testResultId)
      .single();

    if (testResultError) throw testResultError;

    if (!testResultData || !testResultData.test_center_id) {
      console.warn("No test_center_id found for testResultId:", testResultId);
      return 0;
    }

    const testCenterId = testResultData.test_center_id;

    // 해당 시험장의 모든 데이터 가져오기
    const { data: results, error: resultsError } = await supabase
      .from("test_result")
      .select("uid, correct_count, created_at")
      .eq("test_center_id", testCenterId)
      .order("created_at", { ascending: false });

    if (resultsError) throw resultsError;

    if (!results || results.length === 0) {
      console.warn("No data found for test_center_id:", testCenterId);
      return 0;
    }

    // Map으로 중복 uid 제거 (최신 데이터 유지)
    const latestResults = Array.from(
      new Map(results.map((row) => [row.uid, row])).values(),
    );

    const totalCorrect = latestResults.reduce(
      (sum, row) => sum + (row.correct_count || 0),
      0,
    );
    const usersCount = latestResults.length;

    const averageScore = usersCount > 0 ? totalCorrect / usersCount : 0;
    return averageScore.toFixed(1);
  } catch (error) {
    console.error("평균 계산 오류", error);
    return 0;
  }
};

//유저의 scores 가져오기
const getUsersScores = async (testCenterId) => {
  try {
    if (!testCenterId) throw new Error("유효하지 않은 testCenterId");

    const { data, error } = await supabase
      .from("test_result")
      .select("uid, test_center_id, correct_count, user_info(name)")
      .eq("test_center_id", testCenterId)
      .order("correct_count", { ascending: false });

    if (error) {
      console.error("Supabase 에러:", error);
      throw error;
    }
    return (
      data?.map((item) => ({
        uid: item.uid,
        name: item.user_info?.name || "Unknown User",
        test_center_id: item.test_center_id,
        correct_count: item.correct_count ?? 0,
      })) || []
    );
  } catch (error) {
    console.error("시험장 사용자 점수 가져오기 오류:", error);
    throw error;
  }
};

// 시험장 ID 가져오기
const fetchTestCenterId = async (testResultId) => {
  try {
    if (!testResultId) {
      console.error("유효하지 않은 testResultId:", testResultId);
      return null;
    }

    const { data, error } = await supabase
      .from("test_result")
      .select("test_center_id")
      .eq("id", testResultId);

    if (error) {
      console.error("시험장 ID 가져오기 실패:", error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0].test_center_id;
    } else {
      console.error(
        "해당 testResultId에 대한 test_center_id를 찾을 수 없습니다.",
      );
      return null;
    }
  } catch (error) {
    console.error("시험장 ID 가져오는 중 오류 발생:", error);
    throw error;
  }
};

// 시험장의 문제집 정보 가져오기
const fetchWorkbookFromTestResult = async (testResultId) => {
  if (!testResultId) {
    console.error("[ERROR] testResultId is required");
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("test_result")
      .select(
        `
        test_center!inner(id,
          workbook!inner(id, title, description)
        )
      `,
      )
      .eq("id", testResultId);

    if (error) {
      console.error("supabase query 오류", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn(
        "[WARN] No workbook data found for testResultId:",
        testResultId,
      );
      return null;
    }

    const workbook = data[0]?.test_center?.workbook;

    return workbook;
  } catch (error) {
    console.error("[ERROR] Unexpected error occurred:", error.message);
    return null;
  }
};

export const testResultAPI = {
  add,
  getAllByUserId,
  checkIsSubmitted,
  search,
  getScore,
  getAverage,
  getUsersScores,
  fetchTestCenterId,
  fetchWorkbookFromTestResult,
};
