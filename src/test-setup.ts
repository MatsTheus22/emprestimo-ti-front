import { configure } from '@testing-library/react';

// O padrão de 1 s para achar um elemento derrubava testes corretos com a máquina ocupada:
// a tela ainda não tinha renderizado. Espera mais, mas continua falhando se nunca aparecer.
configure({ asyncUtilTimeout: 15_000 });
