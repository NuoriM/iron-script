class Tetris {
  constructor() {
    this.config = {
      idJogador: null,
      posInicialX: 23,
      posInicialY: 2,
      posFinalX: 34,
      posFinalY: 23,
      pecaAtual: null,
      posAtualX: 0,
      posAtualY: 0,
      posProximaInicialX: 18,
      posProximaInicialY: 12,
      posProximaFinalX: 21,
      posProximaFinalY: 15,
      proximaPeca: null,
      furnisPontuacao: null,
      furnisLevel: null,
      pontuacao: 0,
      fimDeJogo: false,
      processando: false,
      pecaId: 0
    };

    this.LARGURA = this.config.posFinalX - this.config.posInicialX + 1;
    this.ALTURA = this.config.posFinalY - this.config.posInicialY + 1;

    this.furnis = [];
    this.proximoFurnis = []; // Furnis para mostrar a próxima peça
    this.jogo = [];
    this.loopTask = null;

    this.tetrominos = {
      I: { formato: [0x00, 0xF0, 0x00, 0x00], paleta: 1 },
      O: { formato: [0xC0, 0xC0], paleta: 2 },
      T: { formato: [0x40, 0xE0, 0x00], paleta: 3 },
      S: { formato: [0x60, 0xC0, 0x00], paleta: 4 },
      Z: { formato: [0xC0, 0x60, 0x00], paleta: 5 },
      J: { formato: [0x80, 0xE0, 0x00], paleta: 6 },
      L: { formato: [0x20, 0xE0, 0x00], paleta: 5 }
    };
  }

  inicializarFurnis() {
    this.furnis = [];
    for (let y = this.config.posInicialY; y <= this.config.posFinalY; y++) {
      const linha = [];
      for (let x = this.config.posInicialX; x <= this.config.posFinalX; x++) {
        const lista = Room.getFurniByTile(x, y);
        linha.push(lista && lista.length > 0 ? lista[0] : null);
      }
      this.furnis.push(linha);
    }

    this.proximoFurnis = [];
    for (let y = this.config.posProximaInicialY; y <= this.config.posProximaFinalY; y++) {
      const linha = [];
      for (let x = this.config.posProximaInicialX; x <= this.config.posProximaFinalX; x++) {
        const lista = Room.getFurniByTile(x, y);
        linha.push(lista && lista.length > 0 ? lista[0] : null);
      }
      this.proximoFurnis.push(linha);
    }
  }

  inicializarDisplays() {
    this.scoreFurnis = [];
    this.levelFurnis = [];

    // Score: X=36, de Y=17 (topo) até Y=12 (base)
    for (let y = 17; y >= 12; y--) {
      const lista = Room.getFurniByTile(36, y);
      this.scoreFurnis.push(lista && lista.length > 0 ? lista[0] : null);
    }

    // Level: X=38, de Y=17 (topo) até Y=12 (base)
    for (let y = 17; y >= 12; y--) {
      const lista = Room.getFurniByTile(38, y);
      this.levelFurnis.push(lista && lista.length > 0 ? lista[0] : null);
    }
  }

  atualizarScore() {
    if (!this.scoreFurnis.length) return;

    let pontos = this.config.pontuacao.toString().padStart(6, '0');

    for (let i = 0; i < 6; i++) {
      const furni = this.scoreFurnis[i];
      if (furni) {
        furni.setState(parseInt(pontos[i]));
      }
    }
  }

  atualizarLevel() {
    if (!this.levelFurnis.length) return;

    const fase = Math.floor(this.config.pontuacao / 500) + 1;
    let levelStr = fase.toString().padStart(2, '0');

    for (let i = 0; i < 6; i++) {
      const furni = this.levelFurnis[i];
      if (furni) {
        const digito = (i < 4) ? 0 : parseInt(levelStr[i - 4]);
        furni.setState(digito);
      }
    }
  }

  inicializarJogo() {
    this.jogo = [];
    for (let y = 0; y < this.ALTURA; y++) {
      this.jogo.push(new Array(this.LARGURA).fill(0));
    }
  }

  paraGrid(formato, tamanho) {
    if (!Array.isArray(formato)) return [];
    return formato.map(byte =>
      Array.from({ length: tamanho }, (_, i) => (byte & (0x80 >> i)) ? 1 : 0)
    );
  }

  verificarColisao(formato, px, py) {
    for (let y = 0; y < formato.length; y++) {
      for (let x = 0; x < formato[y].length; x++) {
        if (formato[y][x] === 0) continue;
        const bx = px + x;
        const by = py + y;
        if (bx < 0 || bx >= this.LARGURA || by >= this.ALTURA) return true;
        if (by < 0) continue;
        if (this.jogo[by][bx] !== 0) return true;
      }
    }
    return false;
  }

  aplicarEmCadaPixel(formato, posX, posY, callback) {
    for (let y = 0; y < formato.length; y++) {
      for (let x = 0; x < formato[y].length; x++) {
        if (formato[y][x] === 1) {
          const by = posY + y;
          const bx = posX + x;
          if (by >= 0 && by < this.ALTURA && bx >= 0 && bx < this.LARGURA) {
            callback(bx, by);
          }
        }
      }
    }
  }

  gerarPecaAleatoria() {
    const keys = Object.keys(this.tetrominos);
    const tipo = keys[Math.floor(Math.random() * keys.length)];
    const base = this.tetrominos[tipo];
    return {
      formato: this.paraGrid(base.formato, base.formato.length),
      paleta: base.paleta,
      id: ++this.config.pecaId
    };
  }

  criarPeca() {
    if (this.config.fimDeJogo) return;

    if (!this.config.proximaPeca) {
      this.config.proximaPeca = this.gerarPecaAleatoria();
    }

    this.config.pecaAtual = this.config.proximaPeca;
    this.config.proximaPeca = this.gerarPecaAleatoria();

    this.config.posAtualX = Math.floor((this.LARGURA - this.config.pecaAtual.formato[0].length) / 2);
    this.config.posAtualY = 0;

    if (this.verificarColisao(this.config.pecaAtual.formato, this.config.posAtualX, this.config.posAtualY)) {
      this.finalizarJogo(this.config.idJogador, "Fim de jogo! Sua pontuação:");
    }
    this.renderizarProximaPeca();
  }


  fixarPeca() {
    const { formato, paleta } = this.config.pecaAtual;
    this.aplicarEmCadaPixel(formato, this.config.posAtualX, this.config.posAtualY, (bx, by) => {
      this.jogo[by][bx] = paleta;
    });
  }

  rotacionar(formato) {
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
  }

  limparLinhas() {
    let linhasLimpas = 0;
    for (let y = this.ALTURA - 1; y >= 0; y--) {
      if (this.jogo[y].every(paleta => paleta !== 0)) {
        this.jogo.splice(y, 1);
        this.jogo.unshift(new Array(this.LARGURA).fill(0));
        linhasLimpas++;
        y++;
      }
    }
    if (linhasLimpas > 0) {
      this.config.pontuacao += linhasLimpas * 100;
      this.atualizarScore();
      this.atualizarLevel();
      this.reiniciarLoop();
    }
    return linhasLimpas;
  }

  renderizar() {
    for (let y = 0; y < this.ALTURA; y++) {
      for (let x = 0; x < this.LARGURA; x++) {
        const estadoAtual = this.jogo[y][x];
        if (this.furnis[y][x] && String(this.furnis[y][x].getState()) !== String(estadoAtual)) {
          this.furnis[y][x].setState(estadoAtual);
        }
      }
    }

    if (this.config.pecaAtual && !this.config.fimDeJogo) {
      const { formato, paleta } = this.config.pecaAtual;
      this.aplicarEmCadaPixel(formato, this.config.posAtualX, this.config.posAtualY, (bx, by) => {
        if (this.furnis[by][bx] && String(this.furnis[by][bx].getState()) !== String(paleta)) {
          this.furnis[by][bx].setState(paleta);
        }
      });
    }
  }

  renderizarProximaPeca() {
    if (!this.config.proximaPeca || this.config.fimDeJogo) return;

    const { formato, paleta } = this.config.proximaPeca;

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (this.proximoFurnis[y][x]) {
          this.proximoFurnis[y][x].setState(0);
        }
      }
    }

    this.aplicarEmCadaPixel(formato, 0, 0, (bx, by) => {
      if (this.proximoFurnis[by] && this.proximoFurnis[by][bx]) {
        this.proximoFurnis[by][bx].setState(paleta);
      }
    });
  }

  tick() {
    if (this.config.fimDeJogo || this.config.processando || !this.config.pecaAtual) return;
    this.config.processando = true;

    const idAoEntrar = this.config.pecaAtual.id;
    const novoY = this.config.posAtualY + 1;

    if (this.verificarColisao(this.config.pecaAtual.formato, this.config.posAtualX, novoY)) {
      if (this.config.pecaAtual.id === idAoEntrar) {
        this.fixarPeca();
        this.limparLinhas();
        this.criarPeca();
      }
      if (this.config.fimDeJogo) {
        this.config.processando = false;
        this.finalizarJogo(this.config.idJogador, "Fim de jogo! Sua pontuação:");
        return;
      }
    } else {
      if (this.config.pecaAtual.id === idAoEntrar) {
        this.config.posAtualY = novoY;
      }
    }

    this.renderizar();
    this.config.processando = false;
  }

  obterVelocidade() {
    const fase = Math.floor(this.config.pontuacao / 500);
    return Math.max(1, 7 - fase);
  }

  reiniciarLoop() {
    if (this.loopTask) Delay.cancel(this.loopTask);
    this.loopTask = Delay.interval(() => this.tick(), this.obterVelocidade());
  }

  limparTela() {
    for (let y = 0; y < this.ALTURA; y++) {
      for (let x = 0; x < this.LARGURA; x++) {
        if (this.furnis[y][x]) this.furnis[y][x].setState(0);
      }
    }

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (this.proximoFurnis[y] && this.proximoFurnis[y][x]) this.proximoFurnis[y][x].setState(0);
      }
    }
  }

  finalizarJogo(idJogador, message) {
    const jogador = Room.getPlayerById(idJogador);
    if (idJogador && jogador) jogador.message(message + " " + this.config.pontuacao);
    if (jogador) Highscores.add(jogador, this.config.pontuacao);

    Engine.log("Jogo encerrado. Pontuação final: " + this.config.pontuacao);
    this.config.fimDeJogo = true;
    this.config.idJogador = null;

    if (this.loopTask) {
      Delay.cancel(this.loopTask);
      this.loopTask = null;
    }

    this.inicializarJogo();
    this.limparTela();
  }

  handleKeyDown(user, keyCode) {
    if (user.getId() !== this.config.idJogador) return;
    if (this.config.fimDeJogo || !this.config.pecaAtual || this.config.processando) return;

    this.config.processando = true;

    if (keyCode === 6) {
      this.config.posAtualX--;
      if (this.verificarColisao(this.config.pecaAtual.formato, this.config.posAtualX, this.config.posAtualY))
        this.config.posAtualX++;
    } else if (keyCode === 7) {
      this.config.posAtualX++;
      if (this.verificarColisao(this.config.pecaAtual.formato, this.config.posAtualX, this.config.posAtualY))
        this.config.posAtualX--;
    } else if (keyCode === 5) {
      const novoY = this.config.posAtualY + 1;
      // this.atualizarScore();
      // this.atualizarLevel();
      if (this.verificarColisao(this.config.pecaAtual.formato, this.config.posAtualX, novoY)) {
        this.fixarPeca();
        this.limparLinhas();
        this.criarPeca();
        if (this.config.fimDeJogo) {
          if (this.loopTask) Delay.cancel(this.loopTask);
          this.renderizar();
          this.config.processando = false;
          return;
        }
      } else {
        this.config.posAtualY = novoY;
      }
    } else if (keyCode === 4) {
      const rotacionada = this.rotacionar(this.config.pecaAtual.formato);
      if (!this.verificarColisao(rotacionada, this.config.posAtualX, this.config.posAtualY))
        this.config.pecaAtual.formato = rotacionada;
    }

    this.renderizar();
    this.config.processando = false;
  }

  handleWalk(entity) {
    if (this.config.idJogador === null || entity.getId() !== this.config.idJogador) return;
    if (entity.getX() !== 23 || entity.getY() !== 25) {
      this.finalizarJogo(entity.getId(), "Você saiu da área de jogo! Jogo encerrado. Sua pontuação:");
    }
  }

  handleUserLeave(id) {
    if (id !== this.config.idJogador) return;
    this.finalizarJogo(id, "Jogador saiu.");
  }

  iniciar(user) {
    if (user.getX() === 23 && user.getY() === 25) {
      this.config.idJogador = user.getId();
    }

    if (this.config.idJogador !== user.getId()) {
      user.message("Aguarde sua vez para jogar!");
      return;
    }

    if (this.loopTask) Delay.cancel(this.loopTask);

    this.config.fimDeJogo = false;
    this.config.pontuacao = 0;
    this.config.pecaAtual = null;
    this.config.proximaPeca = null;
    this.config.processando = false;
    this.config.pecaId = 0;

    this.inicializarFurnis();
    this.inicializarDisplays();
    this.inicializarJogo();
    this.criarPeca();
    this.renderizar();
    this.renderizarProximaPeca();
    this.atualizarScore();
    this.atualizarLevel();

    this.reiniciarLoop();
  }
}

const jogoTetris = new Tetris();

Events.on("keyDown", (user, keyCode) => jogoTetris.handleKeyDown(user, keyCode));
Events.on("walk", (entity) => jogoTetris.handleWalk(entity));
Events.on("userLeave", (id) => jogoTetris.handleUserLeave(id));

Commands.register(":iniciar", (user) => jogoTetris.iniciar(user));
Commands.register(":limparPlacar", (user) => {
  if (user.hasRank(8) || user.hasRank(9)) Engine.log("Placar de highscores limpo!");
});
