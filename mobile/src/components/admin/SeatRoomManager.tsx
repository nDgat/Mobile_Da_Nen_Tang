import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Row } from "./config";

type Props = {
  rooms: Row[];
  seats: Row[];
  roomLabel: (room: Row) => string;
  onAdd: (roomId: number, rowLabel: string, seatNumber: number, type: string) => void;
  onEdit: (seat: Row) => void;
  onToggleAisle: (seat: Row) => void;
};

export function SeatRoomManager({ rooms, seats, roomLabel, onAdd, onEdit, onToggleAisle }: Props) {
  const roomIdsWithSeats = useMemo(() => new Set(seats.map(seat => Number(seat.roomId))), [seats]);
  const availableRooms = useMemo(() => rooms.filter(room => room.isActive !== false || roomIdsWithSeats.has(room.id)), [roomIdsWithSeats, rooms]);
  const [roomId, setRoomId] = useState<number | null>(availableRooms[0]?.id ?? null);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  useEffect(() => {
    if (roomId === null || !availableRooms.some(room => room.id === roomId)) setRoomId(availableRooms[0]?.id ?? null);
  }, [availableRooms, roomId]);
  useEffect(() => { setSelectedSeatId(null); }, [roomId]);

  const roomSeats = useMemo(() => seats
    .filter(seat => Number(seat.roomId) === roomId)
    .sort((left, right) => String(left.rowLabel).localeCompare(String(right.rowLabel), undefined, { numeric: true }) || Number(left.seatNumber) - Number(right.seatNumber)), [roomId, seats]);
  const rows = useMemo(() => {
    const result = new Map<string, Row[]>();
    for (const seat of roomSeats) {
      const label = String(seat.rowLabel);
      result.set(label, [...(result.get(label) ?? []), seat]);
    }
    return [...result.entries()];
  }, [roomSeats]);
  const selected = roomSeats.find(seat => seat.id === selectedSeatId);
  const active = roomSeats.filter(seat => seat.isActive !== false);
  const counts = {
    standard: active.filter(seat => seat.type === "STANDARD").length,
    vip: active.filter(seat => seat.type === "VIP").length,
    sweetbox: active.filter(seat => seat.type === "SWEETBOX").length,
    aisle: roomSeats.length - active.length,
  };

  if (!availableRooms.length) return <View style={styles.empty}><Text style={styles.title}>Chưa có phòng chiếu</Text><Text style={styles.muted}>Hãy tạo phòng trước, ghế sẽ được tạo cùng sơ đồ.</Text></View>;

  return <View style={styles.container}>
    <View style={styles.section}>
      <Text style={styles.label}>Chọn phòng để quản lý</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomList}>
        {availableRooms.map(room => <Pressable key={room.id} onPress={() => setRoomId(room.id)} style={[styles.roomChip, room.id === roomId && styles.roomChipActive]}>
          <Text style={[styles.roomText, room.id === roomId && styles.roomTextActive]}>{roomLabel(room)}</Text>
        </Pressable>)}
      </ScrollView>
    </View>

    <View style={styles.summary}>
      <Summary label="Tổng hoạt động" value={active.length} color="#FFFFFF" />
      <Summary label="Thường" value={counts.standard} color="#AEB6C8" />
      <Summary label="VIP" value={counts.vip} color="#E1B955" />
      <Summary label="Sweetbox (2 người)" value={counts.sweetbox} color="#F174A3" />
      <Summary label="Vị trí lối đi" value={counts.aisle} color="#7C8498" />
    </View>

    <View style={styles.mapCard}>
      <View style={styles.screen}><Text style={styles.screenText}>MÀN HÌNH</Text></View>
      {!rows.length ? <Text style={styles.muted}>Phòng này chưa có hàng ghế để thêm. Hãy tạo phòng mới với sơ đồ ghế.</Text> :
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.map}>{rows.map(([label, rowSeats]) => <View key={label} style={styles.row}>
          <Text style={styles.rowLabel}>{label}</Text>
          {rowSeats.map((seat, index) => {
            const previousNumber = index === 0 ? 0 : Number(rowSeats[index - 1]?.seatNumber);
            const missingBefore = Math.max(0, Number(seat.seatNumber) - previousNumber - 1);
            const isAisle = seat.isActive === false;
            return <Pressable key={seat.id} onPress={() => setSelectedSeatId(seat.id)} style={[
            styles.seat,
            { marginLeft: missingBefore * 41 },
            seat.type === "VIP" && styles.vip,
            seat.type === "SWEETBOX" && styles.sweetbox,
            isAisle && styles.aisle,
            seat.id === selectedSeatId && styles.selected,
          ]}><Text style={isAisle ? styles.aisleText : styles.seatText}>{isAisle ? "Lối" : seat.type === "SWEETBOX" ? "SB" + String(seat.seatNumber) : String(seat.seatNumber)}</Text></Pressable>;
          })}
          <Pressable
            accessibilityLabel={`Thêm ghế vào hàng ${label}`}
            onPress={() => {
              const lastSeat = rowSeats[rowSeats.length - 1];
              const nextNumber = Math.max(...rowSeats.map(seat => Number(seat.seatNumber))) + 1;
              onAdd(roomId!, label, nextNumber, String(lastSeat?.type ?? "STANDARD"));
            }}
            style={styles.addSeat}
          ><Text style={styles.addSeatText}>+ Ghế</Text></Pressable>
        </View>)}</View>
      </ScrollView>}
      <View style={styles.legend}><Legend style={styles.standard} label="Thường" /><Legend style={styles.vip} label="VIP" /><Legend style={styles.sweetbox} label="Sweetbox" /><Legend style={styles.aisle} label="Lối đi" /></View>
    </View>

    <View style={styles.actionRow}>
      {selected && <><Pressable onPress={() => onEdit(selected)} style={styles.action}><Text style={styles.actionText}>Sửa {String(selected.rowLabel)}{String(selected.seatNumber)}</Text></Pressable>
      <Pressable onPress={() => onToggleAisle(selected)} style={styles.action}><Text style={styles.actionText}>{selected.isActive === false ? "Khôi phục ghế" : "Đổi thành lối đi"}</Text></Pressable></>}
    </View>
    <Text style={styles.tip}>Dùng nút “+ Ghế” ở cuối hàng để thêm ghế đúng vào hàng đó. Chạm vào một ghế để sửa loại ghế hoặc đổi thành lối đi.</Text>
  </View>;
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color }]}>{value}</Text><Text style={styles.muted}>{label}</Text></View>;
}
function Legend({ style, label }: { style: object; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendBox, style]} /><Text style={styles.muted}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { gap: 16 }, section: { gap: 9 }, label: { color: "#F2F4FA", fontWeight: "800", fontSize: 14 },
  roomList: { gap: 8, paddingBottom: 4 }, roomChip: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: "#242A3C", borderWidth: 1, borderColor: "#343C53" },
  roomChipActive: { backgroundColor: "#6D2C43", borderColor: "#FF7690" }, roomText: { color: "#BEC5D5", fontSize: 12, fontWeight: "700" }, roomTextActive: { color: "#FFFFFF" },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, summaryItem: { minWidth: 125, flexGrow: 1, padding: 13, borderRadius: 11, backgroundColor: "#171B28" },
  summaryValue: { fontSize: 21, fontWeight: "900" }, muted: { color: "#AAB3CA", fontSize: 12, lineHeight: 18 },
  mapCard: { gap: 17, padding: 18, borderRadius: 15, backgroundColor: "#151925", borderWidth: 1, borderColor: "#30374A" },
  screen: { alignSelf: "center", width: "70%", borderTopWidth: 5, borderColor: "#EAEAF0", paddingTop: 8 }, screenText: { color: "#7F8799", textAlign: "center", fontSize: 9, letterSpacing: 2 },
  map: { minWidth: 500, gap: 8, padding: 6 }, row: { flexDirection: "row", alignItems: "center", gap: 7 }, rowLabel: { width: 22, color: "#AAB3CA", fontWeight: "900" },
  seat: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#394052", borderWidth: 1, borderColor: "#566078" },
  addSeat: { minWidth: 58, height: 34, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, borderRadius: 9, borderWidth: 1, borderStyle: "dashed", borderColor: "#FF7690" }, addSeatText: { color: "#FF9AAF", fontSize: 10, fontWeight: "900" },
  standard: { backgroundColor: "#394052", borderColor: "#566078" }, vip: { backgroundColor: "#987126", borderColor: "#D8AA49" }, sweetbox: { width: 62, backgroundColor: "#A93661", borderColor: "#F174A3" },
  aisle: { width: 42, backgroundColor: "transparent", borderColor: "#596174", borderStyle: "dashed" }, aisleText: { color: "#7F8799", fontSize: 9, fontWeight: "800" }, selected: { borderWidth: 3, borderColor: "#FFFFFF", opacity: 1 }, seatText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 13 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 6 }, legendBox: { width: 17, height: 17, borderRadius: 5, borderWidth: 1 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, action: { minHeight: 44, justifyContent: "center", paddingHorizontal: 15, borderRadius: 9, backgroundColor: "#2A3043" },
  actionText: { color: "#FFFFFF", fontWeight: "800" },
  tip: { color: "#8F98AD", fontSize: 12 }, empty: { gap: 8, padding: 20, borderRadius: 14, backgroundColor: "#191D2B" }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
});
