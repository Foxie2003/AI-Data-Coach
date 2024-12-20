import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import RoundContainer from "../../RoundContainer";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import NormalButton from "../../NormalButton";
import { API } from "../../../constants/API";
import axios from "axios";
import { useNavigation } from "expo-router";
import TokenStorage from "../../../constants/TokenStorage";
import ToastHelper from "../../../constants/ToastHelper";

const LoginEmailComponent = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async () => {
    console.log("LOGIN URL: ", API.LOGIN);
    try {
      const response = await axios.post(API.LOGIN, {
        email: email,
        password: password,
      });
      if (response.status === 200) {
        await TokenStorage.saveToken(response.data.token);
        console.log("Đăng nhập thành công");
        console.log("Token đã lưu: ", response.data.token);
        navigation.navigate("(tabs)");
        ToastHelper.show("success", "Đăng nhập thành công");
      } else {
        console.log("Email hoặc mật khẩu không đúng");
        ToastHelper.show("error", "Email hoặc mật khẩu không đúng");
      }
    } catch (error) {
      console.log("Lỗi khi đăng nhập: " + error);
      ToastHelper.show("error", "Email hoặc mật khẩu không đúng");
      ToastHelper.show("error", API.ip + error);
    }
  };

  const handleForgotPassword = async () => {
    try {
      console.log("Gửi email đến: " + email);
      ToastHelper.show("success", "Đang gửi email đến: " + email);
      const response = await axios.post(API.SEND_OTP, {
        email: email,
      });
      if (response.status === 200) {
        console.log("Gửi email thành công");
        ToastHelper.show("success", "Gửi email thành công");
        navigation.navigate("VerifyOTP", {
          resetPasswordInfo: {
            email: email,
          },
        });
      }
    } catch (error) {
      console.log("Lỗi khi quên mật khẩu: " + error);
      ToastHelper.show("error", "Gửi email không thành công");
    }
  };
  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: "#fff",
        paddingHorizontal: 30,
      }}
    >
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
      />
      <Pressable
        style={{ position: "absolute", top: 30, left: 30 }}
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Ionicons name="arrow-back" size={38} color="black" />
      </Pressable>
      <Text style={styles.title}>Đăng nhập với email</Text>
      <Text style={styles.detail}>
        Đăng nhập bằng tên tài khoản đã được đăng ký từ trước đó
      </Text>
      <View style={styles.form}>
        <Text style={styles.label}>
          Email<Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          placeholder="Nhập email"
          style={styles.input}
          onChangeText={(text) => setEmail(text)}
        />
        <Text style={styles.label}>
          Mật khẩu<Text style={{ color: "red" }}>*</Text>
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Nhập mật khẩu"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            onChangeText={(text) => setPassword(text)}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={34}
              color="black"
              style={{ marginLeft: -45 }}
            />
          </Pressable>
        </View>
        <View style={{ alignItems: "center" }}>
          <NormalButton
            title="Đăng nhập"
            onPress={handleLogin}
            style={{ width: "100%", marginTop: 10 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <NormalButton
            title="Quên mật khẩu?"
            onPress={handleForgotPassword}
            style={{
              width: "100%",
              marginTop: 10,
              backgroundColor: "#00000000",
            }}
            textStyle={styles.forgotPassword}
          />
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    height: 120,
    resizeMode: "contain",
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  form: {
    width: "100%",
    padding: 20,
    marginTop: 40,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1, // chiếm hết chiều rộng của container
    padding: 14,
    fontSize: 16,
  },
  forgotPassword: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6793e3",
    textAlign: "right",
  },
  detail: {
    fontSize: 16,
    color: "#737373",
    textAlign: "center",
    marginTop: 20,
  },
});
export default LoginEmailComponent;
