import CourseMain from "../components/Web/Course/CourseMain";
import Lessons from "../app/(tabs)/lessons";
import { Platform, View } from "react-native";
export default function Course() {
  return (
    <>
      {Platform.OS === "web" ? (
        <View style={{ flex: 1 }}>
          <CourseMain />
        </View>
      ) : (
        <Lessons />
      )}
    </>
  );
}
