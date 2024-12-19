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
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const AnimatedCell = React.memo(({ value, isHighlighted }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isHighlighted) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      opacity.value,
      [0, 1],
      ["white", "rgba(76, 175, 80, 0.8)"]
    ),
  }));

  return (
    <Animated.View style={[styles.tableCell, animatedStyle]}>
      <Text style={styles.cellText}>{value}</Text>
    </Animated.View>
  );
});

const TableRow = React.memo(({ item, columns, highlightedId }) => {
  return (
    <View style={styles.tableRow}>
      {columns.map((column) => (
        <AnimatedCell
          key={column}
          value={item[column]}
          isHighlighted={item.id === highlightedId}
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

const InnerJoinAnimation = () => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();
  const marginTop = top > 0 ? top : 0;
  const route = useRoute();
  const { lessonId } = route.params;

  const scrollViewRef = useRef(null);
  const [lessonData, setLessonData] = useState(null);
  const [codeExercise, setCodeExercise] = useState(null);
  const [theoryVisible, setTheoryVisible] = useState(false);

  const [joinQuery, setJoinQuery] = useState(
    "SELECT * FROM nhanvien INNER JOIN phongban ON nhanvien.maphong = phongban.maphong"
  );
  const [nhanvienData, setNhanvienData] = useState([
    { id: 1, ho: "Nguyễn", ten: "Văn A", tuoi: 30, maphong: "P001" },
    { id: 2, ho: "Trần", ten: "Thị B", tuoi: 25, maphong: "P002" },
    { id: 3, ho: "Lê", ten: "Văn C", tuoi: 35, maphong: "P001" },
    { id: 4, ho: "Phạm", ten: "Thị D", tuoi: 28, maphong: "P003" },
    { id: 5, ho: "Hoàng", ten: "Văn E", tuoi: 40, maphong: "P002" },
  ]);
  const [phongbanData, setPhongbanData] = useState([
    { maphong: "P001", tenphong: "Kế toán" },
    { maphong: "P002", tenphong: "Nhân sự" },
    { maphong: "P003", tenphong: "Kỹ thuật" },
  ]);
  const [result, setResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [delayBetweenRows, setDelayBetweenRows] = useState("1000");

  const nhanvienColumns = ["id", "ho", "ten", "tuoi", "maphong"];
  const phongbanColumns = ["maphong", "tenphong"];

  const [currentNhanVienId, setCurrentNhanVienId] = useState(null);
  const [currentPhongBanId, setCurrentPhongBanId] = useState(null);
  const [currentResultId, setCurrentResultId] = useState(null);

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

  const handleQueryChange = (text) => {
    setJoinQuery(text);
    setError(null);
  };

  const handleDelayChange = (text) => {
    setDelayBetweenRows(text);
  };

  const executeJoin = useCallback(() => {
    const parsedQuery = parseJoinQuery(joinQuery);
    if (!parsedQuery) {
      setError("Câu lệnh INNER JOIN không hợp lệ. Vui lòng kiểm tra lại.");
      Alert.alert(
        "Lỗi",
        "Câu lệnh INNER JOIN không hợp lệ. Vui lòng kiểm tra lại."
      );
      return;
    }

    setIsAnimating(true);
    setResult(null);
    setError(null);

    const delay = parseInt(delayBetweenRows, 10);
    const joinResult = [];

    nhanvienData.forEach((nv, nvIndex) => {
      phongbanData.forEach((pb, pbIndex) => {
        if (nv.maphong === pb.maphong) {
          const resultItem = { ...nv, tenphong: pb.tenphong };
          joinResult.push(resultItem);

          setTimeout(() => {
            setCurrentNhanVienId(nv.id);

            setTimeout(() => {
              setCurrentPhongBanId(pb.maphong);

              setTimeout(() => {
                setResult((prev) => {
                  if (!prev) return [resultItem];
                  return [...prev, resultItem];
                });
                setCurrentResultId(resultItem.id);

                setTimeout(() => {
                  setCurrentNhanVienId(null);
                  setCurrentPhongBanId(null);
                  setCurrentResultId(null);
                }, delay / 2);
              }, delay / 2);
            }, delay / 2);
          }, delay * (nvIndex * phongbanData.length + pbIndex));
        }
      });
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, delay * nhanvienData.length * phongbanData.length);
  }, [joinQuery, nhanvienData, phongbanData, delayBetweenRows]);

  const parseJoinQuery = (query) => {
    const regex =
      /SELECT\s+(.+)\s+FROM\s+nhanvien\s+INNER JOIN\s+phongban\s+ON\s+nhanvien\.maphong\s*=\s*phongban\.maphong/i;
    const match = query.match(regex);
    if (match) {
      return true;
    }
    return false;
  };

  // Memoize tables
  const NhanVienTable = useMemo(
    () => (
      <View style={styles.table}>
        <TableHeader columns={nhanvienColumns} />
        {nhanvienData.map((item) => (
          <TableRow
            key={item.id}
            item={item}
            columns={nhanvienColumns}
            highlightedId={currentNhanVienId}
          />
        ))}
      </View>
    ),
    [nhanvienData, currentNhanVienId]
  );

  const PhongBanTable = useMemo(
    () => (
      <View style={styles.table}>
        <TableHeader columns={phongbanColumns} />
        {phongbanData.map((item) => (
          <TableRow
            key={item.maphong}
            item={{ ...item, id: item.maphong }}
            columns={phongbanColumns}
            highlightedId={currentPhongBanId}
          />
        ))}
      </View>
    ),
    [phongbanData, currentPhongBanId]
  );

  const ResultTable = useMemo(() => {
    if (!result) return null;
    return (
      <View style={styles.table}>
        <TableHeader columns={[...nhanvienColumns, "tenphong"]} />
        {result.map((item) => (
          <TableRow
            key={item.id}
            item={item}
            columns={[...nhanvienColumns, "tenphong"]}
            highlightedId={currentResultId}
          />
        ))}
      </View>
    );
  }, [result, currentResultId]);

  const handlePractice = () => {
    if (codeExercise) {
      navigation.navigate("Practice", {
        algorithm: "InnerJoinAnimation",
        exercise: codeExercise[0],
      });
    } else {
      Alert.alert(
        "Thông báo",
        "Dữ liệu bài tập chưa sẵn sàng. Vui lòng thử lại sau."
      );
    }
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
            value={joinQuery}
            onChangeText={handleQueryChange}
            placeholder="Nhập câu lệnh INNER JOIN"
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
              onPress={executeJoin}
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

        <View style={styles.tablesContainer}>
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Bảng nhân viên:</Text>
            <ScrollView horizontal>{NhanVienTable}</ScrollView>
          </View>

          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Bảng phòng ban:</Text>
            <ScrollView horizontal>{PhongBanTable}</ScrollView>
          </View>
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
  table: {
    flexDirection: "column",
    // borderWidth: 1,
    // borderColor: "gray",
  },
  tableRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderBottomWidth: 1.5,
    borderColor: "gray",
  },
  tableHeader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "gray",
    minWidth: 120,
  },
  tableCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "gray",
    minWidth: 120,
  },
  cellText: {
    fontSize: 14,
    textAlign: "center",
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
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
  tablesContainer: {
    ...Platform.select({
      ios: {
        flexDirection: "column",
      },
      android: {
        flexDirection: "column",
      },
      default: {
        flexDirection: "row",
        justifyContent: "space-between",
      },
    }),
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

export default InnerJoinAnimation;
