const express = require('express');
const Redis = require('ioredis');
const bcrypt = require('bcrypt');
const sequelize = require('./config/db');
const Usuario = require('./models/Usuario');

const app = express();
const redis = new Redis({ host: 'redis', port: 6379 });

app.use(express.json());

app.post('/registro', async (req, res) => {
  const { nombre, correo, password } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const usuario = await Usuario.create({ nombre, correo });

    // Emitir evento con el hash de la contraseña
    await redis.xadd(
      'eventos', '*',
      'tipo', 'usuario_registrado',
      'correo', correo,
      'passwordHash', passwordHash
    );

    res.status(201).json({ mensaje: 'Usuario registrado', usuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, async () => {
  await sequelize.sync();
  console.log('Servicio Registro de Usuario en puerto 3001');
});


