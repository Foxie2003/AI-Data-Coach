import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  Image,
  Platform,
} from "react-native";
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  Text,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { API } from "../constants/API";
import axios from "axios";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { io } from "socket.io-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TokenStorage from "../constants/TokenStorage";

export default function Practice() {
  const { top } = useSafeAreaInsets();
  const marginTop = top > 0 ? top : 0;

  const navigation = useNavigation();
  const route = useRoute();
  const { lessonId } = route.params;

  const [userInfo, setUserInfo] = useState();
  const [exercise, setExercise] = useState();
  let letExercise = null;
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");
  // const [chatMessages, setChatMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      text: "Xin chào, mình là Chat Bot AI AIC rất vui khi được hỗ trợ bạn. Nếu có thắc mắc gì hãy hỏi mình nhé!!!",
      user: false,
    },
  ]);

  const [language, setLanguage] = useState("python");
  const [isExerciseVisible, setIsExerciseVisible] = useState(true);
  const exerciseHeight = useState(new Animated.Value(1))[0];
  const [isCorrect, setIsCorrect] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("🔴 Chưa kết nối");
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [userInput, setUserInput] = useState("");

  const isMobile = Platform.OS === "android" || Platform.OS === "ios";
  const [showChat, setShowChat] = useState(!isMobile);
  const [showGreeting, setShowGreeting] = useState(true);

  const fetchSavedCode = async (token, user) => {
    try {
      const response = await axios.get(
        `${API.GET_SAVED_CODE}/${user.userId}/${lessonId}/code1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.codeExercise) {
        setCode(response.data.codeExercise?.code);
        console.log(">>> Check code: ", response.data.codeExercise?.code);
      }
    } catch (error) {
      if (error.status === 404) {
        console.log("Không tìm thấy code");
      } else {
        console.error("Lỗi khi gọi API: ", error);
      }
    }
  };

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
        fetchSavedCode(token, response.data.user);
      } catch (error) {
        console.error("Lỗi khi gọi API: ", error);
        navigation.navigate("Login");
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    console.log("Lesson ID:: ", lessonId);
    const fetchData = async () => {
      try {
        const exerciseResponse = await axios.get(
          `${API.API_URL}/lessons/${lessonId}/code-exercises`
        );
        if (exerciseResponse.data && exerciseResponse.data.length > 0) {
          const exerciseData = exerciseResponse.data[0];
          setExercise(exerciseData);
          letExercise = exerciseData;
          setLanguage(exerciseData.defaultLanguage || "python");
          console.log(">>> Check exercise: ", exerciseData);
        } else {
          Alert.alert(
            "Thông báo",
            "Dữ liệu bài tập chưa sẵn sàng. Vui lòng thử lại sau."
          );
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải dữ liệu bài học. Vui lòng thử lại sau."
        );
      }
    };

    if (lessonId) {
      fetchData();
    }
  }, [lessonId]);

  useEffect(() => {
    setSessionId(`session_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    const newSocket = io(API.API_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket đã kết nối!");
      setConnectionStatus("🟢 Đã kết nối");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket đã ngắt kết nối!");
      setConnectionStatus("🔴 Chưa kết nối");
    });

    newSocket.on("output", (data) => {
      console.log("Frontend received output:", data);
      setOutput((prev) => {
        const newOutput = prev + data;
        if (!data.includes("input(") && !data.includes("Nhập")) {
          checkResult(newOutput);
        }
        return newOutput;
      });

      if (data.includes("input(") || data.includes("Nhập")) {
        console.log("Input prompt detected");
        setInputEnabled(true);
      }
    });

    newSocket.on("error", (error) => {
      console.error("Frontend received error:", error);
      setOutput(
        (prev) =>
          prev +
          `Lỗi: ${error}\nVui lòng kiểm bảo:\n- Docker Desktop đang chạy\n- Server backend đang hoạt động\n`
      );
      setIsExecuting(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Đã kết nối lại sau", attemptNumber, "lần thử");
      setConnectionStatus("🟢 Đã kết nối lại");
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Lỗi kết nối lại:", error);
      setConnectionStatus("🔴 Lỗi kết nối");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const executeCode = async () => {
    if (language === "sql") {
      // Giữ nguyên logic cũ cho SQL
      try {
        var jdoodleConfig = {
          sql: { language: "sql", versionIndex: "3" },
        };

        var selectedConfig = jdoodleConfig[language];
        const response = await fetch(`${API.API_URL}/combined/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            script: code,
            language: selectedConfig.language,
            versionIndex: selectedConfig.versionIndex,
          }),
        });

        const data = await response.json();

        if (data.error) {
          setOutput(`Lỗi: ${data.error}`);
          setIsCorrect(false);
        } else {
          setOutput(data.output);
          checkResult(data.output);
        }
      } catch (error) {
        console.error("Lỗi:", error);
        setOutput("Đã xảy ra lỗi khi thực thi mã");
        setIsCorrect(false);
      }
    } else {
      // Sử dụng Socket.IO cho các ngôn ngữ khác
      if (!socket?.connected) {
        setOutput(
          "Đang kết nối lại với server...\nVui lòng đảm bảo:\n- Docker Desktop đang chạy\n- Server backend đang hoạt động"
        );
        socket?.connect();
        return;
      }

      setOutput("");
      setIsCorrect(false);
      setIsExecuting(true);
      console.log("Lang: ", { code, language });

      socket.emit("execute", { code, language });
    }
  };

  const checkResult = (result) => {
    // Loại bỏ khoảng trắng và xuống dòng để so sánh chính xác
    const cleanResult = result.trim().replace(/\s+/g, "");
    // const cleanExpected = exercise.output.trim().replace(/\s+/g, "");
    const cleanExpected = letExercise.output.trim().replace(/\s+/g, "");
    setIsCorrect(cleanResult === cleanExpected);
    console.log(">>> Check result: ", result, cleanResult, letExercise);
  };

  const handleSubmit = () => {
    setModalMessage("Bạn có chắc chắn muốn nộp bài không?");
    setIsModalVisible(true);
  };

  const confirmSubmit = async () => {
    setIsModalVisible(false);

    const token = await TokenStorage.getToken();
    if (!token) {
      console.error("Không có token, vui lòng đăng nhập.");
      setModalVisible(false);
      navigation.navigate("Login");
      return;
    }
    try {
      console.log("CHeck code: ", {
        userId: userInfo.userId,
        lessonId: lessonId,
        codeExerciseId: "code1",
        code: code,
        language: language,
      });
      const response = await axios.post(
        API.SAVE_CODE,
        {
          userId: userInfo.userId,
          lessonId: lessonId,
          codeExerciseId: "code1",
          code: code,
          language: language,
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
      }
    } catch (error) {
      console.error("Lỗi khi gọi API: ", error);
    }

    setModalMessage("Bạn đã hoàn thành bài tập!");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    if (modalMessage === "Bạn đã hoàn thành bài tập!") {
      if (Platform.OS === "web") {
        navigation.navigate("Course");
      } else {
        navigation.goBack();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === "Enter") {
      sendMessage();
    }
  };
  const sendMessage = async () => {
    console.log("Check session: ", sessionId);

    if (chatInput.trim() && sessionId) {
      const userMessage = { text: chatInput, user: true };
      setChatMessages((prevMessages) => [...prevMessages, userMessage]);
      setChatInput("");

      try {
        let message = userMessage.text;
        let problem =
          exercise.question +
          ". Input: " +
          exercise.input +
          ". Output: " +
          exercise.output;
        const response = await fetch(`${API.API_URL}/combined/chatAI`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            output,
            code,
            problem,
            language,
            sessionId: sessionId,
          }),
        });
        console.log("Message body: ", {
          message: message,
          output,
          code,
          problem,
          language,
          sessionId: sessionId,
        });

        const data = await response.json();

        if (data.error) {
          setChatMessages((prevMessages) => [
            ...prevMessages,
            { text: `Lỗi: ${data.error}`, user: false },
          ]);
        } else {
          setChatMessages((prevMessages) => [
            ...prevMessages,
            { text: data.reply, user: false },
          ]);
        }
      } catch (error) {
        console.error("Lỗi:", error);
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { text: "Đã xảy ra lỗi khi gửi tin nhắn", user: false },
        ]);
      }
    }
  };

  const clearChatHistory = async () => {
    if (sessionId) {
      try {
        const response = await fetch(`${API.API_URL}/combined/clear-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionId,
          }),
        });

        const data = await response.json();
        console.log(data.message);

        setChatMessages([]);
        setSessionId(`session_${Math.random().toString(36).substr(2, 9)}`);
      } catch (error) {
        console.error("Lỗi khi xóa lịch sử chat:", error);
      }
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const toggleExerciseVisibility = () => {
    setIsExerciseVisible(!isExerciseVisible);
    Animated.timing(exerciseHeight, {
      toValue: isExerciseVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleInputSubmit = () => {
    if (userInput.trim() && socket?.connected && inputEnabled) {
      console.log("Frontend sending input:", userInput);
      socket.emit("input", userInput);
      setUserInput("");
      setInputEnabled(false);
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.nativeEvent.key === "Enter" && inputEnabled) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  return (
    <View style={[styles.container, { marginTop }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thực hành</Text>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.leftContainer,
            { display: showChat && isMobile ? "none" : "flex" },
          ]}
        >
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseHeaderText}>Đề bài</Text>
            <TouchableOpacity onPress={toggleExerciseVisibility}>
              <Text style={styles.toggleButton}>
                {isExerciseVisible ? "Ẩn" : "Hiện"}
              </Text>
            </TouchableOpacity>
          </View>
          <Animated.View
            style={[
              styles.exerciseContainer,
              {
                maxHeight: exerciseHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                opacity: exerciseHeight,
              },
            ]}
          >
            <ScrollView>
              <Text style={styles.exerciseTitle}>Yêu cầu:</Text>
              <Text style={styles.exerciseText}>{exercise?.question}</Text>
              <Text style={styles.exerciseTitle}>Input:</Text>
              <Text style={styles.exerciseText}>{exercise?.input}</Text>
              <Text style={styles.exerciseTitle}>Output mong đợi:</Text>
              <Text style={styles.exerciseText}>{exercise?.output}</Text>
            </ScrollView>
          </Animated.View>
          <View style={styles.codeContainer}>
            <View style={styles.languageSelector}>
              <Text>Chọn ngôn ngữ: </Text>
              <Picker
                selectedValue={language}
                style={styles.picker}
                onValueChange={(itemValue) => setLanguage(itemValue)}
              >
                <Picker.Item label="Python" value="python" />
                <Picker.Item label="JavaScript" value="javascript" />
                <Picker.Item label="Java" value="java" />
                <Picker.Item label="C++" value="cpp" />
                <Picker.Item label="C#" value="csharp" />
                <Picker.Item label="SQL" value="sql" />
              </Picker>
            </View>

            <TextInput
              style={styles.codeInput}
              multiline
              // numberOfLines={10}
              onChangeText={setCode}
              value={code}
              placeholder={`Nhập mã ${language} của bạn ở đây...`}
            />
            <Button title="Thực thi" onPress={executeCode} />
          </View>
          <ScrollView style={styles.outputContainer}>
            <Text style={styles.outputText}>{output}</Text>
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.inputField,
                { backgroundColor: inputEnabled ? "#fff" : "#f0f0f0" },
              ]}
              value={userInput}
              onChangeText={setUserInput}
              onKeyPress={handleInputKeyPress}
              placeholder="Nhập input ở đây và nhấn Enter..."
              editable={inputEnabled}
            />
          </View>

          {isCorrect && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Nộp bài</Text>
            </TouchableOpacity>
          )}
        </View>
        <View
          style={[
            styles.chatContainer,
            { display: showChat ? "flex" : "none" },
          ]}
        >
          {isMobile && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                backgroundColor: "#FFF",
                alignItems: "center",
              }}
              onPress={() => setShowChat(false)}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
              <Text style={{ fontSize: 18 }}>Quay lại code</Text>
            </TouchableOpacity>
          )}
          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((msg, index) => (
              <Text
                key={index}
                style={msg.user ? styles.userMessage : styles.botMessage}
              >
                {msg.text}
              </Text>
            ))}
          </ScrollView>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onKeyPress={handleKeyPress}
              onChangeText={setChatInput}
              placeholder="Nhập tin nhắn..."
            />
            <Button
              // title={<Ionicons name="send" size={16} color="white" />}
              title={"Gửi"}
              onPress={sendMessage}
            />
          </View>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            {modalMessage === "Bạn có chắc chắn muốn nộp bài không?" ? (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={closeModal}
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
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={closeModal}
              >
                <Text style={styles.textStyle}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      {(Platform.OS === "android" || Platform.OS === "ios") && !showChat && (
        <View style={styles.robot}>
          {showGreeting && (
            <Text
              style={{
                borderWidth: 1,
                position: "absolute",
                top: 10,
                left: 10,
                borderRadius: 10,
                padding: 5,
                backgroundColor: "#FFF",
              }}
            >
              Xin chào, mình là AI AIC rất vui khi được hỗ trợ bạn. Nếu có thắc
              mắc gì hãy hỏi mình nhé!!!
            </Text>
          )}
          {showGreeting && (
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
              onPress={() => setShowGreeting(false)}
            >
              <Ionicons name="close-circle" size={24} color="black" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
            onPress={() => setShowChat(true)}
          >
            <Image
              source={require("../assets/images/robot.png")}
              resizeMode="contain"
              style={{
                width: 130,
                height: 130,
              }}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: theme.colors.statusBar,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: "#4285F4",
    fontWeight: "bold",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  leftContainer: {
    flex: 2,
    padding: 10,
  },
  codeContainer: {
    flex: 2,
  },
  codeInput: {
    flex: 1,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
    textAlignVertical: "top",
  },
  outputContainer: {
    flex: 1,
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
  },
  outputText: {
    fontFamily: "monospace",
  },
  chatContainer: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "gray",
    padding: 10,
  },
  chatMessages: {
    flex: 1,
  },
  chatInputContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
    borderColor: "gray",
    borderWidth: 1,
    marginRight: 10,
    padding: 5,
    borderRadius: 6,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: 150,
  },
  exerciseContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  exerciseTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  exerciseText: {
    fontSize: 14,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    height: 40,
  },
  exerciseHeaderText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  toggleButton: {
    color: "#4285F4",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonCancel: {
    backgroundColor: "#F194FF",
  },
  buttonConfirm: {
    backgroundColor: "#2196F3",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  connectionStatus: {
    position: "absolute",
    right: 10,
    fontSize: 14,
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  inputField: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 16,
  },
  robot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 200,
    height: 240,
  },
});
