import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CinemaLocationPickerProps } from "./CinemaLocationPicker";
import { distanceKilometers } from "../../utils/cinema-location";

function coordinate(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude), lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 8 && lat <= 24 && lng >= 102 && lng <= 115
    ? { latitude: lat, longitude: lng } : null;
}

export function CinemaLocationPicker(props: CinemaLocationPickerProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const marker = useRef<Leaflet.Marker | null>(null);
  const library = useRef<typeof Leaflet | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const { values, disabled, confirmed, onChange, onConfirm } = props;
  const selected = coordinate(values.latitude ?? "", values.longitude ?? "");
  const latitude = selected?.latitude, longitude = selected?.longitude;

  useEffect(() => {
    let disposed = false;
    let tileLoaded = false;
    const timeout = setTimeout(() => { if (!disposed && !tileLoaded) setError("Chưa tải được ảnh nền bản đồ. Kiểm tra kết nối Internet tới OpenStreetMap rồi đóng và mở lại form."); }, 15000);
    let observer: ResizeObserver | undefined;
    void import("leaflet").then(L => {
      if (disposed || !container.current) return;
      library.current = L;
      const initial = coordinate(latest.current.values.latitude ?? "", latest.current.values.longitude ?? "");
      const instance = L.map(container.current, { scrollWheelZoom: false, maxBounds: [[8, 102], [24, 115]], minZoom: 5, maxZoom: 19 });
      map.current = instance;
      instance.setView(initial ? [initial.latitude, initial.longitude] : [16.05, 108.2], initial ? 17 : 6);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on("tileload", () => { if (!disposed) { tileLoaded = true; setTilesReady(true); setError(""); } }).on("tileerror", () => { if (!disposed) setError("Không tải được một phần bản đồ. Kiểm tra mạng và phóng to/thu nhỏ để tải lại; chỉ xác nhận khi đã đối chiếu đúng địa điểm."); }).addTo(instance);
      instance.on("click", (event: Leaflet.LeafletMouseEvent) => {
        if (latest.current.disabled) return;
        const point = coordinate(String(event.latlng.lat), String(event.latlng.lng));
        if (!point) { setError("Vui lòng chọn vị trí trong phạm vi Việt Nam."); return; }
        setError("");
        latest.current.onChange(point.latitude.toFixed(7), point.longitude.toFixed(7));
      });
      observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!disposed) setError("Không thể mở bản đồ. Vui lòng đóng và mở lại form."); });
    return () => { disposed = true; clearTimeout(timeout); observer?.disconnect(); map.current?.remove(); map.current = null; marker.current = null; };
  }, []);

  useEffect(() => {
    const L = library.current, instance = map.current;
    if (!ready || !L || !instance) return;
    if (latitude === undefined || longitude === undefined) { marker.current?.remove(); marker.current = null; return; }
    const position: Leaflet.LatLngExpression = [latitude, longitude];
    if (!marker.current) {
      marker.current = L.marker(position, {
        draggable: !disabled, title: "Vị trí rạp — kéo để điều chỉnh",
        icon: L.divIcon({ className: "", html: '<div style="width:24px;height:24px;background:#ad2948;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px #333"></div>', iconSize: [30, 30], iconAnchor: [15, 15] }),
      }).addTo(instance);
      marker.current.on("dragend", () => {
        if (latest.current.disabled || !marker.current) return;
        const point = marker.current.getLatLng();
        if (!coordinate(String(point.lat), String(point.lng))) {
          marker.current.setLatLng([Number(latest.current.values.latitude), Number(latest.current.values.longitude)]);
          setError("Vui lòng chọn vị trí trong phạm vi Việt Nam."); return;
        }
        setError(""); latest.current.onChange(point.lat.toFixed(7), point.lng.toFixed(7));
      });
    } else marker.current.setLatLng(position);
    if (disabled) marker.current.dragging?.disable(); else marker.current.dragging?.enable();
    if (!instance.getBounds().contains(position)) instance.panTo(position);
  }, [ready, latitude, longitude, disabled]);

  const nearby = selected ? props.cinemas.filter(cinema => {
    if (cinema.id === props.editingId) return false;
    const other = coordinate(String(cinema.latitude ?? ""), String(cinema.longitude ?? ""));
    return other && distanceKilometers(selected, other) < 0.15;
  }) : [];
  const buttonStyle = { background: "#272C40", color: "white", border: "1px solid #505A73", borderRadius: 8, padding: "10px 12px", cursor: "pointer" };

  return <section aria-label="Chọn vị trí rạp" style={{ color: "#F2F4FA", display: "grid", gap: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
    <strong>Vị trí rạp trên bản đồ *</strong>
    <span style={{ color: "#AAB3CA", lineHeight: 1.5 }}>Phóng to đến đúng rạp rồi bấm vào bản đồ để đặt ghim. Kéo ghim để chỉnh vị trí. Đối chiếu tên đường và địa chỉ trước khi lưu.</span>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {([{ label: "Hà Nội", lat: 21.0285, lng: 105.8542 }, { label: "Đà Nẵng", lat: 16.0544, lng: 108.2022 }, { label: "TP. Hồ Chí Minh", lat: 10.7769, lng: 106.7009 }]).map(city => <button key={city.label} type="button" disabled={disabled || !ready} style={buttonStyle} onClick={() => map.current?.setView([city.lat, city.lng], 13)}>{city.label}</button>)}
      {selected && <button type="button" disabled={!ready} style={buttonStyle} onClick={() => map.current?.setView([selected.latitude, selected.longitude], 17)}>Về ghim đã chọn</button>}
    </div>
    <div ref={container} aria-label="Bản đồ chọn vị trí rạp" style={{ height: 340, width: "100%", borderRadius: 10, isolation: "isolate", background: "#30394a" }} />
    {!tilesReady && !error && <span>Đang tải ảnh nền bản đồ…</span>}
    {!!error && <span role="alert" style={{ color: "#FF9CB0" }}>{error}</span>}
    <div style={{ background: "#10131D", borderRadius: 8, padding: 12, lineHeight: 1.7 }}>
      <strong>{values.name || "Chưa nhập tên rạp"}</strong><br />
      {[values.address, values.city].filter(Boolean).join(", ") || "Chưa nhập địa chỉ"}<br />
      {selected ? "Vĩ độ: " + selected.latitude.toFixed(7) + " · Kinh độ: " + selected.longitude.toFixed(7) : "Chưa có vị trí hợp lệ. Hãy chọn điểm trên bản đồ."}
    </div>
    {!!nearby.length && <span role="alert" style={{ color: "#FFD58C" }}>Gần vị trí rạp đã có (dưới 150 m): {nearby.map(cinema => String(cinema.name)).join(", ")}. Kiểm tra để tránh thêm trùng chi nhánh.</span>}
    <button type="button" aria-expanded={advanced} style={buttonStyle} onClick={() => setAdvanced(value => !value)}>{advanced ? "Ẩn nhập tọa độ nâng cao" : "Nhập tọa độ nâng cao"}</button>
    {advanced && <div style={{ display: "grid", gap: 10 }}>
      {(["latitude", "longitude"] as const).map(key => <label key={key}>{key === "latitude" ? "Vĩ độ (8–24)" : "Kinh độ (102–115)"}<input style={{ display: "block", boxSizing: "border-box", width: "100%", padding: 12, marginTop: 6 }} disabled={disabled} inputMode="decimal" value={values[key] ?? ""} onChange={event => onChange(key === "latitude" ? event.target.value : values.latitude ?? "", key === "longitude" ? event.target.value : values.longitude ?? "")} /></label>)}
    </div>}
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5, cursor: "pointer" }}>
      <input type="checkbox" disabled={disabled || !selected || !ready || !tilesReady} checked={confirmed} onChange={event => onConfirm(event.target.checked)} />
      Tôi đã đối chiếu ghim với địa chỉ và xác nhận đúng chi nhánh rạp.
    </label>
  </section>;
}



