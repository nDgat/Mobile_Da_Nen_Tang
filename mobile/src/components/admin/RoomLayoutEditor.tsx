import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type RoomSeatType = "STANDARD" | "VIP" | "SWEETBOX";
export type RoomLayoutSeat = { rowLabel: string; seatNumber: number; type: RoomSeatType };
type LayoutRow = { label: string; cells: (RoomSeatType | null)[] };

const initialRows = (): LayoutRow[] => [
  { label: "A", cells: Array<RoomSeatType>(10).fill("STANDARD") },
  { label: "B", cells: Array<RoomSeatType>(10).fill("STANDARD") },
  { label: "C", cells: Array<RoomSeatType>(10).fill("VIP") },
  { label: "D", cells: Array<RoomSeatType>(10).fill("VIP") },
  { label: "E", cells: Array<RoomSeatType>(10).fill("VIP") },
  { label: "F", cells: Array<RoomSeatType>(5).fill("SWEETBOX") },
];

const flatten = (rows: LayoutRow[]): RoomLayoutSeat[] =>
  rows.flatMap(row => row.cells.flatMap((type, index) => type ? [{ rowLabel: row.label, seatNumber: index + 1, type }] : []));

export const createDefaultRoomLayout = () => flatten(initialRows());

export function RoomLayoutEditor({ onChange }: { onChange: (seats: RoomLayoutSeat[]) => void }) {
  const [rows, setRows] = useState<LayoutRow[]>(initialRows);
  const seatCount = useMemo(() => flatten(rows).length, [rows]);

  useEffect(() => { onChange(flatten(rows)); }, [onChange, rows]);

  function updateRow(index: number, updater: (row: LayoutRow) => LayoutRow) {
    setRows(current => current.map((row, rowIndex) => rowIndex === index ? updater(row) : row));
  }

  function cycleSeat(rowIndex: number, cellIndex: number) {
    setRows(current => current.map((row, index) => {
      if (index !== rowIndex) return row;
      const last = rowIndex === current.length - 1;
      const cells = [...row.cells];
      const value = cells[cellIndex];
      if (last) {
        const sweetboxCount = cells.filter(type => type === "SWEETBOX").length;
        cells[cellIndex] = value === "SWEETBOX" && sweetboxCount > 1 ? null : "SWEETBOX";
      } else {
        cells[cellIndex] = value === "STANDARD" ? "VIP" : value === "VIP" ? null : "STANDARD";
      }
      return { ...row, cells };
    }));
  }

  function addRow() {
    setRows(current => {
      if (current.length >= 26) return current;
      const prior = current.map((row, index) => index === current.length - 1
        ? { ...row, cells: row.cells.map(type => type === "SWEETBOX" ? "VIP" as const : type) }
        : row);
      const label = String.fromCharCode(65 + current.length);
      return [...prior, { label, cells: Array<RoomSeatType>(5).fill("SWEETBOX") }];
    });
  }

  function removeLastRow() {
    setRows(current => {
      if (current.length <= 2) return current;
      const next = current.slice(0, -1);
      return next.map((row, index) => index === next.length - 1
        ? { ...row, cells: row.cells.map(type => type ? "SWEETBOX" as const : null) }
        : row);
    });
  }

  return <View style={styles.card}>
    <View style={styles.header}>
      <View><Text style={styles.title}>Sơ đồ ghế *</Text><Text style={styles.help}>Mỗi hàng có nút Thêm ghế/Bớt ghế. Chạm vào ghế để đổi Thường → VIP → Lối đi. Hàng cuối là Sweetbox 2 người.</Text></View>
      <Text style={styles.count}>{seatCount} vị trí</Text>
    </View>
    <Text style={styles.savedHint}>Ghế trong sơ đồ sẽ được tạo tự động khi bấm “Lưu thay đổi”.</Text><View style={styles.screen}><Text style={styles.screenText}>MÀN HÌNH</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={styles.map}>
        {rows.map((row, rowIndex) => <View key={row.label} style={styles.row}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          {row.cells.map((type, cellIndex) => <Pressable
            key={cellIndex}
            accessibilityRole="button"
            accessibilityLabel={`Hàng ${row.label}, vị trí ${cellIndex + 1}, ${type ?? "lối đi"}`}
            onPress={() => cycleSeat(rowIndex, cellIndex)}
            style={[styles.seat, type === "VIP" && styles.vip, type === "SWEETBOX" && styles.sweetbox, !type && styles.gap]}
          ><Text style={styles.seatText}>{type === "SWEETBOX" ? `SB${cellIndex + 1}` : type ? cellIndex + 1 : "·"}</Text></Pressable>)}
          <Pressable onPress={() => updateRow(rowIndex, current => ({ ...current, cells: [...current.cells, rowIndex === rows.length - 1 ? "SWEETBOX" : "STANDARD"] }))} style={styles.smallButton}><Text style={styles.smallButtonText}>+ Ghế</Text></Pressable>
          <Pressable disabled={row.cells.length <= 1} onPress={() => updateRow(rowIndex, current => ({ ...current, cells: current.cells.slice(0, -1) }))} style={styles.smallButton}><Text style={styles.smallButtonText}>− Ghế</Text></Pressable>
        </View>)}
      </View>
    </ScrollView>
    <View style={styles.legend}>
      <Legend color="#394052" label="Thường" />
      <Legend color="#A77A28" label="VIP" />
      <Legend color="#B13D68" label="Sweetbox 2 người" wide />
      <Legend color="transparent" label="Lối đi" border />
    </View>
    <View style={styles.actions}>
      <Pressable onPress={() => setRows(initialRows())} style={styles.action}><Text style={styles.actionText}>Khôi phục sơ đồ mẫu</Text></Pressable><Pressable onPress={addRow} style={styles.action}><Text style={styles.actionText}>+ Thêm hàng</Text></Pressable>
      <Pressable onPress={removeLastRow} disabled={rows.length <= 2} style={[styles.action, rows.length <= 2 && styles.disabled]}><Text style={styles.actionText}>Xóa hàng cuối</Text></Pressable>
    </View>
  </View>;
}

function Legend({ color, label, border, wide }: { color: string; label: string; border?: boolean; wide?: boolean }) {
  return <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: color }, border && styles.gap, wide && { width: 30 }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { gap: 16, padding: 16, borderRadius: 14, backgroundColor: "#10131D", borderWidth: 1, borderColor: "#343A4E" },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, title: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  help: { maxWidth: 430, marginTop: 4, color: "#9EA7BC", fontSize: 12, lineHeight: 18 }, count: { color: "#FF9CB0", fontSize: 12, fontWeight: "800" },
  savedHint: { color: "#9CE6C3", backgroundColor: "#143B30", padding: 11, borderRadius: 9, fontSize: 12, lineHeight: 18 }, screen: { alignSelf: "center", width: "75%", paddingVertical: 6, borderTopWidth: 4, borderColor: "#E9E6EF" }, screenText: { color: "#80889D", fontSize: 9, letterSpacing: 2, textAlign: "center" },
  map: { gap: 7, padding: 5, minWidth: 480 }, row: { flexDirection: "row", alignItems: "center", gap: 6 }, rowLabel: { width: 20, color: "#AFB7CA", fontWeight: "800" },
  seat: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#394052", borderWidth: 1, borderColor: "#50596F" },
  vip: { backgroundColor: "#A77A28", borderColor: "#D9A94A" }, sweetbox: { width: 58, backgroundColor: "#B13D68", borderColor: "#F06B9D" },
  gap: { backgroundColor: "transparent", borderColor: "#4B5264", borderStyle: "dashed" }, seatText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  smallButton: { minWidth: 58, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#252B3D" }, smallButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 6 }, legendBox: { width: 16, height: 16, borderRadius: 5 }, legendText: { color: "#AEB6C8", fontSize: 11 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, action: { minHeight: 40, justifyContent: "center", paddingHorizontal: 13, borderRadius: 9, backgroundColor: "#30374B" }, actionText: { color: "#FFFFFF", fontWeight: "700" }, disabled: { opacity: 0.4 },
});
