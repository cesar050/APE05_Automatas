package com.ape05.automatas.model;

import java.util.List;
import java.util.Map;

/**
 * Encapsula el resultado completo del proceso de conversión AFND → AFD
 * mediante el algoritmo de construcción de subconjuntos, incluyendo
 * la tabla de subconjuntos generada en cada iteración del algoritmo.
 */
public class ConversionResult {

    /** AFD resultante después de aplicar la construcción de subconjuntos. */
    private Automata afd;

    /**
     * Tabla de subconjuntos generada durante la conversión.
     * Cada entrada mapea un conjunto de estados del AFND a sus transiciones.
     */
    private List<Map<String, Object>> subsetTable;

    public ConversionResult(Automata afd, List<Map<String, Object>> subsetTable) {
        this.afd = afd;
        this.subsetTable = subsetTable;
    }

    public Automata getAfd() { return afd; }
    public List<Map<String, Object>> getSubsetTable() { return subsetTable; }
}