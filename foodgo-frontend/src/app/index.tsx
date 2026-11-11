import React from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useApp } from "../providers/AppProvider";
export default function Index() {
  const { session, restoring } = useApp();
  if (restoring)
    return <ActivityIndicator style={{ flex: 1 }} color="#006C59" />;
  return (
    <Redirect
      href={
        session?.user.role === "RESTAURANT"
          ? "/restaurant"
          : session?.user.role === "DRIVER"
            ? "/driver"
            : "/(customer)/(tabs)/home"
      }
    />
  );
}
