import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import { Banner, Label, RequireRole } from "../../../shared/components/ui";
import { DriverAvatar, GuiScreen, Icon, IconButton, guiStyles } from "../../../shared/components/Gui";
import { callDuration, conversationPeer } from "../lib/presentation";
import { communicationService } from "../services/communicationService";
import { colors, explain } from "../../../shared/theme/theme";
type CallState =
  "CHECKING" | "DIALING" | "CONNECTED" | "NO_ANSWER" | "FAILED" | "ENDED";
const labels: Record<CallState, string> = {
  CHECKING: "Đang chuẩn bị cuộc gọi…",
  DIALING: "Đang kết nối…",
  CONNECTED: "Đã kết nối",
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
  const { request, session } = useApp();
  const [peer, setPeer] = useState<{scope:string;name:string;uri?:string} | null>(null);
  const identityScope = `${session!.user.id}:${orderId}`;
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
      setMuted(false);
      setSpeaker(false);
      setPeer(null);
      const service = communicationService(request);
      void service.conversation(orderId).then(conversation => {
        if (g !== generation.current) return;
        const other = conversationPeer(conversation.participants, session!.user.id);
        if (other) setPeer({scope:identityScope,name:other.displayName,uri:other.avatarUrl});
      }).catch(() => { /* Identity failure never invents a participant or changes call access. */ });
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
    }, [orderId, request, identityScope, session]),
  );
  useEffect(() => {
    if (state === "ENDED") generation.current++;
  }, [state]);
  const active = ["DIALING", "CONNECTED", "CHECKING"].includes(state);
  const peerName = peer?.scope === identityScope ? peer.name : "Người nhận cuộc gọi";
  return (
    <GuiScreen title="FoodGo" subtitle={`Đơn #${orderId}`}
      footer={<View style={callStyles.controls}>
        <View style={callStyles.control}>
          <IconButton name="volume" label={speaker ? "Tắt loa mô phỏng" : "Bật loa mô phỏng"} size={64} disabled={state !== "CONNECTED"} onPress={() => setSpeaker(v => !v)} />
          <Text style={guiStyles.muted}>Loa: {speaker ? "bật" : "tắt"}</Text>
        </View>
        <View style={callStyles.control}>
          <View style={{transform:[{rotate:"135deg"}]}}><IconButton name="call" label={active ? "Kết thúc cuộc gọi" : "Về hội thoại"} variant="danger" size={72} onPress={() => { change("ENDED"); if (!active) router.back(); }} /></View>
          <Text style={guiStyles.muted}>{active ? "Kết thúc" : "Hội thoại"}</Text>
        </View>
        <View style={callStyles.control}>
          <IconButton name={muted ? "micOff" : "mic"} label={muted ? "Bật micro mô phỏng" : "Tắt micro mô phỏng"} size={64} disabled={state !== "CONNECTED"} onPress={() => setMuted(v => !v)} />
          <Text style={guiStyles.muted}>Mic: {muted ? "tắt" : "bật"}</Text>
        </View>
      </View>}>
      <View style={callStyles.content}>
        <Text style={callStyles.name}>{peerName}</Text>
        <View style={callStyles.badge}><Icon name="call" size={16} /><Text style={{color:colors.brand,fontSize:13,fontWeight:"700"}}>Gọi mô phỏng</Text></View>
        <View style={{paddingVertical:12}}><DriverAvatar name={peerName} uri={peer?.scope === identityScope ? peer.uri : undefined} size={172} /></View>
        <Text accessibilityLiveRegion="polite" style={guiStyles.heading}>{labels[state]}</Text>
        <Text accessibilityLabel={`Thời lượng ${callDuration(seconds)}`} style={callStyles.timer}>{callDuration(seconds)}</Text>
        <Text style={[guiStyles.muted,{textAlign:"center"}]}>Không thu micro, phát hay truyền âm thanh.</Text>
      </View>
      {error && <Banner error>{error}</Banner>}
      {!active && <Label muted>Cuộc gọi đã dừng. Quay về hội thoại để tiếp tục trao đổi.</Label>}
    </GuiScreen>
  );
}
const callStyles = StyleSheet.create({
  content:{alignItems:"center",gap:14,paddingVertical:20},name:{fontSize:28,lineHeight:36,fontWeight:"800",textAlign:"center",color:colors.ink},
  badge:{flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:14,paddingVertical:8,borderRadius:22,backgroundColor:colors.mint},
  timer:{fontSize:44,lineHeight:54,fontWeight:"800",color:colors.ink,fontVariant:["tabular-nums"]},
  controls:{flexDirection:"row",alignItems:"center",justifyContent:"space-around",gap:6,paddingVertical:8},control:{flex:1,alignItems:"center",gap:8},
});
