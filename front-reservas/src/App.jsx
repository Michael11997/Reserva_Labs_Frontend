import { useEffect, useMemo, useState } from "react";
import { reservaSchema } from "./reservaSchema";
import "./index.css";

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
  const [darkMode, setDarkMode] = useState(() => {
  const guardado = localStorage.getItem("darkMode");
  return guardado ? JSON.parse(guardado) : false;
});

  async function cargar() {
    try {
      const res = await fetch(`${API}/api/salas`);

      if (!res.ok) {
        throw new Error("No se pudieron cargar los laboratorios");
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

    fetch(`${API}/api/salas`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudieron cargar los laboratorios");
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

  useEffect(() => {
  localStorage.setItem("darkMode", JSON.stringify(darkMode));
}, [darkMode]);

  async function reservar(e) {
    e.preventDefault();

    setMensaje("");
    setErrores({});

    const check = reservaSchema.safeParse(form);

    if (!check.success) {
      setErrores(check.error.flatten().fieldErrors);
      return;
    }

    try {
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
        setMensaje("No se pudo crear la reserva");
        return;
      }

      setMensaje("✓ Reserva creada correctamente");

      setForm({
        responsable: "",
        motivo: "",
        inicio: "",
        fin: "",
      });

      setSalaId("");

      cargar();
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    }
  }

  const totalReservas = useMemo(
    () =>
      salas.reduce(
        (total, sala) => total + (sala.reservas?.length ?? 0),
        0
      ),
    [salas]
  );

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">RL</div>

          <div>
            <h1>Reserva Labs</h1>
            <p>Gestión de laboratorios universitarios</p>
          </div>
        </div>

        <div className="topbar-actions">
  <button
    type="button"
    className="theme-toggle"
    onClick={() => setDarkMode(!darkMode)}
  >
    {darkMode ? "☀️ Claro" : "🌙 Oscuro"}
  </button>

  <div className="status">
    <span className="status-dot"></span>
    Sistema conectado
  </div>
</div>
      </header>

      <main className="page">
        <section className="hero">
          <div>
            <span className="eyebrow">Panel de reservas</span>
            <h2>Encuentra y reserva tu laboratorio</h2>
            <p>
              Consulta los laboratorios disponibles y registra una
              nueva reserva de manera rápida.
            </p>
          </div>
        </section>

        <section className="stats">
          <article className="stat-card">
            <span className="stat-label">Laboratorios</span>
            <strong>{salas.length}</strong>
            <small>Registrados en el sistema</small>
          </article>

          <article className="stat-card">
            <span className="stat-label">Reservas</span>
            <strong>{totalReservas}</strong>
            <small>Reservas registradas</small>
          </article>

          <article className="stat-card">
            <span className="stat-label">Estado</span>
            <strong className="available">Activo</strong>
            <small>API conectada</small>
          </article>
        </section>

        <div className="content-grid">
          <section className="labs-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  Laboratorios
                </span>
                <h3>Salas disponibles</h3>
              </div>

              <span className="counter">
                {salas.length} salas
              </span>
            </div>

            {cargando && (
              <div className="state-card">
                Cargando laboratorios...
              </div>
            )}

            {error && (
              <div className="state-card error-card">
                <strong>Error de conexión</strong>
                <span>{error}</span>
              </div>
            )}

            {!cargando && !error && salas.length === 0 && (
              <div className="state-card">
                No hay laboratorios registrados.
              </div>
            )}

            <div className="labs-grid">
              {salas.map((s) => (
                <article className="lab-card" key={s.id}>
                  <div className="lab-card-top">
                    <div className="lab-number">
                      {String(s.id).padStart(2, "0")}
                    </div>

                    <span className="capacity">
                      Capacidad {s.capacidad}
                    </span>
                  </div>

                  <h4>{s.nombre}</h4>

                  <p className="building">
                    Edificio {s.edificio}
                  </p>

                  <div className="reservations">
                    <div className="reservations-heading">
                      <span>Reservas</span>

                      <span>
                        {s.reservas?.length ?? 0}
                      </span>
                    </div>

                    {(s.reservas ?? []).length === 0 ? (
                      <p className="empty-reservation">
                        Sin reservas registradas
                      </p>
                    ) : (
                      <div className="reservation-list">
                        {(s.reservas ?? []).map((r) => (
                          <div
                            className="reservation-item"
                            key={r.id}
                          >
                            <div className="avatar">
                              {r.responsable
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>{r.responsable}</strong>
                              <span>{r.motivo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="reservation-panel">
            <div className="panel-heading">
              <span className="section-kicker">
                Nueva reserva
              </span>

              <h3>Reserva un laboratorio</h3>

              <p>
                Completa la información para registrar tu
                solicitud.
              </p>
            </div>

            <form onSubmit={reservar}>
              <div className="field">
                <label htmlFor="sala">Laboratorio</label>

                <select
                  id="sala"
                  value={salaId}
                  onChange={(e) =>
                    setSalaId(e.target.value)
                  }
                  required
                >
                  <option value="">
                    Selecciona un laboratorio
                  </option>

                  {salas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="responsable">
                  Responsable
                </label>

                <input
                  id="responsable"
                  placeholder="Ej. Michael Gutiérrez"
                  value={form.responsable}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      responsable: e.target.value,
                    })
                  }
                />

                {errores.responsable && (
                  <small className="field-error">
                    {errores.responsable[0]}
                  </small>
                )}
              </div>

              <div className="field">
                <label htmlFor="motivo">Motivo</label>

                <input
                  id="motivo"
                  placeholder="Ej. Práctica de programación"
                  value={form.motivo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      motivo: e.target.value,
                    })
                  }
                />

                {errores.motivo && (
                  <small className="field-error">
                    {errores.motivo[0]}
                  </small>
                )}
              </div>

              <div className="date-grid">
                <div className="field">
                  <label htmlFor="inicio">Inicio</label>

                  <input
                    id="inicio"
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
                    <small className="field-error">
                      {errores.inicio[0]}
                    </small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="fin">Fin</label>

                  <input
                    id="fin"
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
                    <small className="field-error">
                      {errores.fin[0]}
                    </small>
                  )}
                </div>
              </div>

              <button className="reserve-button" type="submit">
                Crear reserva
                <span>→</span>
              </button>

              {mensaje && (
                <div
                  className={
                    mensaje.startsWith("✓")
                      ? "message success-message"
                      : "message error-message"
                  }
                >
                  {mensaje}
                </div>
              )}
            </form>
          </aside>
        </div>
      </main>

      <footer>
        Reserva Labs · Proyecto de Programación Web
      </footer>
    </div>
  );
}