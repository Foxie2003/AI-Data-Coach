import {
  Button,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import RoundContainer from "../../RoundContainer";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import NormalButton from "../../NormalButton";
import { API } from "../../../constants/API";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import TokenStorage from "../../../constants/TokenStorage";
import { toast } from "react-toastify";

const LoginEmailComponent = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async () => {
    try {
      const response = await axios.post(API.LOGIN, {
        email: email,
        password: password,
      });
      if (response.status === 200) {
        await TokenStorage.saveToken(response.data.token);
        console.log("Token đã lưu: ", response.data.token);
        navigation.navigate("Home");
        toast.success("Đăng nhập thành công!");
      } else {
        console.log("Email hoặc mật khẩu không đúng");
      }
    } catch (error) {
      toast.error("Email hoặc mật khẩu không đúng ");
      console.log("Lỗi khi đăng nhập: " + error);
    }
  };

  const handleForgotPassword = async () => {
    try {
      console.log("Gửi email đến: " + email);
      toast.success("Đang gửi email đến: " + email);
      const response = await axios.post(API.SEND_OTP, {
        email: email,
      });
      if (response.status === 200) {
        console.log("Gửi email thành công");
        toast.success("Gửi email thành công");
        navigation.navigate("VerifyOTP", {
          resetPasswordInfo: {
            email: email,
          },
        });
      }
    } catch (error) {
      console.log("Lỗi khi quên mật khẩu: " + error);
      toast.success("Gửi email thất bại vui lòng thử lại sau");
    }
  };
  return (
    <RoundContainer style={{ ...styles.container, width: "70%" }}>
      <Pressable
        style={{ position: "absolute", top: 20, left: 20 }}
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </Pressable>
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Đăng nhập với email</Text>
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
              size={24}
              color="black"
              style={{ marginLeft: -35 }}
            />
          </Pressable>
        </View>
        <Pressable onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <NormalButton
            title="Đăng nhập"
            onPress={handleLogin}
            style={{ width: "30%", marginTop: 10 }}
          />
        </View>
      </View>
    </RoundContainer>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: 80,
    resizeMode: "contain",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  form: {
    width: "100%",
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
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
    padding: 10,
  },
  forgotPassword: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6793e3",
    textAlign: "right",
  },
});
export default LoginEmailComponent;
