package com.ape05.automatas.service;

import com.ape05.automatas.model.Automata;
import com.ape05.automatas.model.MinimizationResult;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Servicio responsable de minimizar un Autómata Finito Determinista (AFD)
 * mediante el algoritmo de partición de equivalencia (algoritmo de la tabla).
 * Identifica y fusiona los estados equivalentes, produciendo el AFD mínimo
 * que reconoce exactamente el mismo lenguaje con el menor número de estados posible.
 */
@Service
public class MinimizationService {

    /**
     * Minimiza el AFD recibido aplicando el algoritmo de partición de equivalencia.
     * Parte de la partición inicial {F, Q-F} y refina iterativamente hasta que
     * no se produzcan más divisiones. Los estados equivalentes se fusionan en
     * un único estado representante en el AFD minimizado resultante.
     *
     * @param afd definición formal del AFD a minimizar
     * @return resultado con el AFD minimizado, tabla de equivalencia y grupos fusionados
     */
    public MinimizationResult minimize(Automata afd) {
        List<String> states = afd.getStates();
        List<String> alphabet = afd.getAlphabet();
        Set<String> accepting = new HashSet<>(afd.getAccepting());
        Map<String, Map<String, Object>> transitions = afd.getTransitions();

        // Partición inicial: estados finales vs no finales
        Set<String> finalStates = new HashSet<>(accepting);
        Set<String> nonFinalStates = new HashSet<>(states);
        nonFinalStates.removeAll(finalStates);

        List<Set<String>> partition = new ArrayList<>();
        if (!finalStates.isEmpty()) partition.add(finalStates);
        if (!nonFinalStates.isEmpty()) partition.add(nonFinalStates);

        List<Map<String, Object>> equivalenceTable = new ArrayList<>();
        boolean changed = true;
        int iteration = 0;

        while (changed) {
            changed = false;
            List<Set<String>> newPartition = new ArrayList<>();
            Map<String, Object> iterRow = new LinkedHashMap<>();
            iterRow.put("iteration", iteration++);
            List<List<String>> groupsSnapshot = new ArrayList<>();
            partition.forEach(g -> groupsSnapshot.add(new ArrayList<>(g)));
            iterRow.put("groups", groupsSnapshot);
            equivalenceTable.add(iterRow);

            for (Set<String> group : partition) {
                if (group.size() == 1) {
                    newPartition.add(new HashSet<>(group));
                    continue;
                }

                Map<String, Set<String>> signatures = new LinkedHashMap<>();
                for (String state : group) {
                    StringBuilder sig = new StringBuilder();
                    for (String symbol : alphabet) {
                        String dest = getDestination(transitions, state, symbol);
                        sig.append(findGroup(partition, dest)).append("|");
                    }
                    signatures.computeIfAbsent(sig.toString(), k -> new HashSet<>()).add(state);
                }

                newPartition.addAll(signatures.values());
                if (signatures.size() > 1) changed = true;
            }

            partition = newPartition;
        }

        // Construir el AFD minimizado
        Map<String, String> stateMap = new LinkedHashMap<>();
        for (Set<String> group : partition) {
            String representative = group.stream().sorted().findFirst().orElse("");
            for (String state : group) stateMap.put(state, representative);
        }

        Set<String> minStatesSet = new LinkedHashSet<>(stateMap.values());
        List<String> minStates = new ArrayList<>(minStatesSet);
        Map<String, Map<String, Object>> minTransitions = new LinkedHashMap<>();

        for (String state : minStates) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (String symbol : alphabet) {
                String dest = getDestination(transitions, state, symbol);
                String mappedDest = stateMap.getOrDefault(dest, dest);
                row.put(symbol, mappedDest);
            }
            minTransitions.put(state, row);
        }

        String minInitial = stateMap.get(afd.getInitial());
        Set<String> minAccepting = new HashSet<>();
        for (String acc : accepting) {
            String mapped = stateMap.get(acc);
            if (mapped != null) minAccepting.add(mapped);
        }

        Automata minimizedAfd = new Automata();
        minimizedAfd.setStates(minStates);
        minimizedAfd.setAlphabet(alphabet);
        minimizedAfd.setTransitions(minTransitions);
        minimizedAfd.setInitial(minInitial);
        minimizedAfd.setAccepting(new ArrayList<>(minAccepting));

        List<List<String>> equivalenceGroups = new ArrayList<>();
        partition.forEach(g -> equivalenceGroups.add(new ArrayList<>(g)));

        return new MinimizationResult(minimizedAfd, equivalenceTable, equivalenceGroups);
    }

    /**
     * Obtiene el estado destino desde las transiciones del AFD dado un estado
     * y un símbolo de entrada. Retorna "qE" si no existe transición definida.
     *
     * @param transitions tabla de transiciones del AFD
     * @param state       estado origen
     * @param symbol      símbolo de entrada
     * @return nombre del estado destino o "qE" si no hay transición
     */
    private String getDestination(Map<String, Map<String, Object>> transitions,
                                   String state, String symbol) {
        Map<String, Object> row = transitions.getOrDefault(state, Collections.emptyMap());
        Object dest = row.get(symbol);
        return dest != null ? dest.toString() : "qE";
    }

    /**
     * Determina a qué grupo de la partición actual pertenece un estado dado.
     * Utilizado para calcular la firma de equivalencia de cada estado durante
     * el proceso iterativo de refinamiento de la partición.
     *
     * @param partition partición actual de estados
     * @param state     estado a buscar
     * @return índice del grupo al que pertenece el estado
     */
    private int findGroup(List<Set<String>> partition, String state) {
        for (int i = 0; i < partition.size(); i++) {
            if (partition.get(i).contains(state)) return i;
        }
        return -1;
    }
}