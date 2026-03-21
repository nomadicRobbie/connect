import { Platform } from "react-native";

import { DateField as NativeDateField } from "./DateField.native";
import { DateField as WebDateField } from "./DateField.web";

export const DateField = Platform.OS === "web" ? WebDateField : NativeDateField;
