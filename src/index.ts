import { Hono } from "hono";
import { customAlphabet } from "nanoid";

declare module 'hono' {
  interface Env {
    notes: KVNamespace
  }
}

const html_data = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Notes</title>
  <style>
    html, body {
      height: 100%;
      overflow: hidden;
    }
    #note {
      width:100%;
      height:100%;
      resize:none;
      margin:0;
      border:0;
      padding:7px;
      outline: none;
    }
    @media (prefers-color-scheme: dark) {
      #note {
        background-color: #2f3136;
        color: #eee;
      }
    }
  </style>
  <meta property="og:title" content="note.autos" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="http://note.autos" />
  <meta property="og:description" content="Quick, hyper-minimal note sharing site" />
  <meta name="description" content="Quick, hyper-minimal note sharing site">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    function save() {
      const note = document.getElementById("note").value;
      fetch("/save", {
        method: "POST",
        body: note
      }).then((response) => {
        // send to new link
        response.text().then((id) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(location.origin + "/" + id);
          }
          window.location.href = "/" + id;
        });
      });
    }
    // save on ctrl-s
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        save();
      }
    });
  </script>
</head>
<body style="margin:0;">
  <textarea id="note" autofocus placeholder="Press ctrl-s to save"></textarea>
</body>
</html>`

const app = new Hono();

app.get("/", async (c) => {
  return c.html(html_data);
});

app.get("/robots.txt", async (c) => {
  return c.text("User-agent: *\nAllow: /$\nDisallow: /");
});

app.get("/:id", async (c) => {
  const id = c.req.param('id');
  const note = await c.env.notes.get(id);
  if (note) {
    return c.text(note);
  }
  return c.redirect("/");
});

app.post("/save", async (c) => {
  // save to a randomly generate id
  const id = customAlphabet("ABCDEFGHJKLMNPQRTUVWXYZabcdefghjkmnpqrstuvwxyz12346789")(10);
  const note = await c.req.text();
  await c.env.notes.put(id, note, { expirationTtl: 60 * 60 * 24 });
  return c.text(id);
});

export default app;