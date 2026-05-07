package com.ape05.automatas.service;

import com.ape05.automatas.model.Automata;
import com.ape05.automatas.model.SimulationResult;
import com.ape05.automatas.model.SimulationStep;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Servicio responsable de simular el procesamiento de cadenas de entrada
 * sobre un Autómata Finito No Determinista (AFND).
 * Implementa el algoritmo de subconjuntos en tiempo de ejecución,
 * manteniendo un conjunto de estados activos simultáneos en cada paso.
 */
@Service
public class AfndService {

    /**
     * Simula el procesamiento de una cadena sobre el AFND dado,
     * manteniendo en cada paso el conjunto de estados activos simultáneos.
     * La cadena es aceptada si al finalizar algún estado activo
     * pertenece al conjunto de estados de aceptación F.
     *
     * @param automata definición formal del AFND a simular
     * @param input    cadena de entrada representada como lista de símbolos
     * @return resultado completo con traza de ejecución y veredicto de aceptación
     */
    public SimulationResult simulate(Automata automata, List<String> input) {
        Set<String> currentStates = new HashSet<>();
        currentStates.add(automata.getInitial());

        List<SimulationStep> steps = new ArrayList<>();
        steps.add(new SimulationStep(null, new ArrayList<>(currentStates)));

        for (String symbol : input) {
            Set<String> nextStates = new HashSet<>();

            for (String state : currentStates) {
                Map<String, Object> stateTransitions = automata.getTransitions()
                        .getOrDefault(state, Collections.emptyMap());

                Object destinations = stateTransitions.get(symbol);
                if (destinations instanceof List<?> destList) {
                    destList.forEach(d -> nextStates.add(d.toString()));
                }
            }

            currentStates = nextStates;
            steps.add(new SimulationStep(symbol, new ArrayList<>(currentStates)));
        }

        Set<String> accepting = new HashSet<>(automata.getAccepting());
        boolean accepted = currentStates.stream().anyMatch(accepting::contains);

        return new SimulationResult(
                input,
                accepted,
                steps,
                new ArrayList<>(currentStates),
                automata
        );
    }
}