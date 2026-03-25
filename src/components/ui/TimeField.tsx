import { Platform } from "react-native";

import { TimeField as NativeTimeField } from "./TimeField.native";
import { TimeField as WebTimeField } from "./TimeField.web";

export const TimeField = Platform.OS === "web" ? WebTimeField : NativeTimeField;
