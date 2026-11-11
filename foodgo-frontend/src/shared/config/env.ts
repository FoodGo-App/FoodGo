export const config = {
  mode:
    process.env.EXPO_PUBLIC_DATA_MODE === "api"
      ? ("api" as const)
      : ("demo" as const),
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
};
