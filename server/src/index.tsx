import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";
import * as schedule from "node-schedule";

interface Action {
  action: string;
  time: string;
  days: number[];
}

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

const clients: { id: string; ws: WSContext; actions: schedule.Job[] }[] = [];

app.get("/", (c) => {
  return c.html(
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <div id="now-time"></div>
        <button id="btn">Send Message</button>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        const ws = new WebSocket('ws://localhost:5005/ws?id=' + Math.random())
        const $nowTime = document.getElementById('now-time')
        ws.onmessage = (event) => {
          $nowTime.textContent = event.data
        }
        document.getElementById('btn').addEventListener('click', () => {
          ws.send("Hello World")
        })
        `,
          }}
        ></script>
      </body>
    </html>
  );
});

app.get("/clients", (c) => {
  return c.json({ clients: clients.map((c) => c.id) });
});

app.post("/device/:id/toggle", (c) => {
  const id = c.req.param("id");
  const client = clients.find((c) => c.id === id);
  if (client) {
    client.ws.send(
      JSON.stringify({ time: new Date().toISOString(), type: "TOGGLE_POWER" })
    );
  }
  return c.json({ id });
});

app.post("/device/:id/brightness", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const client = clients.find((c) => c.id === id);
  if (client) {
    client.ws.send(
      JSON.stringify({
        time: new Date().toISOString(),
        type: "BRIGHTNESS",
        value: Math.max(0, Math.min(body.brightness, 100)),
      })
    );
  }
  return c.json({ id });
});

app.post("/device/:id/color", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const client = clients.find((c) => c.id === id);

  if (!client) return c.status(404);

  const colors = {
    r: Math.max(0, Math.min(body.r, 255)),
    g: Math.max(0, Math.min(body.g, 255)),
    b: Math.max(0, Math.min(body.b, 255)),
    w: Math.max(0, Math.min(body.w, 255)),
  };

  client.ws.send(
    JSON.stringify({
      time: new Date().toISOString(),
      type: "COLOR",
      ...colors,
    })
  );

  return c.json({ id });
});

app.post("/device/:id/mode", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const client = clients.find((c) => c.id === id);

  if (!client) return c.status(404);

  console.log("mode", body.mode);

  client.ws.send(
    JSON.stringify({
      type: "MODE",
      value: body.mode,
    })
  );

  return c.json({ id });
});

// app.post("/device/:id/schedule", async (c) => {
//   console.log("schedule");
  
//   const id = c.req.param("id");
//   const body = await c.req.json();
//   const client = clients.find((c) => c.id === id);

//   if (!client) return c.status(404);

//   if (!body?.action || !body?.time || !body?.days) return c.status(400);

//   const min = parseInt(body.time.split(":")[1]);
//   const hour = parseInt(body.time.split(":")[0]);

//   const rule = new schedule.RecurrenceRule();
//   rule.dayOfWeek = body.days;
//   rule.hour = hour;
//   rule.minute = min;

//   console.log(rule);
  

//   const job = schedule.scheduleJob(rule, () => {
//     if (body.action === "on") {
//       client.ws.send(
//         JSON.stringify({
//           type: "ON",
//         })
//       );
//     } else if (body.action === "off") {
//       client.ws.send(
//         JSON.stringify({
//           type: "OFF",
//         })
//       );
//     }
//   });

//   client.actions.push(job);

//   return c.json({ id });
// });

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      async onOpen(_event, ws) {
        if (ws.url?.searchParams.get("id") === null) {
          return ws.close();
        }

        const client = {
          id: ws.url?.searchParams.get("id") as string,
          ws,
          actions: [],
        };

        clients.splice(clients.indexOf(client), 1);
        clients.push(client);
      },
      onMessage(_event, ws) {
        console.log(JSON.parse(_event.data.toString()));
      },
      onError(evt, ws) {
        console.error(evt);
      },
      onClose(_event, ws) {
        console.log("close");

        const id = ws.url?.searchParams.get("id");

        const index = clients.findIndex(
          (c) => c.ws.url?.searchParams.get("id") === id
        );

        clients.splice(index, 1);
      },
    };
  })
);

export default {
  port: 5005,
  fetch: app.fetch,
  websocket,
};
