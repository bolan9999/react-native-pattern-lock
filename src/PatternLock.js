/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 2021-08-02 10:13:06
 * @LastEditTime: 2021-08-03 22:34:06
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
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function PatternLock(props) {
  const [isError, setIsError] = useState(false);
  const canTouch = useSharedValue(true);
  const patternPoints = useSharedValue();
  const R = useSharedValue(1000); //默认值1000解决web上borderRadius的问题
  const selectedIndexes = useSharedValue([]);
  const endPoint = useSharedValue();
  const containerWidth = useSharedValue(0);
  const cvc = useAnimatedStyle(() => ({
    marginBottom: "30%",
    width: containerWidth.value,
    height: containerWidth.value,
  }));
  const msgX = useSharedValue(0);
  const msgStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: msgX.value }] };
  });
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
      <Animated.View
        style={styles.container}
        onLayout={({
          nativeEvent: {
            layout: { x, y, width, height },
          },
        }) => (containerWidth.value = Math.min(width, height))}
      >
        <TapGestureHandler onGestureEvent={panHandler}>
          <Animated.View style={styles.container}>
            <View style={styles.msgc}>
              <Animated.Text
                style={[
                  { color: isError ? props.errorColor : props.activeColor },
                  msgStyle,
                ]}
              >
                {props.message}
              </Animated.Text>
            </View>
            <Animated.View
              style={cvc}
              onLayout={({ nativeEvent: { layout } }) => {
                const points = [];
                for (let i = 0; i < props.rowCount; i++) {
                  for (let j = 0; j < props.columnCount; j++) {
                    points.push({
                      x:
                        layout.x +
                        (layout.width / props.columnCount) * (j + 0.5),
                      y:
                        layout.y + (layout.height / props.rowCount) * (i + 0.5),
                    });
                  }
                }
                patternPoints.value = points;
              }}
            >
              {Array(props.rowCount)
                .fill(0)
                .map((_, ridx) => (
                  <View style={styles.chc} key={ridx}>
                    {Array(props.columnCount)
                      .fill(0)
                      .map((_, cidx) => {
                        const outer = useAnimatedStyle(() => {
                          const fColor = isError
                            ? props.errorColor
                            : props.activeColor;
                          const selected =
                            selectedIndexes.value.findIndex(
                              (v) => v === ridx * props.rowCount + cidx
                            ) < 0;
                          const borderColor = selected
                            ? props.inactiveColor
                            : fColor;
                          return {
                            flex: 1,
                            margin: 25,
                            borderWidth: 2,
                            borderColor: borderColor,
                            borderRadius: 2 * R.value,
                          };
                        });
                        const inner = useAnimatedStyle(() => {
                          const fColor = isError
                            ? props.errorColor
                            : props.activeColor;
                          const selected =
                            selectedIndexes.value.findIndex(
                              (v) => v === ridx * props.rowCount + cidx
                            ) < 0;
                          const innerColor = selected ? "transparent" : fColor;
                          return {
                            flex: 1,
                            margin: 20,
                            borderRadius: R.value - 20,
                            backgroundColor: innerColor,
                          };
                        });
                        return (
                          <Animated.View
                            key={cidx}
                            style={outer}
                            onLayout={({
                              nativeEvent: {
                                layout: { width, height },
                              },
                            }) => {
                              if (width > 0) R.value = width / 2;
                            }}
                          >
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
  message: "Draw an unlock pattern",
  rowCount: 3,
  columnCount: 3,
  inactiveColor: "#8E91A8",
  activeColor: "#5FA8FC",
  errorColor: "#D93609",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "stretch",
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
