import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAuthState } from "@/features/authentication";
import { supportApi } from "./support.api";
import { supportSocketUrl } from "./supportSocket";

export function useSupportStream() {
  const token = useAuthState().session?.accessToken;
  const dispatch = useDispatch();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!token || typeof WebSocket === "undefined") return;
    let socket: WebSocket | null = null;
    let stopped = false;
    let attempt = 0;
    let timer = 0;

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(supportSocketUrl());
      socket.onopen = () => {
        attempt = 0;
        socket?.send(JSON.stringify({ type: "auth", accessToken: tokenRef.current }));
      };
      socket.onmessage = (event) => {
        const data = typeof event.data === "string" ? event.data : "";
        if (data.includes("case.updated") || data.includes("message.created")) {
          dispatch(supportApi.util.invalidateTags(["Case"]));
        }
      };
      socket.onclose = () => {
        if (stopped) return;
        attempt += 1;
        timer = window.setTimeout(connect, Math.min(10000, 500 * attempt));
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      socket?.close();
    };
  }, [dispatch, token]);
}
