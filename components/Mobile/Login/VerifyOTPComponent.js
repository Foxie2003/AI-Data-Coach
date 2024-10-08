import { Button, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import RoundContainer from '../../RoundContainer';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import NormalButton from '../../NormalButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API } from '../../../constants/API';

const ForgetPassword = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const registerInfo = route.params?.registerInfo;
    const resetPasswordInfo = route.params?.resetPasswordInfo;
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const handleOtpChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value !== '') {
            // Chuyển sang ô tiếp theo nếu có giá trị
            if (index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            // Quay lại ô trước đó khi xóa
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        try {
            console.log(registerInfo.email);
            const data = {
                email: resetPasswordInfo?.email || registerInfo?.email,
                otp: otpString
            }
            console.log(data);
            const response = await axios.post(API.VERIFY_OTP, data);
            if (response.status === 200) {
                console.log("Xác nhận mã thành công");
                // Thêm xử lý sau khi xác nhận thành công (ví dụ: chuyển hướng)
                if(registerInfo) {
                    handleRegister();
                }
                else if (resetPasswordInfo) {
                    console.log("Đặt lại mật khẩu" + resetPasswordInfo.email);
                    navigation.navigate('ResetPassword', { resetPasswordInfo });
                }
                else {
                    console.log("Quên mật khẩu");
                }
            }
        } catch (error) {
            console.log("Lỗi khi xác nhận mã: " + error);
        }
    }

    const handleRegister = async () => {
        try {
            const response = await axios.post(API.REGISTER, {
                accountType: "email",
                email: registerInfo.email,
                isGoogleSignUp: false,
                password: registerInfo.password
            });
            console.log(response.data.message);
        } catch (error) {
            console.log("Lỗi khi đăng ký tài khoản: " + error);
        }
    }

    const handleGoBack = () => {
        navigation.goBack();
    }

    return (
        <View style={{ ...styles.container, backgroundColor: '#fff', paddingHorizontal: 10 }}>
            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
            <Pressable
                style={{ position: 'absolute', top: 30, left: 30 }}
                onPress={handleGoBack}>
                <Ionicons name="arrow-back" size={38} color="black" />
            </Pressable>
            <Text style={styles.title}>Vui lòng nhập mã xác nhận</Text>
            <Text style={styles.detail}>Mã xác nhận đã được AIC gửi đến email của bạn. Vui lòng nhập mã xác nhận bên dưới</Text>
            <View style={styles.form}>
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => inputRefs.current[index] = ref}
                            style={styles.otpInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                        />
                    ))}
                </View>
                <View style={{ alignItems: 'center' }}>
                    <NormalButton
                        title='Xác nhận'
                        onPress={handleVerifyOTP}
                        style={{ width: '100%', marginTop: 10 }}
                    />
                </View>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: 20
                }}>
                    <Text style={{ fontSize: 16, marginRight: 5 }}>
                        Chưa nhận được mã?
                    </Text>
                    <Pressable
                        onPress={() => { navigation.navigate('ForgetPassword') }}>
                        <Text style={styles.resendCode}>Chưa nhận được mã?</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    logo: {
        height: 120,
        resizeMode: 'contain',
        marginTop: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20
    },
    form: {
        width: '100%',
        padding: 20,
        marginTop: 40
    },
    label: {
        fontSize: 18,
        marginBottom: 10
    },
    detail: {
        fontSize: 16,
        color: '#737373',
        textAlign: 'center',
        marginTop: 20
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    otpInput: {
        width: '13%',
        aspectRatio: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    codeInput: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10
    },
    resendCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6793e3'
    }
});
export default ForgetPassword;