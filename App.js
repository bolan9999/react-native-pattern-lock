/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 1985-10-26 16:15:00
 * @LastEditTime: 2021-08-03 23:56:11
 * @LastEditors: 石破天惊
 * @Description:
 */
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Easing,
  SafeAreaView,
} from "react-native";
import { PatternLock } from "./src";

const screen = Dimensions.get("screen");
const screenHeight = Math.max(screen.width, screen.height);

export default function App() {
  const [msg, setMsg] = useState();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [modalY] = useState(new Animated.Value(screenHeight));
  const ms = StyleSheet.flatten([
    { transform: [{ translateY: modalY }] },
    styles.modal,
  ]);
  const modal = {
    open: () =>
      Animated.timing(modalY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(),
    close: () =>
      Animated.timing(modalY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start(),
  };
  const onSet = () => {
    setCode();
    setStatus("setting");
    setMsg("Set pattern lock");
    modal.open();
  };
  const onVerify = () => {
    setStatus("verifying");
    setMsg("Draw An Unlock Pattern To Verify");
    modal.open();
  };
  const onCheck = (res) => {
    if (status === "setting") {
      if (!code) {
        setCode(res);
        setMsg("Repeat Setting Pattern");
        return true;
      } else if (code === res) {
        setMsg("Success");
        setTimeout(modal.close, 1000);
        return true;
      } else {
        setMsg("Repeat Error,Set Again");
        return false;
      }
    } else {
      if (code === res) {
        setMsg("Success");
        setTimeout(modal.close, 1000);
        return true;
      } else {
        setMsg("Input Error,Please Try Again");
        return false;
      }
    }
  };
  return (
    <View style={styles.container}>
      <Button onPress={onSet} title="Set pattern lock" />
      <Button onPress={onVerify} title="Verify" />
      <Animated.View style={ms}>
        <SafeAreaView style={styles.sfv}>
          <Button color="#007AFF" title="Cancel" onPress={modal.close} />
          <PatternLock
            message={msg}
            inactiveColor="#8E91A8"
            activeColor="#5FA8FC"
            errorColor="#D93609"
            onCheck={onCheck}
          />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const Button = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.btnc}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: "absolute",
    backgroundColor: "rgb(41,43,56)",
  },
  sfv: { flex: 1, alignItems: "flex-start", paddingTop: 64 },
  btnc: {
    fontSize: 18,
    color: "#007AFF",
  },
});
