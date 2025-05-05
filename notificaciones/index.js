const Redis = require('ioredis');
const redis = new Redis({ host: 'redis', port: 6379 });

async function procesarEventos() {
  console.log('📨 Esperando eventos de solicitudes-permiso...');

  let lastId = '$';

  while (true) {
    const result = await redis.xread('BLOCK', 0, 'STREAMS', 'solicitudes-permiso', lastId);
    if (result) {
      const [_, eventos] = result[0];
      for (const [id, datos] of eventos) {
        const data = {};
        for (let i = 0; i < datos.length; i += 2) {
          data[datos[i]] = datos[i + 1];
        }

        console.log(`📥 Evento recibido: acción=${data.accion} expediente=${data.expedienteId}`);
        console.log(`➡ Se envía solicitud de permiso para expediente ${data.expedienteId} (acción: ${data.accion})`);

        lastId = id;
      }
    }
  }
}

async function escucharCitas() {
  console.log('📡 Esperando eventos de cita-creada...');

  let lastId = '$';

  while (true) {
    const result = await redis.xread('BLOCK', 0, 'STREAMS', 'cita-creada', lastId);
    if (result) {
      const [_, eventos] = result[0];

      for (const [id, datos] of eventos) {
        const cita = {};
        for (let i = 0; i < datos.length; i += 2) {
          cita[datos[i]] = datos[i + 1];
        }

        console.log(`📅 Nueva cita creada para ${cita.paciente} con ${cita.medico} el ${cita.fecha} a las ${cita.hora}`);
        console.log(`✅ Notificación enviada a paciente: ${cita.paciente}`);

        lastId = id;
      }
    }
  }
}

async function escucharDocumentos() {
  console.log('📂 Esperando eventos de documento-subido...');

  let lastId = '0';

  while (true) {
    const result = await redis.xread('BLOCK', 0, 'STREAMS', 'eventos', lastId);
    if (result) {
      const [_, eventos] = result[0];

      for (const [id, datos] of eventos) {
        const evento = {};
        for (let i = 0; i < datos.length; i += 2) {
          evento[datos[i]] = datos[i + 1];
        }

        if (evento.tipo === 'documento-subido') {
          console.log(`📄 Documento subido: "${evento.nombre}" del paciente ${evento.pacienteId}`);
          console.log(`✅ Notificación enviada para documento ${evento.documentoId}`);
        }

        lastId = id;
      }
    }
  }
}

// Ejecutar todos los listeners
escucharCitas();
procesarEventos();
escucharDocumentos();


