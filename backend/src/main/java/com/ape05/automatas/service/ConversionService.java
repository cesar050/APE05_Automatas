package com.ape05.automatas.service;

import com.ape05.automatas.model.Automata;
import com.ape05.automatas.model.ConversionResult;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Servicio responsable de convertir un Autómata Finito No Determinista (AFND)
 * en un Autómata Finito Determinista (AFD) equivalente mediante el algoritmo
 * de construcción de subconjuntos (subset construction).
 * Cada estado del AFD resultante corresponde a un conjunto de estados del AFND.
 * Los conjuntos vacíos se representan como el estado trampa "qE".
 */
@Service
public class ConversionService {

    /**
     * Convierte el AFND recibido en un AFD equivalente aplicando el algoritmo
     * de construcción de subconjuntos. Parte del conjunto inicial {q0} y expande
     * iterativamente todos los conjuntos de estados alcanzables hasta que no
     * aparezcan conjuntos nuevos. Los ∅ se reemplazan por el estado trampa qE.
     *
     * @param afnd definición formal del AFND a convertir
     * @return resultado de conversión con el AFD generado y la tabla de subconjuntos
     */
    public ConversionResult convert(Automata afnd) {
        List<String> alphabet = afnd.getAlphabet();
        Map<String, Map<String, Object>> afndTransitions = afnd.getTransitions();
        Set<String> afndAccepting = new HashSet<>(afnd.getAccepting());

        Map<Set<String>, String> stateNames = new LinkedHashMap<>();
        Queue<Set<String>> pending = new LinkedList<>();
        List<Map<String, Object>> subsetTable = new ArrayList<>();

        Set<String> initialSet = new HashSet<>();
        initialSet.add(afnd.getInitial());
        stateNames.put(initialSet, setToName(initialSet));
        pending.add(initialSet);

        Map<String, Map<String, String>> afdTransitions = new LinkedHashMap<>();
        Set<String> afdAccepting = new HashSet<>();

        while (!pending.isEmpty()) {
            Set<String> current = pending.poll();
            String currentName = stateNames.get(current);
            Map<String, String> row = new LinkedHashMap<>();
            Map<String, Object> tableRow = new LinkedHashMap<>();
            tableRow.put("state", currentName);
            tableRow.put("stateSet", new ArrayList<>(current));

            for (String symbol : alphabet) {
                Set<String> nextSet = new HashSet<>();

                for (String state : current) {
                    Map<String, Object> trans = afndTransitions
                            .getOrDefault(state, Collections.emptyMap());
                    Object dest = trans.get(symbol);
                    if (dest instanceof List<?> destList) {
                        destList.forEach(d -> nextSet.add(d.toString()));
                    }
                }

                String nextName;
                if (nextSet.isEmpty()) {
                    nextName = "qE";
                } else {
                    nextName = setToName(nextSet);
                    if (!stateNames.containsKey(nextSet)) {
                        stateNames.put(nextSet, nextName);
                        pending.add(nextSet);
                    }
                }

                row.put(symbol, nextName);
                tableRow.put(symbol, nextName);
            }

            afdTransitions.put(currentName, new LinkedHashMap<>(row));
            subsetTable.add(tableRow);

            boolean isFinal = current.stream().anyMatch(afndAccepting::contains);
            if (isFinal) afdAccepting.add(currentName);
        }

        // Agregar estado trampa qE con todas las transiciones a sí mismo
        if (afdTransitions.values().stream()
                .anyMatch(row -> row.containsValue("qE"))) {
            Map<String, String> trapRow = new LinkedHashMap<>();
            for (String symbol : alphabet) trapRow.put(symbol, "qE");
            afdTransitions.put("qE", trapRow);

            Map<String, Object> trapTableRow = new LinkedHashMap<>();
            trapTableRow.put("state", "qE");
            trapTableRow.put("stateSet", List.of("∅"));
            for (String symbol : alphabet) trapTableRow.put(symbol, "qE");
            subsetTable.add(trapTableRow);
        }

        // Construir el AFD resultante
        Map<String, Map<String, Object>> afdTransObj = new LinkedHashMap<>();
        afdTransitions.forEach((state, row) -> {
            Map<String, Object> rowObj = new LinkedHashMap<>(row);
            afdTransObj.put(state, rowObj);
        });

        List<String> afdStates = new ArrayList<>(afdTransitions.keySet());
        String afdInitial = setToName(initialSet);

        Automata afd = new Automata();
        afd.setStates(afdStates);
        afd.setAlphabet(alphabet);
        afd.setTransitions(afdTransObj);
        afd.setInitial(afdInitial);
        afd.setAccepting(new ArrayList<>(afdAccepting));

        return new ConversionResult(afd, subsetTable);
    }

    /**
     * Convierte un conjunto de nombres de estados en un nombre de estado
     * compuesto ordenado alfabéticamente para garantizar nombres únicos
     * y consistentes durante la construcción de subconjuntos.
     *
     * @param states conjunto de nombres de estados del AFND
     * @return nombre compuesto del estado del AFD resultante
     */
    private String setToName(Set<String> states) {
        List<String> sorted = new ArrayList<>(states);
        Collections.sort(sorted);
        return String.join("_", sorted);
    }
}