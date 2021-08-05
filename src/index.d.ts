/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 2021-08-05 19:41:19
 * @LastEditTime: 2021-08-05 19:50:43
 * @LastEditors: 石破天惊
 * @Description:
 */

declare module "@bolan9999/react-native-pattern-lock" {
  import * as React from 'react';
  
  interface PropsType {
    message?: string;
    rowCount?: number;
    errorColor?: string;
    columnCount?: number;
    activeColor?: string;
    inactiveColor?: string;
    patternMargin?: number;
    onCheck?: (res: string) => boolean;
  }
  export function PatternLock(props: PropsType): React.ReactNode;
}
