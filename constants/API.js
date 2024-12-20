let ip = "192.168.1.34";
let API_URL = `http://${ip}:5000`;

export const setIp = (newIp) => {
  ip = newIp; // Cập nhật giá trị của ip
  API_URL = `http://${ip}:5000`; // Cập nhật API_URL với ip mới

  // Cập nhật lại đối tượng API với URL mới
  API = {
    ip: ip,
    API_URL: API_URL,
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    SEND_OTP: `${API_URL}/auth/send-otp`,
    VERIFY_OTP: `${API_URL}/auth/verify-otp`,
    RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    CHANGE_PASSWORD: `${API_URL}/auth/change-password`,
    CHANGE_USER_INFO: `${API_URL}/users/update-information`,
    GET_SUBJECTS: `${API_URL}/lessons/subjects`,
    GET_LESSONS: `${API_URL}/lessons`,
    GET_LEARNING_LESSONS: `${API_URL}/lessons/learning-lessons`,
    GET_USER_INFO: `${API_URL}/protected/user-info`,
    GET_USER_INFO_BY_EMAIL: `${API_URL}/users/get-user-by-email/`,
    SAVE_QUIZ: `${API_URL}/lessons/save-quizz-exercise`,
    SAVE_CODE: `${API_URL}/lessons/save-code-exercise`,
    SAVE_LESSON: `${API_URL}/lessons/save-lesson`,
    GET_SAVED_CODE: `${API_URL}/lessons/code-exercise`,
  };

  console.log("New ip: ", ip);
};

export let API = {
  ip: ip,
  API_URL: API_URL,
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  SEND_OTP: `${API_URL}/auth/send-otp`,
  VERIFY_OTP: `${API_URL}/auth/verify-otp`,
  RESET_PASSWORD: `${API_URL}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_URL}/auth/change-password`,
  CHANGE_USER_INFO: `${API_URL}/users/update-information`,
  GET_SUBJECTS: `${API_URL}/lessons/subjects`,
  GET_LESSONS: `${API_URL}/lessons`, // /user/${idUser}/subject/${idSubject}
  GET_LEARNING_LESSONS: `${API_URL}/lessons/learning-lessons`, // + idUser
  GET_USER_INFO: `${API_URL}/protected/user-info`,
  GET_USER_INFO_BY_EMAIL: `${API_URL}/users/get-user-by-email/`,
  SAVE_QUIZ: `${API_URL}/lessons/save-quizz-exercise`,
  SAVE_CODE: `${API_URL}/lessons/save-code-exercise`,
  SAVE_LESSON: `${API_URL}/lessons/save-lesson`,
  GET_SAVED_CODE: `${API_URL}/lessons/code-exercise`, // + ${userId}/${lessonId}/${codeExerciseId}
};
