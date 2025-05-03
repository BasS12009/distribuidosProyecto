const express = require('express');
const { createClient } = require('redis');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Cliente Redis
const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redisClient.connect();
  console.log('Conectado a Redis');
})();

// crear una nueva cita
app.post('/citas', async (req, res) => {
  const { fecha, hora, medico, paciente } = req.body;

  if (!fecha || !hora || !medico || !paciente) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const cita = { fecha, hora, medico, paciente };
  const id = Date.now().toString(); // id único usando timestamp

  try {
    await redisClient.hSet(`cita:${id}`, cita);
    res.status(201).json({ id, ...cita });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar en Redis' });
  }
});

// obtener todas las citas
app.get('/citas', async (req, res) => {
  try {
    const keys = await redisClient.keys('cita:*');
    const citas = [];

    for (const key of keys) {
      const cita = await redisClient.hGetAll(key);
      citas.push({ id: key.split(':')[1], ...cita });
    }

    res.json(citas);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer de Redis' });
  }
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
