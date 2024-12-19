import { Button, Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { View, Text } from "react-native";
import RoundImage from "../RoundImage";
import { useEffect, useState } from "react";
import TokenStorage from "../../constants/TokenStorage";
import axios from "axios";
import { API } from "../../constants/API";
import { useNavigation } from "@react-navigation/native";

function InfoComponent() {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);

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

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <View>
          <Text style={styles.boldText}>{userInfo?.name}</Text>
          <Text style={styles.text}>{userInfo?.email}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("userInfo")}>
        <Text style={{ fontWeight: "bold", marginTop: 5, fontSize: 14 }}>
          Thông tin tài khoản
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          TokenStorage.removeToken();
          navigation.navigate("Login");
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            color: "#e64335",
            marginVertical: 5,
            fontSize: 14,
          }}
        >
          Đăng xuất
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 4,
    padding: 15,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "rgba(89, 87, 87, 0.3)",
    paddingBottom: 10,
    paddingHorizontal: 5,
  },
  avatar: {
    width: 45,
    height: 45,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#eee",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  text: {
    fontSize: 12,
  },
});

export default InfoComponent;
