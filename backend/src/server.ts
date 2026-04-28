import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma } from './config/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log('================================================');
  console.log('  Sportify API demarree');
  console.log('  http://localhost:' + env.port);
  console.log('  Docs : http://localhost:' + env.port + '/api/docs');
  console.log('  Env  : ' + env.nodeEnv);
  console.log('================================================');
});

async function shutdown(signal: string) {
  console.log('\n[' + signal + '] arret en cours...');
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
