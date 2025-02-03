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

const getTestCenterId = async (testResultId, userId) => {
  const query = supabase
    .from("test_result")
    .select("test_center_id")
    .eq("id", testResultId)
    .eq("uid", userId)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("getTestCenterId 에러:", error);
    return null;
  }

  return data;
};

const getProblemHistory = async (testCenterId, userId) => {
  const query = supabase
    .from("problem_history")
    .select("problem_id, my_option, status")
    .eq("test_center_id", testCenterId)
    .eq("uid", userId)
    .order("problem_id", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("getProblemHistory 에러:", error);
    return null;
  }
  return data;
};

export const problemHistoryAPI = {
  add,
  getUid,
  getTestCenterId,
  getProblemHistory,
};
