package com.ape05.automatas.controller;

import com.ape05.automatas.model.Automata;
import com.ape05.automatas.model.ConversionResult;
import com.ape05.automatas.model.MinimizationResult;
import com.ape05.automatas.model.SimulationResult;
import com.ape05.automatas.service.AfndService;
import com.ape05.automatas.service.ConversionService;
import com.ape05.automatas.service.MinimizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST que expone los endpoints para la simulación de autómatas finitos.
 * Gestiona las operaciones de simulación AFND, conversión AFND→AFD mediante
 * construcción de subconjuntos, minimización del AFD resultante y verificación
 * de equivalencia entre los tres autómatas para un conjunto de cadenas de prueba.
 */
@RestController
@RequestMapping("/api/automata")
@CrossOrigin(origins = "*")
public class AutomataController {

    private final AfndService afndService;
    private final ConversionService conversionService;
    private final MinimizationService minimizationService;

    /**
     * Inyección de dependencias de los servicios requeridos para
     * la simulación, conversión y minimización de autómatas.
     *
     * @param afndService         servicio de simulación AFND
     * @param conversionService   servicio de conversión AFND a AFD
     * @param minimizationService servicio de minimización del AFD
     */
    public AutomataController(AfndService afndService,
                               ConversionService conversionService,
                               MinimizationService minimizationService) {
        this.afndService = afndService;
        this.conversionService = conversionService;
        this.minimizationService = minimizationService;
    }

    /**
     * Simula una cadena de entrada sobre el AFND recibido en el cuerpo
     * de la petición, retornando la traza completa de estados activos
     * en cada paso y el veredicto final de aceptación o rechazo.
     *
     * @param body mapa con el AFND bajo la clave "automata" y la cadena bajo "input"
     * @return resultado de simulación con traza y veredicto
     */
    @PostMapping("/afnd/simulate")
    public ResponseEntity<SimulationResult> simulateAfnd(
            @RequestBody Map<String, Object> body) {

        Automata automata = parseAutomata(body.get("automata"));
        List<String> input = (List<String>) body.get("input");
        return ResponseEntity.ok(afndService.simulate(automata, input));
    }

    /**
     * Convierte el AFND recibido en el cuerpo de la petición a un AFD equivalente
     * mediante el algoritmo de construcción de subconjuntos, retornando el AFD
     * resultante junto con la tabla de subconjuntos generada en cada iteración.
     *
     * @param automata definición formal del AFND a convertir
     * @return AFD resultante con tabla de subconjuntos
     */
    @PostMapping("/convert")
    public ResponseEntity<ConversionResult> convert(
            @RequestBody Automata automata) {
        return ResponseEntity.ok(conversionService.convert(automata));
    }

    /**
     * Simula una cadena de entrada sobre el AFD recibido en el cuerpo
     * de la petición. Funciona tanto para el AFD por subconjuntos como
     * para el AFD minimizado, ya que ambos son autómatas deterministas.
     *
     * @param body mapa con el AFD bajo la clave "automata" y la cadena bajo "input"
     * @return resultado de simulación con traza y veredicto
     */
    @PostMapping("/afd/simulate")
    public ResponseEntity<SimulationResult> simulateAfd(
            @RequestBody Map<String, Object> body) {

        Automata automata = parseAutomata(body.get("automata"));
        List<String> input = (List<String>) body.get("input");
        return ResponseEntity.ok(afndService.simulate(automata, input));
    }

    /**
     * Minimiza el AFD recibido en el cuerpo de la petición mediante el algoritmo
     * de partición de equivalencia, retornando el AFD mínimo junto con la tabla
     * de equivalencia completa y los grupos de estados fusionados.
     *
     * @param automata definición formal del AFD a minimizar
     * @return AFD minimizado con tabla de equivalencia y grupos fusionados
     */
    @PostMapping("/minimize")
    public ResponseEntity<MinimizationResult> minimize(
            @RequestBody Automata automata) {
        return ResponseEntity.ok(minimizationService.minimize(automata));
    }

    /**
     * Verifica que el AFND original, el AFD por subconjuntos y el AFD minimizado
     * aceptan exactamente el mismo lenguaje probando un conjunto de cadenas de prueba.
     * Retorna para cada cadena el resultado de los tres autómatas, confirmando
     * la equivalencia teórica mediante evidencia experimental.
     *
     * @param body mapa con el AFND bajo "afnd", el AFD bajo "afd",
     *             el AFD minimizado bajo "minimized" y las cadenas bajo "testStrings"
     * @return lista de resultados comparativos por cada cadena de prueba
     */
    @PostMapping("/verify")
    public ResponseEntity<List<Map<String, Object>>> verify(
            @RequestBody Map<String, Object> body) {

        Automata afnd = parseAutomata(body.get("afnd"));
        Automata afd = parseAutomata(body.get("afd"));
        Automata minimized = parseAutomata(body.get("minimized"));
        List<List<String>> testStrings = (List<List<String>>) body.get("testStrings");

        List<Map<String, Object>> results = testStrings.stream().map(input -> {
            boolean afndResult = afndService.simulate(afnd, input).isAccepted();
            boolean afdResult = afndService.simulate(afd, input).isAccepted();
            boolean minResult = afndService.simulate(minimized, input).isAccepted();

            return (Map<String, Object>) Map.of(
                    "input", input,
                    "afnd", afndResult,
                    "afd", afdResult,
                    "minimized", minResult,
                    "equivalent", afndResult == afdResult && afdResult == minResult
            );
        }).toList();

        return ResponseEntity.ok(results);
    }

    /**
     * Convierte el objeto recibido desde el cuerpo JSON de la petición
     * en una instancia de Automata. Extrae los campos states, alphabet,
     * transitions, initial y accepting del mapa deserializado por Jackson.
     *
     * @param raw objeto deserializado por Jackson desde el JSON de la petición
     * @return instancia de Automata con los datos extraídos
     */
    private Automata parseAutomata(Object raw) {
        Map<String, Object> map = (Map<String, Object>) raw;
        Automata automata = new Automata();
        automata.setStates((List<String>) map.get("states"));
        automata.setAlphabet((List<String>) map.get("alphabet"));
        automata.setInitial((String) map.get("initial"));
        automata.setAccepting((List<String>) map.get("accepting"));

        Map<String, Map<String, Object>> transitions =
                (Map<String, Map<String, Object>>) map.get("transitions");
        automata.setTransitions(transitions);

        return automata;
    }
}