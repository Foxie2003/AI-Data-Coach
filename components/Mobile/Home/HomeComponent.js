import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import RoundImage from "../../RoundImage";
import { theme } from "../../../constants/theme";
import LessonComponent from "../Lesson/LessonComponent";
import { useNavigation } from "@react-navigation/native";
import { API } from "../../../constants/API";
import axios from "axios";
import TokenStorage from "../../../constants/TokenStorage";
import { FontAwesome } from "@expo/vector-icons";

const HomeMobileComponent = () => {
  const navigation = useNavigation();

  const [userInfo, setUserInfo] = useState();
  const [lessons, setLessons] = useState();
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
        const response2 = await axios.get(
          API.GET_USER_INFO_BY_EMAIL + response.data.user.email,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserInfo({
          userId: response2.data._id,
          email: response2.data.email,
          accountType: response2.data.accountType,
          name: response2.data.name,
          tel: response2.data.tel,
        });
      } catch (error) {
        console.error("Lỗi khi gọi API: ", error);
        navigation.navigate("Login");
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      const token = await TokenStorage.getToken();
      if (!token) {
        console.error("Không có token, vui lòng đăng nhập.");
        navigation.navigate("Login");
        return;
      }
      try {
        const response = await axios.get(
          `${API.GET_LEARNING_LESSONS}/${userInfo?.userId}`
        );
        console.log("Dữ liệu nhận được từ API: ", response.data);
        setLessons(response.data.lessons);
      } catch (error) {
        console.error("Lỗi khi gọi API: ", error);
      }
    };

    if (userInfo) {
      fetchLessons();
    }
  }, [userInfo]);
  return (
    <>
      <StatusBar barStyle={"light-content"} backgroundColor={"#6fa8dc"} />
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          {/* <RoundImage
            style={styles.avatar}
            source={require("../../../assets/images/logo.png")}
          /> */}
          <FontAwesome name="user-circle-o" size={50} color="#FFF" />
          <View style={styles.welcome}>
            <Text style={styles.welcomeText}>Xin chào, {userInfo?.name}</Text>
          </View>
        </View>

        <ScrollView>
          {/* slogan */}
          <View style={styles.slogan}>
            <Text style={styles.sloganText}>
              Chào mừng bạn đến với AIC ứng dụng học tập cùng gia sư AI thông
              minh!!!
            </Text>
            <Image
              style={styles.sloganImage}
              source={require("../../../assets/images/robot.png")}
            />
          </View>

          {/* lessons section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={30} color="red" />
            <Text style={styles.sectionTitle}>Bài học của bạn</Text>
          </View>

          {lessons?.reduce((rows, item, index) => {
            if (index % 2 === 0) {
              rows.push(
                <View key={index} style={styles.sectionRow}>
                  <LessonComponent
                    style={styles.lessonItem}
                    imageStyle={styles.lessonImage}
                    image={item.image}
                    title={item.name}
                    condition={item.condition}
                    status={item.condition}
                    onPress={() => {
                      navigation.navigate(`${item.source}`, {
                        lessonId: item._id,
                      });
                    }}
                  />
                  {lessons[index + 1] && (
                    <LessonComponent
                      style={styles.lessonItem}
                      imageStyle={styles.lessonImage}
                      image={lessons[index + 1].image}
                      title={lessons[index + 1].name}
                      condition={lessons[index + 1].condition}
                      status={lessons[index + 1].condition}
                      onPress={() => {
                        navigation.navigate(`${lessons[index + 1].source}`, {
                          lessonId: lessons[index + 1]._id,
                        });
                      }}
                    />
                  )}
                </View>
              );
            }
            return rows;
          }, [])}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f4f4",
  },
  header: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    height: 120,
    backgroundColor: "#fff",
    paddingTop: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#6fa8dc",
  },
  avatar: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    borderWidth: 1,
    borderColor: "#00000033",
    borderRadius: 1000,
    backgroundColor: "#eee",
  },
  welcome: {
    backgroundColor: "#FFF",
    padding: 5,
    borderWidth: 1,
    borderColor: "#00000033",
    borderRadius: 6,
  },
  welcomeText: {
    fontSize: 16,
  },
  slogan: {
    marginVertical: 60,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  sloganText: {
    width: "45%",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2667df",
  },
  sloganImage: {
    width: "45%",
    height: "100%",
    resizeMode: "contain",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "bold" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  lessonItem: {
    width: "100%",
  },
  lessonImage: {
    height: 130,
    width: 245,
    borderRadius: 10,
  },
});

export default HomeMobileComponent;
