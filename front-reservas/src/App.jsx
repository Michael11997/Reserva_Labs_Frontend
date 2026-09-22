import { useEffect, useState } from "react";
import { reservaSchema } from "./reservaSchema";

const API = "http://localhost:3010";

export default function App() {
  const [salas, setSalas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [salaId, setSalaId] = useState("");
  const [form, setForm] = useState({
    responsable: "",
    motivo: "",
    inicio: "",
    fin: "",
  });

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
  try {
    const res = await fetch(`${API}/api/salas`);

    if (!res.ok) {
      throw new Error("no se pudo cargar");
    }

    const data = await res.json();

    setSalas(data);
    setError(null);
  } catch (e) {
    setError(e.message);
  } finally {
    setCargando(false);
  }
}

  useEffect(() => {
  const controller = new AbortController();

  fetch(`${API}/api/salas`, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) {
        throw new Error("no se pudo cargar");
      }

      return res.json();
    })
    .then((data) => {
      setSalas(data);
      setError(null);
    })
    .catch((e) => {
      if (e.name !== "AbortError") {
        setError(e.message);
      }
    })
    .finally(() => {
      setCargando(false);
    });

  return () => {
    controller.abort();
  };
}, []);

  async function reservar(e) {
    e.preventDefault();

    setMensaje("");
    setErrores({});

    const check = reservaSchema.safeParse(form);

    if (!check.success) {
      setErrores(check.error.flatten().fieldErrors);
      return;
    }

    const res = await fetch(
      `${API}/api/salas/${salaId}/reservas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    if (res.status === 400) {
      setErrores((await res.json()).detalles || {});
      return;
    }

    if (!res.ok) {
      setMensaje("error del servidor");
      return;
    }

    setMensaje("✓ reserva creada");

    setForm({
      responsable: "",
      motivo: "",
      inicio: "",
      fin: "",
    });

    cargar();
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        fontFamily: "system-ui",
      }}
    >
      <h1>Reserva de Labs</h1>

      {cargando && <p>Cargando labs...</p>}

      {error && <p>Error: {error}</p>}

      <ul>
        {salas.map((s) => (
          <li key={s.id}>
            <b>{s.nombre}</b> · {s.edificio} · cap. {s.capacidad}

            <ul>
              {s.reservas.map((r) => (
                <li key={r.id}>
                  {r.responsable} — {r.motivo}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h2>Nueva reserva</h2>

      <form onSubmit={reservar}>
        <select
          value={salaId}
          onChange={(e) => setSalaId(e.target.value)}
          required
        >
          <option value="">— elegí un lab —</option>

          {salas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>

        <br />

        <input
          placeholder="tu nombre"
          value={form.responsable}
          onChange={(e) =>
            setForm({
              ...form,
              responsable: e.target.value,
            })
          }
        />

        {errores.responsable && (
          <small>{errores.responsable[0]}</small>
        )}

        <br />

        <input
          placeholder="motivo"
          value={form.motivo}
          onChange={(e) =>
            setForm({
              ...form,
              motivo: e.target.value,
            })
          }
        />

        {errores.motivo && (
          <small>{errores.motivo[0]}</small>
        )}

        <br />

        <label>Inicio</label>

        <input
          type="datetime-local"
          value={form.inicio}
          onChange={(e) =>
            setForm({
              ...form,
              inicio: e.target.value,
            })
          }
        />

        {errores.inicio && (
          <small>{errores.inicio[0]}</small>
        )}

        <br />

        <label>Fin</label>

        <input
          type="datetime-local"
          value={form.fin}
          onChange={(e) =>
            setForm({
              ...form,
              fin: e.target.value,
            })
          }
        />

        {errores.fin && (
          <small>{errores.fin[0]}</small>
        )}

        <br />

        <button type="submit">Reservar</button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </main>
  );
}