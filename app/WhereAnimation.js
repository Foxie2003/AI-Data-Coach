import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { API } from "../constants/API";
import LessonHeader from "./LessonHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

const { width } = Dimensions.get("window");

const WhereAnimation = () => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();
  const marginTop = top > 0 ? top : 0;
  const route = useRoute();
  const { lessonId } = route.params;

  const scrollViewRef = useRef(null);
  const [lessonData, setLessonData] = useState(null);
  const [codeExercise, setCodeExercise] = useState(null);
  const [theoryVisible, setTheoryVisible] = useState(false);
  const [selectQuery, setSelectQuery] = useState(
    "SELECT * FROM nhanvien WHERE tuoi > 30"
  );
  const [sampleData, setSampleData] = useState([
    {
      id: 1,
      ho: "Nguyễn",
      ten: "Văn A",
      tuoi: 30,
      chucvu: "Quản lý",
      luong: 15000000,
    },
    {
      id: 2,
      ho: "Trần",
      ten: "Thị B",
      tuoi: 25,
      chucvu: "Nhân viên",
      luong: 8000000,
    },
    {
      id: 3,
      ho: "Lê",
      ten: "Văn C",
      tuoi: 35,
      chucvu: "Kỹ sư",
      luong: 12000000,
    },
    {
      id: 4,
      ho: "Phạm",
      ten: "Thị D",
      tuoi: 28,
      chucvu: "Kế toán",
      luong: 10000000,
    },
    {
      id: 5,
      ho: "Hoàng",
      ten: "Văn E",
      tuoi: 40,
      chucvu: "Giám đốc",
      luong: 25000000,
    },
  ]);
  const [result, setResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [delayBetweenRows, setDelayBetweenRows] = useState("1000");

  const columns = ["id", "ho", "ten", "tuoi", "chucvu", "luong"];

  const animatedValues = sampleData.map(() => useSharedValue(0));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lessonResponse = await axios.get(
          `${API.GET_LESSONS}/${lessonId}`
        );
        setLessonData(lessonResponse.data);

        const exerciseResponse = await axios.get(
          `${API.API_URL}/lessons/${lessonId}/code-exercises`
        );
        setCodeExercise(exerciseResponse.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải dữ liệu bài học. Vui lòng thử lại sau."
        );
      }
    };

    fetchData();
  }, [lessonId]);

  useEffect(() => {
    // Kiểm tra nếu result không rỗng thì cuộn xuống
    if (result && result.length > 0) {
      scrollToBottom();
    }
  }, [result]);

  const handlePractice = () => {
    if (codeExercise) {
      navigation.navigate("Practice", {
        algorithm: "WhereAnimation",
        exercise: codeExercise[0],
      });
    } else {
      Alert.alert(
        "Thông báo",
        "Dữ liệu bài tập chưa sẵn sàng. Vui lòng thử lại sau."
      );
    }
  };
  const handlePractice2 = () => {
    if (codeExercise) {
      navigation.navigate("quizz", {
        lessonId,
      });
    } else {
      Alert.alert(
        "Thông báo",
        "Dữ liệu bài tập chưa sẵn sàng. Vui lòng thử lại sau."
      );
    }
  };
  const handleQueryChange = (text) => {
    setSelectQuery(text);
    setError(null);
  };

  const handleDelayChange = (text) => {
    setDelayBetweenRows(text);
  };

  const parseQuery = (query) => {
    console.log("Câu lệnh SQL:", query);
    const match = query.match(
      /SELECT\s+(.+)\s+FROM\s+nhanvien\s+WHERE\s+(.+)/i
    );
    if (match) {
      const fieldsString = match[1];
      const whereClause = match[2];
      const fields =
        fieldsString === "*"
          ? columns
          : fieldsString.split(",").map((field) => field.trim());

      // Xử lý các nhóm điều kiện
      const conditions = parseConditions(whereClause);

      console.log("Các trường được chọn:", fields);
      console.log("Điều kiện WHERE:", conditions);

      return { fields, conditions };
    }
    return { fields: [], conditions: null };
  };

  const parseConditions = (whereClause) => {
    console.log("Phân tích điều kiện WHERE:", whereClause);
    const conditions = [];
    let currentCondition = "";
    let depth = 0;

    for (let i = 0; i < whereClause.length; i++) {
      const char = whereClause[i];
      if (char === "(") {
        depth++;
        if (depth === 1) {
          if (currentCondition.trim()) {
            conditions.push(parseSimpleCondition(currentCondition.trim()));
            currentCondition = "";
          }
          continue;
        }
      } else if (char === ")") {
        depth--;
        if (depth === 0) {
          conditions.push(parseConditions(currentCondition));
          currentCondition = "";
          continue;
        }
      }

      if (depth === 0) {
        if (whereClause.substr(i, 5).toUpperCase() === " AND ") {
          if (currentCondition.trim()) {
            conditions.push(parseSimpleCondition(currentCondition.trim()));
          }
          conditions.push("AND");
          i += 4;
          currentCondition = "";
        } else if (whereClause.substr(i, 4).toUpperCase() === " OR ") {
          if (currentCondition.trim()) {
            conditions.push(parseSimpleCondition(currentCondition.trim()));
          }
          conditions.push("OR");
          i += 3;
          currentCondition = "";
        } else {
          currentCondition += char;
        }
      } else {
        currentCondition += char;
      }
    }

    if (currentCondition.trim()) {
      conditions.push(parseSimpleCondition(currentCondition.trim()));
    }

    console.log("Kết quả phân tích điều kiện:", conditions);
    return conditions;
  };

  const parseSimpleCondition = (condition) => {
    const [field, operator, ...value] = condition.split(/\s+/);
    return { field, operator, value: value.join(" ").replace(/['"]/g, "") };
  };

  const evaluateWhereClause = (item, conditions) => {
    if (Array.isArray(conditions)) {
      return conditions.reduce((result, condition, index, array) => {
        if (condition === "AND") {
          return result && evaluateWhereClause(item, array[index + 1]);
        } else if (condition === "OR") {
          return result || evaluateWhereClause(item, array[index + 1]);
        } else {
          return index === 0 ? evaluateWhereClause(item, condition) : result;
        }
      }, false);
    } else if (typeof conditions === "object" && conditions !== null) {
      const { field, operator, value } = conditions;
      const itemValue = item[field];
      switch (operator.toLowerCase()) {
        case ">":
          return Number(itemValue) > Number(value);
        case ">=":
          return Number(itemValue) >= Number(value);
        case "<":
          return Number(itemValue) < Number(value);
        case "<=":
          return Number(itemValue) <= Number(value);
        case "=":
        case "==":
          return (
            String(itemValue).toLowerCase() === String(value).toLowerCase()
          );
        case "like":
          return String(itemValue)
            .toLowerCase()
            .includes(String(value).toLowerCase());
        default:
          return false;
      }
    }
    return false;
  };

  const executeQuery = useCallback(() => {
    const { fields, conditions } = parseQuery(selectQuery);
    if (fields.length === 0 || conditions === null) {
      setError("Câu lệnh SELECT không hợp lệ. Vui lòng kiểm tra lại.");
      Alert.alert(
        "Lỗi",
        "Câu lệnh SELECT không hợp lệ. Vui lòng kiểm tra lại."
      );
      return;
    }

    setIsAnimating(true);
    setResult(null);
    setError(null);

    const delay = parseInt(delayBetweenRows, 10);
    const duration = 1000;

    animatedValues.forEach((av) => (av.value = 0));

    sampleData.forEach((item, index) => {
      const isValid = evaluateWhereClause(item, conditions);
      setTimeout(() => {
        animatedValues[index].value = withTiming(isValid ? 1 : -1, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        });
      }, index * delay);
    });

    const totalAnimationTime = (sampleData.length - 1) * delay + duration;
    setTimeout(() => {
      setIsAnimating(false);
      setResult(
        sampleData.filter((item) => evaluateWhereClause(item, conditions))
      );
    }, totalAnimationTime);
  }, [selectQuery, sampleData, delayBetweenRows]);

  const AnimatedRow = ({ item, index, isResult = false }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const backgroundColor = isResult
        ? "#E8F5E9"
        : interpolateColor(
            animatedValues[index].value,
            [-1, 0, 1],
            ["#FFCDD2", "white", "#E8F5E9"]
          );
      return {
        backgroundColor,
      };
    });

    return (
      <Animated.View style={[styles.tableRow, animatedStyle]}>
        {columns.map((column) => (
          <View key={column} style={styles.tableCell}>
            <Text style={styles.cellText}>{item[column]}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  const toggleTheoryVisibility = () => {
    setTheoryVisible(!theoryVisible);
  };

  const TheorySection = () => {
    if (!lessonData) return null;

    return (
      <View style={styles.theoryContainer}>
        <Text style={styles.theorySectionTitle}>Lý Thuyết Bài Học</Text>
        <Text style={styles.theoryText}>{lessonData.theory}</Text>
      </View>
    );
  };

  const scrollToBottom = (smooth = true) => {
    if (Platform.OS === "web") {
      try {
        // Xử lý cuộn cho web
        const scrollOptions = {
          top: document.documentElement.scrollHeight,
          left: 0,
          behavior: smooth ? "smooth" : "auto",
        };

        if (window.scrollTo) {
          window.scrollTo(scrollOptions);
        } else if (window.pageYOffset !== undefined) {
          window.scrollTo(0, document.documentElement.scrollHeight);
        }
      } catch (error) {
        console.log("Lỗi cuộn trang web:", error);
      }
    } else {
      // Xử lý cuộn cho mobile
      if (scrollViewRef?.current) {
        scrollViewRef.current.scrollToEnd({ animated: smooth });
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { marginTop }]} ref={scrollViewRef}>
      <LessonHeader lessonData={lessonData} />
      {theoryVisible && <TheorySection />}
      <View style={{ padding: 10, flex: 1 }}>
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            value={selectQuery}
            onChangeText={handleQueryChange}
            placeholder="Nhập câu lệnh SELECT với WHERE (vd: SELECT * FROM nhanvien WHERE tuoi > 30)"
            multiline
          />
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <TouchableOpacity
              style={[styles.theoryButton, { marginBottom: 10 }]}
              onPress={toggleTheoryVisibility}
            >
              {theoryVisible ? (
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="black"
                />
              ) : (
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="black"
                />
              )}
              <Text style={styles.theoryButtonText}>
                {theoryVisible ? "Ẩn lý thuyết" : "Hiện lý thuyết"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={executeQuery}
              disabled={isAnimating}
            >
              <Ionicons name="play" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Thực hiện</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.delayInputSection}>
          <Text>Thời gian giữa các hàng (ms):</Text>
          <TextInput
            style={styles.delayInput}
            value={delayBetweenRows}
            onChangeText={handleDelayChange}
            keyboardType="numeric"
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Dữ liệu mẫu:</Text>
          <ScrollView horizontal>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                {columns.map((column) => (
                  <View key={column} style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>{column}</Text>
                  </View>
                ))}
              </View>
              {sampleData.map((item, index) => (
                <AnimatedRow key={item.id} item={item} index={index} />
              ))}
            </View>
          </ScrollView>
        </View>

        {result && (
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Kết quả:</Text>
            <ScrollView horizontal>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  {columns.map((column) => (
                    <View key={column} style={styles.tableHeader}>
                      <Text style={styles.tableHeaderText}>{column}</Text>
                    </View>
                  ))}
                </View>
                {result.map((item, index) => (
                  <AnimatedRow
                    key={item.id}
                    item={item}
                    index={index}
                    isResult={true}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inputSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  input: {
    width: "75%",
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    textAlignVertical: "top",
    fontSize: 20,
  },
  button: {
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  dataSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  sampleTable: {
    borderWidth: 1,
    borderColor: "gray",
    width: width - 40,
  },
  table: {
    flexDirection: "column",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 10,
    borderWidth: 1,
    borderColor: "gray",
    minWidth: 100,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2667df",
    textAlign: "center",
  },
  tableCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "gray",
    minWidth: 120,
  },
  cellText: {
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  delayInputSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  delayInput: {
    width: 100,
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginLeft: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerButton: {
    padding: 10,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#2667df",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2667df",
    textAlign: "center",
  },
  // Thêm style riêng cho header của bảng
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  theoryContainer: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginVertical: 10,
  },
  theorySectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  theoryText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "justify",
  },
  theoryButton: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    gap: 10,
  },
  theoryButtonText: {
    fontWeight: "bold",
  },
});

export default WhereAnimation;
