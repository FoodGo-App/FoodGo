import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Heading,
  Label,
  Panda,
  RequireRole,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { communicationService } from "../services/communicationService";
import { colors, explain } from "../../../shared/theme/theme";
type CallState =
  "CHECKING" | "DIALING" | "CONNECTED" | "NO_ANSWER" | "FAILED" | "ENDED";
const labels: Record<CallState, string> = {
  CHECKING: "Đang chuẩn bị cuộc gọi…",
  DIALING: "Đang kết nối…",
  CONNECTED: "Đã kết nối · dùng thử",
  NO_ANSWER: "Không có người trả lời",
  FAILED: "Không kết nối được",
  ENDED: "Cuộc gọi đã kết thúc",
};
export default function CallScreen() {
  return (
    <RequireRole roles={["CUSTOMER", "DRIVER"]}>
      <Call />
    </RequireRole>
  );
}
function Call() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { request } = useApp();
  const [state, setState] = useState<CallState>("CHECKING"),
    [seconds, setSeconds] = useState(0),
    [muted, setMuted] = useState(false),
    [speaker, setSpeaker] = useState(false),
    [error, setError] = useState<string | null>(null);
  const status = useRef<CallState>("CHECKING"),
    start = useRef(0),
    generation = useRef(0);
  const change = (s: CallState) => {
    status.current = s;
    setState(s);
  };
  useFocusEffect(
    useCallback(() => {
      const g = ++generation.current;
      let connection: ReturnType<typeof setTimeout> | undefined;
      let pollBusy = false;
      change("CHECKING");
      setError(null);
      setSeconds(0);
      const service = communicationService(request);
      service
        .call(orderId)
        .then((result) => {
          if (g !== generation.current) return;
          if (!result.allowed)
            throw new Error("Hiện không thể mở cuộc gọi cho đơn này.");
          change("DIALING");
          connection = setTimeout(() => {
            if (g !== generation.current || status.current === "ENDED") return;
            change(result.scenarioCode);
            if (result.scenarioCode === "CONNECTED") start.current = Date.now();
          }, 1800);
        })
        .catch((e) => {
          if (g === generation.current) {
            setError(explain(e));
            change("FAILED");
          }
        });
      const tick = setInterval(() => {
        if (status.current === "CONNECTED")
          setSeconds(Math.floor((Date.now() - start.current) / 1000));
      }, 1000);
      const verify = setInterval(() => {
        if (pollBusy || !["DIALING", "CONNECTED"].includes(status.current))
          return;
        pollBusy = true;
        service
          .call(orderId)
          .then((result) => {
            if (!result.allowed)
              throw new Error("Đơn đã kết thúc nên cuộc gọi được đóng lại.");
          })
          .catch((e) => {
            if (g === generation.current) {
              setError(explain(e));
              change("ENDED");
            }
          })
          .finally(() => {
            pollBusy = false;
          });
      }, 5000);
      const listener = AppState.addEventListener("change", (value) => {
        if (value !== "active") {
          change("ENDED");
          generation.current++;
          if (connection) clearTimeout(connection);
        }
      });
      return () => {
        generation.current++;
        status.current = "ENDED";
        if (connection) clearTimeout(connection);
        clearInterval(tick);
        clearInterval(verify);
        listener.remove();
      };
    }, [orderId, request]),
  );
  useEffect(() => {
    if (state === "ENDED") generation.current++;
  }, [state]);
  const active = ["DIALING", "CONNECTED", "CHECKING"].includes(state);
  return (
    <Screen title="Cuộc gọi dùng thử" subtitle={`Đơn #${orderId}`} back>
      <View style={{ alignItems: "center", paddingVertical: 24, gap: 20 }}>
        <Panda size={180} pose={state === "CONNECTED" ? "inbox" : "waiting"} />
        <Heading>{labels[state]}</Heading>
        <Text
          style={{
            fontSize: 38,
            color: colors.brand,
            fontVariant: ["tabular-nums"],
          }}
        >
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")}
        </Text>
      </View>
      <Banner>
        Chỉ mô phỏng trạng thái và nút điều khiển. Không thu micro, phát hay
        truyền âm thanh.
      </Banner>
      {error && <Banner error>{error}</Banner>}
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button
              title={muted ? "Micro: tắt" : "Micro: bật"}
              variant="secondary"
              disabled={state !== "CONNECTED"}
              onPress={() => setMuted((v) => !v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={speaker ? "Loa: bật" : "Loa: tắt"}
              variant="secondary"
              disabled={state !== "CONNECTED"}
              onPress={() => setSpeaker((v) => !v)}
            />
          </View>
        </View>
        <Button
          title={active ? "Kết thúc cuộc gọi" : "Về hội thoại"}
          variant="danger"
          onPress={() => {
            change("ENDED");
            if (!active) router.back();
          }}
        />
      </Card>
      <Label muted>
        Thời lượng chỉ chạy khi đã kết nối. Cuộc gọi dừng khi rời màn, đưa app
        xuống nền hoặc quyền theo đơn hết hiệu lực.
      </Label>
    </Screen>
  );
}
