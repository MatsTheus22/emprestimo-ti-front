import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Spec 004 CA-19: o layout.md reflete o card novo e registra a mudança. O arquivo fica
// no repositório do agente, na pasta acima: num clone só do front, este teste é pulado.
const caminho = fileURLToPath(new URL('../../layout.md', import.meta.url));

describe.skipIf(!existsSync(caminho))('layout.md', () => {
  const texto = () => readFileSync(caminho, 'utf8');
  // O que vale é o que está antes da seção de alterações, que cita o texto antigo.
  const desenho = () => texto().split('## 11. Alterações')[0] ?? '';

  it('test_ca_19_card_tem_foto_e_dados', () => {
    expect(desenho()).toMatch(/Card = foto do equipamento/);
  });

  it('test_ca_19_card_nao_mostra_pessoa_nem_data_de_outra_pessoa', () => {
    expect(desenho()).not.toContain('Com {pessoa}');
    expect(desenho()).not.toMatch(/detalhe mostra quem/);
    expect(desenho()).not.toMatch(/`emprestado` com o nome da pessoa/);
    expect(desenho()).toMatch(/sem o nome dela nem a data/);
  });

  it('test_ca_19_manutencao_usa_texto_fixo', () => {
    expect(desenho()).toContain('Indisponível durante a manutenção');
    expect(desenho()).not.toMatch(/detalhe com a observação/);
  });

  it('test_ca_19_registra_a_mudanca_e_a_spec_que_pediu', () => {
    const alteracoes = texto().split('## 11. Alterações')[1] ?? '';

    expect(alteracoes).toContain('Spec 004-solicitar-emprestimo');
    expect(alteracoes).toContain('Com {pessoa}');
    expect(alteracoes).toContain('2026-11-06');
  });
});
