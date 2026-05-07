package com.ape05.automatas.model;

import java.util.List;

/**
 * Encapsula el resultado completo de simular una cadena de entrada
 * sobre un autómata finito, incluyendo la traza de ejecución paso
 * a paso y el veredicto final de aceptación o rechazo.
 */
public class SimulationResult {

    /** Cadena de entrada procesada por el autómata. */
    private List<String> input;

    /** Indica si la cadena fue aceptada por el autómata. */
    private boolean accepted;

    /** Traza completa de estados activos en cada paso de la simulación. */
    private List<SimulationStep> steps;

    /** Estados activos al finalizar el procesamiento de la cadena. */
    private List<String> finalStates;

    /** Definición formal del autómata que procesó la cadena. */
    private Automata definition;

    public SimulationResult(List<String> input, boolean accepted,
                            List<SimulationStep> steps, List<String> finalStates,
                            Automata definition) {
        this.input = input;
        this.accepted = accepted;
        this.steps = steps;
        this.finalStates = finalStates;
        this.definition = definition;
    }

    public List<String> getInput() { return input; }
    public boolean isAccepted() { return accepted; }
    public List<SimulationStep> getSteps() { return steps; }
    public List<String> getFinalStates() { return finalStates; }
    public Automata getDefinition() { return definition; }
}