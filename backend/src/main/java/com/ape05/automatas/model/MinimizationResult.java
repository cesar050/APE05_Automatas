package com.ape05.automatas.model;

import java.util.List;
import java.util.Map;

/**
 * Encapsula el resultado del proceso de minimización de un AFD
 * mediante el algoritmo de partición de Hopcroft, incluyendo
 * la tabla de equivalencia y los pares de estados marcados.
 */
public class MinimizationResult {

    /** AFD minimizado resultante con estados fusionados. */
    private Automata minimizedAfd;

    /**
     * Tabla de equivalencia construida manualmente durante la minimización.
     * Muestra cada iteración del algoritmo y los pares marcados en cada paso.
     */
    private List<Map<String, Object>> equivalenceTable;

    /** Grupos de estados equivalentes que fueron fusionados. */
    private List<List<String>> equivalenceGroups;

    public MinimizationResult(Automata minimizedAfd,
                               List<Map<String, Object>> equivalenceTable,
                               List<List<String>> equivalenceGroups) {
        this.minimizedAfd = minimizedAfd;
        this.equivalenceTable = equivalenceTable;
        this.equivalenceGroups = equivalenceGroups;
    }

    public Automata getMinimizedAfd() { return minimizedAfd; }
    public List<Map<String, Object>> getEquivalenceTable() { return equivalenceTable; }
    public List<List<String>> getEquivalenceGroups() { return equivalenceGroups; }
}