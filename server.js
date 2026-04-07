require('dotenv').config(); // leer el .env en local
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Conexión a PostgreSQL ──────────────────────────────────────────────────
// En Railway, DATABASE_URL se inyecta automáticamente.
// En tu PC, la cargás desde el archivo .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /clases
// Devuelve todas las clases con sus horarios agrupados como array.
// La estructura es exactamente igual al JSON que tu página ya espera.
app.get('/clases', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        c.id,
        c.nombre,
        c.descripcion,
        c.nivel,
        c.imagen,
        array_agg(h.horario ORDER BY h.id) AS horarios
      FROM clases c
      JOIN clases_horarios h ON h.clase_id = c.id
      GROUP BY c.id, c.nombre, c.descripcion, c.nivel, c.imagen
      ORDER BY c.id
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al obtener clases:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /clases/:id
// Devuelve una sola clase por ID (útil para el modal de detalle)
app.get('/clases/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(`
      SELECT
        c.id,
        c.nombre,
        c.descripcion,
        c.nivel,
        c.imagen,
        array_agg(h.horario ORDER BY h.id) AS horarios
      FROM clases c
      JOIN clases_horarios h ON h.clase_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, c.nombre, c.descripcion, c.nivel, c.imagen
    `, [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error('Error al obtener clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET / — para verificar que el servidor está vivo
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Academia de Danza funcionando ✓' });
});

// ── Arrancar servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
