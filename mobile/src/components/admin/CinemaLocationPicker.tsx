import { Text } from "react-native";
import type { Row } from "./config";

export interface CinemaLocationPickerProps {
  values: Record<string, string>;
  cinemas: Row[];
  editingId?: number;
  disabled: boolean;
  confirmed: boolean;
  onChange: (latitude: string, longitude: string) => void;
  onConfirm: (confirmed: boolean) => void;
}
export function CinemaLocationPicker(_props: CinemaLocationPickerProps) {
  return <Text>Vui lòng mở trang quản trị trên trình duyệt để chọn vị trí rạp.</Text>;
}

