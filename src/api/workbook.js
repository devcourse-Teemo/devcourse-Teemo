import { supabase } from ".";

// CREATE
const add = async (title, description, shared) => {
  const { data, error } = await supabase
    .from("workbook")
    .insert([{ title, description, shared }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const workbookProblemAdd = async (body) => {
  try {
    const { data, error } = await supabase
      .from("workbook_problem")
      .insert(body)
      .select();
    if (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
};

const sharedWorkbookAdd = async (body) => {
  try {
    const { data, error } = await supabase
      .from("shared_workbook")
      .insert(body)
      .select();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// READ
const getWorkbookProblems = async (workbookId) => {
  const { data, error } = await supabase.rpc("workbook_problem_info", {
    workbook_id: workbookId,
  });
  if (error) {
    console.error("Error fetching workbook problems:", error);
    return null;
  }
  return data;
};

const getSharedWorkbook = async (workbookId, uid) => {
  try {
    const { data, error } = await supabase
      .from("shared_workbook")
      .select("uid")
      .eq("uid", uid)
      .eq("workbook_id", workbookId);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

const getOne = async (id) => {
  const { data, error } = await supabase
    .from("workbook")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

const getAll = async (uid) => {
  const { data, error } = await supabase
    .from("workbook")
    .select("*")
    .eq("uid", uid);
  if (error) throw error;
  return data;
};

const getAllNewWorkbooks = async (uid) => {
  const { data, error } = await supabase
    .from("workbook")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false }); // 최신순 정렬 추가
  if (error) throw error;
  return data;
};

const getUid = async (uid) => {
  const { data, error } = await supabase
    .from("workbook")
    .select("*")
    .eq("uid", uid);
  if (error) throw error;
  return data;
};

/**
 * @description 공유된 문제집 목록을 가져오는 API
 * @returns
 */
const getAllShared = async () => {
  const { data, error } = await supabase
    .from("workbook")
    .select(
      "*, user: user_info(name, avatar_url), problems: workbook_problem(problem_id), likes: workbook_like(id)",
    )
    .eq("shared", true);
  if (error) throw error;
  return data;
};
// 유저가 공유받은 workbook 가져오기
const getShared = async (uid) => {
  const { data, error } = await supabase
    .from("shared_workbook")
    .select("*")
    .eq("uid", uid);
  if (error) throw error;
  return data;
};
/**
 * @description 특정 유저가 공유한 문제집 목록을 가져오는 API
 * @param {*} uid 유저 ID
 * @returns
 */
const getAllSharedByUserId = async (uid) => {
  try {
    const { data, error } = await supabase
      .from("workbook")
      .select(
        `
        *,
        user: user_info!uid(*),
        problems: workbook_problem(*),
        likes: workbook_like(id)
      `,
      )
      .eq("uid", uid)
      .eq("shared", true);

    const result = data.map((workbook) => ({
      ...workbook,
      count: workbook.problems.length,
    }));

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(error);
  }
};

const search = async (keyword, startDate, endDate) => {
  const query = supabase
    .from("workbook")
    .select(
      `
      *,
      user: user_info(name, avatar_url),
      problems: workbook_problem(problem_id),
      likes: workbook_like(id)
    `,
    )
    .eq("shared", true);

  if (keyword) {
    query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }
  if (startDate) {
    query.gte("created_at", startDate);
  }
  if (endDate) {
    query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

const checkWorkbookInsert = async () => {
  const { data, error } = await supabase
    .from("workbook")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching workbook data:", error);
  } else {
    if (data && data.length > 0) {
      console.log("Latest workbook entry:", data[0]);
    } else {
      console.log("No workbook entries found");
    }
  }
};

// UPDATE
const updated_at = new Date();
const workbookCommentInfo = async (workbookId, page, pageSize) => {
  try {
    const { data, error } = await supabase.rpc("workbook_comment_info", {
      workbook_id: workbookId,
      page_number: page,
      page_size: pageSize,
    });

    if (error) {
      console.error("Error fetching workbook comments:", error);
      return null;
    }
    return { data, totalCount: data[0]?.total_count || 0 };
  } catch (error) {
    console.error("실패:", error);
  }
};

/**
 *
 * @param {object} body
 * @param {string} body.title
 * @param {string} body.description
 * @param {string} body.shared
 * @param {number} id 문제집 id
 * @returns
 */
const update = async (body, id) => {
  try {
    const { data, error } = await supabase
      .from("workbook")
      .update(body)
      .eq("id", id);

    if (error) console.log(error);
    return data;
  } catch (error) {
    console.log(error);
  }
};

const updateTitle = async (title, id) => {
  await supabase.from("workbook").update({ title, updated_at }).eq("id", id);
};

const updateDescription = async (description, id) => {
  await supabase
    .from("workbook")
    .update({ description, updated_at })
    .eq("id", id);
};

// DELETE
const removeProblem = async (workbook_id, problem_id) => {
  try {
    const { error } = await supabase
      .from("workbook_problem")
      .delete()
      .eq("workbook_id", workbook_id)
      .eq("problem_id", problem_id);
    if (error) console.log(error);
  } catch (error) {
    console.log(error);
  }
};

const removeWorkbook = async (workbook_id) => {
  try {
    const { data, error } = await supabase
      .from("workbook")
      .delete()
      .eq("id", workbook_id);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

/**
 * @description 특정 workbook에 포함된 문제의 총 개수를 조회합니다
 * @param {number} workbookId - 조회할 workbook의 ID
 * @returns {number} 해당 workbook에 포함된 문제의 총 개수
 */
const getWorkbookProblemCount = async (workbookId) => {
  try {
    const { data, count, error } = await supabase
      .from("workbook_problem")
      .select("*", { count: "exact" })
      .eq("workbook_id", workbookId);

    if (error) throw error;
    return count;
  } catch (error) {
    console.error("문제 수 조회 실패:", error);
    throw error;
  }
};

// READ - 유저의 모든 문제집 조회
const getAllByUserId = async (userId) => {
  const { data, error } = await supabase
    .from("workbook")
    .select(
      `
        *,
        workbook_problem (count)
      `,
    )
    .eq("uid", userId);

  if (error) throw error;
  return data;
};
const sharedWorkbookDelete = async (uid, workbook_id) => {
  try {
    const { data, error } = await supabase
      .from("shared_workbook")
      .delete()
      .eq("uid", uid)
      .eq("workbook_id", workbook_id);
    if (error) console.log(error);
  } catch (error) {
    console.error(error);
  }
};

const fetchSharedWorkbooks = async (uid) => {
  try {
    const { data: sharedData, error: sharedError } = await supabase
      .from("shared_workbook")
      .select("workbook_id")
      .eq("uid", uid);

    if (sharedError) throw sharedError;
    if (!sharedData || sharedData.length === 0) return [];

    const workbookIds = sharedData.map((item) => item.workbook_id);

    const { data: workbooks, error: workbooksError } = await supabase
      .from("workbook")
      .select("id, title, description, uid")
      .in("id", workbookIds);

    if (workbooksError) throw workbooksError;

    const author = workbooks.map((book) => book.uid);
    const { data: users, error: usersError } = await supabase
      .from("user_info")
      .select("id, name, avatar_url")
      .in("id", author);

    if (usersError) throw usersError;

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = { name: user.name, avatar_url: user.avatar_url };
      return acc;
    }, {});

    return workbooks.map((book) => ({
      ...book,
      user: userMap[book.uid] || { name: "알 수 없음", avatar_url: "" },
    }));
  } catch (error) {
    console.error("공유받은 문제집을 가져오는 중 오류 발생:", error);
    return [];
  }
};

export const workbookAPI = {
  add,
  getAll,
  getOne,
  getShared,
  getAllShared,
  getAllSharedByUserId,
  getWorkbookProblems,
  getAllShare: getAllSharedByUserId,
  search,
  getUid,
  updateTitle,
  updateDescription,
  update,
  removeProblem,
  checkWorkbookInsert,
  workbookCommentInfo,
  workbookProblemAdd,
  getWorkbookProblemCount,
  getSharedWorkbook,
  sharedWorkbookAdd,
  removeWorkbook,
  getAllByUserId,
  fetchSharedWorkbooks,
  sharedWorkbookDelete,
  getAllNewWorkbooks,
};
