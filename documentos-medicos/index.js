const express = require('express');
const { createClient } = require('redis');
const { randomUUID } = require('crypto');
const app = express();
const port = 3004;

app.use(express.json({ limit: '10mb' })); 

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('Conectado a Redis');
  } catch (err) {
    console.error('Error al conectar a Redis:', err);
  }
})();

// POST /documentos Guardar documento
app.post('/documentos', async (req, res) => {
  const { nombre, tipo, contenidoBase64, pacienteId } = req.body;

  if (!nombre || !tipo || !contenidoBase64 || !pacienteId) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const id = randomUUID();
  const documento = {
    nombre,
    tipo,
    contenidoBase64,
    pacienteId,
    fecha: new Date().toISOString()
  };

  try {
    await redisClient.hSet(`documento:${id}`, documento);

    // Publicar evento documento subido
    await redisClient.xAdd('eventos', '*', {
      tipo: 'documento-subido',
      documentoId: id,
      pacienteId,
      nombre
    });

    res.status(201).json({ id, ...documento });
  } catch (err) {
    console.error('Error al guardar documento:', err);
    res.status(500).json({ error: 'Error interno al guardar el documento' });
  }
});

// GET /documentos/:id Obtener documento por id
app.get('/documentos/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const documento = await redisClient.hGetAll(`documento:${id}`);

    if (!documento || Object.keys(documento).length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json({ id, ...documento });
  } catch (err) {
    console.error('Error al obtener documento:', err);
    res.status(500).json({ error: 'Error interno al leer el documento' });
  }
});


app.listen(port, () => {
  console.log(`Servicio de Documentos Médicos escuchando en ${port}`);
});
