import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

async function readError(response) {
  try {
    const body = await response.json();
    return body.error || response.statusText;
  } catch {
    return response.statusText;
  }
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`${API}/api/todos`);
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    setTodos(await response.json());
  }

  useEffect(() => {
    if (!API) {
      setError("VITE_API_URL is not set.");
      return;
    }
    load().catch((reason) => setError(reason.message));
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("title", title);
    if (file) {
      body.append("file", file);
    }
    try {
      const response = await fetch(`${API}/api/todos`, { method: "POST", body });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      setTitle("");
      setFile(null);
      event.target.reset();
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(todo) {
    setError("");
    const response = await fetch(`${API}/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    await load();
  }

  async function remove(todo) {
    setError("");
    const response = await fetch(`${API}/api/todos/${todo.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    await load();
  }

  return (
    <main>
      <h1>Todos</h1>
      <p className="lede">Kept in Postgres. Files stay in S3.</p>
      <form onSubmit={onSubmit}>
        <label>
          Task
          <input
            type="text"
            name="title"
            value={title}
            maxLength={200}
            required
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Attachment
          <input type="file" name="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Saving" : "Add"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {todos.length === 0 ? <p className="empty">Nothing on the list yet.</p> : null}
      <ul className="list">
        {todos.map((todo) => (
          <li className={todo.completed ? "item done" : "item"} key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              aria-label={`Mark ${todo.title} complete`}
              onChange={() => toggle(todo)}
            />
            <span>
              <span className="title">{todo.title}</span>
              {todo.attachment ? (
                <a className="file-link" href={`${API}/api/todos/${todo.id}/attachment`} target="_blank" rel="noreferrer">
                  Open file
                </a>
              ) : null}
            </span>
            <button className="delete" type="button" onClick={() => remove(todo)} aria-label={`Delete ${todo.title}`}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
