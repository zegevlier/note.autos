import { Hono } from "hono";
import { customAlphabet } from "nanoid";

// @ts-ignore
import html_data from 'index.html';

type Bindings = {
  notes: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  return c.html(html_data);
});

app.get("/robots.txt", async (c) => {
  return c.text("User-agent: *\nAllow: /$\nDisallow: /");
});

app.get("/:id", async (c) => {
  const id = c.req.param('id');
  const note = await c.env.notes.get(id, { cacheTtl: 60 * 60 * 24 * 356 });
  if (note) {
    return c.text(note);
  }
  return c.text("Not found", 404);
});

app.post("/save", async (c) => {
  // save to a randomly generate id
  const id = customAlphabet("ABCDEFGHJKLMNPQRTUVWXYZabcdefghjkmnpqrstuvwxyz12346789")(10);
  const note = await c.req.text();
  await c.env.notes.put(id, note, { expirationTtl: 180 * 60 * 60 * 24 });
  return c.text(id);
});

export default app;