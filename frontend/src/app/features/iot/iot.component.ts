import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomataService } from '../../core/services/automata.service';
import {
  Automata,
  SimulationResult,
  ConversionResult,
  MinimizationResult,
  VerificationRow
} from '../../shared/models/automata.model';

/**
 * Componente principal del ejercicio de Telemetría IoT.
 * Gestiona las cuatro vistas: AFND original, AFD por subconjuntos,
 * AFD minimizado y verificación de equivalencia entre los tres autómatas.
 */
@Component({
  selector: 'app-iot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './iot.component.html',
  styleUrl: './iot.component.css'
})
export class IotComponent implements OnInit {

  /** Tab activo actualmente en la interfaz. */
  activeTab = 'afnd';

  /** Cadena de entrada sin procesar ingresada por el usuario. */
  inputRaw = '';

  /** Resultado de simular la cadena sobre el AFND. */
  afndResult: SimulationResult | null = null;

  /** Resultado de simular la cadena sobre el AFD por subconjuntos. */
  afdResult: SimulationResult | null = null;

  /** Resultado de la conversión AFND → AFD por subconjuntos. */
  conversionResult: ConversionResult | null = null;

  /** Resultado de la minimización del AFD. */
  minimizationResult: MinimizationResult | null = null;

  /** Resultado de la verificación de equivalencia entre los tres autómatas. */
  verificationResult: VerificationRow[] | null = null;

  /** Indica si todos los autómatas son equivalentes para todas las cadenas. */
  allEquivalent = false;

  /** Índice del paso actual en la animación del AFND. */
  afndCurrentStepIndex = -1;

  /** Paso actual de la animación del AFND. */
  afndCurrentStep: any = null;

  /** Índice del paso actual en la animación del AFD. */
  afdCurrentStepIndex = -1;

  /** Paso actual de la animación del AFD. */
  afdCurrentStep: any = null;

  /** Ancho del SVG del AFND calculado según el número de estados. */
  svgWidth = 600;

  /** Ancho del SVG del AFD calculado según el número de estados. */
  afdSvgWidth = 750;

  /** Aristas calculadas para el diagrama dinámico del AFD. */
  afdEdges: { from: string; to: string; label: string }[] = [];

  /** Estados principales del AFD sin incluir qE. */
  mainAfdStates: string[] = [];

  /** Coordenada X central del estado trampa qE. */
  afdTrapX = 400;

  /** Índice del paso actual en la animación del AFD minimizado. */
  minCurrentStepIndex = -1;

  /** Paso actual de la animación del AFD minimizado. */
  minCurrentStep: any = null;

  /** Resultado de simular la cadena sobre el AFD minimizado. */
  minResult: SimulationResult | null = null;

  /**
   * Definición formal del AFND de Telemetría IoT.
   * Patrón reconocido: HDR (TEMP | HUM)* CRC
   */
  afnd: Automata = {
    states: ['q0', 'q1', 'q2', 'q3'],
    alphabet: ['HDR', 'TEMP', 'HUM', 'CRC'],
    transitions: {
      'q0': { 'HDR': ['q1'] },
      'q1': { 'TEMP': ['q1', 'q2'], 'HUM': ['q1', 'q2'] },
      'q2': { 'CRC': ['q3'] },
      'q3': {}
    },
    initial: 'q0',
    accepting: ['q3']
  };

  /** Cadenas de prueba de ejemplo para el ejercicio. */
  examples = [
    ['HDR', 'CRC'],
    ['HDR', 'TEMP', 'CRC'],
    ['HDR', 'HUM', 'TEMP', 'CRC'],
    ['HDR', 'TEMP']
  ];

  /**
   * Tipos de cadenas de prueba para mostrar en la tabla de verificación.
   * Clasifica cada cadena según su longitud y características.
   */
  testStringTypes = [
    'Vacía', 'Corta', 'Corta', 'Corta',
    'Corta', 'Corta', 'Mediana', 'Mediana',
    'Frontera', 'Mediana', 'Mediana', 'Mediana',
    'Mediana', 'Larga', 'Frontera', 'Frontera',
    'Larga', 'Larga', 'Frontera', 'Larga'
  ];

  /**
   * Cadenas de prueba para verificación de equivalencia.
   * Incluye cadenas vacías, cortas, medianas, largas y frontera.
   */
  testStrings: string[][] = [
    [],
    ['HDR'],
    ['CRC'],
    ['HDR', 'CRC'],
    ['HDR', 'TEMP'],
    ['HDR', 'HUM'],
    ['HDR', 'TEMP', 'CRC'],
    ['HDR', 'HUM', 'CRC'],
    ['TEMP', 'CRC'],
    ['HDR', 'TEMP', 'HUM', 'CRC'],
    ['HDR', 'HUM', 'TEMP', 'CRC'],
    ['HDR', 'TEMP', 'TEMP', 'CRC'],
    ['HDR', 'HUM', 'HUM', 'CRC'],
    ['HDR', 'TEMP', 'HUM', 'TEMP', 'CRC'],
    ['HDR', 'CRC', 'CRC'],
    ['HDR', 'HDR', 'CRC'],
    ['HDR', 'TEMP', 'HUM', 'TEMP', 'HUM', 'CRC'],
    ['HDR', 'TEMP', 'HUM', 'TEMP', 'HUM', 'TEMP', 'CRC'],
    ['CRC', 'HDR'],
    ['HDR', 'TEMP', 'HUM', 'TEMP', 'HUM', 'TEMP', 'HUM', 'CRC']
  ];

  constructor(private svc: AutomataService) {}

  /**
   * Inicializa el componente precargando la conversión y minimización
   * para que los datos estén disponibles al navegar entre tabs.
   */
  ngOnInit(): void {
    this.svgWidth = Math.max(600, this.afnd.states.length * 150);
    this.loadConversion();
  }

  /**
   * Carga la conversión AFND → AFD y encadena la minimización del resultado.
   * Construye además las aristas del diagrama SVG del AFD.
   */
  private loadConversion(): void {
    this.svc.convert(this.afnd).subscribe(result => {
      this.conversionResult = result;
      this.afdSvgWidth = Math.max(750, result.afd.states.length * 140);
      this.buildAfdEdges(result.afd);
      this.mainAfdStates = result.afd.states.filter(s => s !== 'qE');  // ← aquí
      this.afdTrapX = this.afdSvgWidth / 2;                            // ← aquí
      this.svc.minimize(result.afd).subscribe(min => {
        this.minimizationResult = min;
      });
    });
  }

  /**
   * Construye la lista de aristas para el diagrama SVG del AFD,
   * agrupando los símbolos que comparten el mismo par origen-destino.
   *
   * @param afd definición formal del AFD del que se extraen las aristas
   */
  private buildAfdEdges(afd: Automata): void {
    const map: Record<string, string[]> = {};
    for (const from of afd.states) {
      for (const sym of afd.alphabet) {
        const to = String(afd.transitions[from]?.[sym] ?? 'qE');
        const key = `${from}->${to}`;
        if (!map[key]) map[key] = [];
        map[key].push(sym);
      }
    }
    this.afdEdges = Object.entries(map).map(([key, syms]) => {
      const [from, to] = key.split('->');
      return { from, to, label: syms.join(', ') };
    });
  }

  /**
   * Activa el tab del AFD por subconjuntos y carga la conversión si es necesario.
   */
  setTabAfd(): void {
    this.activeTab = 'afd';
    if (!this.conversionResult) this.loadConversion();
  }

  /**
   * Activa el tab del AFD minimizado y carga la minimización si es necesario.
   */
  setTabMin(): void {
    this.activeTab = 'min';
    if (!this.minimizationResult && this.conversionResult) {
      this.svc.minimize(this.conversionResult.afd).subscribe(min => {
        this.minimizationResult = min;
      });
    }
  }

  /**
   * Activa el tab de verificación de equivalencia.
   */
  setTabVerify(): void {
    this.activeTab = 'verify';
  }

  /**
   * Simula la cadena ingresada sobre el AFND y activa
   * la animación paso a paso del diagrama de estados.
   */
  simulate(): void {
    const cadena = this.parseInput();
    if (!cadena) return;
    this.svc.simulateAfnd(this.afnd, cadena).subscribe(result => {
      this.afndResult = result;
      this.startAfndAnimation(result);
    });
  }

  /**
   * Simula la cadena ingresada sobre el AFD por subconjuntos
   * y activa la animación del diagrama del AFD.
   */
  simulateAfd(): void {
    if (!this.conversionResult) return;
    const cadena = this.parseInput();
    if (!cadena) return;
    this.svc.simulateAfd(this.conversionResult.afd, cadena).subscribe(result => {
      this.afdResult = result;
      this.startAfdAnimation(result);
    });
  }

  /**
   * Ejecuta la verificación de equivalencia entre los tres autómatas
   * para las 20 cadenas de prueba predefinidas.
   */
  runVerification(): void {
    if (!this.conversionResult || !this.minimizationResult) return;
    this.svc.verify(
      this.afnd,
      this.conversionResult.afd,
      this.minimizationResult.minimizedAfd,
      this.testStrings
    ).subscribe(result => {
      this.verificationResult = result;
      this.allEquivalent = result.every(r => r.equivalent);
    });
  }

  /**
   * Inicia la animación del diagrama del AFND resaltando cada estado
   * activo con un intervalo de 800ms entre pasos.
   *
   * @param result resultado de simulación con la traza de pasos
   */
  private startAfndAnimation(result: SimulationResult): void {
    this.afndCurrentStepIndex = 0;
    this.afndCurrentStep = result.steps[0];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= result.steps.length) { clearInterval(interval); return; }
      this.afndCurrentStepIndex = i;
      this.afndCurrentStep = result.steps[i];
      i++;
    }, 800);
  }

  /**
   * Inicia la animación del diagrama del AFD resaltando cada estado
   * activo con un intervalo de 800ms entre pasos.
   *
   * @param result resultado de simulación con la traza de pasos
   */
  private startAfdAnimation(result: SimulationResult): void {
    this.afdCurrentStepIndex = 0;
    this.afdCurrentStep = result.steps[0];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= result.steps.length) { clearInterval(interval); return; }
      this.afdCurrentStepIndex = i;
      this.afdCurrentStep = result.steps[i];
      i++;
    }, 800);
  }

  /**
   * Limpia los resultados y el campo de entrada del formulario.
   */
  clear(): void {
    this.inputRaw = '';
    this.afndResult = null;
    this.afdResult = null;
    this.afndCurrentStepIndex = -1;
    this.afndCurrentStep = null;
    this.afdCurrentStepIndex = -1;
    this.afdCurrentStep = null;
    this.minResult = null;
    this.minCurrentStepIndex = -1;
    this.minCurrentStep = null;
  }

  /**
   * Carga un ejemplo en el campo de entrada y lanza la simulación.
   *
   * @param example lista de símbolos del ejemplo a cargar
   */
  loadExample(example: string[]): void {
    this.inputRaw = example.join(', ');
    this.simulate();
  }

  /**
   * Parsea el campo de entrada separado por comas en una lista de símbolos.
   *
   * @returns lista de símbolos o null si el campo está vacío
   */
  private parseInput(): string[] | null {
    const cadena = this.inputRaw.split(',').map(s => s.trim()).filter(Boolean);
    return cadena.length > 0 ? cadena : null;
  }

  /**
   * Calcula la coordenada X de un estado del AFND en el diagrama SVG.
   *
   * @param index índice del estado en la lista de estados del AFND
   * @returns coordenada X en píxeles
   */
  stateX(index: number): number {
    return (this.svgWidth / (this.afnd.states.length + 1)) * (index + 1);
  }

  /**
   * Calcula la coordenada X de un estado del AFD en el diagrama SVG.
   *
   * @param index índice del estado en la lista de estados del AFD
   * @returns coordenada X en píxeles
   */
  afdStateX(index: number): number {
    const states = this.conversionResult?.afd.states ?? [];
    return (this.afdSvgWidth / (states.length + 1)) * (index + 1);
  }

  /**
   * Obtiene el índice de un estado dentro de la lista de estados del AFD.
   *
   * @param state nombre del estado a buscar
   * @returns índice del estado en la lista
   */
  afdStateIndex(state: string): number {
    return this.conversionResult?.afd.states.indexOf(state) ?? 0;
  }

  /**
   * Determina si un estado del AFND está activo en el paso actual de la animación.
   *
   * @param state nombre del estado a verificar
   * @returns true si el estado está activo en el paso actual
   */
  isAfndStateActive(state: string): boolean {
    return this.afndCurrentStep?.activeStates?.includes(state) ?? false;
  }

  /**
   * Determina si la transición entre dos estados del AFND está activa en la animación.
   *
   * @param from estado origen de la transición
   * @param to   estado destino de la transición
   * @returns true si la transición está siendo recorrida en el paso actual
   */
  isAfndEdgeActive(from: string, to: string): boolean {
    if (!this.afndCurrentStep || this.afndCurrentStepIndex < 1) return false;
    const prev = this.afndResult?.steps[this.afndCurrentStepIndex - 1];
    return (prev?.activeStates.includes(from) ?? false) &&
           (this.afndCurrentStep.activeStates.includes(to) ?? false);
  }

  /**
   * Determina si el loop de un estado del AFND está activo en la animación.
   *
   * @param state nombre del estado con loop
   * @returns true si el estado hace loop en el paso actual
   */
  isAfndLoopActive(state: string): boolean {
    if (!this.afndCurrentStep || this.afndCurrentStepIndex < 1) return false;
    const prev = this.afndResult?.steps[this.afndCurrentStepIndex - 1];
    return (prev?.activeStates.includes(state) ?? false) &&
           (this.afndCurrentStep.activeStates.includes(state) ?? false);
  }

  /**
   * Determina si un estado del AFD está activo en la animación del AFD.
   *
   * @param state nombre del estado a verificar
   * @returns true si el estado está activo en el paso actual del AFD
   */
  isAfdStateActive(state: string): boolean {
    return this.afdCurrentStep?.activeStates?.includes(state) ?? false;
  }

  /**
   * Determina si la transición entre dos estados del AFD está activa en la animación.
   *
   * @param from estado origen
   * @param to   estado destino
   * @returns true si la transición está siendo recorrida en el paso actual
   */
  isAfdEdgeActive(from: string, to: string): boolean {
    if (!this.afdCurrentStep || this.afdCurrentStepIndex < 1) return false;
    const prev = this.afdResult?.steps[this.afdCurrentStepIndex - 1];
    return (prev?.activeStates.includes(from) ?? false) &&
           (this.afdCurrentStep.activeStates.includes(to) ?? false);
  }

  /**
   * Determina si el loop de un estado del AFD está activo en la animación.
   *
   * @param state nombre del estado con loop
   * @returns true si el estado hace loop en el paso actual del AFD
   */
  isAfdLoopActive(state: string): boolean {
    if (!this.afdCurrentStep || this.afdCurrentStepIndex < 1) return false;
    const prev = this.afdResult?.steps[this.afdCurrentStepIndex - 1];
    return (prev?.activeStates.includes(state) ?? false) &&
           (this.afdCurrentStep.activeStates.includes(state) ?? false);
  }

  /**
   * Obtiene la representación textual de la transición del AFND
   * para mostrar en la tabla de transiciones.
   *
   * @param state  estado origen
   * @param symbol símbolo de entrada
   * @returns conjunto destino como string o vacío si no hay transición
   */
  getAfndTrans(state: string, symbol: string): string {
    const t = this.afnd.transitions[state]?.[symbol];
    if (!t) return '';
    return Array.isArray(t) ? `{${(t as string[]).join(', ')}}` : String(t);
  }

  /**
   * Obtiene el estado destino del AFD por subconjuntos para
   * mostrar en la tabla de transiciones.
   *
   * @param state  estado origen
   * @param symbol símbolo de entrada
   * @returns nombre del estado destino
   */
  getAfdTrans(state: string, symbol: string): string {
    const t = this.conversionResult?.afd.transitions[state]?.[symbol];
    return t ? String(t) : 'qE';
  }

  /**
   * Obtiene el estado destino del AFD minimizado para
   * mostrar en la tabla de transiciones.
   *
   * @param state  estado origen
   * @param symbol símbolo de entrada
   * @returns nombre del estado destino en el AFD minimizado
   */
  getMinTrans(state: string, symbol: string): string {
    const t = this.minimizationResult?.minimizedAfd.transitions[state]?.[symbol];
    return t ? String(t) : 'qE';
  }

  /**
 * Calcula la coordenada X de un estado principal del AFD
 * en la fila superior del diagrama SVG, excluyendo qE.
 *
 * @param index índice del estado en la lista de estados principales
 * @returns coordenada X en píxeles
 */
afdMainX(index: number): number {
    const count = this.mainAfdStates.length;
    const spacing = this.afdSvgWidth / (count + 1);
    return spacing * (index + 1);
  }
  /**
 * Inicia la animación del diagrama del AFD minimizado con intervalo de 800ms.
 *
 * @param result resultado de simulación con la traza de pasos
 */
private startMinAnimation(result: SimulationResult): void {
  this.minCurrentStepIndex = 0;
  this.minCurrentStep = result.steps[0];
  let i = 0;
  const interval = setInterval(() => {
    if (i >= result.steps.length) { clearInterval(interval); return; }
    this.minCurrentStepIndex = i;
    this.minCurrentStep = result.steps[i];
    i++;
  }, 800);
}
  /**
 * Simula la cadena ingresada sobre el AFD minimizado y activa la animación.
 */
simulateMin(): void {
  if (!this.minimizationResult) return;
  const cadena = this.parseInput();
  if (!cadena) return;
  this.svc.simulateAfd(this.minimizationResult.minimizedAfd, cadena).subscribe(result => {
    this.minResult = result;
    this.startMinAnimation(result);
  });
}

/** Determina si un estado del AFD minimizado está activo en la animación. */
isMinStateActive(state: string): boolean {
  return this.minCurrentStep?.activeStates?.includes(state) ?? false;
}

/** Determina si la transición entre dos estados del AFD minimizado está activa. */
isMinEdgeActive(from: string, to: string): boolean {
  if (!this.minCurrentStep || this.minCurrentStepIndex < 1) return false;
  const prev = this.minResult?.steps[this.minCurrentStepIndex - 1];
  return (prev?.activeStates.includes(from) ?? false) &&
         (this.minCurrentStep.activeStates.includes(to) ?? false);
}

/** Determina si el loop de un estado del AFD minimizado está activo. */
isMinLoopActive(state: string): boolean {
  if (!this.minCurrentStep || this.minCurrentStepIndex < 1) return false;
  const prev = this.minResult?.steps[this.minCurrentStepIndex - 1];
  return (prev?.activeStates.includes(state) ?? false) &&
         (this.minCurrentStep.activeStates.includes(state) ?? false);
}
}