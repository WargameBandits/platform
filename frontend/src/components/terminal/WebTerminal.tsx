import { useEffect, useRef } from "react";

interface WebTerminalProps {
  instanceId: number;
  token: string;
}

function WebTerminal({ instanceId, token }: WebTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<any>(null);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      // xterm.js 동적 import (패키지 설치 필요)
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");

      if (destroyed || !containerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        theme: {
          background: "#0a0a0a",
          foreground: "#e0e0e0",
          cursor: "#8b5cf6",
          selectionBackground: "#8b5cf633",
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      termRef.current = term;

      // WebSocket 연결
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${instanceId}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        term.writeln("\x1b[35mConnected to instance.\x1b[0m\r\n");
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          term.write(new Uint8Array(event.data));
        } else {
          term.write(event.data as string);
        }
      };

      ws.onclose = (event) => {
        term.writeln(
          `\r\n\x1b[31mConnection closed (${event.code}).\x1b[0m`
        );
      };

      ws.onerror = () => {
        term.writeln("\r\n\x1b[31mConnection error.\x1b[0m");
      };

      // 터미널 입력 → WebSocket 전송
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(new TextEncoder().encode(data));
        }
      });

      // 리사이즈 대응
      const observer = new ResizeObserver(() => fitAddon.fit());
      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    };

    init();

    return () => {
      destroyed = true;
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, [instanceId, token]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-lg border border-border bg-black"
    />
  );
}

export default WebTerminal;
