import { useAuthStore } from "@/store/authStore.js";
import { supabase } from "./index.js";

export const storageAPI = {
  /**
   * 이미지 업로드
   * @param file - 업로드할 이미지 파일
   * @returns 업로드된 이미지의 URL
   */
  async uploadImage(file) {
    try {
      // 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        throw new Error("이미지 파일만 업로드 가능합니다.");
      }

      // 파일 크기 제한 (50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("파일 크기는 50MB를 초과할 수 없습니다.");
      }

      // 파일명 생성 (timestamp-randomString)
      const timestamp = new Date().getTime();
      const fileExt = file.name.split(".").pop();
      const fileName = `${timestamp}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      // 사용자 UID 기반 경로 설정
      // TODO: 로그아웃 안했는데 user이 null이 됨 -> token 갱신 이슈?
      const { user } = useAuthStore();
      if (!user) {
        throw new Error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
      }

      
      const userUID = user.id; // 로그인된 사용자 UID 가져오기
      const filePath = `${userUID}/problem_image/${fileName}`;

      // Storage에 업로드
      const { data, error } = await supabase.storage
        .from("problem_image")
        .upload(filePath, file, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      // 공개 URL 생성
      const {
        data: { publicUrl },
      } = supabase.storage.from("problem_image").getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw error;
    }
  },

  /**
   * 여러 이미지 업로드
   * @param files - 업로드할 이미지 파일 배열
   * @returns 업로드된 이미지들의 URL 배열
   */
  async uploadMultipleImages(files) {
    try {
      const uploadPromises = files.map((file) => this.uploadImage(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("다중 이미지 업로드 실패:", error);
      throw error;
    }
  },

  /**
   * 이미지 삭제
   * @param imageUrl - 삭제할 이미지의 URL
   */
  async deleteImage(imageUrl) {
    try {
      const urlPath = new URL(imageUrl).pathname;
      const filePath = urlPath.split("/").pop(); // filename만 추출
      const fullPath = `problem-images/${filePath}`;

      const { error } = await supabase.storage
        .from("problem_image")
        .remove([fullPath]);

      if (error) throw error;
    } catch (error) {
      console.error("이미지 삭제 실패:", error);
      throw error;
    }
  },

  /**
   * 여러 이미지 삭제
   * @param imageUrls - 삭제할 이미지 URL 배열
   */
  async deleteMultipleImages(imageUrls) {
    try {
      const deletePromises = imageUrls.map((url) => this.deleteImage(url));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("다중 이미지 삭제 실패:", error);
      throw error;
    }
  },
};
