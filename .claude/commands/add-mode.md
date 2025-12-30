# Add New Propagation Mode

Ajoute un nouveau mode de propagation au simulateur.

## Instructions

1. Identifier le type de mode à ajouter (TE, TM, TEM, hybride)
2. Déterminer le guide d'onde concerné (rectangulaire, circulaire, coaxial)
3. Implémenter les équations de champ dans `src/engine/modes/`
4. Ajouter le mode au sélecteur dans `src/components/controls/ModeSelector.tsx`
5. Tester la visualisation 2D et 3D

## Formules à implémenter

- Fréquence de coupure fc
- Constante de propagation β
- Distribution des champs Ex, Ey, Ez, Hx, Hy, Hz
