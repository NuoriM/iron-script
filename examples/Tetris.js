const config = {
  idJogador: null,
  posInicialX: 23,
  posInicialY: 2,
  posFinalX: 34,
  posFinalY: 23,
  pecaAtual: null,
  posAtualX: 0,
  posAtualY: 0,
  pontuacao: 0,
  fimDeJogo: false,
  processando: false,
  pecaId: 0, // ID único incrementado a cada nova peça
};

const LARGURA = config.posFinalX - config.posInicialX + 1; // 12
const ALTURA = config.posFinalY - config.posInicialY + 1;  // 22

let furnis = [];

const inicializarFurnis = (x1, x2, y1, y2) => {
  furnis = [];
  for (let y = y1; y <= y2; y++) {
    const linha = [];
    for (let x = x1; x <= x2; x++) {
      const lista = Room.getFurniByTile(x, y);
      linha.push(lista && lista.length > 0 ? lista[0] : null);
    }
    furnis.push(linha);
  }
};

// Matriz lógica: só paletas (números)
let jogo = [];

const inicializarJogo = () => {
  jogo = [];
  for (let y = 0; y < ALTURA; y++) {
    jogo.push(new Array(LARGURA).fill(0));
  }
};

const tetrominos = {
  I: {
    formato: [0x00, 0xF0, 0x00, 0x00],
    paleta: 1,
  },
  O: {
    formato: [0xC0, 0xC0],
    paleta: 2,
  },
  T: {
    formato: [0x40, 0xE0, 0x00],
    paleta: 3,
  },
  S: {
    formato: [0x60, 0xC0, 0x00],
    paleta: 4,
  },
  Z: {
    formato: [0xC0, 0x60, 0x00],
    paleta: 5,
  },
  J: {
    formato: [0x80, 0xE0, 0x00],
    paleta: 6,
  },
  L: {
    formato: [0x20, 0xE0, 0x00],
    paleta: 5,
  },
};

const paraGrid = (formato, tamanho) => {
  if (!Array.isArray(formato)) return [];

  return formato.map(byte =>
    Array.from({ length: tamanho }, (_, i) =>
      (byte & (0x80 >> i)) ? 1 : 0
    )
  );
};

const verificarColisao = (formato, px, py) => {
  for (let y = 0; y < formato.length; y++) {
    for (let x = 0; x < formato[y].length; x++) {
      if (formato[y][x] === 0) continue;

      const bx = px + x;
      const by = py + y;

      if (bx < 0 || bx >= LARGURA || by >= ALTURA) return true;
      if (by < 0) continue;
      if (jogo[by][bx] !== 0) return true;
    }
  }
  return false;
};

const aplicarEmCadaPixel = (formato, posX, posY, callback) => {
  for (let y = 0; y < formato.length; y++) {
    for (let x = 0; x < formato[y].length; x++) {
      if (formato[y][x] === 1) {
        const by = posY + y;
        const bx = posX + x;

        if (by >= 0 && by < ALTURA && bx >= 0 && bx < LARGURA) {
          callback(bx, by);
        }
      }
    }
  }
};

const criarPeca = () => {
  const keys = Object.keys(tetrominos);
  const tipo = keys[Math.floor(Math.random() * keys.length)];
  const base = tetrominos[tipo];
  const baseTamanho = base.formato.length;

  config.pecaId++;
  config.pecaAtual = {
    formato: paraGrid(base.formato, baseTamanho),
    paleta: base.paleta,
    id: config.pecaId,
  };

  config.posAtualX = Math.floor(
    (LARGURA - config.pecaAtual.formato[0].length) / 2,
  );
  config.posAtualY = 0;

  if (verificarColisao(config.pecaAtual.formato, config.posAtualX, config.posAtualY)) {
    finalizarJogo(config.idJogador, "Fim de jogo! Sua pontuação:");
  }
};

const fixarPeca = () => {
  const { formato, paleta } = config.pecaAtual;

  aplicarEmCadaPixel(formato, config.posAtualX, config.posAtualY, (bx, by) => {
    jogo[by][bx] = paleta;
  });
};

const rotacionar = (formato) => {
  const tamanho = formato.length;
  const rotacionado = Array.from({ length: tamanho }, () => new Array(tamanho).fill(0));

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (formato[y][x] === 1) {
        rotacionado[x][tamanho - 1 - y] = formato[y][x];
      }
    }
  }

  return rotacionado;
};

const limparLinhas = () => {
  let linhasLimpas = 0;
  for (let y = ALTURA - 1; y >= 0; y--) {
    if (jogo[y].every((paleta) => paleta !== 0)) {
      jogo.splice(y, 1);
      jogo.unshift(new Array(LARGURA).fill(0));
      linhasLimpas++;
      y++;
    }
  }
  if (linhasLimpas > 0) {
    config.pontuacao += linhasLimpas * 100
    reiniciarLoop();
  };
  return linhasLimpas;
};

const renderizar = () => {
  for (let y = 0; y < ALTURA; y++) {
    for (let x = 0; x < LARGURA; x++) {
      const estadoAtual = jogo[y][x];

      if (furnis[y][x] && String(furnis[y][x].getState()) !== String(estadoAtual)) {
        furnis[y][x].setState(estadoAtual);
      }
    }
  }

  if (config.pecaAtual) {
    const { formato, paleta } = config.pecaAtual;

    aplicarEmCadaPixel(formato, config.posAtualX, config.posAtualY, (bx, by) => {
      if (furnis[by][bx] && String(furnis[by][bx].getState()) !== String(paleta)) {
        furnis[by][bx].setState(paleta);
      }
    });
  }
};

let loopTask = null;

const tick = () => {
  if (config.fimDeJogo || config.processando) return;

  config.processando = true;

  const idAoEntrar = config.pecaAtual.id;

  const novoY = config.posAtualY + 1;
  if (verificarColisao(config.pecaAtual.formato, config.posAtualX, novoY)) {
    if (config.pecaAtual.id === idAoEntrar) {
      fixarPeca();
      limparLinhas();
      criarPeca();
    }
    if (config.fimDeJogo) {
      Delay.cancel(loopTask);

      finalizarJogo(config.idJogador, "Fim de jogo! Sua pontuação:");
      return;
    }
  } else {
    if (config.pecaAtual.id === idAoEntrar) {
      config.posAtualY = novoY;
    }
  }

  renderizar();
  config.processando = false;
};

const obterVelocidade = () => {
  const fase = Math.floor(config.pontuacao / 500);
  return Math.max(1, 7 - fase);
};

const reiniciarLoop = () => {
  if (loopTask) Delay.cancel(loopTask);
  loopTask = Delay.interval(tick, obterVelocidade());
};

Events.on("keyDown", (user, keyCode) => {
  if (user.getId() !== config.idJogador) return

  if (config.fimDeJogo || !config.pecaAtual || config.processando) return;

  config.processando = true;

  if (keyCode === 6) {
    config.posAtualX--;
    if (verificarColisao(config.pecaAtual.formato, config.posAtualX, config.posAtualY))
      config.posAtualX++;
  } else if (keyCode === 7) {
    config.posAtualX++;
    if (verificarColisao(config.pecaAtual.formato, config.posAtualX, config.posAtualY))
      config.posAtualX--;
  } else if (keyCode === 5) {
    const novoY = config.posAtualY + 1;
    if (verificarColisao(config.pecaAtual.formato, config.posAtualX, novoY)) {
      fixarPeca();
      limparLinhas();
      criarPeca();
      if (config.fimDeJogo) {
        Delay.cancel(loopTask);
        renderizar();
        config.processando = false;
        return;
      }
    } else {
      config.posAtualY = novoY;
    }
  } else if (keyCode === 4) {
    const rotacionada = rotacionar(config.pecaAtual.formato);
    if (!verificarColisao(rotacionada, config.posAtualX, config.posAtualY))
      config.pecaAtual.formato = rotacionada;
  }

  renderizar();
  config.processando = false;
});

const limparTela = () => {
  for (let y = 0; y < ALTURA; y++) {
    for (let x = 0; x < LARGURA; x++) {
      if (furnis[y][x]) {
        furnis[y][x].setState(0);
      }
    }
  }
};

const finalizarJogo = (idJogador, message) => {
  const jogador = Room.getPlayerById(idJogador)
  if (idJogador) jogador.message(message + " " + config.pontuacao);
  Highscores.add(jogador, config.pontuacao);
  Engine.log("Jogo encerrado. Pontuação final: " + config.pontuacao);
  config.fimDeJogo = true;
  config.idJogador = null;

  if (loopTask) {
    Delay.cancel(loopTask);
    loopTask = null;
  }

  inicializarJogo();
  limparTela();
};

Events.on("walk", (entity) => {
  if (config.idJogador === null) return;
  if (entity.getId() !== config.idJogador) return;

  if (entity.getX() !== 23 || entity.getY() !== 25) {
    config.fimDeJogo = true;
    config.idJogador = null;

    if (loopTask) {
      Delay.cancel(loopTask);
      loopTask = null;
    }

    inicializarJogo();
    limparTela();
    finalizarJogo(entity.getId(), "Você saiu da área de jogo! Jogo encerrado. Sua pontuação:");
  }
});

Events.on("userLeave", (id, username) => {
  if (id !== config.idJogador) return;

  config.fimDeJogo = true;
  config.idJogador = null;

  if (loopTask) {
    Delay.cancel(loopTask);
    loopTask = null;
  }

  inicializarJogo();
  limparTela();
});

Commands.register(":limparPlacar", (user) => {
  if (!user.hasRank(8) || !user.hasRank(9)) return;
  Engine.log("Placar de highscores limpo!");
});

Commands.register(":iniciar", (user) => {
  if (user.getX() === 23 && user.getY() === 25) {
    config.idJogador = user.getId();
  }
  if (config.idJogador !== user.getId()) {
    user.message("Aguarde sua vez para jogar!");
    return;
  }

  if (loopTask) Delay.cancel(loopTask);

  config.fimDeJogo = false;
  config.pontuacao = 0;
  config.pecaAtual = null;
  config.processando = false;
  config.pecaId = 0;

  inicializarFurnis(
    config.posInicialX,
    config.posFinalX,
    config.posInicialY,
    config.posFinalY,
  );
  inicializarJogo();

  criarPeca();
  renderizar();

  // loopTask = Delay.interval(tick, 8);
  reiniciarLoop();
});
