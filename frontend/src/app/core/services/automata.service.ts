import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Automata,
  SimulationResult,
  ConversionResult,
  MinimizationResult,
  VerificationRow
} from '../../shared/models/automata.model';

/**
 * Servicio centralizado que gestiona todas las peticiones HTTP
 * hacia el backend Spring Boot para simulación, conversión,
 * minimización y verificación de autómatas finitos.
 */
@Injectable({ providedIn: 'root' })
export class AutomataService {

  /** URL base del backend Spring Boot. */
  private readonly base = 'http://localhost:8080/api/automata';

  constructor(private http: HttpClient) {}

  /**
   * Simula una cadena de entrada sobre el AFND dado.
   *
   * @param automata definición formal del AFND
   * @param input    cadena de entrada como lista de símbolos
   * @returns resultado con traza de ejecución y veredicto
   */
  simulateAfnd(automata: Automata, input: string[]): Observable<SimulationResult> {
    return this.http.post<SimulationResult>(`${this.base}/afnd/simulate`, { automata, input });
  }

  /**
   * Simula una cadena de entrada sobre el AFD dado.
   *
   * @param automata definición formal del AFD
   * @param input    cadena de entrada como lista de símbolos
   * @returns resultado con traza de ejecución y veredicto
   */
  simulateAfd(automata: Automata, input: string[]): Observable<SimulationResult> {
    return this.http.post<SimulationResult>(`${this.base}/afd/simulate`, { automata, input });
  }

  /**
   * Convierte el AFND recibido a un AFD equivalente mediante
   * el algoritmo de construcción de subconjuntos.
   *
   * @param automata definición formal del AFND a convertir
   * @returns AFD resultante con tabla de subconjuntos
   */
  convert(automata: Automata): Observable<ConversionResult> {
    return this.http.post<ConversionResult>(`${this.base}/convert`, automata);
  }

  /**
   * Minimiza el AFD recibido mediante el algoritmo de partición
   * de equivalencia, fusionando los estados equivalentes.
   *
   * @param automata definición formal del AFD a minimizar
   * @returns AFD minimizado con tabla de equivalencia y grupos
   */
  minimize(automata: Automata): Observable<MinimizationResult> {
    return this.http.post<MinimizationResult>(`${this.base}/minimize`, automata);
  }

  /**
   * Verifica que el AFND, AFD y AFD minimizado aceptan exactamente
   * el mismo lenguaje para un conjunto de cadenas de prueba.
   *
   * @param afnd       definición formal del AFND original
   * @param afd        definición formal del AFD por subconjuntos
   * @param minimized  definición formal del AFD minimizado
   * @param testStrings lista de cadenas de prueba
   * @returns tabla comparativa de resultados por cadena
   */
  verify(
    afnd: Automata,
    afd: Automata,
    minimized: Automata,
    testStrings: string[][]
  ): Observable<VerificationRow[]> {
    return this.http.post<VerificationRow[]>(`${this.base}/verify`, {
      afnd, afd, minimized, testStrings
    });
  }
}