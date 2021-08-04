/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 2021-08-02 10:13:06
 * @LastEditTime: 2021-08-04 10:50:42
 * @LastEditors: 石破天惊
 * @Description:
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import {
  PanGestureHandler,
  TapGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function PatternLock(props) {
  const [isError, setIsError] = useState(false);
  const canTouch = useSharedValue(true);
  const patternPoints = useSharedValue();
  const selectedIndexes = useSharedValue([]);
  const endPoint = useSharedValue();
  const containerLayout = useSharedValue({ width: 0, height: 0, min: 0 });
  const R = useDerivedValue(
    () =>
      (containerLayout.value.min / props.rowCount - props.patternMargin * 2) / 2
  );
  const cvc = useAnimatedStyle(() => ({
    marginBottom: `${
      Math.max(
        0,
        containerLayout.value.height / containerLayout.value.width - 1.25
      ) * 50
    }%`,
    width: containerLayout.value.min,
    height: containerLayout.value.min,
  }));
  const msgX = useSharedValue(0);
  const msgColor = { color: isError ? props.errorColor : props.activeColor };
  const msgStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: msgX.value }] };
  });
  const onContainerLayout = ({
    nativeEvent: {
      layout: { x, y, width, height },
    },
  }) =>
    (containerLayout.value = {
      width,
      height,
      min: Math.min(width, height),
    });
  const onPatternLayout = ({ nativeEvent: { layout } }) => {
    const points = [];
    for (let i = 0; i < props.rowCount; i++) {
      for (let j = 0; j < props.columnCount; j++) {
        points.push({
          x: layout.x + (layout.width / props.columnCount) * (j + 0.5),
          y: layout.y + (layout.height / props.rowCount) * (i + 0.5),
        });
      }
    }
    patternPoints.value = points;
  };
  const onEndJS = (res) => {
    if (props.onCheck) {
      canTouch.value = false;
      if (!props.onCheck(res)) {
        setIsError(true);
        const closeError = () => setIsError(false);
        runOnUI(() => {
          cancelAnimation(msgX);
          //修复iOS上原地spring不动的问题。
          msgX.value = withSpring(
            msgX.value === 0 ? 0.1 : 0,
            {
              stiffness: 2000,
              damping: 10,
              mass: 1,
              velocity: 2000,
            },
            (finished) => {
              runOnJS(closeError)();
              canTouch.value = true;
              selectedIndexes.value = [];
            }
          );
        })();
      } else {
        setIsError(false);
        setTimeout(() => {
          selectedIndexes.value = [];
          canTouch.value = true;
        }, 1000);
      }
    }
  };
  const panHandler = useAnimatedGestureHandler({
    onStart: (evt) => {
      if (
        canTouch.value &&
        patternPoints.value &&
        selectedIndexes.value.length === 0
      ) {
        const selected = [];
        patternPoints.value.every((p, idx) => {
          if (
            (p.x - evt.x) * (p.x - evt.x) + (p.y - evt.y) * (p.y - evt.y) <
            R.value * R.value
          ) {
            selected.push(idx);
            return false;
          }
          return true;
        });
        selectedIndexes.value = selected;
      }
    },
    onActive: (evt) => {
      if (
        canTouch.value &&
        patternPoints.value &&
        selectedIndexes.value.length > 0
      ) {
        patternPoints.value.every((p, idx) => {
          if (
            (p.x - evt.x) * (p.x - evt.x) + (p.y - evt.y) * (p.y - evt.y) <
            R.value * R.value
          ) {
            if (selectedIndexes.value.indexOf(idx) < 0) {
              selectedIndexes.value = [...selectedIndexes.value, idx];
            }
            return false;
          }
          return true;
        });
        endPoint.value = { x: evt.x, y: evt.y };
      }
    },
    onEnd: (evt) => {
      if (!canTouch.value) return;
      endPoint.value = null;
      if (selectedIndexes.value.length > 0)
        runOnJS(onEndJS)(selectedIndexes.value.join(""));
    },
  });
  const animatedProps = useAnimatedProps(() => {
    let d = "";
    selectedIndexes.value.forEach((idx) => {
      d += !d ? " M" : " L";
      d += ` ${patternPoints.value[idx].x},${patternPoints.value[idx].y}`;
    });
    if (d && endPoint.value) d += ` L${endPoint.value.x},${endPoint.value.y}`;
    if (!d) d = "M-1,-1";
    return { d };
  });

  return (
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View style={styles.container} onLayout={onContainerLayout}>
        <TapGestureHandler onGestureEvent={panHandler}>
          <Animated.View style={styles.container}>
            <View style={styles.msgc}>
              <Animated.Text style={[msgColor, msgStyle]}>
                {props.message}
              </Animated.Text>
            </View>
            <Animated.View style={cvc} onLayout={onPatternLayout}>
              {Array(props.rowCount)
                .fill(0)
                .map((_, ridx) => (
                  <View style={styles.chc} key={ridx}>
                    {Array(props.columnCount)
                      .fill(0)
                      .map((_, cidx) => {
                        const idx = ridx * props.rowCount + cidx;
                        const fColor = isError
                          ? props.errorColor
                          : props.activeColor;
                        const outer = useAnimatedStyle(() => {
                          const selected =
                            selectedIndexes.value.findIndex((v) => v === idx) <
                            0;
                          const borderColor = selected
                            ? props.inactiveColor
                            : fColor;
                          return {
                            flex: 1,
                            margin: props.patternMargin,
                            borderWidth: 2,
                            borderColor: borderColor,
                            borderRadius: 2 * R.value,
                            justifyContent: "center",
                            alignItems: "center",
                          };
                        });
                        const inner = useAnimatedStyle(() => {
                          const color =
                            selectedIndexes.value.findIndex((v) => v === idx) <
                            0
                              ? "transparent"
                              : fColor;
                          return {
                            width: R.value * 0.8,
                            height: R.value * 0.8,
                            borderRadius: R.value * 0.8,
                            backgroundColor: color,
                          };
                        });
                        return (
                          <Animated.View key={cidx} style={outer}>
                            <Animated.View style={inner} />
                          </Animated.View>
                        );
                      })}
                  </View>
                ))}
            </Animated.View>
            <Svg style={styles.svg} width="100%" height="100%">
              <AnimatedPath
                fill="none"
                strokeWidth={3}
                animatedProps={animatedProps}
                stroke={isError ? props.errorColor : props.activeColor}
              />
            </Svg>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

PatternLock.defaultProps = {
  message: "",
  rowCount: 3,
  columnCount: 3,
  patternMargin: 25,
  inactiveColor: "#8E91A8",
  activeColor: "#5FA8FC",
  errorColor: "#D93609",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
  },
  msgc: {
    flex: 1,
    justifyContent: "center",
    alignSelf: "center",
  },
  svg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  chc: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
});
