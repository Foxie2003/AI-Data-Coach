import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { API } from "../constants/API";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import LessonHeader from "./LessonHeader";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const AnimatedCell = React.memo(
  ({ field, value, isCurrentField }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      if (isCurrentField) {
        opacity.value = withTiming(1, { duration: 300 });
      } else {
        opacity.value = withTiming(0, { duration: 300 });
      }
    }, [isCurrentField]);

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        opacity.value,
        [0, 1],
        ["white", "rgba(76, 175, 80, 0.5)"]
      ),
    }));

    return (
      <Animated.View style={[styles.tableCell, animatedStyle]}>
        <Text style={styles.cellText}>{value}</Text>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isCurrentField === nextProps.isCurrentField &&
      prevProps.value === nextProps.value
    );
  }
);

const TableRow = React.memo(({ item, columns, currentField }) => {
  return (
    <View style={styles.tableRow}>
      {columns.map((column) => (
        <AnimatedCell
          key={column}
          field={column}
          value={item[column]}
          isCurrentField={column === currentField}
        />
      ))}
    </View>
  );
});

const TableHeader = React.memo(({ columns }) => {
  return (
    <View style={styles.tableRow}>
      {columns.map((column) => (
        <View key={column} style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>{column}</Text>
        </View>
      ))}
    </View>
  );
});

const SelectAnimation = () => {
  const { top } = useSafeAreaInsets();
  const marginTop = top > 0 ? top : 0;
  const navigation = useNavigation();
  const route = useRoute();
  const { lessonId } = route.params;
  console.log(">>> lessonId: ", lessonId);
  const scrollViewRef = useRef(null);
  const [lessonData, setLessonData] = useState(null);
  const [codeExercise, setCodeExercise] = useState(null);
  const [selectQuery, setSelectQuery] = useState("SELECT * FROM nhanvien");
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
  const [animatedFields, setAnimatedFields] = useState([]);
  const [error, setError] = useState(null);
  const [delayBetweenColumns, setDelayBetweenColumns] = useState("1000");
  const [theoryVisible, setTheoryVisible] = useState(false);
  const [currentField, setCurrentField] = useState(null);

  const columns = ["id", "ho", "ten", "tuoi", "chucvu", "luong"];

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
        if (exerciseResponse) {
          setCodeExercise(exerciseResponse.data);
        }
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

  const handleQueryChange = (text) => {
    setSelectQuery(text);
    setError(null);
  };

  const handleDelayChange = (text) => {
    setDelayBetweenColumns(text);
  };

  const executeSelect = useCallback(() => {
    const fields = parseSelectQuery(selectQuery);
    if (fields.length === 0) {
      setError("Câu lệnh SELECT không hợp lệ. Vui lòng kiểm tra lại.");
      Alert.alert(
        "Lỗi",
        "Câu lệnh SELECT không hợp lệ. Vui lòng kiểm tra lại."
      );
      return;
    }

    setIsAnimating(true);
    setResult(null);
    setAnimatedFields([]);
    setError(null);
    setCurrentField(null);

    const delay = parseInt(delayBetweenColumns, 10);

    fields.forEach((field, index) => {
      setTimeout(() => {
        setCurrentField(field);

        setResult((prevResult) => {
          const newResult = prevResult ? [...prevResult] : [];
          sampleData.forEach((item, dataIndex) => {
            if (!newResult[dataIndex]) {
              newResult[dataIndex] = {};
            }
            newResult[dataIndex][field] = item[field];
          });
          return newResult;
        });

        setAnimatedFields((prev) => [...prev, field]);

        if (index === fields.length - 1) {
          setTimeout(() => {
            setCurrentField(null);
            setIsAnimating(false);
          }, delay / 2);
        }
      }, delay * index);
    });
  }, [selectQuery, sampleData, delayBetweenColumns]);

  const parseSelectQuery = (query) => {
    const match = query.match(/SELECT\s+(.+)\s+FROM\s+nhanvien/i);
    if (match) {
      const fieldsString = match[1];
      if (fieldsString === "*") {
        return columns;
      }
      const selectedFields = fieldsString
        .split(",")
        .map((field) => field.trim());
      // Kiểm tra xem các trường được chọn có hợp lệ không
      if (selectedFields.every((field) => columns.includes(field))) {
        return selectedFields;
      }
    }
    return [];
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

  const DataTable = useMemo(
    () => (
      <View style={styles.table}>
        <TableHeader columns={columns} />
        {sampleData.map((item) => (
          <TableRow
            key={item.id}
            item={item}
            columns={columns}
            currentField={currentField}
          />
        ))}
      </View>
    ),
    [sampleData, columns, currentField]
  );

  const ResultTable = useMemo(() => {
    if (!result) return null;
    return (
      <View style={styles.table}>
        <TableHeader columns={animatedFields} />
        {result.map((item, index) => (
          <TableRow
            key={index}
            item={item}
            columns={animatedFields}
            currentField={currentField}
          />
        ))}
      </View>
    );
  }, [result, animatedFields, currentField]);

  return (
    <ScrollView style={[styles.container, { marginTop }]} ref={scrollViewRef}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {lessonData ? lessonData.name : "Tiêu đề bài học"}
        </Text>
        <TouchableOpacity
          onPress={handlePractice}
          style={styles.headerRightButton}
        >
          <Ionicons name="book" size={24} color="black" />
          <Text style={styles.headerButtonText}>Câu hỏi ôn tập</Text>
        </TouchableOpacity>
      </View> */}

      <LessonHeader lessonData={lessonData} />

      {theoryVisible && <TheorySection />}
      <View style={{ padding: 10, flex: 1 }}>
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            value={selectQuery}
            onChangeText={handleQueryChange}
            placeholder="Nhập câu lệnh SELECT (vd: SELECT ho, ten, tuoi FROM nhanvien)"
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
              onPress={executeSelect}
              disabled={isAnimating}
            >
              <Ionicons name="play" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Thực hiện</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.delayInputSection}>
          <Text>Thời gian giữa các cột (ms):</Text>
          <TextInput
            style={styles.delayInput}
            value={delayBetweenColumns}
            onChangeText={handleDelayChange}
            keyboardType="numeric"
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Dữ liệu mẫu:</Text>
          <ScrollView horizontal>{DataTable}</ScrollView>
        </View>

        {result && (
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Kết quả:</Text>
            <ScrollView horizontal>{ResultTable}</ScrollView>
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
    borderWidth: 1,
    borderColor: "gray",
    minWidth: 100,
    backgroundColor: "white",
    overflow: "hidden",
    height: 40,
  },
  cellText: {
    fontSize: 14,
    textAlign: "center",
    zIndex: 1,
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
    alignItems: "center",
    backgroundColor: theme.colors.statusBar,
    paddingVertical: 10,
    justifyContent: "space-between",
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
  },
  headerButtonText: {
    fontSize: 18,
    color: "#000",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
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

export default React.memo(SelectAnimation);
