const express = require('express');
const Redis = require('ioredis');

const app = express();
const port = 3005;

const redis = new Redis({ host: 'redis', port: 6379 });

app.use(express.json());

// Crear una nueva cita
app.post('/citas', async (req, res) => {
  const { fecha, hora, medico, paciente } = req.body;

  if (!fecha || !hora || !medico || !paciente) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const cita = { fecha, hora, medico, paciente };
  const id = Date.now().toString();

  try {
    await redis.hset(`cita:${id}`, cita);

    // Publicar evento a stream
    await redis.xadd('cita-creada', '*',
      'citaId', id,
      'fecha', fecha,
      'hora', hora,
      'medico', medico,
      'paciente', paciente
    );
    console.log(`Cita creada: ${id}`);
    res.status(201).json({ id, ...cita });
  } catch (err) {
    console.error('Error al guardar la cita:', err);
    res.status(500).json({ error: 'Error al guardar en Redis' });
  }
});

// Obtener todas las citas
app.get('/citas', async (req, res) => {
  try {
    const keys = await redis.keys('cita:*');
    const citas = [];

    for (const key of keys) {
      const cita = await redis.hgetall(key);
      citas.push({ id: key.split(':')[1], ...cita });
    }

    res.json(citas);
  } catch (err) {
    console.error('Error al leer citas:', err);
    res.status(500).json({ error: 'Error al leer de Redis' });
  }
});

app.listen(port, () => {
  console.log(`Servicio de citas escuchando en http://localhost:${port}`);
});
