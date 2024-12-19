import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { toast } from "react-toastify";

export default ToastHelper = {
  show: (type = "success", message) => {
    if (Platform.OS === "web") {
      toast[type](message);
    } else {
      Toast.show({
        text1: message,
        type: type === "success" ? "success" : "error",
      });
    }
  },
};
