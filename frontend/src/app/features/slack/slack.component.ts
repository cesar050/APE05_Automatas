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
 * Componente principal del ejercicio de Sintaxis de Mensajería Slack.
 * Gestiona las cuatro vistas: AFND original, AFD por subconjuntos,
 * AFD minimizado y verificación de equivalencia entre los tres autómatas.
 */
@Component({
  selector: 'app-slack',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slack.component.html',
  styleUrl: './slack.component.css'
})
export class SlackComponent implements OnInit {

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

    /** Resultado de simular sobre el AFD minimizado. */
    minResult: SimulationResult | null = null;

    /** Índice del paso actual en la animación del minimizado. */
    minCurrentStepIndex = -1;
  
    /** Paso actual de la animación del minimizado. */
    minCurrentStep: any = null;

  /**
   * Definición formal del AFND de Sintaxis de Mensajería Slack.
   * Patrón reconocido: @bot (USER)? (!cmd | ?help)
   */
  afnd: Automata = {
    states: ['q0', 'q1', 'q2', 'q3'],
    alphabet: ['@bot', 'USER', '!cmd', '?help'],
    transitions: {
      'q0': { '@bot': ['q1'] },
      'q1': { 'USER': ['q1', 'q2'], '!cmd': ['q3'], '?help': ['q3'] },
      'q2': { '!cmd': ['q3'], '?help': ['q3'] },
      'q3': {}
    },
    initial: 'q0',
    accepting: ['q3']
  };

  /** Cadenas de prueba de ejemplo para el ejercicio. */
  examples = [
    ['@bot', '!cmd'],
    ['@bot', '?help'],
    ['@bot', 'USER', '!cmd'],
    ['@bot', 'USER', '?help'],
    ['@bot', 'USER']
  ];

  /**
   * Tipos de cadenas de prueba para la tabla de verificación.
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
    ['@bot'],
    ['!cmd'],
    ['?help'],
    ['@bot', '!cmd'],
    ['@bot', '?help'],
    ['@bot', 'USER'],
    ['@bot', 'USER', '!cmd'],
    ['@bot', 'USER', '?help'],
    ['USER', '!cmd'],
    ['@bot', '@bot', '!cmd'],
    ['@bot', 'USER', 'USER', '!cmd'],
    ['@bot', 'USER', '!cmd', '?help'],
    ['!cmd', '@bot', 'USER'],
    ['@bot', '!cmd', 'USER'],
    ['@bot', '?help', '!cmd'],
    ['@bot', 'USER', '@bot', '!cmd'],
    ['@bot', 'USER', '!cmd', '@bot'],
    ['@bot', 'USER', 'USER', '?help'],
    ['@bot', 'USER', '!cmd', '?help', '@bot']
  ];

  constructor(private svc: AutomataService) {}

  /**
   * Inicializa el componente precargando la conversión y minimización.
   */
  ngOnInit(): void {
    this.loadConversion();
  }

  /**
   * Carga la conversión AFND → AFD y encadena la minimización del resultado.
   */
  private loadConversion(): void {
    this.svc.convert(this.afnd).subscribe(result => {
      this.conversionResult = result;
      this.svc.minimize(result.afd).subscribe(min => {
        this.minimizationResult = min;
      });
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
   * Simula la cadena ingresada sobre el AFND y activa la animación.
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
   * Simula la cadena ingresada sobre el AFD por subconjuntos y activa la animación.
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
   * Ejecuta la verificación de equivalencia para las 20 cadenas de prueba.
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
   * Inicia la animación del diagrama del AFND con intervalo de 800ms.
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
   * Inicia la animación del diagrama del AFD con intervalo de 800ms.
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
   * Limpia los resultados y el campo de entrada.
   */
  clear(): void {
    this.inputRaw = '';
    this.afndResult = null;
    this.afdResult = null;
    this.afndCurrentStepIndex = -1;
    this.afndCurrentStep = null;
    this.afdCurrentStepIndex = -1;
    this.afdCurrentStep = null;
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
   * Parsea el campo de entrada en una lista de símbolos.
   *
   * @returns lista de símbolos o null si el campo está vacío
   */
  private parseInput(): string[] | null {
    const cadena = this.inputRaw.split(',').map(s => s.trim()).filter(Boolean);
    return cadena.length > 0 ? cadena : null;
  }

  /** Determina si un estado del AFND está activo en la animación. */
  isAfndStateActive(state: string): boolean {
    return this.afndCurrentStep?.activeStates?.includes(state) ?? false;
  }

  /** Determina si la transición entre dos estados del AFND está activa. */
  isAfndEdgeActive(from: string, to: string): boolean {
    if (!this.afndCurrentStep || this.afndCurrentStepIndex < 1) return false;
    const prev = this.afndResult?.steps[this.afndCurrentStepIndex - 1];
    return (prev?.activeStates.includes(from) ?? false) &&
           (this.afndCurrentStep.activeStates.includes(to) ?? false);
  }

  /** Determina si el loop de un estado del AFND está activo. */
  isAfndLoopActive(state: string): boolean {
    if (!this.afndCurrentStep || this.afndCurrentStepIndex < 1) return false;
    const prev = this.afndResult?.steps[this.afndCurrentStepIndex - 1];
    return (prev?.activeStates.includes(state) ?? false) &&
           (this.afndCurrentStep.activeStates.includes(state) ?? false);
  }

  /** Determina si un estado del AFD está activo en la animación. */
  isAfdStateActive(state: string): boolean {
    return this.afdCurrentStep?.activeStates?.includes(state) ?? false;
  }

  /** Determina si la transición entre dos estados del AFD está activa. */
  isAfdEdgeActive(from: string, to: string): boolean {
    if (!this.afdCurrentStep || this.afdCurrentStepIndex < 1) return false;
    const prev = this.afdResult?.steps[this.afdCurrentStepIndex - 1];
    return (prev?.activeStates.includes(from) ?? false) &&
           (this.afdCurrentStep.activeStates.includes(to) ?? false);
  }

  /** Determina si el loop de un estado del AFD está activo. */
  isAfdLoopActive(state: string): boolean {
    if (!this.afdCurrentStep || this.afdCurrentStepIndex < 1) return false;
    const prev = this.afdResult?.steps[this.afdCurrentStepIndex - 1];
    return (prev?.activeStates.includes(state) ?? false) &&
           (this.afdCurrentStep.activeStates.includes(state) ?? false);
  }

  /** Obtiene la transición del AFND como string. */
  getAfndTrans(state: string, symbol: string): string {
    const t = this.afnd.transitions[state]?.[symbol];
    if (!t) return '';
    return Array.isArray(t) ? `{${(t as string[]).join(', ')}}` : String(t);
  }

  /** Obtiene el estado destino del AFD por subconjuntos. */
  getAfdTrans(state: string, symbol: string): string {
    const t = this.conversionResult?.afd.transitions[state]?.[symbol];
    return t ? String(t) : 'qE';
  }

  /** Obtiene el estado destino del AFD minimizado. */
  getMinTrans(state: string, symbol: string): string {
    const t = this.minimizationResult?.minimizedAfd.transitions[state]?.[symbol];
    return t ? String(t) : 'qE';
  }

    /**
   * Simula la cadena sobre el AFD minimizado y activa la animación.
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
  
    isMinStateActive(state: string): boolean {
      return this.minCurrentStep?.activeStates?.includes(state) ?? false;
    }
  
    isMinEdgeActive(from: string, to: string): boolean {
      if (!this.minCurrentStep || this.minCurrentStepIndex < 1) return false;
      const prev = this.minResult?.steps[this.minCurrentStepIndex - 1];
      return (prev?.activeStates.includes(from) ?? false) &&
             (this.minCurrentStep.activeStates.includes(to) ?? false);
    }
  
    isMinLoopActive(state: string): boolean {
      if (!this.minCurrentStep || this.minCurrentStepIndex < 1) return false;
      const prev = this.minResult?.steps[this.minCurrentStepIndex - 1];
      return (prev?.activeStates.includes(state) ?? false) &&
             (this.minCurrentStep.activeStates.includes(state) ?? false);
    }
}