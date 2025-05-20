const Redis = require('ioredis');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6380,
  tls: {
    ca: fs.readFileSync('/certs/ca.crt'),
    cert: fs.readFileSync('/certs/redis.crt'),
    key: fs.readFileSync('/certs/redis.key'),
    rejectUnauthorized: false
  }
});

async function verificarPermiso(expedienteId) {
    const requestId = uuidv4();

    // Emitir evento al stream
    await redis.xadd('verificacion-permisos', '*',
        'tipoEvento', 'verificar-permiso',
        'requestId', requestId,
        'expedienteId', expedienteId
    );

    // Esperar la respuesta desde el stream
    const timeoutMs = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const response = await redis.xread(
            'BLOCK', 1000,
            'STREAMS', 'respuesta-permisos', '0'
        );

        if (response) {
            const events = response[0][1];
            for (const [_, fields] of events) {
                const data = {};
                for (let i = 0; i < fields.length; i += 2) {
                    data[fields[i]] = fields[i + 1];
                }

                if (data.requestId === requestId) {
                    return data.permitido === 'true';
                }
            }
        }
    }

    console.log("Tiempo de espera agotado sin respuesta del servicio de permisos.");
    return false;
}

module.exports = { verificarPermiso };

