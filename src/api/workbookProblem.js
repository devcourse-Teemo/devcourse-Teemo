import { supabase } from "./index.js";

export const fetchProblemsForTestResult = async (testResultId) => {
  try {
    const { data: testResult, error: testResultError } = await supabase
      .from("test_result")
      .select("test_center_id")
      .eq("id", testResultId)
      .single();

    if (testResultError) {
      console.error("Error fetching test_center_id:", testResultError);
      throw testResultError;
    }
    const testCenterId = testResult.test_center_id;

    const { data: testCenter, error: testCenterError } = await supabase
      .from("test_center")
      .select("workbook_id")
      .eq("id", testCenterId)
      .single();

    if (testCenterError) {
      console.error("Error fetching workbook_id:", testCenterError);
      throw testCenterError;
    }
    const workbookId = testCenter.workbook_id;

    const { data: workbookProblems, error: workbookProblemError } =
      await supabase
        .from("workbook_problem")
        .select("problem_id")
        .eq("workbook_id", workbookId);

    if (workbookProblemError) {
      console.error(
        "Error fetching problem_id from workbook_problem:",
        workbookProblemError,
      );
      throw workbookProblemError;
    }
    const problemIds = workbookProblems.map((item) => item.problem_id);

    if (problemIds.length === 0) {
      console.warn("No problem_ids found for workbook_id:", workbookId);
      return [];
    }

    const { data: problems, error: problemError } = await supabase
      .from("problem")
      .select(
        `
        id,
        question,
        answer,
        explanation,
        image_src,
        problem_type,
        option_one,
        option_two,
        option_three,
        option_four,
        created_at
      `,
      )
      .in("id", problemIds);

    if (problemError) {
      console.error("Error fetching problems:", problemError);
      throw problemError;
    }

    return problems.map((problem) => ({
      ...problem,
      options:
        problem.problem_type === "multiple_choice"
          ? [
              problem.option_one,
              problem.option_two,
              problem.option_three,
              problem.option_four,
            ]
          : [],
    }));
  } catch (error) {
    console.error("Error in fetchProblemsForTestResult:", error);
    return [];
  }
};
