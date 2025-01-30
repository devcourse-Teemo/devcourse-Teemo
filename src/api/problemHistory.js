import { supabase } from ".";

// CREATE
/**
 *
 * @param {Array} body {uid, problem_id, test_center_id}
 * @returns
 */
const add = async (body) => {
  const { data, error } = await supabase
    .from("problem_history")
    .insert([body])
    .select();

  if (error) throw error;
  return data;
};

// READ
const getUid = async (uid) => {
  await supabase.from("workbook_like").select("problem_id").eq("uid", uid);
};

//내가 고른 선택지

const getTestCenterId = async (testResultId) => {
  console.log("getTestCenterId 호출됨, testResultId:", testResultId);

  const query = supabase
    .from("test_result")
    .select("test_center_id, created_at")
    .eq("id", testResultId)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("getTestCenterId 에러:", error);
    return null;
  }

  console.log("getTestCenterId 결과:", data);
  return data;
};

const getProblemHistory = async (testCenterId) => {
  console.log("getProblemHistory 호출됨, testCenterId:", testCenterId);

  const query = supabase
    .from("problem_history")
    .select("problem_id, my_option, status")
    .eq("test_center_id", testCenterId)
    .order("problem_id", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("getProblemHistory 에러:", error);
    return null;
  }

  console.log("getProblemHistory 결과:", data);
  return data;
};

export const problemHistoryAPI = {
  add,
  getUid,
  // getMyOptionByTestResult,
  getTestCenterId,
  getProblemHistory,
};
