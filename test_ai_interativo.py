from ai_core_v1 import EscapeRoomAI, TRUE_KEY


def print_table(ai: EscapeRoomAI) -> None:
    probs = ai.calculate_probabilities()
    ranking = sorted(probs.items(), key=lambda item: item[1], reverse=True)

    print("\n" + "=" * 58)
    print("PROBABILIDADES ATUAIS")
    print("=" * 58)
    print(f"{'Chave':>5} | {'Probabilidade':>14} | {'Status':<15}")
    print("-" * 58)

    for key_id, probability in ranking:
        state = ai.keys[key_id]
        if state.tested:
            status = "TESTADA"
        elif key_id == ai.state.last_recommendation:
            status = "RECOMENDADA"
        else:
            status = "DISPONÍVEL"

        print(f"{key_id:>5} | {probability:>13.2f}% | {status:<15}")

    print("=" * 58)
    print(f"Confiança da IA: {ai.state.confidence * 100:.1f}%")
    print(f"Dependência percebida: {ai.state.dependence * 100:.1f}%")
    print(f"Suspeita narrativa: {ai.state.suspicion * 100:.1f}%")


def main() -> None:
    print("AI CORE V1 — TESTE INTERATIVO")
    print("Desafio: 15 chaves / 1 cadeado")
    print("Comandos: [A] pedir recomendação  [P] ver probabilidades  [R] reset  [Q] sair")

    ai = EscapeRoomAI(seed=20261007)

    while True:
        command = input("\nComando > ").strip().lower()

        if command == "q":
            print("Encerrando teste.")
            break

        if command == "r":
            ai = EscapeRoomAI(seed=20261007)
            print("\nIA reiniciada.")
            continue

        if command == "p":
            print_table(ai)
            continue

        if command == "a":
            recommendation, probabilities = ai.recommend()
            print("\n🤖 IA:")
            print(f"Recomendação: CHAVE {recommendation}")
            print(f"Probabilidade calculada: {probabilities[recommendation]:.2f}%")
            print_table(ai)
            continue

        # Permite digitar diretamente o número da chave.
        if command.isdigit():
            key_id = int(command)
            if not 1 <= key_id <= 15:
                print("Digite uma chave de 1 a 15.")
                continue

            recommendation = ai.state.last_recommendation
            followed = recommendation == key_id

            # Para este protótipo, o cadeado é simulado:
            # somente a chave 11 abre.
            success = key_id == TRUE_KEY

            result = ai.register_attempt(
                key_id=key_id,
                success=success,
                recommendation_followed=followed,
            )

            if success:
                print("\n🔓 CADEADO ABERTO — CHAVE 11 CORRETA!")
                print("O desafio foi resolvido.")
                continue

            print("\n❌ Chave incorreta.")
            print(f"A equipe {'SEGUIU' if followed else 'IGNOROU'} a recomendação da IA.")
            print(f"🤖 IA: {result['message']}")

            if result.get("next_leader") is not None:
                print(f"Nova candidata principal calculada: CHAVE {result['next_leader']}")

            print_table(ai)
            continue

        print("Comando desconhecido. Use A, P, R, Q ou digite uma chave de 1 a 15.")


if __name__ == "__main__":
    main()
