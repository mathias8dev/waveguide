# Add New Waveguide Type

Ajoute un nouveau type de guide d'onde au simulateur.

## Instructions

1. Créer une nouvelle classe dans `src/engine/waveguides/`
2. Étendre la classe abstraite `Waveguide`
3. Implémenter les méthodes requises:
   - `getCutoffFrequency(mode: Mode): number`
   - `getPropagationConstant(frequency: number, mode: Mode): number`
   - `getFieldDistribution(x: number, y: number, z: number, mode: Mode): FieldVector`
4. Ajouter la géométrie 3D dans `src/components/three/geometries/`
5. Mettre à jour le store et les types

## Exemple de structure

```typescript
export class NewWaveguide extends Waveguide {
  constructor(params: NewWaveguideParams) {
    super();
    // ...
  }

  getCutoffFrequency(mode: Mode): number {
    // Implementation
  }

  // ...
}
```
