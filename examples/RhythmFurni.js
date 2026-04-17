const TICK_MS = 500;

const musicas = [
  { id: 1, name: "Musica 1", tempoMS: 5000 },
  { id: 2, name: "Musica 2", tempoMS: 3000 },
];

// Formato: "TECLA:TEMPO_SEGURADO_MS:TEMPO_PROXIMO_MS"
// TEMPO_SEGURADO = duração do trajeto (Y_START -> Y_END)
// TEMPO_PROXIMO  = delay até a próxima nota começar
const notas = [
  {
    idMusica: 1,
    notas: "A:100:1000 S:3000:1000 J:3000:1000 K:3000:1000 L:3000:1000",
  },
  {
    idMusica: 2,
    notas: "A:3000:1000 S:3000:1000 J:3000:1000 K:3000:1000 L:3000:1000",
  },
];

const keyToFurni = {
  A: { id: 477653186, x: 15 },
  S: { id: 477653166, x: 16 },
  J: { id: 477653188, x: 17 },
  K: { id: 477653189, x: 18 },
  L: { id: 477653190, x: 19 },
};

const Y_START = 2;
const Y_END = 14;
const Z = 0.0;
const ROT = 0;
const TOTAL_Y_STEPS = Y_END - Y_START;

const HOLD_END_TICKS = 2;

let playSession = 0;
const keyFreeTick = {};

function msToTicks(ms) {
  return Math.max(1, Math.round(ms / TICK_MS));
}

function scheduleMove(key, startTick, tempoSeguradoMS, sessionId) {
  const furniData = keyToFurni[key];
  if (!furniData) return;

  const trajTicks = Math.max(TOTAL_Y_STEPS, msToTicks(tempoSeguradoMS));
  const safeStart = Math.max(startTick, keyFreeTick[key] ?? 0);
  keyFreeTick[key] = safeStart + trajTicks + HOLD_END_TICKS + 2;

  Delay.wait(() => {
    if (sessionId !== playSession) return;
    const f = Room.getFurniById(furniData.id);
    if (f) f.move(furniData.x, Y_START, Z, ROT, true, true);
  }, safeStart);

  for (let step = 1; step <= TOTAL_Y_STEPS; step++) {
    const tickOffset = Math.floor((step * trajTicks) / TOTAL_Y_STEPS);
    const s = step;
    Delay.wait(() => {
      if (sessionId !== playSession) return;
      const f = Room.getFurniById(furniData.id);
      if (f) f.move(furniData.x, Y_START + s, Z, ROT, true, true);
    }, safeStart + tickOffset);
  }

  Delay.wait(
    () => {
      if (sessionId !== playSession) return;
      const f = Room.getFurniById(furniData.id);
      if (f) f.move(furniData.x, Y_START, Z, ROT, true, true);
    },
    safeStart + trajTicks + HOLD_END_TICKS + 1,
  );
}

function parseNotas(notasStr, sessionId) {
  const tokens = notasStr.match(/\|[^|]+\|:\d+:\d+|\S+/g) || [];

  let offsetTicks = 0;

  for (const token of tokens) {
    if (token.startsWith("|")) {
      const match = token.match(/\|([^|]+)\|:(\d+):(\d+)/);
      if (!match) continue;

      const keys = match[1].trim().split(" ");
      const tempoSeguradoMS = Number(match[2]);
      const tempoProximoMS = Number(match[3]);

      for (const key of keys) {
        scheduleMove(key.trim(), offsetTicks, tempoSeguradoMS, sessionId);
      }

      offsetTicks += msToTicks(tempoProximoMS);
    } else {
      const parts = token.split(":");
      if (parts.length < 3) continue;

      const key = parts[0];
      const tempoSeguradoMS = Number(parts[1]);
      const tempoProximoMS = Number(parts[2]);

      scheduleMove(key, offsetTicks, tempoSeguradoMS, sessionId);
      offsetTicks += msToTicks(tempoProximoMS);
    }
  }
}

function playMusic(idMusica) {
  const musica = musicas.find((m) => m.id === idMusica);
  if (!musica) {
    Engine.log("Música não encontrada");
    return;
  }

  const notaObj = notas.find((n) => n.idMusica === idMusica);
  if (!notaObj) {
    Engine.log("Notas não encontradas");
    return;
  }

  playSession++;
  const sid = playSession;
  for (const k of Object.keys(keyToFurni)) delete keyFreeTick[k];
  parseNotas(notaObj.notas, sid);
  Engine.log(`Tocando: ${musica.name}`);
}

Commands.register(":teste", () => {
  const f = Room.getFurniById(477653166);
  if (!f) {
    Engine.log("Furni não encontrado");
    return;
  }
  f.move(16, Y_START, Z, ROT, true, true);
  Engine.log(`Pos: x=${f.getX()} y=${f.getY()} z=${f.getZ()}`);
});

Commands.register(":play", () => playMusic(1));
