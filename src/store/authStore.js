// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
 const user = ref(null)
 const isLoading = ref(false)

 const isAuthenticated = computed(() => !!user.value)
 
 async function initializeAuth() {
   try {
     isLoading.value = true
     const currentUser = await auth.getCurrentUser()
     user.value = currentUser
     
     // Auth 상태 변경 감지
     auth.onAuthStateChange((event, session) => {
       if (event === 'SIGNED_IN') {
         user.value = session?.user || null
       } else if (event === 'SIGNED_OUT') {
         user.value = null
       }
     })
   } catch (error) {
     console.error('인증 초기화 실패:', error)
   } finally {
     isLoading.value = false
   }
 }

 async function loginWithGoogle() {
   try {
     isLoading.value = true
     await auth.logInWithGoogle()
     const currentUser = await auth.getCurrentUser()
     user.value = currentUser
   } catch (error) {
     console.error('구글 로그인 실패:', error)
     throw error
   } finally {
     isLoading.value = false
   }
 }

 async function loginWithGithub() {
   try {
     isLoading.value = true
     await auth.logInWithGithub()
     const currentUser = await auth.getCurrentUser()
     user.value = currentUser
   } catch (error) {
     console.error('깃허브 로그인 실패:', error)
     throw error
   } finally {
     isLoading.value = false
   }
 }

 async function logout() {
   try {
     isLoading.value = true
     await auth.logOut()
     user.value = null
   } catch (error) {
     console.error('로그아웃 실패:', error)
     throw error
   } finally {
     isLoading.value = false
   }
 }

 return {
   user,
   isLoading,

   isAuthenticated,

   initializeAuth,
   loginWithGoogle,
   loginWithGithub,
   logout
 }
})