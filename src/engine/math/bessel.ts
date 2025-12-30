/**
 * Fonctions de Bessel et leurs dérivées
 * Implémentation basée sur les séries et approximations polynomiales
 */

/**
 * Fonction de Bessel de première espèce Jn(x)
 * Utilise la série de puissance pour les petits x et les approximations pour les grands x
 */
export function besselJ(n: number, x: number): number {
  if (x === 0) {
    return n === 0 ? 1 : 0;
  }

  if (Math.abs(x) < 8) {
    return besselJSeries(n, x);
  }

  return besselJAsymptotic(n, x);
}

/**
 * Série de puissance pour Jn(x)
 */
function besselJSeries(n: number, x: number): number {
  const maxTerms = 50;
  let sum = 0;
  const halfX = x / 2;

  for (let k = 0; k < maxTerms; k++) {
    const term = Math.pow(-1, k) * Math.pow(halfX, 2 * k + n) /
                 (factorial(k) * factorial(k + n));
    sum += term;
    if (Math.abs(term) < 1e-15 * Math.abs(sum)) break;
  }

  return sum;
}

/**
 * Approximation asymptotique pour grands x
 */
function besselJAsymptotic(n: number, x: number): number {
  const phase = x - (n / 2 + 0.25) * Math.PI;
  const amplitude = Math.sqrt(2 / (Math.PI * x));
  return amplitude * Math.cos(phase);
}

/**
 * Dérivée de la fonction de Bessel J'n(x)
 */
export function besselJPrime(n: number, x: number): number {
  if (n === 0) {
    return -besselJ(1, x);
  }

  return 0.5 * (besselJ(n - 1, x) - besselJ(n + 1, x));
}

/**
 * Fonction de Bessel de seconde espèce Yn(x) (Neumann)
 */
export function besselY(n: number, x: number): number {
  if (x <= 0) {
    return -Infinity;
  }

  if (n === 0) {
    return besselY0(x);
  }

  if (n === 1) {
    return besselY1(x);
  }

  // Récurrence pour n > 1
  let y0 = besselY0(x);
  let y1 = besselY1(x);

  for (let k = 1; k < n; k++) {
    const yn = (2 * k / x) * y1 - y0;
    y0 = y1;
    y1 = yn;
  }

  return y1;
}

function besselY0(x: number): number {
  const gamma = 0.5772156649015329;

  if (x < 8) {
    const j0 = besselJ(0, x);
    let sum = 0;
    const halfX = x / 2;

    for (let k = 1; k <= 20; k++) {
      const term = Math.pow(-1, k + 1) * Math.pow(halfX, 2 * k) /
                   Math.pow(factorial(k), 2) * harmonicSum(k);
      sum += term;
      if (Math.abs(term) < 1e-15) break;
    }

    return (2 / Math.PI) * ((Math.log(halfX) + gamma) * j0 + sum);
  }

  // Approximation asymptotique
  const phase = x - Math.PI / 4;
  const amplitude = Math.sqrt(2 / (Math.PI * x));
  return amplitude * Math.sin(phase);
}

function besselY1(x: number): number {
  if (x < 8) {
    const j1 = besselJ(1, x);
    const gamma = 0.5772156649015329;
    let sum = 0;
    const halfX = x / 2;

    for (let k = 0; k <= 20; k++) {
      const hk = k === 0 ? 0 : harmonicSum(k);
      const hk1 = harmonicSum(k + 1);
      const term = Math.pow(-1, k) * Math.pow(halfX, 2 * k + 1) /
                   (factorial(k) * factorial(k + 1)) * (hk + hk1);
      sum += term;
      if (Math.abs(term) < 1e-15 && k > 0) break;
    }

    return (2 / Math.PI) * ((Math.log(halfX) + gamma) * j1 - 1 / x - sum);
  }

  const phase = x - 3 * Math.PI / 4;
  const amplitude = Math.sqrt(2 / (Math.PI * x));
  return amplitude * Math.sin(phase);
}

function harmonicSum(n: number): number {
  let sum = 0;
  for (let k = 1; k <= n; k++) {
    sum += 1 / k;
  }
  return sum;
}

/**
 * Dérivée de Yn(x)
 */
export function besselYPrime(n: number, x: number): number {
  if (n === 0) {
    return -besselY(1, x);
  }

  return 0.5 * (besselY(n - 1, x) - besselY(n + 1, x));
}

/**
 * Factorielle
 */
function factorial(n: number): number {
  if (n < 0) return Infinity;
  if (n === 0 || n === 1) return 1;

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Racines de Jn(x) = 0 (pour modes TM dans guide circulaire)
 * Retourne les premières racines de la fonction de Bessel Jn
 */
export const BESSEL_J_ZEROS: Record<number, number[]> = {
  0: [2.4048, 5.5201, 8.6537, 11.7915, 14.9309],
  1: [3.8317, 7.0156, 10.1735, 13.3237, 16.4706],
  2: [5.1356, 8.4172, 11.6198, 14.7960, 17.9598],
  3: [6.3802, 9.7610, 13.0152, 16.2235, 19.4094],
  4: [7.5883, 11.0647, 14.3725, 17.6160, 20.8269],
};

/**
 * Racines de J'n(x) = 0 (pour modes TE dans guide circulaire)
 */
export const BESSEL_J_PRIME_ZEROS: Record<number, number[]> = {
  0: [3.8317, 7.0156, 10.1735, 13.3237, 16.4706],
  1: [1.8412, 5.3314, 8.5363, 11.7060, 14.8636],
  2: [3.0542, 6.7061, 9.9695, 13.1704, 16.3475],
  3: [4.2012, 8.0152, 11.3459, 14.5858, 17.7887],
  4: [5.3175, 9.2824, 12.6819, 15.9641, 19.1960],
};

/**
 * Obtient la p-ième racine de Jn(x) = 0
 * @param n - Ordre de la fonction de Bessel (n >= 0)
 * @param p - Numéro de la racine (p >= 1)
 * @throws {Error} Si n < 0 ou p < 1
 */
export function getBesselJZero(n: number, p: number): number {
  // Validation des paramètres
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error(`getBesselJZero: n doit être un entier >= 0, reçu: ${n}`);
  }
  if (p < 1 || !Number.isInteger(p)) {
    throw new Error(`getBesselJZero: p doit être un entier >= 1, reçu: ${p}`);
  }

  // Vérifier si la valeur est tabulée
  if (n in BESSEL_J_ZEROS && p <= BESSEL_J_ZEROS[n].length) {
    return BESSEL_J_ZEROS[n][p - 1];
  }

  // Calcul numérique pour valeurs non tabulées
  console.warn(`getBesselJZero: calcul numérique pour n=${n}, p=${p}`);
  return findBesselJZero(n, p);
}

/**
 * Obtient la p-ième racine de J'n(x) = 0
 * @param n - Ordre de la fonction de Bessel (n >= 0)
 * @param p - Numéro de la racine (p >= 1)
 * @throws {Error} Si n < 0 ou p < 1
 */
export function getBesselJPrimeZero(n: number, p: number): number {
  // Validation des paramètres
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error(`getBesselJPrimeZero: n doit être un entier >= 0, reçu: ${n}`);
  }
  if (p < 1 || !Number.isInteger(p)) {
    throw new Error(`getBesselJPrimeZero: p doit être un entier >= 1, reçu: ${p}`);
  }

  // Vérifier si la valeur est tabulée
  if (n in BESSEL_J_PRIME_ZEROS && p <= BESSEL_J_PRIME_ZEROS[n].length) {
    return BESSEL_J_PRIME_ZEROS[n][p - 1];
  }

  // Calcul numérique pour valeurs non tabulées
  console.warn(`getBesselJPrimeZero: calcul numérique pour n=${n}, p=${p}`);
  return findBesselJPrimeZero(n, p);
}

/**
 * Trouve une racine de Jn par Newton-Raphson
 */
function findBesselJZero(n: number, p: number): number {
  // Estimation initiale
  let x = n + 1.8 * Math.pow(n, 1/3) + (p - 0.5) * Math.PI;

  for (let i = 0; i < 20; i++) {
    const j = besselJ(n, x);
    const jp = besselJPrime(n, x);
    const dx = -j / jp;
    x += dx;
    if (Math.abs(dx) < 1e-12) break;
  }

  return x;
}

/**
 * Trouve une racine de J'n par Newton-Raphson
 */
function findBesselJPrimeZero(n: number, p: number): number {
  let x: number;

  if (n === 0) {
    x = (p + 0.25) * Math.PI;
  } else {
    x = n + 0.8 * Math.pow(n, 1/3) + (p - 0.5) * Math.PI;
  }

  for (let i = 0; i < 20; i++) {
    const jp = besselJPrime(n, x);
    // Seconde dérivée: J''n(x) = (1/2)(J'(n-1) - J'(n+1)) = (n²/x² - 1)Jn - Jn'/x
    const jpp = (n * n / (x * x) - 1) * besselJ(n, x) - besselJPrime(n, x) / x;
    const dx = -jp / jpp;
    x += dx;
    if (Math.abs(dx) < 1e-12) break;
  }

  return x;
}
