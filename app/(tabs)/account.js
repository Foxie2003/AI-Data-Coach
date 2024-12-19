import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { theme } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TokenStorage from "../../constants/TokenStorage";
import axios from "axios";
import { API } from "../../constants/API";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

const Account = () => {
  const navigation = useNavigation();

  const { top } = useSafeAreaInsets();
  const marginTop = top > 0 ? top : 0;

  const [userInfo, setUserInfo] = useState();

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

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={([styles.container], { marginTop })}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Tài khoản</Text>
        </View>
        <View style={styles.section}>
          <FontAwesome name="user-circle-o" size={80} color="#333" />
          <Text style={{ fontSize: 20 }}>{userInfo?.name}</Text>
          <Text style={{ fontSize: 16 }}>{userInfo?.email}</Text>
        </View>
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate("userInfo")}
            style={styles.button}
          >
            <View style={styles.icon}>
              <FontAwesome name="user" size={40} color="#333" />
            </View>
            <Text style={styles.buttonText}>Thông tin tài khoản</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("userInfo", { changePassword: true })
            }
            style={styles.button}
          >
            <View style={styles.icon}>
              <MaterialIcons name="password" size={40} color="#333" />
            </View>
            <Text style={styles.buttonText}>Đổi mật khẩu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              TokenStorage.removeToken();
              navigation.navigate("Login");
            }}
          >
            <Text
              style={[styles.buttonText, { textAlign: "center", color: "red" }]}
            >
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.statusBar,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  headerText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  section: {
    margin: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    alignItems: "center",
    gap: 10,
    padding: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 10,
  },
  icon: {
    width: 40,
    alignItems: "center",
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Account;
