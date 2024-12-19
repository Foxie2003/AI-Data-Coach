/* eslint-disable react/default-props-match-prop-types */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { CheckBox } from "react-native-elements";
import { API } from "../constants/API";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import TokenStorage from "../constants/TokenStorage";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomCheckBox = ({
  title = "",
  checked = false,
  onPress = () => {},
  checkedIcon = "check-square-o",
  uncheckedIcon = "square-o",
  containerStyle = {},
  disabled = false,
}) => {
  return (
    <CheckBox
      title={title}
      checked={checked}
      onPress={onPress}
      checkedIcon={checkedIcon}
      uncheckedIcon={uncheckedIcon}
      containerStyle={containerStyle}
      disabled={disabled}
    />
  );
};

export default function Quizz() {
  const { top } = useSafeAreaInsets();
  const marginTop = top > 0 ? top : 0;

  const navigation = useNavigation();

  const [userInfo, setUserInfo] = useState();
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const route = useRoute();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  if (!route.params) {
    console.error("route.params is undefined. Check your navigation setup.");
    return <Text>Không có dữ liệu bài học.</Text>;
  }

  const { lessonId } = route.params;

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = await TokenStorage.getToken();
      if (!token) {
        console.error("Không có token, vui lòng đăng nhập.");
        navigation.navigate("Login");
        return;
      }
      try {
        const response = await axios.get(API.GET_USER_INFO, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Dữ liệu nhận được từ API: ", response.data);
        setUserInfo(response.data.user);
      } catch (error) {
        console.error("Lỗi khi gọi API: ", error);
        navigation.navigate("Login");
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!lessonId) {
      console.error("lessonId is undefined. Check if it is passed correctly.");
    } else {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(
        `${API.API_URL}/lessons/${lessonId}/quizz-exercises`
      );
      const data = await response.json();
      console.log(data);
      setLesson(data);
      const formattedQuestions = data
        .filter(
          (exercise) =>
            exercise.type === "single" || exercise.type === "multiple"
        )
        .map((q, index) => ({
          ...q,
          index, // Thêm index vào mỗi câu hỏi
          userAnswer: [], // Khởi tạo câu trả lời của người dùng là mảng rỗng
          correctAnswer: q.correctAnswer.map(Number), // Chuyển đổi correctAnswer thành mảng số
        }));
      console.log("Formatted Questions:", formattedQuestions);
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Lỗi khi tải bài học:", error);
    }
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setQuestions((prevQuestions) => {
      return prevQuestions.map((q, index) => {
        if (index === questionIndex) {
          if (q.type === "single") {
            return { ...q, userAnswer: [optionIndex] };
          } else {
            let newAnswer = [...q.userAnswer];
            if (newAnswer.includes(optionIndex)) {
              newAnswer = newAnswer.filter((a) => a !== optionIndex);
            } else {
              newAnswer.push(optionIndex);
            }
            return { ...q, userAnswer: newAnswer.sort((a, b) => a - b) };
          }
        }
        return q;
      });
    });
  };

  const handleSubmit = () => {
    setModalMessage("Bạn có chắc chắn muốn nộp bài không?");
    setIsModalVisible(true);
  };

  const confirmSubmit = async () => {
    setIsModalVisible(false);
    let correctAnswers = 0;
    const updatedQuestions = questions.map((q) => {
      const isCorrect =
        JSON.stringify(q.userAnswer.sort()) ===
        JSON.stringify(q.correctAnswer.sort());
      console.log(">>> Check user answers: ", q.userAnswer);

      if (isCorrect) correctAnswers++;
      return { ...q, isCorrect };
    });
    setQuestions(updatedQuestions);
    setScore(`${correctAnswers}/${questions.length}`);
    setSubmitted(true);

    setResultMessage(
      `Bạn đã trả lời đúng ${correctAnswers} trên ${questions.length} câu hỏi.`
    );
    setIsResultModalVisible(true);

    const token = await TokenStorage.getToken();
    if (!token) {
      console.error("Không có token, vui lòng đăng nhập.");
      setModalVisible(false);
      navigation.navigate("Login");
      return;
    }
    const submitAnswers = questions.map((q, index) => ({
      questionIndex: index,
      selectedAnswers: q.userAnswer,
    }));
    console.log("Subimit data: ", submitAnswers);

    try {
      const response = await axios.post(
        API.SAVE_QUIZ,
        {
          id: lessonId,
          userId: userInfo.userId,
          score: correctAnswers,
          answers: submitAnswers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status == 200) {
        const saveLessonRes = await axios.post(
          API.SAVE_LESSON,
          {
            userId: userInfo.userId,
            lessonId: lessonId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(">>> res: ", saveLessonRes);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API: ", error);
    }
  };

  const getOptionStyle = (question, optionIndex) => {
    if (!submitted) return styles.option;
    if (question.correctAnswer.includes(optionIndex)) {
      return [styles.option, styles.correctOption];
    }
    if (question.userAnswer.includes(optionIndex) && !question.isCorrect) {
      return [styles.option, styles.incorrectOption];
    }
    return styles.option;
  };

  const allQuestionsAnswered = () => {
    return questions.every((q) => {
      if (q.type === "single") {
        return q.userAnswer.length > 0; // Đối với câu hỏi chọn một, cần có câu trả lời
      } else {
        return q.userAnswer.length > 0; // Đối với câu hỏi chọn nhiều, cần có ít nhất một câu trả lời
      }
    });
  };

  if (!lesson) {
    return <Text>Đang tải...</Text>;
  }

  return (
    <View style={[styles.container, { marginTop }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Bài tập trắc nghiệm</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {/* <Text style={styles.title}>{lesson.name}</Text>
      <Text style={styles.theory}>{lesson.theory}</Text> */}
        <View style={{ padding: 10 }}>
          {questions.map((q, qIndex) => (
            <View key={qIndex} style={styles.questionContainer}>
              <Text style={styles.question}>{`${qIndex + 1}. ${
                q.question
              }`}</Text>
              <Text style={styles.questionType}>
                {q.type === "single"
                  ? "(Chọn một đáp án)"
                  : "(Chọn nhiều đáp án)"}
              </Text>
              {q.options.map((option, index) => (
                <CustomCheckBox
                  key={index}
                  title={option}
                  checked={q.userAnswer.includes(index)}
                  onPress={() => handleOptionSelect(qIndex, index)}
                  checkedIcon={
                    q.type === "single" ? "dot-circle-o" : "check-square-o"
                  }
                  uncheckedIcon={q.type === "single" ? "circle-o" : "square-o"}
                  containerStyle={getOptionStyle(q, index)}
                  disabled={submitted}
                />
              ))}
              <Text
                style={styles.debug}
              >{`Debug - User Answer: ${JSON.stringify(q.userAnswer)}`}</Text>
              <Text
                style={styles.debug}
              >{`Debug - Correct Answer: ${JSON.stringify(
                q.correctAnswer
              )}`}</Text>
            </View>
          ))}
          {allQuestionsAnswered() && !submitted && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Nộp bài</Text>
            </TouchableOpacity>
          )}
          {score !== null && (
            <Text style={styles.scoreText}>Điểm số của bạn: {score}</Text>
          )}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.textStyle}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm]}
                onPress={confirmSubmit}
              >
                <Text style={styles.textStyle}>Nộp bài</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isResultModalVisible}
        onRequestClose={() => setIsResultModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{resultMessage}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsResultModalVisible(false)}
            >
              <Text style={styles.textStyle}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.statusBar,
    paddingVertical: 10,
    // justifyContent: "space-between",
  },
  headerButton: {
    padding: 10,
  },
  headerRightButton: {
    padding: 10,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginRight: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  headerButtonText: {
    fontSize: 18,
    color: "#000",
  },
  headerText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  theory: {
    fontSize: 16,
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 5,
  },
  correctOption: {
    borderColor: "green",
    borderWidth: 2,
  },
  incorrectOption: {
    borderColor: "red",
    borderWidth: 2,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  explanationButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  explanationButtonText: {
    textAlign: "center",
    color: "#007AFF",
  },
  explanation: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    fontStyle: "italic",
  },
  questionType: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 10,
    color: "#666",
  },
  debug: {
    fontSize: 12,
    color: "#999",
    marginBottom: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
  },
  button: {
    padding: 10,
    borderRadius: 5,
    elevation: 2,
  },
  buttonCancel: {
    backgroundColor: "#f44336",
    marginRight: 10,
  },
  buttonConfirm: {
    backgroundColor: "#007AFF",
    marginLeft: 10,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
    marginTop: 15,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
});
