import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { subirImagen } from "../lib/cloudinary";
import { useAuth } from "../AuthContext";

export default function ProductoDetalle({ producto, onCerrar, onAgregarAlCarrito }) {
  const { usuario, perfil } = useAuth();
  const [cantidad, setCantidad] = useState(1);
  const [subiendo, setSubiendo] = useState(false);
  const [yaEnviado, setYaEnviado] = useState(false);
  const [error, setError] = useState("");

  const esMiPropioProducto = usuario && producto.vendedorId === usuario.uid;
  const stockDisponible = Number(producto.stock) || 0;

  // Enlace a WhatsApp solo si el vendedor lo configuró
  const numeroWa = producto.whatsapp ? producto.whatsapp.replace(/\D/g, "") : null;
  const linkWhatsApp = numeroWa
    ? `https://wa.me/${numeroWa}?text=${encodeURIComponent(
        `¡Hola ${producto.vendedorNombre}! Te escribo desde M&S Market para consultar sobre "${producto.nombre}".`
      )}`
    : null;

  async function subirComprobante(e) {
    const archivo = e.target.files?.[0];
    if (!archivo || !usuario) return;

    setSubiendo(true);
    setError("");
    try {
      const comprobanteUrl = await subirImagen(archivo, "ms-market/comprobantes");

      await addDoc(collection(db, "transacciones"), {
        productoId: producto.id,
        productoNombre: producto.nombre,
        monto: producto.precio,
        compradorId: usuario.uid,
        compradorNombre: perfil?.nombre || usuario.displayName || usuario.email,
        compradorEmail: usuario.email,
        vendedorId: producto.vendedorId,
        vendedorNombre: producto.vendedorNombre,
        comprobanteUrl,
        estado: "esperando_confirmacion",
        creadoEn: serverTimestamp(),
      });

      setYaEnviado(true);
    } catch (err) {
      setError(err.message || "No se pudo subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="overlay" onClick={onCerrar}>
      <div className="modal modal-detalle-responsive" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera con botón de cerrar accesible */}
        <div className="modal-header-nav">
          <div>
            <span className="card-badge-categoria" style={{ position: "static" }}>
              {producto.categoria}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onCerrar} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="modal-grid">
          {/* Columna 1: Fotografía y Datos */}
          <div className="modal-col-media">
            <div className="modal-foto">
              {producto.imagenUrl ? (
                <img src={producto.imagenUrl} alt={producto.nombre} />
              ) : (
                <span style={{ fontSize: "48px" }}>🛍️</span>
              )}
            </div>

            <h2 className="modal-prod-titulo">{producto.nombre}</h2>

            <div className="detalle-lista">
              <b>Descripción</b>
              <p>{producto.detalle || "Sin descripción proporcionada."}</p>

              <b>Vendedora</b>
              <p>{producto.vendedorNombre}</p>

              <b>Punto de entrega o método de envío</b>
              <p>{producto.envio || "A coordinar con la vendedora"}</p>
            </div>
          </div>

          {/* Columna 2: Compra, WhatsApp y QR */}
          <div className="modal-col-actions">
            {/* Caja de Compra y Carrito */}
            <div className="box-compra">
              <div className="box-compra-header">
                <span className="modal-prod-precio">Bs {producto.precio}</span>
                <span className={stockDisponible > 0 ? "card-stock" : "card-stock card-stock--agotado"}>
                  {stockDisponible > 0 ? `${stockDisponible} disponibles` : "Agotado"}
                </span>
              </div>

              {stockDisponible > 0 && (
                <div className="box-qty-row">
                  <span>Cantidad:</span>
                  <div className="item-qty">
                    <button
                      className="btn-qty"
                      type="button"
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    >
                      −
                    </button>
                    <span className="qty-number">{cantidad}</span>
                    <button
                      className="btn-qty"
                      type="button"
                      onClick={() => setCantidad((c) => Math.min(stockDisponible, c + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primario btn-block"
                disabled={stockDisponible <= 0}
                onClick={() => onAgregarAlCarrito && onAgregarAlCarrito(producto, cantidad)}
              >
                🛒 Añadir al Carrito
              </button>

              {/* Botón WhatsApp */}
              {linkWhatsApp ? (
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-wa btn-block"
                  style={{ marginTop: "8px" }}
                >
                  💬 Contactar por WhatsApp
                </a>
              ) : (
                <div className="aviso-sin-wa">
                  <span>ℹ️ Esta vendedora aún no registró WhatsApp directo.</span>
                </div>
              )}
            </div>

            {/* Módulo de Pago Directo por QR */}
            {esMiPropioProducto ? (
              <div className="ticket" style={{ textAlign: "center" }}>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: 0 }}>
                  Eres la propietaria de este producto. Las compradoras verán tu QR para transferirte.
                </p>
              </div>
            ) : (
              <div className="ticket">
                <div className="ticket-top">
                  <h3 style={{ fontSize: "14px" }}>Pago directo a {producto.vendedorNombre}</h3>
                  <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Escanea con tu aplicación de banco
                  </div>
                </div>

                <div className="qr-real">
                  {producto.qrUrl ? (
                    <img src={producto.qrUrl} alt={`QR de ${producto.vendedorNombre}`} />
                  ) : (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
                      Sin QR asignado
                    </p>
                  )}
                </div>

                <div className="ticket-divider" />

                <div className="ticket-row">
                  <span>Monto unitario:</span>
                  <b className="mono">Bs {producto.precio}</b>
                </div>

                {!usuario ? (
                  <p className="auth-error" style={{ textAlign: "center", fontSize: "12px" }}>
                    Inicia sesión para subir tu comprobante de pago directo.
                  </p>
                ) : yaEnviado ? (
                  <div style={{ textAlign: "center", marginTop: "8px" }}>
                    <span className="badge badge--wait">Comprobante enviado</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      id="input-comprobante-directo"
                      style={{ display: "none" }}
                      disabled={subiendo}
                      onChange={subirComprobante}
                    />
                    <button
                      type="button"
                      className="btn btn-secundario btn-block"
                      style={{ marginTop: "6px" }}
                      disabled={subiendo || !producto.qrUrl}
                      onClick={() => document.getElementById("input-comprobante-directo").click()}
                    >
                      {subiendo ? "Subiendo..." : "📷 Subir comprobante directo"}
                    </button>
                  </>
                )}

                {error && <div className="auth-error">{error}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}