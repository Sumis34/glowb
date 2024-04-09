import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

const clients: { id: string; ws: WSContext }[] = [];

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
