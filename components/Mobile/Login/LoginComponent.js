import * as React from "react";
import {
  Image,
  Text,
  StyleSheet,
  Pressable,
  View,
  TouchableOpacity,
  TextInput,
  Button,
  Platform,
} from "react-native";
import NormalButton from "../../NormalButton";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import TokenStorage from "../../../constants/TokenStorage";
import ToastHelper from "../../../constants/ToastHelper";
import { API, setIp } from "../../../constants/API";
import axios from "axios";
import { useNavigation } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

const LoginComponent = () => {
  const navigation = useNavigation();
  const [showIp, setShowIp] = React.useState(0);
  const [IP, setIP] = React.useState(API.ip);

  React.useEffect(() => {
    const fetchUserInfo = async () => {
      const token = await TokenStorage.getToken();
      if (!token) {
        console.log("Không có token, vui lòng đăng nhập.");
        return;
      }
      try {
        const response = await axios.get(API.GET_USER_INFO, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Dữ liệu nhận được từ API: ", response.data);
        if (response.status === 200) {
          navigation.navigate("(tabs)");
        }
      } catch (error) {
        console.log("Không có token được xác thực", error);
      }
    };

    fetchUserInfo();
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "193831814873-4tvmlr7rkgca855u7i4fqlt7bheo7t2r.apps.googleusercontent.com",
    iosClientId:
      "193831814873-v4kcau6fdo26u1fff3i98n24gdcrkkqv.apps.googleusercontent.com",
    webClientId:
      "193831814873-8b6qjbnulj2e73molv4tu6qiucv0eo1r.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    handleSignInWithGoogle();
  }, [response]);

  async function handleSignInWithGoogle() {
    // const user = await AsyncStorage.getItem("@user");
    // const userToken = await TokenStorage.getToken();
    if (response?.type === "success") {
      await getUserInfo(response.authentication.accessToken);
    }
    // if (!user) {
    //   if (response?.type === "success") {
    //     await getUserInfo(response.authentication.accessToken);
    //   }
    // } else {
    //   setUserInfo(JSON.parse(user));
    // }
  }

  const getUserInfo = async (token) => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const user = await response.json();
      console.log(user);
      if (user) {
        const loginRes = await fetch(API.LOGIN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            password: "string",
            isGoogleSignIn: true,
            name: user.name,
          }),
        });
        if (response.status === 200) {
          const loginInfo = await loginRes.json();
          console.log("LOGIN: ", loginInfo);
          await TokenStorage.saveToken(loginInfo.token);
          navigation.navigate("(tabs)");
          ToastHelper.show(
            "success",
            "Đăng nhập bằng tài khoản google thành công!"
          );
        } else {
          ToastHelper.show("error", "Đăng nhập bằng tài khoản google thất bại");
          console.log("err: ", await loginRes.json());
        }
      }

      // await AsyncStorage.setItem("@user", JSON.stringify(user));
      // setUserInfo(user);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ ...styles.container, backgroundColor: "#fff" }}>
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>
        Tham gia ngay các khoá học cùng AIC - Gia sư AI thông minh
      </Text>
      <NormalButton
        title="Tiếp tục với email"
        style={{
          backgroundColor: "#6793e3",
          margin: 5,
          width: "70%",
        }}
        textStyle={{ lineHeight: 30 }}
        onPress={() => {
          navigation.navigate("LoginEmail");
        }}
      />
      <NormalButton
        title="Tiếp tục với Gmail"
        onPress={() => {
          promptAsync();
        }}
        style={{
          backgroundColor: "#fff",
          margin: 5,
          width: "70%",
          borderWidth: 1,
          borderColor: "#b8b9bb",
        }}
        textStyle={{ color: "#000", lineHeight: 30 }}
        icon={require("../../../assets/images/icon-google.png")}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          margin: 10,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 5 }}>Chưa có tài khoản?</Text>
        <Pressable
          onPress={() => {
            navigation.navigate("Register");
          }}
        >
          <Text style={{ fontSize: 16, color: "#6793e3", fontWeight: "bold" }}>
            Đăng ký
          </Text>
        </Pressable>
      </View>
      {showIp % 5 == 0 && showIp != 0 && (
        <View>
          <TextInput
            value={IP}
            onChangeText={(text) => setIP(text)}
            style={{ width: 200, height: 60, borderWidth: 1 }}
          />
          <Button title="SET IP" onPress={() => setIp(IP)} />
        </View>
      )}

      <TouchableOpacity
        onPress={() => setShowIp(showIp + 1)}
        style={styles.bottomTextContainer}
      >
        <Text style={styles.bottomText}>
          Bằng việc đăng ký, bạn đồng ý với
          <Text style={{ color: "#6793e3", fontWeight: "bold" }}>
            {" "}
            Điều khoản dịch vụ{" "}
          </Text>
          và
          <Text style={{ color: "#6793e3", fontWeight: "bold" }}>
            {" "}
            Chính sách bảo mật{" "}
          </Text>
          của chúng tôi.
        </Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: 180,
    resizeMode: "contain",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  bottomTextContainer: {
    position: "absolute",
    bottom: 20,
  },
  bottomText: {
    fontSize: 16,
    margin: 5,
    textAlign: "center",
  },
});
export default LoginComponent;
