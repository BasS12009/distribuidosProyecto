const Redis = require('ioredis');
const redis = new Redis({ host: 'redis', port: 6379 });

async function procesarEventos() {
  console.log('Esperando eventos de Redis Stream...');

  let lastId = '$'; // Leer solo eventos nuevos

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

        // Simula una acción, como enviar una solicitud por correo
        console.log(`➡ Se envía solicitud de permiso para expediente ${data.expedienteId} (acción: ${data.accion})`);

        lastId = id;
      }
    }
  }
}

procesarEventos();

