package com.ape05.automatas.model;

import java.util.List;
import java.util.Map;

/**
 * Representa la definición formal de un autómata finito (AFD o AFND).
 * Contiene la quíntupla M = (Q, Σ, δ, q0, F) necesaria para simular
 * el reconocimiento de cadenas de entrada.
 */
public class Automata {

    /** Conjunto de estados Q del autómata. */
    private List<String> states;

    /** Alfabeto Σ de símbolos válidos de entrada. */
    private List<String> alphabet;

    /**
     * Función de transición δ representada como mapa anidado.
     * Para AFD: estado -> símbolo -> estado destino.
     * Para AFND: estado -> símbolo -> lista de estados destino.
     */
    private Map<String, Map<String, Object>> transitions;

    /** Estado inicial q0 del autómata. */
    private String initial;

    /** Conjunto de estados de aceptación F. */
    private List<String> accepting;

    public List<String> getStates() { return states; }
    public void setStates(List<String> states) { this.states = states; }

    public List<String> getAlphabet() { return alphabet; }
    public void setAlphabet(List<String> alphabet) { this.alphabet = alphabet; }

    public Map<String, Map<String, Object>> getTransitions() { return transitions; }
    public void setTransitions(Map<String, Map<String, Object>> transitions) { this.transitions = transitions; }

    public String getInitial() { return initial; }
    public void setInitial(String initial) { this.initial = initial; }

    public List<String> getAccepting() { return accepting; }
    public void setAccepting(List<String> accepting) { this.accepting = accepting; }
}