import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

const clients: WSContext[] = [];

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
  return c.json({ clients: clients.map((c) => c.url?.searchParams) });
});

app.get("/send/:id", (c) => {
  const id = c.req.param("id");
  const ws = clients.find((c) => c.url?.searchParams.get("id") === id);
  if (ws) {
    ws.send("Hello World for you");
  }
  return c.json({ id });
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen(_event, ws) {
        clients.push(ws);
        console.log(clients.length);
      },
      onMessage(_event, ws) {
        console.log(ws);
      },
      onClose(_event, ws) {
        clients.splice(clients.indexOf(ws), 1);
      },
    };
  })
);

export default {
  port: 5005,
  fetch: app.fetch,
  websocket,
};
