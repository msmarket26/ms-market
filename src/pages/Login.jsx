import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ irARegistro }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  async function manejarLogin(e) {
    e.preventDefault();
    setError("");
    setMensajeExito("");

    // .trim() elimina espacios accidentales introducidos por el teclado del móvil
    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio || !password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, correoLimpio, password);
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Correo o contraseña incorrectos. Revisa mayúsculas y espacios.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos erróneos. Espera unos minutos o restablece tu clave.");
      } else {
        setError(err.message || "Error al iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  }

  async function recuperarContrasena() {
    const correoLimpio = correo.trim().toLowerCase();
    if (!correoLimpio) {
      setError("Ingresa tu correo arriba y pulsa de nuevo 'Recuperar contraseña'.");
      return;
    }

    try {
      setError("");
      await sendPasswordResetEmail(auth, correoLimpio);
      setMensajeExito(`¡Enlace enviado a ${correoLimpio}! Revisa tu bandeja de entrada o spam.`);
    } catch (err) {
      setError("No se pudo enviar el correo de recuperación: " + err.message);
    }
  }

  return (
    <div className="auth-card">
      <h2>Iniciar sesión</h2>
      <p className="auth-sub">Entra a tu cuenta de M&amp;S Market.</p>

      <form onSubmit={manejarLogin} className="auth-form">
        <div>
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="tu-correo@gmail.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            autoCapitalize="none"
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="auth-error">{error}</div>}
        {mensajeExito && (
          <div style={{ color: "var(--teal)", fontSize: "12.5px", marginTop: "6px" }}>
            {mensajeExito}
          </div>
        )}

        <button type="submit" className="btn btn-primario" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button
            type="button"
            className="link-btn"
            style={{ fontSize: "12px", color: "var(--text-muted)" }}
            onClick={recuperarContrasena}
          >
            ¿Olvidaste tu contraseña? Restablécela aquí
          </button>
        </div>
      </form>

      <div className="auth-switch">
        ¿No tienes cuenta?{" "}
        <button type="button" className="link-btn" onClick={irARegistro}>
          Regístrate
        </button>
      </div>
    </div>
  );
}