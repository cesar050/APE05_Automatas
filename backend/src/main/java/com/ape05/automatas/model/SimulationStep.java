package com.ape05.automatas.model;

import java.util.List;

/**
 * Representa un paso individual dentro de la traza de ejecución
 * de un autómata al procesar una cadena de entrada.
 */
public class SimulationStep {

    /** Símbolo leído en este paso. Null si es el estado inicial. */
    private String symbol;

    /**
     * Conjunto de estados activos después de procesar el símbolo.
     * En AFD siempre contiene un único elemento.
     * En AFND puede contener múltiples estados simultáneos.
     */
    private List<String> activeStates;

    public SimulationStep(String symbol, List<String> activeStates) {
        this.symbol = symbol;
        this.activeStates = activeStates;
    }

    public String getSymbol() { return symbol; }
    public List<String> getActiveStates() { return activeStates; }
}