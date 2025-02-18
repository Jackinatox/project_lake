"use client"

import webSocket from "@/lib/Pterodactyl/webSocket";
import { Box, Breadcrumbs, Grid, Link, Textarea, Typography } from "@mui/joy"
import { Gauge } from "@mui/x-charts";
import { useEffect, useRef, useState } from "react"
import Console from "./console";
import { Gamepad2Icon, Server } from "lucide-react";
import CopyAddress from "./copyAddress";
import { Status } from "./status";
import { PowerBtns } from "./powerBtns";
import { Info } from "./info";
import { GameServerSettings } from "@/models/settings";

const settings: GameServerSettings = {
  egg: 'Minecraft',
  ver: '1.17.1',
  flavour: 'Paper',
  node: '01',
  wing: '01',
  cpuModel: 'Ryzen 5 5950X',
  vCores: 4,
  mem: 4096,
  addr: 'w1.scyed.com:2134',
  status: 'restarting',
}

interface serverProps {
  server: string;
  ptApiKey: string;
}

function GameDashboard({ server, ptApiKey }: serverProps) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const wsCreds = useRef<any>(null);

  const [serverStats, setServerStats] = useState<any>();

  useEffect(() => {
    function handleWsMessage(msg: string) {
      const data = JSON.parse(msg);
      console.log('event: ', data.event);

      switch (data.event) {

        case 'stats': {
          const stats = JSON.parse(data.args[0]);

          const roundedStats = {
            cpu_absolute: parseFloat(stats.cpu_absolute.toFixed(1)),
            disk_bytes: parseFloat((stats.disk_bytes / 1024 / 1024 / 1024).toFixed(2)),
            memory_bytes: parseFloat((stats.memory_bytes / 1024 / 1024 / 1024).toFixed(2)),
            memory_limit_bytes: parseFloat((stats.memory_limit_bytes / 1024 / 1024 / 1024).toFixed(2)),
            network: {
              rx_bytes: stats.network.rx_bytes,
              tx_bytes: stats.network.tx_bytes
            },
            state: stats.state,
            uptime: parseFloat((stats.uptime / 1000).toFixed(2)),
          }
          setServerStats(roundedStats);
        }
          break;

        case 'console output': {
          const consoleLine = data.args[0];
          setLogs(prevLogs => consoleLine + '\n' + prevLogs);
          console.log('consoleLine: ', consoleLine)
        }
          break;

        case 'token expiring': {
          wsRef.current?.send(JSON.stringify({
            event: 'auth',
            args: [wsCreds.current?.data.token]
          }));
        }
      }
    }

    const startWebSocket = async () => {
      const wsCred = await webSocket(server, ptApiKey);
      wsCreds.current = wsCred;

      console.log('socket and token: ', wsCred?.data.socket, wsCred?.data.token);

      const ws: WebSocket = new WebSocket(wsCred?.data.socket);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to WebSocket");


        ws.send(JSON.stringify({
          event: "auth",
          args: [wsCred?.data.token], // token as an array element
        }));

        if (ws.OPEN) {
          setLoading(false);
        }
      };

      ws.onmessage = (ev: MessageEvent) => {
        handleWsMessage(ev.data);
      }
    }

    startWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const days = Math.floor(serverStats?.uptime / 86400); // 86400 Sekunden pro Tag
  const hours = Math.floor((serverStats?.uptime % 86400) / 3600); // Restliche Stunden
  const minutes = Math.floor((serverStats?.uptime % 3600) / 60); // Restliche Minuten

  const handleStop = () => {
    if (!loading && wsRef.current){
      wsRef.current.send(JSON.stringify({
        event: 'set state',
        args: ["stop"]
      }));
    }  
  }

  const handleStart = () => {
    if (!loading && wsRef.current){
      wsRef.current.send(JSON.stringify({
        event: 'set state',
        args: ["start"]
      }));
    }  
  }

  return (
    <>
      {/* <BreakpointDisplay /> */}

      <Grid container spacing={2}>

        <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
          <Breadcrumbs separator="›" aria-label="breadcrumbs">

            <Link color="primary" href="/gameserver" sx={{ display: 'flex' }}>
              <Server /> &nbsp; Gameservers
            </Link>

            <Typography sx={{ display: 'flex' }}>
              <Gamepad2Icon /> &nbsp; {server}
            </Typography>

          </Breadcrumbs>
        </Grid>


        <Grid sx={{ flexGrow: 1 }}>
          <CopyAddress settings={settings} />
        </Grid>
        <Grid sx={{ flexGrow: 1 }}>
          <Status settings={settings} />
        </Grid>
        <Grid sx={{ flexGrow: 1 }}>
          <PowerBtns loading={loading} onStop={handleStop} onStart={handleStart}/>
        </Grid>
        <Grid xs={12} sx={{ flexGrow: 1 }}>
          <Console logs={logs} />
        </Grid>


        {/*<Grid xs={12} sm={12} md={12} lg={12} xl={12}>
          <GameDashboard server={server} ptApiKey={ptApiKey}></GameDashboard>
        </Grid>*/}

        <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
          <Info settings={settings} />
        </Grid>



      </Grid >

      <Box sx={{ display: 'inline-flex' }}>
        CPU
        <Gauge
          width={200} height={200}
          value={serverStats?.cpu_absolute}
          startAngle={-120}
          endAngle={120}
          innerRadius="80%"
          outerRadius="100%"
          text={
            ({ value, valueMax }) => `${value} / ${valueMax} %`
          }
        />
        RAM
        <Gauge
          width={200} height={200}
          value={serverStats?.memory_bytes}
          valueMax={serverStats?.memory_limit_bytes}
          startAngle={-120}
          endAngle={120}
          innerRadius="80%"
          outerRadius="100%"
          text={
            ({ value, valueMax }) => `${value} / ${valueMax} GiB`
          }
        />
      </Box>


      <div>
        <p>Uptime: {days}d {hours}h {minutes}min</p>
        {/*<p>CPU: {serverStats?.cpu_absolute} %</p>
        <p>Memory: {serverStats?.memory_bytes} GiB</p>
        <p>Memory Limit: {serverStats?.memory_limit_bytes} GiB</p>*/}
        <p>Disk: {serverStats?.disk_bytes} GiB</p>
        <p>Network RX: {serverStats?.network.rx_bytes} bytes</p>
        <p>Network TX: {serverStats?.network.tx_bytes} bytes</p>
        <p>State: {serverStats?.state}</p>
        {/*<p>Uptime: {serverStats?.uptime} sek</p>*/}
      </div>




    </>
  )
}

export default GameDashboard