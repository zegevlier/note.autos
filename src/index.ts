import { Hono } from "hono";
import { customAlphabet } from "nanoid";

declare module 'hono' {
  interface Env {
    notes: KVNamespace
  }
}

const app = new Hono();

app.get("/", async (c) => {
  return c.html(`
<head>
  <title>Notes</title>
  <style>
    #note {
      width:100%;
      height:100%;
      resize:none;
      margin:0;
    }
    @media (prefers-color-scheme: dark) {
      #note {
        background-color: #333;
        color: #eee;
      }
    }
  </style>
  <meta property="og:title" content="note.autos" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="http://my.site.com" />
  <meta property="og:description" content="Quick, hyper-minimal note sharing site" />
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
<body style="padding:0;margin:0;">
  <textarea id="note" rows="20" cols="80" maxlength="10000" autofocus></textarea>
</body>`);
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