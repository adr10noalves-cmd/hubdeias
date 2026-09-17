import { runOrchestratorValidationSuite } from './src/services/assistant/__tests__/orchestratorValidation';

async function main() {
  console.log('Iniciando Bateria de Testes do Orquestrador de IA (14 Cenários)...');
  const results = await runOrchestratorValidationSuite();

  let passedCount = 0;
  results.forEach((r) => {
    if (r.passed) passedCount++;
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [Cenário ${r.scenarioId}] ${r.name}`);
    console.log(`   Detalhes: ${r.details}`);
  });

  console.log(`\nResultado Final: ${passedCount}/${results.length} testes aprovados.`);

  if (passedCount === results.length) {
    console.log('🎉 Todos os 14 cenários foram validados com sucesso!');
  } else {
    console.error('⚠️ Alguns cenários falharam!');
    process.exit(1);
  }
}

main().catch(console.error);
