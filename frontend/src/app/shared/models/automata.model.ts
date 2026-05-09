/**
 * Representa la definición formal de un autómata finito.
 * Contiene la quíntupla M = (Q, Σ, δ, q0, F).
 */
export interface Automata {
    states: string[];
    alphabet: string[];
    transitions: Record<string, Record<string, string | string[]>>;
    initial: string;
    accepting: string[];
  }
  
  /**
   * Representa un paso individual en la traza de ejecución
   * del autómata al procesar una cadena de entrada.
   */
  export interface SimulationStep {
    symbol: string | null;
    activeStates: string[];
  }
  
  /**
   * Encapsula el resultado completo de simular una cadena
   * sobre un autómata finito, incluyendo traza y veredicto.
   */
  export interface SimulationResult {
    input: string[];
    accepted: boolean;
    steps: SimulationStep[];
    finalStates: string[];
    definition: Automata;
  }
  
  /**
   * Encapsula el resultado de convertir un AFND a AFD
   * mediante construcción de subconjuntos.
   */
  export interface ConversionResult {
    afd: Automata;
    subsetTable: Record<string, string>[];
  }
  
  /**
   * Encapsula el resultado de minimizar un AFD,
   * incluyendo la tabla de equivalencia y los grupos fusionados.
   */
  export interface MinimizationResult {
    minimizedAfd: Automata;
    equivalenceTable: Record<string, any>[];
    equivalenceGroups: string[][];
  }
  
  /**
   * Resultado de verificar equivalencia entre AFND, AFD y AFD minimizado
   * para una cadena de prueba específica.
   */
  export interface VerificationRow {
    input: string[];
    afnd: boolean;
    afd: boolean;
    minimized: boolean;
    equivalent: boolean;
  }