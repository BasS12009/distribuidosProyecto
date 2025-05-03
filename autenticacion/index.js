const express = require('express');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const Usuario = require('./models/Usuario');
const sequelize = require('./config/db');
const { comparePassword } = require('./utils/auth');

const redis = new Redis({ host: 'redis', port: 6379 });
const app = express();
app.use(express.json());

app.listen(3002, async () => {
  await sequelize.sync();
  console.log('Servicio de Autenticación en puerto 3002');
  escucharEventos();
});

app.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  const usuario = await Usuario.findOne({ where: { correo } });

  if (!usuario || !(await comparePassword(password, usuario.passwordHash))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ correo }, 'secreto123', { expiresIn: '1h' });
  res.json({ token });
});

async function escucharEventos() {
  let lastId = '0';
  console.log('Esperando eventos de usuario...');

  while (true) {
    const result = await redis.xread('BLOCK', 0, 'STREAMS', 'eventos', lastId);
    if (result) {
      const [_, eventos] = result[0];
      for (const [id, fields] of eventos) {
        const data = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }

        if (data.tipo === 'usuario_registrado' && data.correo && data.passwordHash) {
          await Usuario.findOrCreate({
            where: { correo: data.correo },
            defaults: { passwordHash: data.passwordHash }
          });
          console.log(`Usuario sincronizado para autenticación: ${data.correo}`);
        }

        lastId = id;
      }
    }
  }
}
