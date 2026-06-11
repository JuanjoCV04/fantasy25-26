#include<stdlib.h>
using namespace std;

// No hay que usar la función mcd
int mcd(int a, int b) {
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}

struct Solucion {
    int inicio;
    int fin;
    int longitud;
};

Solucion SolucionDirecta(int p, int q, int A[]) {
    Solucion solucion;
    if (q == p) {
        solucion.inicio = p;
        solucion.fin = q;
        solucion.longitud = 1;
    }
    return solucion;
}

Solucion Combinar(Solucion izq, Solucion der, Solucion centro) {
    Solucion solucion_mejor = izq;

    if (der.longitud > solucion_mejor.longitud) {
        solucion_mejor = der;
    }
    if (centro.longitud > solucion_mejor.longitud) {
        solucion_mejor = centro;
    }

    return solucion_mejor;
}

Solucion DyV(int p, int q, int A[]) {
    Solucion solucion;
    if (p == q) {
        solucion = SolucionDirecta(p, q, A);
    }
    else {
        int mitad = (p + q) / 2;

        Solucion izq = DyV(p, mitad, A);
        Solucion der = DyV(mitad + 1, q, A);

        // Centro
        // Para buscar la mejor subsecuencia que cruce la frontera, nos expandimos
        // desde el centro y vamos comprobando hacia ambos lados
        Solucion centro;
        int i = mitad;
        int j = mitad + 1;

        if (abs(A[mitad] - A[mitad+1]) < 2) {
            while (i-1 >= p && abs(A[i] - A[i-1]) < 2) {  // Expandimos a la izquierda
                i--;
            }
            while (j+1 <= q && abs(A[j] - A[j+1]) < 2) {  // Expandimos a la derecha
                j++;
            }
            centro.inicio = i;
            centro.fin = j;
            centro.longitud = j - i + 1;  // Longitud: i=2 j=5, la seria 4, para elementos (2, 3, 4, 5 y 6).
        }
        else {
            centro.inicio = 0;
            centro.fin = 0;
            centro.longitud = 0;
        }

        // Luego se calcula de los tres
        solucion = Combinar(izq, der, centro);
    }

    return solucion;
}

int main() {
    int p = 0;
    int q = 11;
    int n = 12;
    int A[n] = {1, 3, 4, 2, 6, 3, 1, 3, 9, 10, 12, 6};
    Solucion solucion = DyV(p, q, A);

    if (solucion.longitud != 0) {
        cout << "La solucion seria la subsecuencia [";
        for (int i = solucion.inicio; i <= solucion.fin; i++) {
            cout << A[i] << ", ";
        }
        cout << "], entre los indices " << solucion.inicio << " y " << solucion.fin
             << " con longitud " << solucion.longitud << endl;
    } else {
        cout << "(0,0)" << endl;
    }

    return 0;
}

int contarApariciones(const vector<int>& v, int x, int inicio, int fin) {
    // FASE 0: Casos Base (Problema pequeño)
    if (inicio > fin) {
        return 0; // El rango está vacío [1]
    }
    if (inicio == fin) {
        // Solo hay un elemento: si es x devolvemos 1, si no 0 [1]
        return (v[inicio] == x) ? 1 : 0;
    }

    // FASE 1: Dividir
    // Calculamos el punto medio para partir el array en dos [5, 6]
    int mitad = (inicio + fin) / 2;

    // FASE 2: Vencer (Llamadas recursivas)
    // Buscamos en ambas partes sin descartar ninguna [3]
    int cuentaIzq = contarApariciones(v, x, inicio, mitad);
    int cuentaDer = contarApariciones(v, x, mitad + 1, fin);

    // FASE 3: Combinar
    // La solución global es la suma de lo encontrado en cada mitad [3]
    return cuentaIzq + cuentaDer;
}