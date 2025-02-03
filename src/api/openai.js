import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 개발 환경에서만 사용
});

export const chatCompletion = async (messages) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });
    return response.choices[0].message;
  } catch (error) {
    console.error("OpenAI API 에러:", error);
    throw error;
  }
};
