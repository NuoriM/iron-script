/**
 * Constante responsável por gerenciar os comandos.
 * @category Classes
 * @author Arthur L
 * @author Gabriel T
 */
declare namespace Commands {
  /**
   * Callback de execução de comandos.
   * @category Tipos
   * @param user - Usuário que executou o comando.
   * @param message - Mensagem enviada pelo usuário.
   */
  type CommandCallback = (user: any, message: string) => void;

  /**
   * Registra um comando.
   * @example
   * Commands.register(':comando', true, (entity, text) => {
   *      // Comando é executado!
   * });
   *
   * @param text - Comando a ser utilizado.
   * @param needStartText - Define se a mensagem deverá ser iniciada com o comando.
   * @param callback - Callback executado ao comando ser utilizado.
   */
  function register(text: string, needStartText: boolean, callback: CommandCallback): void;

  /**
   * Registra um comando.
   * @example
   * Commands.register(':comando', (entity, text) => {
   *      // Comando é executado!
   * });
   *
   * @param text - Comando a ser utilizado.
   * @param callback - Callback executado ao comando ser utilizado.
   */
  function register(text: string, callback: CommandCallback): void;
}
